"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import Sphere, { type SphereProps } from "@/components/Sphere";
import { cards } from "@/lib/cards";
import { getElevenLabsSignedUrl, logElevenLabsEvent } from "@/lib/elevenlabs";
import { EVENTS } from "@/lib/events";
import { useJourney } from "@/lib/journey-context";
import { logEvent, logTranscriptMessage, updateSession } from "@/lib/tracking";
import { useSuppressLiveKitDataChannelError } from "@/hooks";

const VOICE_START_TIMEOUT_MS = 15_000;

function getErrorMessage(err: unknown) {
  if (err instanceof Error) return err.message;
  return "Unable to start voice conversation";
}

function getVoiceIntensity(volume: number) {
  return Math.max(0, Math.min(1, volume * 3));
}

async function verifyVoiceSupport() {
  if (!window.isSecureContext) {
    throw new Error("Voice needs a secure browser context. Open the app on localhost or HTTPS, not a plain network IP address.");
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error("This browser does not allow microphone access for this page.");
  }

  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  stream.getTracks().forEach((track) => track.stop());
}

function ConversationContent() {
  const { state, dispatch } = useJourney();
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startupMessage, setStartupMessage] = useState<string | null>(null);
  const [voiceIntensity, setVoiceIntensity] = useState(0);
  const messageSequence = useRef(0);
  const seenMessageKeys = useRef(new Set<string>());
  const activeCard = useMemo(() => cards.find((card) => card.id === state.activeCardId) ?? cards[0], [state.activeCardId]);
  const conversation = useConversation({
    onConnect: () => {
      logElevenLabsEvent("card", "connected", { cardId: activeCard.id });
      setIsStarting(false);
      setError(null);
      setStartupMessage(null);
    },
    onDisconnect: (details) => {
      logElevenLabsEvent("card", "disconnected", { cardId: activeCard.id, details });
      setIsStarting(false);
      setStartupMessage(null);
      setVoiceIntensity(0);
    },
    onError: (message, context) => {
      logElevenLabsEvent("card", "error", { cardId: activeCard.id, message, context });
      setIsStarting(false);
      setStartupMessage(null);
      setVoiceIntensity(0);
      setError(message);
    },
    onStatusChange: (status) => {
      logElevenLabsEvent("card", "status", { cardId: activeCard.id, status });
    },
    onDebug: (info) => {
      logElevenLabsEvent("card", "debug", { cardId: activeCard.id, info });
    },
    onConversationMetadata: (metadata) => {
      logElevenLabsEvent("card", "metadata", { cardId: activeCard.id, metadata });
    },
    onMessage: (message) => {
      const text = message.message.trim();
      if (!text) return;

      const key = message.event_id ? `${message.role}-${message.event_id}` : `${message.role}-${text}`;
      if (seenMessageKeys.current.has(key)) return;
      seenMessageKeys.current.add(key);

      const role = message.role === "agent" ? "guide" : "user";
      const sequence = messageSequence.current;
      messageSequence.current += 1;

      dispatch({ type: "ADD_TRANSCRIPT_MESSAGE", message: { role, text } });
      void logTranscriptMessage(state.sessionId, {
        card_id: activeCard.id,
        role,
        content: text,
        sequence,
        metadata: {
          category: activeCard.category,
          elevenlabsRole: message.role,
          elevenlabsEventId: message.event_id,
        },
      });
    },
  });
  const { endSession, getOutputVolume, startSession } = conversation;
  const isConnected = conversation.status === "connected";
  const isConnecting = conversation.status === "connecting" || isStarting;
  const sphereState: SphereProps["state"] = isConnected ? (conversation.isSpeaking ? "speaking" : "listening") : isConnecting ? "thinking" : "idle";

  useSuppressLiveKitDataChannelError();

  useEffect(() => {
    void updateSession(state.sessionId, { current_screen: "conv" });
    dispatch({ type: "CLEAR_TRANSCRIPT" });
    messageSequence.current = 0;
    seenMessageKeys.current.clear();

    return () => endSession();
  }, [activeCard.id, dispatch, endSession, state.sessionId]);

  useEffect(() => {
    if (!isConnected) {
      return;
    }

    let frameId: number;

    function updateVoiceIntensity() {
      const nextIntensity = conversation.isSpeaking ? getVoiceIntensity(getOutputVolume()) : 0;

      setVoiceIntensity((currentIntensity) =>
        Math.abs(currentIntensity - nextIntensity) < 0.02 ? currentIntensity : nextIntensity,
      );
      frameId = window.requestAnimationFrame(updateVoiceIntensity);
    }

    frameId = window.requestAnimationFrame(updateVoiceIntensity);

    return () => window.cancelAnimationFrame(frameId);
  }, [conversation.isSpeaking, getOutputVolume, isConnected]);

  useEffect(() => {
    if (!isStarting || isConnected) return;

    const timeoutId = window.setTimeout(() => {
      logElevenLabsEvent("card", "startup timeout", { cardId: activeCard.id });
      endSession();
      setIsStarting(false);
      setStartupMessage(null);
      setError("Voice is taking too long to connect. Check microphone permission and try again.");
    }, VOICE_START_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [activeCard.id, endSession, isConnected, isStarting]);

  async function startConversation() {
    if (isConnected || isConnecting) return;

    setError(null);
    setIsStarting(true);
    setStartupMessage("Checking microphone access...");

    try {
      logElevenLabsEvent("card", "checking voice support", {
        cardId: activeCard.id,
        isSecureContext: window.isSecureContext,
        hasMediaDevices: Boolean(navigator.mediaDevices?.getUserMedia),
      });
      await verifyVoiceSupport();

      setStartupMessage("Creating voice session...");
      logElevenLabsEvent("card", "requesting signed url", { cardId: activeCard.id });
      const signedUrl = await getElevenLabsSignedUrl();
      const userName = state.name.trim() || "there";

      setStartupMessage("Connecting to voice guide...");
      logElevenLabsEvent("card", "starting websocket session", { cardId: activeCard.id });
      startSession({
        signedUrl,
        connectionType: "websocket",
        dynamicVariables: {
          user_name: userName,
          card_question: activeCard.question,
          card_category: activeCard.categoryLabel,
        },
      });

      void logEvent(state.sessionId, EVENTS.VOICE_CONVERSATION_STARTED, {
        cardId: activeCard.id,
        category: activeCard.category,
      });
    } catch (err) {
      setIsStarting(false);
      setStartupMessage(null);
      setError(getErrorMessage(err));
    }
  }

  function stopConversation() {
    endSession();
    void logEvent(state.sessionId, EVENTS.VOICE_CONVERSATION_ENDED, {
      cardId: activeCard.id,
      category: activeCard.category,
    });
  }

  function returnToBoard() {
    const visitedCardIds =
      state.activeCardId === null ? state.visitedCardIds : Array.from(new Set([...state.visitedCardIds, state.activeCardId]));
    const durationMs = state.activeCardOpenedAt ? Date.now() - state.activeCardOpenedAt : 0;

    if (isConnected) {
      stopConversation();
    }
    void logEvent(state.sessionId, EVENTS.CARD_COMPLETED, {
      cardId: activeCard.id,
      category: activeCard.category,
      durationMs,
    });
    void updateSession(state.sessionId, {
      visited_card_ids: visitedCardIds,
      cards_explored_count: visitedCardIds.length,
    });

    if (state.activeCardId !== null) {
      dispatch({ type: "MARK_VISITED", id: state.activeCardId });
    }
    dispatch({ type: "GO_TO", screen: "board" });
  }

  return (
    <section className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col px-5 py-8 text-center sm:px-8">
      <Button
        type="button"
        variant="ghost"
        onClick={returnToBoard}
        className="absolute left-5 top-5 h-10 rounded-full border border-[#D5DCE6] bg-transparent px-4 text-[#5A6B82] hover:border-[#1B3DD4] hover:bg-white hover:text-[#1B3DD4] sm:left-8 sm:top-8"
      >
        ← Back to board
      </Button>

      <div className="m-auto flex w-full max-w-2xl flex-col items-center pt-16">
        <Sphere state={sphereState} size={160} intensity={voiceIntensity} />
        <p className="mt-5 text-xs font-medium text-[#7B8FA8]">
          {isConnected ? (conversation.isSpeaking ? "Speaking" : "Listening") : isConnecting ? "Connecting" : "Ready to talk"}
        </p>
        {startupMessage ? <p className="mt-2 text-xs font-medium text-[#7B8FA8]">{startupMessage}</p> : null}
        <p className="mt-4 max-w-md text-[15px] leading-[1.65] text-[#5A6B82]">{activeCard.question}</p>

        <div className="mt-10 max-h-[200px] w-full space-y-5 overflow-y-auto rounded-2xl border border-[#D5DCE6] bg-white/70 p-5 text-left">
          {state.transcript.length > 0 ? (
            state.transcript.map((message, index) => (
              <div key={`${message.role}-${index}`}>
                <p className={`mb-1 text-[11px] font-medium uppercase tracking-[0.12em] ${message.role === "user" ? "text-[#1B3DD4]" : "text-[#7B8FA8]"}`}>
                  {message.role === "user" ? "You" : "Guide"}
                </p>
                <p className="text-[15px] leading-[1.65] text-[#0F1B2D]">{message.text}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-[15px] leading-[1.65] text-[#7B8FA8]">Start the voice conversation when you are ready.</p>
          )}
        </div>

        {error ? <p className="mt-4 max-w-md text-sm leading-6 text-[#D85A30]">{error}</p> : null}

        <Button
          type="button"
          onClick={isConnected ? stopConversation : startConversation}
          disabled={isConnecting}
          className="mt-9 h-12 rounded-full bg-[#1B3DD4] px-7 text-white transition-all hover:-translate-y-px hover:bg-[#1632B0] active:scale-[0.98]"
        >
          {isConnected ? "Stop voice conversation" : isConnecting ? "Connecting..." : "Start voice conversation"}
        </Button>

        <Button
          type="button"
          onClick={returnToBoard}
          variant="ghost"
          className="mt-3 h-12 rounded-full border border-[#D5DCE6] bg-white/60 px-7 text-[#5A6B82] transition-all hover:-translate-y-px hover:border-[#1B3DD4] hover:bg-white hover:text-[#1B3DD4] active:scale-[0.98]"
        >
          Done with this one
        </Button>
      </div>
    </section>
  );
}

export default function Conversation() {
  return (
    <ConversationProvider>
      <ConversationContent />
    </ConversationProvider>
  );
}

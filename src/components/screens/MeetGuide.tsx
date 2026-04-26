"use client";

import { useEffect, useState } from "react";
import { ConversationProvider, useConversation } from "@elevenlabs/react";
import { Button } from "@/components/ui/button";
import ProgressDots from "@/components/ui/ProgressDots";
import Sphere, { type SphereProps } from "@/components/Sphere";
import { getElevenLabsSignedUrl, logElevenLabsEvent } from "@/lib/elevenlabs";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce } from "@/lib/journey-context";
import { updateSession } from "@/lib/tracking";
import { useSuppressLiveKitDataChannelError } from "@/hooks";

const VOICE_START_TIMEOUT_MS = 15_000;

function getVoiceIntensity(volume: number) {
  return Math.max(0, Math.min(1, volume * 3));
}

function getErrorMessage(err: unknown) {
  if (err instanceof Error) {
    return getVoiceErrorMessage(err.message);
  }
  return "Unable to start your guide";
}

function getVoiceErrorMessage(message: string) {
  if (message.includes("first_message") || message.includes("firstMessage") || message.includes("First message")) {
    return "ElevenLabs blocked the onboarding message override. In the agent Security settings, enable the First message override.";
  }

  return message;
}

function getOnboardingGuideScript(name: string) {
  return `Hi ${name}. I'm here to listen. Together we'll explore what gives your life meaning — your strengths, your inspirations, the moments where you feel most alive. There's no script, no right answer. Click on "Show me the board" to get started!`;
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

function MeetGuideContent() {
  const { state, dispatch } = useJourney();
  const logMeetGuideViewed = useLogEventOnce(EVENTS.MEET_GUIDE_VIEWED);
  const name = state.name.trim() || "there";
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startupMessage, setStartupMessage] = useState<string | null>(null);
  const [voiceIntensity, setVoiceIntensity] = useState(0);
  const onboardingGuideScript = getOnboardingGuideScript(name);
  const conversation = useConversation({
    onConnect: () => {
      logElevenLabsEvent("meet", "connected");
      setIsStarting(false);
      setError(null);
      setStartupMessage(null);
    },
    onDisconnect: (details) => {
      logElevenLabsEvent("meet", "disconnected", details);
      setIsStarting(false);
      setStartupMessage(null);
      setVoiceIntensity(0);
    },
    onError: (message, context) => {
      logElevenLabsEvent("meet", "error", { message, context });
      setIsStarting(false);
      setStartupMessage(null);
      setVoiceIntensity(0);
      setError(getVoiceErrorMessage(message));
    },
    onStatusChange: (status) => {
      logElevenLabsEvent("meet", "status", status);
    },
    onDebug: (info) => {
      logElevenLabsEvent("meet", "debug", info);
    },
    onConversationMetadata: (metadata) => {
      logElevenLabsEvent("meet", "metadata", metadata);
    },
  });
  const { endSession, getOutputVolume, startSession } = conversation;
  const isConnected = conversation.status === "connected";
  const isConnecting = conversation.status === "connecting" || isStarting;
  const sphereState: SphereProps["state"] = isConnected ? (conversation.isSpeaking ? "speaking" : "listening") : isConnecting ? "thinking" : "idle";

  useSuppressLiveKitDataChannelError();

  useEffect(() => {
    void logMeetGuideViewed();
    void updateSession(state.sessionId, { current_screen: "meet" });
  }, [logMeetGuideViewed, state.sessionId]);

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

  useEffect(() => () => endSession(), [endSession]);

  useEffect(() => {
    if (!isStarting || isConnected) return;

    const timeoutId = window.setTimeout(() => {
      logElevenLabsEvent("meet", "startup timeout");
      endSession();
      setIsStarting(false);
      setStartupMessage(null);
      setError("Voice is taking too long to connect. Check microphone permission and try again.");
    }, VOICE_START_TIMEOUT_MS);

    return () => window.clearTimeout(timeoutId);
  }, [endSession, isConnected, isStarting]);

  async function startGuide() {
    if (isConnected || isConnecting) return;

    setError(null);
    setIsStarting(true);
    setStartupMessage("Checking microphone access...");

    try {
      logElevenLabsEvent("meet", "checking voice support", {
        isSecureContext: window.isSecureContext,
        hasMediaDevices: Boolean(navigator.mediaDevices?.getUserMedia),
      });
      await verifyVoiceSupport();

      setStartupMessage("Creating voice session...");
      logElevenLabsEvent("meet", "requesting signed url");
      const signedUrl = await getElevenLabsSignedUrl();

      setStartupMessage("Connecting to voice guide...");
      logElevenLabsEvent("meet", "starting websocket session");
      startSession({
        signedUrl,
        connectionType: "websocket",
        overrides: {
          agent: {
            firstMessage: onboardingGuideScript,
          },
        },
        dynamicVariables: {
          user_name: name,
          onboarding_context:
            "Welcome the user into a reflective purpose exploration. Keep it warm, brief, and invite them to continue to the board.",
        },
      });
    } catch (err) {
      setIsStarting(false);
      setStartupMessage(null);
      setError(getErrorMessage(err));
    }
  }

  function showBoard() {
    endSession();
    dispatch({ type: "GO_TO", screen: "board" });
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-center sm:px-8">
      <div className="m-auto flex flex-col items-center">
        <Sphere state={sphereState} size={200} intensity={voiceIntensity} />
        <p className="mt-5 text-xs font-medium text-[#7B8FA8]">
          {isConnected ? (conversation.isSpeaking ? "Speaking" : "Listening") : isConnecting ? "Connecting" : "Ready to speak"}
        </p>
        {startupMessage ? <p className="mt-2 text-xs font-medium text-[#7B8FA8]">{startupMessage}</p> : null}
        <h2 className="mt-8 text-2xl font-medium leading-tight text-[#0F1B2D]">Hi {name}. I&apos;m here to listen.</h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-[1.65] text-[#5A6B82] sm:text-base">
          Together we&apos;ll explore what gives your life meaning — your strengths, your inspirations, the moments where you feel most
          alive. There&apos;s no script, no right answer. Click on &quot;Show me the board&quot; to get started!
        </p>
        {error ? (
          <div className="mt-6">
            <p className="max-w-md text-sm leading-6 text-[#D85A30]">{error}</p>
            <Button
              type="button"
              variant="ghost"
              onClick={startGuide}
              disabled={isConnecting}
              className="mt-3 h-10 rounded-full border border-[#D5DCE6] bg-white/60 px-5 text-[#5A6B82] hover:border-[#1B3DD4] hover:bg-white hover:text-[#1B3DD4]"
            >
              Try voice again
            </Button>
          </div>
        ) : null}
        {!isConnected && !error ? (
          <Button
            type="button"
            onClick={startGuide}
            disabled={isConnecting}
            className="mt-8 h-12 rounded-full bg-[#1B3DD4] px-7 text-white transition-all hover:-translate-y-px hover:bg-[#1632B0] active:scale-[0.98]"
          >
            {isConnecting ? "Connecting..." : "Start voice guide"}
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={showBoard}
          className="mt-10 h-12 rounded-full bg-[#1B3DD4] px-7 text-white transition-all hover:-translate-y-px hover:bg-[#1632B0] active:scale-[0.98]"
        >
          Show me the board
        </Button>
      </div>
      <ProgressDots activeIndex={2} />
    </section>
  );
}

export default function MeetGuide() {
  return (
    <ConversationProvider>
      <MeetGuideContent />
    </ConversationProvider>
  );
}

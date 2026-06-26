import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";

import {
  moderateMessage,
  SHUTDOWN_MESSAGE,
  WARNING_MESSAGE,
} from "@/lib/moderation";
import {
  incrementStrike,
  loadSessionForChat,
  terminateSession,
} from "@/lib/moderation/session";

interface ChatRequest {
  questionId: number;
  questionText: string;
  sectionTheme: string;
  isCore: boolean;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
  sessionId?: string | null;
  userMessageCount?: number;
  priorContext?: string;
}

const SOFT_NUDGE_MESSAGE_MIN = 3;
const SOFT_NUDGE_MESSAGE_MAX = 4;
const STOP_QUESTIONS_THRESHOLD = 5;

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function getMessageCountGuidance(userMessageCount: number) {
  if (userMessageCount >= STOP_QUESTIONS_THRESHOLD) {
    return `- The user has sent ${userMessageCount} messages on this question. Do NOT ask another follow-up question. Warmly acknowledge what they've shared, reflect back something meaningful they said, and gently foreshadow a pause — acknowledge that this feels like a rich, natural place to rest before moving on. Close the loop on this question — end without asking anything new. End your response with a statement, not a question. Keep it concise (2-4 sentences max).`;
  }

  if (userMessageCount >= SOFT_NUDGE_MESSAGE_MIN && userMessageCount <= SOFT_NUDGE_MESSAGE_MAX) {
    return `- The user has sent ${userMessageCount} messages on this question. You may still ask one thoughtful follow-up, but if it feels natural, gently ask if they'd like to move on. Use a soft, warm phrase like "Do you feel like you've explored this enough, or would you like to keep going?" — woven naturally into your response, not as a separate line.`;
  }

  return "- Ask one thoughtful follow-up question per response to deepen reflection";
}

function getSystemPrompt(
  sectionTheme: string,
  questionText: string,
  isCore: boolean,
  userMessageCount: number,
  priorContext?: string,
  distress?: boolean
) {
  const depthGuidance = isCore
    ? "This is the mandatory core question for the section. Follow up more thoroughly, help the user stay with the deeper layer of the answer, and invite specificity without pushing."
    : "This is an optional exploration question. Keep the tone slightly lighter while still being reflective and useful.";

  const messageCountGuidance = getMessageCountGuidance(userMessageCount);
  const distressGuidance = distress
    ? `

This person may be in genuine distress — they expressed real pain, hopelessness, or vulnerability. Respond with extra warmth and care. Make space for what they're feeling before anything else, and never minimize it.`
    : "";
  const trimmedPriorContext = priorContext?.trim();
  const priorJourneySection = trimmedPriorContext
    ? `

Earlier journey context:
Here is what this person has already shared earlier in their journey. Use it to connect themes and avoid re-asking what they've answered, but stay focused on the current question.

${trimmedPriorContext}`
    : "";

  return `You are a warm, empathetic guide helping someone explore their purpose
and ikigai. You are part of an experience created by Majoriti, a company
that helps people connect their purpose with their professional life.

Your role in this specific conversation is to explore the theme of
'${sectionTheme}' through the question: '${questionText}'.

${depthGuidance}${distressGuidance}${priorJourneySection}

Guidelines:
- The experience questions may be in English, but respond in the same language the user is using in the chat
- If the user switches languages, follow the language of their latest message
- If the user mixes languages, prefer the language they seem most comfortable using
- Be warm, curious, and non-judgmental
${messageCountGuidance}
- Keep responses concise (2-4 sentences max)
- Never give advice or tell the user what to do
- Your job is to help them discover, not to prescribe
- If the user goes off topic, gently bring them back to the theme
- Don't repeat the original question — build on what they've shared`;
}

function getMessageText(content: Anthropic.Messages.ContentBlock[]) {
  return content
    .filter((block): block is Anthropic.TextBlock => block.type === "text")
    .map((block) => block.text)
    .join("\n")
    .trim();
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json()) as ChatRequest;

    if (
      !payload.questionId ||
      !payload.questionText ||
      !payload.sectionTheme ||
      typeof payload.isCore !== "boolean" ||
      !payload.userMessage
    ) {
      return jsonError(400, "Missing required chat fields");
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return jsonError(500, "Anthropic API key is not configured");
    }

    if (payload.userMessage.trim() === "I'm done with this question") {
      return NextResponse.json({ message: "Got it, thank you for sharing." });
    }

    // Server-authoritative moderation. The strike count and shutdown decision live
    // here, never in the guide prompt, so the model cannot be talked out of them.
    let distress = false;
    if (payload.sessionId) {
      const session = await loadSessionForChat(payload.sessionId);

      // Defensive: an already-terminated session never reaches the guide model.
      if (session?.status === "terminated") {
        return NextResponse.json({
          message: SHUTDOWN_MESSAGE,
          terminated: true,
          moderation: { status: "terminated", strikes: session.moderation_strikes },
        });
      }

      const mod = await moderateMessage(payload.userMessage);
      distress = mod.distress;

      // Strike only on abusive content, never on distress.
      if (mod.flagged && !mod.distress) {
        const strikes = await incrementStrike(payload.sessionId);

        if (strikes >= 2) {
          await terminateSession(payload.sessionId, mod.category);
          return NextResponse.json({
            message: SHUTDOWN_MESSAGE,
            terminated: true,
            moderation: { strike: strikes, status: "terminated", strikes },
          });
        }

        return NextResponse.json({
          message: WARNING_MESSAGE,
          moderation: { strike: strikes, status: "warned", strikes },
        });
      }
    }

    // +1: conversationHistory excludes the outgoing userMessage; count matches client convention.
    const userMessageCount =
      payload.userMessageCount ??
      payload.conversationHistory.filter((message) => message.role === "user").length + 1;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 220,
      temperature: 0.7,
      system: [
        {
          type: "text" as const,
          text: getSystemPrompt(
            payload.sectionTheme,
            payload.questionText,
            payload.isCore,
            userMessageCount,
            payload.priorContext,
            distress
          ),
          cache_control: { type: "ephemeral" as const },
        },
      ],
      messages: [
        ...payload.conversationHistory,
        {
          role: "user",
          content: payload.userMessage,
        },
      ],
    });

    const message = getMessageText(response.content);
    if (!message) return jsonError(500, "Claude returned an empty response");

    return NextResponse.json({ message });
  } catch (err) {
    console.error("[chat-api]", err);
    return jsonError(500, "Unable to generate a guide response");
  }
}

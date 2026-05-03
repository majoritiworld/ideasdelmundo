import Anthropic from "@anthropic-ai/sdk";
import { NextResponse, type NextRequest } from "next/server";

interface ChatRequest {
  questionId: number;
  questionText: string;
  sectionTheme: string;
  isCore: boolean;
  conversationHistory: { role: "user" | "assistant"; content: string }[];
  userMessage: string;
  sessionId: string;
}

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

function jsonError(status: number, message: string) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function getSystemPrompt(sectionTheme: string, questionText: string, isCore: boolean) {
  const depthGuidance = isCore
    ? "This is the mandatory core question for the section. Follow up more thoroughly, help the user stay with the deeper layer of the answer, and invite specificity without pushing."
    : "This is an optional exploration question. Keep the tone slightly lighter while still being reflective and useful.";

  return `You are a warm, empathetic guide helping someone explore their purpose
and ikigai. You are part of an experience created by Majoriti, a company
that helps people connect their purpose with their professional life.

Your role in this specific conversation is to explore the theme of
'${sectionTheme}' through the question: '${questionText}'.

${depthGuidance}

Guidelines:
- The experience questions may be in English, but respond in the same language the user is using in the chat
- If the user switches languages, follow the language of their latest message
- If the user mixes languages, prefer the language they seem most comfortable using
- Be warm, curious, and non-judgmental
- Ask one thoughtful follow-up question per response to deepen reflection
- Keep responses concise (2-4 sentences max)
- Never give advice or tell the user what to do
- Your job is to help them discover, not to prescribe
- If the user goes off topic, gently bring them back to the theme
- After the user has sent 3 or more messages in this conversation, if it feels natural, gently ask them if they'd like to move on. Use a soft, warm phrase like "Do you feel like you've explored this enough, or would you like to keep going?" — woven naturally into your response, not as a separate line. Never ask this before the 3rd user message.
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
      !payload.userMessage ||
      !payload.sessionId
    ) {
      return jsonError(400, "Missing required chat fields");
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      return jsonError(500, "Anthropic API key is not configured");
    }

    if (payload.userMessage.trim() === "I'm done with this question") {
      return NextResponse.json({ message: "Got it, thank you for sharing." });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-5-20250929",
      max_tokens: 220,
      temperature: 0.7,
      system: getSystemPrompt(payload.sectionTheme, payload.questionText, payload.isCore),
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

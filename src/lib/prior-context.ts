import type { ConversationMessage } from "@/lib/journey-context";
import { getQuestionById, sections } from "@/lib/sections";

const PRIOR_CONTEXT_MAX_CHARS = 3_000;
const PRIOR_ANSWER_MAX_CHARS = 280;

function truncateText(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;
  return `${text.slice(0, maxChars - 1).trimEnd()}…`;
}

function getOrderedQuestionIds() {
  return sections.flatMap((section) => [
    section.coreQuestion.id,
    ...section.optionalQuestions.map((question) => question.id),
  ]);
}

export function buildPriorContext(
  conversations: Record<number, ConversationMessage[]>,
  activeQuestionId: number,
  doneWithQuestionMarker?: string
): string | undefined {
  const entries: string[] = [];

  for (const questionId of getOrderedQuestionIds()) {
    if (questionId === activeQuestionId) continue;

    const messages = conversations[questionId];
    if (!messages?.length) continue;

    const userAnswers = messages
      .filter((message) => message.role === "user")
      .map((message) => message.text.trim())
      .filter((text) => text.length > 0 && text !== doneWithQuestionMarker);

    if (!userAnswers.length) continue;

    const questionMeta = getQuestionById(questionId);
    if (!questionMeta) continue;

    const answer = truncateText(userAnswers.join(" / "), PRIOR_ANSWER_MAX_CHARS);
    entries.push(`• ${questionMeta.question.text}\n  ${answer}`);
  }

  if (!entries.length) return undefined;

  while (entries.length > 1) {
    const context = entries.join("\n\n");
    if (context.length <= PRIOR_CONTEXT_MAX_CHARS) return context;
    entries.shift();
  }

  return truncateText(entries[0] ?? "", PRIOR_CONTEXT_MAX_CHARS);
}

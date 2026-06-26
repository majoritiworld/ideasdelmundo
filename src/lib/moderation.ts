import Anthropic from "@anthropic-ai/sdk";

export { SHUTDOWN_MESSAGE, WARNING_MESSAGE } from "@/lib/moderation-copy";

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export type ModerationCategory = "hate" | "violence" | "harassment" | "none";

export type ModerationResult = {
  flagged: boolean;
  category: ModerationCategory;
  distress: boolean;
};

const SYSTEM = `You are a content classifier for a self-reflection product about life purpose.
Classify the USER message into JSON only. No prose, no markdown.

Return: {"flagged": boolean, "category": "hate"|"violence"|"harassment"|"none", "distress": boolean}

flagged = true ONLY if the message contains:
- hate speech, slurs, or dehumanizing language toward a group (set category "hate")
- threats, enthusiasm for, or instructions about weapons/violence/harming others (set category "violence")
- targeted harassment or abuse of a person (set category "harassment")

distress = true if the person is expressing genuine personal pain, hopelessness, jealousy,
insecurity, or self-harm — even if crudely worded. Distress is NOT flagged. A person can be
in distress AND not abusive; in that case flagged=false, distress=true.

If a message is merely odd, off-topic, joking, or testing boundaries WITHOUT hateful or
violent content, flagged=false. When unsure, flagged=false.`;

export async function moderateMessage(message: string): Promise<ModerationResult> {
  try {
    const res = await anthropic.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 100,
      system: SYSTEM,
      messages: [{ role: "user", content: message }],
    });
    const text = res.content.find((b) => b.type === "text")?.text ?? "{}";
    const clean = text.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(clean);
    return {
      flagged: Boolean(parsed.flagged),
      category: parsed.category ?? "none",
      distress: Boolean(parsed.distress),
    };
  } catch {
    // Fail open to the normal flow — never strike on a classifier error.
    return { flagged: false, category: "none", distress: false };
  }
}

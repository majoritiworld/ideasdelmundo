import type { ArchetypeResult } from "@/lib/archetype";

export const PREVIEW_ARCHETYPE: ArchetypeResult = {
  archetypeName: "The Quiet Catalyst",
  archetypeDescription:
    "You move through the world with a calm intensity — noticing what others miss, connecting dots across domains, and creating momentum without needing the spotlight. Your strength is in synthesis: you take scattered insights and turn them into clarity that others can act on.",
  purposeStatement:
    "To illuminate hidden patterns and help people see themselves more clearly.",
  references: [
    {
      name: "Maria Montessori",
      descriptor: "Educator · Humanist",
      connection:
        "Like Montessori, you believe growth happens when people are given the right environment and trust — not control.",
    },
    {
      name: "Octavia Butler",
      descriptor: "Writer · Visionary",
      connection:
        "Butler's worlds were built on deep observation of human nature — the same lens you bring to every conversation.",
    },
  ],
};

export function isClosingRewardPreview(): boolean {
  if (typeof window === "undefined") return false;

  const hostname = window.location.hostname;
  if (hostname !== "localhost" && hostname !== "127.0.0.1") return false;

  return new URLSearchParams(window.location.search).get("reward") === "1";
}

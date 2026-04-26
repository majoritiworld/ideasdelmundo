export interface Card {
  id: number;
  category: "purpose" | "people" | "strengths" | "wellness";
  categoryLabel: string;
  question: string;
  x: number;
  y: number;
  isMed?: boolean;
}

export const cards: Card[] = [
  { id: 0, category: "purpose", categoryLabel: "Purpose", question: "What would you do if money wasn't a factor?", x: 18, y: 14 },
  { id: 1, category: "people", categoryLabel: "People", question: "Who inspires you, and why them?", x: 74, y: 10 },
  { id: 2, category: "strengths", categoryLabel: "Strengths", question: "What comes easily to you?", x: 6, y: 46 },
  { id: 3, category: "purpose", categoryLabel: "Flow", question: "A moment you lost track of time", x: 82, y: 42 },
  { id: 4, category: "people", categoryLabel: "Impact", question: "Whose life would you make better?", x: 14, y: 78 },
  { id: 5, category: "strengths", categoryLabel: "Joy", question: "What did you love as a child?", x: 78, y: 74 },
  { id: 6, category: "purpose", categoryLabel: "Vision", question: "A meaningful day, described", x: 38, y: 6 },
  { id: 7, category: "wellness", categoryLabel: "Pause", question: "I'm anxious — try a breath", x: 54, y: 84, isMed: true },
  { id: 8, category: "strengths", categoryLabel: "Craft", question: "A problem you love solving", x: 48, y: 50 },
];

export const categoryColors = {
  purpose: "#1B3DD4",
  people: "#D85A30",
  strengths: "#1D9E75",
  wellness: "#9F77DD",
} satisfies Record<Card["category"], string>;

export interface Question {
  id: number;
  text: string;
  openingMessage: string;
}

export interface Section {
  id: number;
  title: string;
  theme: keyof typeof categoryColors;
  questions: Question[];
}

export const categoryColors = {
  passion: "#1B3DD4",
  vocation: "#1D9E75",
  mission: "#D85A30",
  profession: "#9F77DD",
} as const;

export const sections: Section[] = [
  {
    id: 1,
    title: "What you love",
    theme: "passion",
    questions: [
      {
        id: 1,
        text: "What activities make you lose track of time?",
        openingMessage: "What activities make you lose track of time? Think freely — it doesn't matter if it seems practical or not.",
      },
      {
        id: 2,
        text: "What would you do even if no one paid you for it?",
        openingMessage: "What would you do even if no one paid you for it? What genuinely moves you?",
      },
      {
        id: 3,
        text: "What topics are you so passionate about you could talk for hours?",
        openingMessage: "What topics could you talk about for hours without getting bored? What gives you that special energy?",
      },
      {
        id: 4,
        text: "When was the last time you felt completely alive?",
        openingMessage: "Think of a recent moment when you felt completely alive. What were you doing? Who were you with?",
      },
    ],
  },
  {
    id: 2,
    title: "What you're good at",
    theme: "vocation",
    questions: [
      {
        id: 5,
        text: "What do you do with ease that others find difficult?",
        openingMessage: "What do you do naturally that seems complicated to others? Sometimes our greatest talents are invisible to ourselves.",
      },
      {
        id: 6,
        text: "What do your friends or colleagues ask for your help with?",
        openingMessage: "What do the people around you come to you for? What kind of help do they ask of you most often?",
      },
      {
        id: 7,
        text: "Which past achievements are you most proud of?",
        openingMessage:
          "Think of an achievement you're genuinely proud of. It doesn't have to be big — it can be personal. What was it, and what skill did it involve?",
      },
      {
        id: 8,
        text: "What skills have you developed throughout your life?",
        openingMessage:
          "Throughout your life you've accumulated skills — some learned, some natural. Which ones would you say are the most uniquely yours?",
      },
    ],
  },
  {
    id: 3,
    title: "What the world needs",
    theme: "mission",
    questions: [
      {
        id: 9,
        text: "What problems in the world hurt or frustrate you most?",
        openingMessage:
          "What do you see in the world that hurts you, frustrates you, or feels deeply wrong? What can you not look away from?",
      },
      {
        id: 10,
        text: "What change would you like to see in your community or industry?",
        openingMessage: "If you could change one thing in your community or industry, what would it be? Why that in particular?",
      },
      {
        id: 11,
        text: "Who would you like to help, and in what way?",
        openingMessage: "Who do you imagine helping with your work? What kind of people or communities matter most to you?",
      },
      {
        id: 12,
        text: "What mark would you like to leave on the world?",
        openingMessage: "Imagine 20 years from now. What mark would you like to have left? How would you want to be remembered?",
      },
    ],
  },
  {
    id: 4,
    title: "What you can be paid for",
    theme: "profession",
    questions: [
      {
        id: 13,
        text: "What services or products could you offer the world?",
        openingMessage:
          "Thinking about your skills and what you love doing, what kinds of services or products could you offer? Don't limit yourself — think big.",
      },
      {
        id: 14,
        text: "In what professional contexts have you felt most valued?",
        openingMessage:
          "In which jobs, projects, or professional contexts have you felt your contribution was truly valued? What did they have in common?",
      },
      {
        id: 15,
        text: "What kind of work do you picture yourself doing in 5 years?",
        openingMessage: "Without any limitations, how do you picture yourself working in 5 years? What would your day-to-day look like?",
      },
      {
        id: 16,
        text: "What market needs could you solve with your talents?",
        openingMessage:
          "Connecting what you know how to do with what the world needs, what concrete market needs do you think you could address?",
      },
    ],
  },
];

export function getQuestionById(questionId: number) {
  for (const section of sections) {
    const question = section.questions.find((item) => item.id === questionId);
    if (question) return { question, section };
  }

  return null;
}

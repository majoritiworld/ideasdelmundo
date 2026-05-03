export interface Question {
  id: number;
  text: string;
  openingMessage: string;
}

export interface Section {
  id: number;
  theme: string;
  title: string;
  introMessage: string;
  coreQuestion: Question;
  optionalQuestions: Question[];
}

export const categoryColors = {
  passion: "#CEA41A",
  vocation: "#1A35CE",
  mission: "#CE1ABC",
  profession: "#008925",
  becoming: "#C5D94A",
} as const;

export const sections: Section[] = [
  {
    id: 1,
    theme: "passion",
    title: "What you love",
    introMessage:
      "This section is about what sets you alive. Take your time — there are no wrong answers here.",
    coreQuestion: {
      id: 1,
      text: "When was the last time you felt completely alive?",
      openingMessage:
        "Let's begin with a moment of aliveness. When was the last time you felt completely alive, and what was happening around you?",
    },
    optionalQuestions: [
      {
        id: 2,
        text: "What would you do even if no one ever paid you for it?",
        openingMessage:
          "Set money aside for a moment. What would you still choose to do, simply because it feels meaningful or alive to you?",
      },
      {
        id: 3,
        text: "What topics could you talk about for hours without getting bored?",
        openingMessage:
          "Notice where your energy naturally rises. What topics could you talk about for hours without getting bored?",
      },
      {
        id: 4,
        text: "What did you love doing as a child that you have mostly forgotten about?",
        openingMessage:
          "Let's look back gently. What did you love doing as a child that life may have asked you to forget?",
      },
      {
        id: 5,
        text: "What does a perfect day look like for you, from morning to night?",
        openingMessage:
          "Imagine a day that feels deeply yours. From morning to night, what would a perfect day look like for you?",
      },
    ],
  },
  {
    id: 2,
    theme: "vocation",
    title: "What you're good at",
    introMessage:
      "This section is about your natural gifts. Don't be modest — you know more than you think.",
    coreQuestion: {
      id: 6,
      text: "What do you do with ease that others find difficult?",
      openingMessage:
        "Let's pay attention to what comes naturally. What do you do with ease that other people seem to find difficult?",
    },
    optionalQuestions: [
      {
        id: 7,
        text: "What do the people closest to you always come to you for?",
        openingMessage:
          "The people close to us often see our gifts clearly. What do they always seem to come to you for?",
      },
      {
        id: 8,
        text: "What have you built, created, or figured out that you are genuinely proud of?",
        openingMessage:
          "Think of something that still gives you quiet pride. What have you built, created, or figured out that matters to you?",
      },
      {
        id: 9,
        text: "What is the shadow side of your greatest strength — the way it can work against you?",
        openingMessage:
          "Every strength has a shadow when it goes too far. What is the shadow side of your greatest strength?",
      },
      {
        id: 10,
        text: "What would you be doing if you knew you could not fail?",
        openingMessage:
          "Let the fear of failure step out of the room for a moment. What would you be doing if you knew you could not fail?",
      },
    ],
  },
  {
    id: 3,
    theme: "mission",
    title: "What the world needs",
    introMessage:
      "This section is about your place in the world. Trust what moves you — your instincts matter.",
    coreQuestion: {
      id: 11,
      text: "What problems in the world hurt or frustrate you most?",
      openingMessage:
        "Let's listen to what moves you. What problems in the world hurt you, frustrate you, or feel impossible to ignore?",
    },
    optionalQuestions: [
      {
        id: 12,
        text: "Who is suffering that most people walk right past?",
        openingMessage:
          "Sometimes purpose begins with who we cannot ignore. Who is suffering that most people seem to walk right past?",
      },
      {
        id: 13,
        text: "What do you see clearly that the people around you seem to miss?",
        openingMessage:
          "There may be something you notice before others do. What do you see clearly that the people around you seem to miss?",
      },
      {
        id: 14,
        text: "What experience in your life made you unable to look away from this?",
        openingMessage:
          "Often our care has a story behind it. What experience in your life made you unable to look away from this?",
      },
      {
        id: 15,
        text: "If you had unlimited resources, what would you actually change?",
        openingMessage:
          "Imagine there were no limits on time, money, or support. If you had unlimited resources, what would you actually change?",
      },
    ],
  },
  {
    id: 4,
    theme: "profession",
    title: "What you can be paid for",
    introMessage:
      "This section is about your value in the world. Be honest — this is just between you and yourself.",
    coreQuestion: {
      id: 16,
      text: "What kind of work do you picture yourself doing in 5 years?",
      openingMessage:
        "Let's look ahead without forcing certainty. What kind of work do you picture yourself doing in 5 years?",
    },
    optionalQuestions: [
      {
        id: 17,
        text: "When have you been paid for something and felt like you were getting away with it because you loved it so much?",
        openingMessage:
          "Think of work that felt almost too natural to be paid for. When have you been paid for something and loved it that much?",
      },
      {
        id: 18,
        text: "What would your work look like if money was not a constraint?",
        openingMessage:
          "Let money stop being the first filter for a moment. What would your work look like if money was not a constraint?",
      },
      {
        id: 19,
        text: "Who is already living a version of the life you want — and what can you learn from them?",
        openingMessage:
          "Look for a living clue. Who is already living a version of the life you want, and what can you learn from them?",
      },
      {
        id: 20,
        text: "What is the one thing standing between you and that version of your life right now?",
        openingMessage:
          "Let's name the real obstacle with honesty and care. What is the one thing standing between you and that version of your life right now?",
      },
    ],
  },
  {
    id: 5,
    theme: "becoming",
    title: "Who you are becoming",
    introMessage:
      "This final section brings it all together. You have looked at what moves you, what you're good at, what the world needs, and what you can offer. Now the deepest question: who are you becoming?",
    coreQuestion: {
      id: 21,
      text: "What version of yourself are you done being?",
      openingMessage:
        "As everything comes together, let's be honest about what is complete. What version of yourself are you done being?",
    },
    optionalQuestions: [
      {
        id: 22,
        text: "What belief about yourself are you ready to leave behind?",
        openingMessage:
          "Some beliefs once protected us but now keep us small. What belief about yourself are you ready to leave behind?",
      },
      {
        id: 23,
        text: "What has your most important relationship taught you about who you really are?",
        openingMessage:
          "Relationships can become mirrors. What has your most important relationship taught you about who you really are?",
      },
      {
        id: 24,
        text: "What would you do differently if you stopped caring what people thought of you?",
        openingMessage:
          "Imagine the noise of other people's opinions getting quiet. What would you do differently if you stopped caring what people thought of you?",
      },
      {
        id: 25,
        text: "What does the most honest person in your life see in you that you struggle to see yourself?",
        openingMessage:
          "Borrow the eyes of someone who loves you and tells the truth. What do they see in you that you struggle to see yourself?",
      },
    ],
  },
];

export function getSectionQuestions(section: Section) {
  return [section.coreQuestion, ...section.optionalQuestions];
}

export function getQuestionById(questionId: number) {
  for (const section of sections) {
    if (section.coreQuestion.id === questionId) {
      return { question: section.coreQuestion, section, isCore: true };
    }

    const question = section.optionalQuestions.find((item) => item.id === questionId);
    if (question) return { question, section, isCore: false };
  }

  return null;
}

import { BLUEPRINT_PROMPT_VERSION, type BlueprintContent } from "@/lib/blueprints/types";
import type { BlueprintStatus, Json } from "@/lib/supabase/types";

export type StaticBlueprint = {
  id: string;
  session_id: string;
  user_id: string | null;
  email: string;
  name: string;
  slug: string;
  status: BlueprintStatus;
  prompt_version: string;
  content: Json;
  generated_at: string;
  reviewed_at: string;
  published_at: string;
  sent_at: string | null;
  created_at: string;
  updated_at: string;
};

const davidEvenhaimContent: BlueprintContent = {
  openingLetter: [
    "David, your transcript keeps returning to one clear image: a table with real food, honest conversation, and people becoming a little freer. Cooking is not just a hobby for you. It is the way you translate truth into something people can taste. You light up when someone realizes that healthy does not have to mean boring, extreme, or fear-based.",
    "Underneath the food is a larger purpose: helping people see through noise. You are moved by the gap between the simple life that makes people well and the industries, habits, and distractions that pull them away from it. Your path seems to live where craft, education, technology, nature, and calm rebellion meet.",
  ],
  ikigai: {
    passion: {
      label: "What you love",
      title: "Making truth edible",
      body: "You love creating from scratch and watching people enjoy what you made. The deeper joy is the shift on their face when a healthy food surprises them, because in that moment you are not only feeding them. You are changing what they believe is possible.",
    },
    vocation: {
      label: "What the world needs",
      title: "A calmer way back to real life",
      body: "You see people exhausted by misinformation, consumption, stress, and superficial goals. The world you want to serve needs someone who can point back to presence, real food, slower habits, and shared humanity without using shame or fear as the fuel.",
    },
    mission: {
      label: "What you can be paid for",
      title: "Whole-food products with a philosophy",
      body: "Your strongest commercial thread is not generic wellness. It is tangible, premium, nourishing products that challenge the myths people have absorbed: ghee or tallow instead of industrial oils, fermented foods, jams, bread, dry meat bars, chocolate, and simple foods in glass or paper.",
    },
    profession: {
      label: "What you are good at",
      title: "Connecting ideas, people, and craft",
      body: "You connect quickly because you are curious across many topics and emotionally tuned to the person in front of you. You also know how to build systems as a software engineer. That combination can turn a personal food philosophy into products, stories, tools, and communities.",
    },
  },
  tensionMap: [
    {
      left: "Calm",
      right: "Revolution",
      description:
        "You want to challenge powerful food myths, but you do not want to become another loud voice spreading panic. Your work needs a tone that can tell the truth without making people feel trapped or guilty.",
    },
    {
      left: "City",
      right: "Garden",
      description:
        "You love parts of city life, yet your alive moments come from nature, simplicity, no internet, and practical presence. The tension is not escape versus ambition. It is how to bring realness into the life you are building.",
    },
    {
      left: "Builder",
      right: "Craftsman",
      description:
        "Technology has helped you build a strong position, while food feels more alive right now. The question is whether tech becomes the main stage, a supporting tool, or the bridge that lets your food work reach more people.",
    },
  ],
  shadowSide: {
    title: "When seeing through illusion becomes heavy",
    body: "Your gift is noticing what others miss: the propaganda, the false health labels, the habits that quietly drain people. The shadow is that this clarity can become frustration, or a feeling that people are asleep and need to wake up quickly. Your strongest version will protect the softness in your message: balance, patience, humor, and the permission not to be perfect.",
  },
  opportunities: [
    {
      tag: "Passion x Profession",
      title: "Founder of a real-food pantry brand",
      body: "Start with one foundational product, such as ghee or tallow, and build a brand around calm education: why cooking fat matters, how to use it, and how small swaps can change the way people relate to food.",
    },
    {
      tag: "Mission x Vocation",
      title: "Whole-food educator",
      body: "Create workshops, short videos, or newsletters that explain food myths in a grounded way. Your differentiation is not fear. It is helping people feel capable, relaxed, and curious enough to improve one habit at a time.",
    },
    {
      tag: "Passion x Mission",
      title: "Garden-kitchen retreat host",
      body: "Your five-year vision already contains a retreat: nature, movement, detox from distraction, real meals, and better habits. This could begin as small weekend experiences before becoming a larger property or community.",
    },
    {
      tag: "Profession x Vocation",
      title: "Food-tech builder for conscious habits",
      body: "Use your engineering background to build tools that make better food choices feel simple: product education, habit tracking, local sourcing, or a content platform that helps people decode labels without anxiety.",
    },
  ],
  coreQuestion:
    "How can you tell the truth about food and modern life in a way that makes people feel freer, not more afraid?",
  books: [
    {
      title: "In Defense of Food",
      author: "Michael Pollan",
      why: "This matches your instinct to return people to simple principles without turning food into a complicated religion. It can help sharpen your calm, memorable way of teaching.",
    },
    {
      title: "Food Politics",
      author: "Marion Nestle",
      why: "You are already moved by the way industry shapes public belief. This book gives language and structure to that frustration, so your critique can become more precise and useful.",
    },
    {
      title: "The Art of Gathering",
      author: "Priya Parker",
      why: "So much of your purpose happens around a table. This book can help you design meals, workshops, retreats, and conversations that create the presence and connection you value.",
    },
  ],
  videos: [
    {
      title: "Teach Every Child About Food",
      speaker: "Jamie Oliver",
      url: "https://www.ted.com/talks/jamie_oliver_teach_every_child_about_food",
      why: "A useful example of food education as public service. Watch it for the urgency, then notice where your own voice would choose more calm and less alarm.",
    },
    {
      title: "The Surprisingly Charming Science of Your Gut",
      speaker: "Giulia Enders",
      url: "https://www.ted.com/talks/giulia_enders_the_surprisingly_charming_science_of_your_gut",
      why: "Your transcript mentioned the microbiome as an eye-opening topic. This keeps the science accessible, human, and easier to share with people who are just beginning.",
    },
    {
      title: "How to Live to Be 100+",
      speaker: "Dan Buettner",
      url: "https://www.ted.com/talks/dan_buettner_how_to_live_to_be_100",
      why: "This connects food with movement, community, simplicity, and environment, which is very close to the life you described outside the city with a garden and fewer distractions.",
    },
  ],
  careerArchetype: {
    name: "The Calm Food Revolutionary",
    body: "You are not here to sell another wellness trend. You are here to make a quieter revolution feel practical: cook with better ingredients, gather around real tables, question what industry calls healthy, return to nature where possible, and help people change without shame.",
    examples: [
      {
        name: "Alice Waters",
        lesson:
          "She shows how food, education, farming, and culture can become one movement when the message is rooted in beauty and simplicity.",
      },
      {
        name: "Yvon Chouinard",
        lesson:
          "He is a reminder that a business can carry a worldview: quality, restraint, sustainability, and resistance to consumption for its own sake.",
      },
    ],
  },
  closingNote: [
    "Your next chapter does not need to begin with the full retreat, the full product line, or the perfect philosophy. It can begin with one honest product and one clear promise: this is real food, made calmly, with respect for the body and the earth.",
    "The gift in your transcript is not only that you can cook. It is that you can help people feel the possibility of a simpler, healthier life without making them feel wrong for where they are now. That tone may become your signature.",
  ],
};

export const STATIC_BLUEPRINTS: Record<string, StaticBlueprint> = {
  "david-evenhaim": {
    id: "david-evenhaim-static-blueprint",
    session_id: "b8a886d4-be8a-49f2-9781-17748079045a",
    user_id: null,
    email: "david13abe@gmail.com",
    name: "David Evenhaim",
    slug: "david-evenhaim",
    status: "published",
    prompt_version: BLUEPRINT_PROMPT_VERSION,
    content: davidEvenhaimContent as Json,
    generated_at: "2026-05-03T16:00:00.000Z",
    reviewed_at: "2026-05-03T16:00:00.000Z",
    published_at: "2026-05-03T16:00:00.000Z",
    sent_at: null,
    created_at: "2026-05-03T16:00:00.000Z",
    updated_at: "2026-05-03T16:00:00.000Z",
  },
};

export function getStaticBlueprint(slug: string) {
  return STATIC_BLUEPRINTS[slug] ?? null;
}

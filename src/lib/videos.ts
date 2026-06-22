/**
 * Majoriti — curated video pool (verified seed)
 *
 * Every entry below was verified via web search on 2026-06-22:
 *   - the talk exists with the stated title + speaker
 *   - the TED.com slug is the canonical one (unambiguous across sources)
 *   - youtubeId, where present, is the official-channel upload confirmed this session
 *
 * IMPORTANT — two embed paths (see the accompanying Cursor prompt):
 *   - TED talks: embed by `tedSlug` via TED's official player. TED talks often have
 *     several YouTube uploads, so the slug is the reliable identifier, not a YT id.
 *   - YouTube-only videos: embed by `youtubeId` via youtube-nocookie.
 *
 * If you have NOT yet added tedSlug support, the 4 entries that also carry a
 * verified `youtubeId` work today as-is; the slug-only TED entries need the tweak.
 */

export type VideoType = "ted" | "youtube";

export type IkigaiDimension = "love" | "skill" | "world" | "paid";

/**
 * Controlled theme vocabulary. Use ONLY these tags so the selection prompt
 * matches against a consistent set. Add new tags here deliberately, not ad hoc —
 * drift in this list quietly degrades match quality.
 */
export const VIDEO_THEMES = [
  "meaning",
  "purpose",
  "fulfillment",
  "relationships",
  "creativity",
  "craft",
  "mastery",
  "skill",
  "contribution",
  "service",
  "identity",
  "growth",
  "resilience",
  "fear",
  "courage",
  "risk",
  "passion",
  "career-change",
  "reinvention",
  "work-you-love",
  "entrepreneurship",
] as const;

export type VideoTheme = (typeof VIDEO_THEMES)[number];

export interface PoolVideo {
  id: string;
  type: VideoType;
  /** TED.com slug — the reliable identifier for TED talks. Embed via TED's player. */
  tedSlug?: string;
  /** Real YouTube id. Required for type "youtube"; optional for TED if you embed by slug. */
  youtubeId?: string;
  title: string;
  creator: string;
  themes: VideoTheme[];
  ikigaiDimension?: IkigaiDimension;
}

export const VIDEO_POOL: PoolVideo[] = [
  // --- Verified TED talks WITH a confirmed official YouTube id (work today) ---
  {
    id: "ted-esfahani-smith-meaning",
    type: "ted",
    tedSlug: "emily_esfahani_smith_there_s_more_to_life_than_being_happy",
    youtubeId: "y9Trdafp83U",
    title: "There's more to life than being happy",
    creator: "Emily Esfahani Smith",
    themes: ["meaning", "purpose", "fulfillment", "resilience"],
    ikigaiDimension: "love",
  },
  {
    id: "ted-waldinger-good-life",
    type: "ted",
    tedSlug: "robert_waldinger_what_makes_a_good_life_lessons_from_the_longest_study_on_happiness",
    youtubeId: "8KkKuTCFvzI",
    title: "What makes a good life? Lessons from the longest study on happiness",
    creator: "Robert Waldinger",
    themes: ["meaning", "relationships", "fulfillment", "purpose"],
    ikigaiDimension: "love",
  },
  {
    id: "ted-robinson-creativity",
    type: "ted",
    tedSlug: "sir_ken_robinson_do_schools_kill_creativity",
    youtubeId: "iG9CE55wbtY",
    title: "Do schools kill creativity?",
    creator: "Sir Ken Robinson",
    themes: ["creativity", "identity", "growth", "skill"],
    ikigaiDimension: "skill",
  },
  {
    id: "ted-ferriss-fear-setting",
    type: "ted",
    tedSlug: "tim_ferriss_why_you_should_define_your_fears_instead_of_your_goals",
    youtubeId: "5J6jAC6XxAI",
    title: "Why you should define your fears instead of your goals",
    creator: "Tim Ferriss",
    themes: ["fear", "courage", "risk", "career-change"],
    ikigaiDimension: "paid",
    // CONTENT NOTE: opens with a vivid account of the speaker's near-suicide.
    // Powerful, but NOT appropriate as a default for an emotionally raw audience.
    // Deliberately excluded from DEFAULT_FALLBACK below.
  },

  // --- Verified TED talks by slug (need the tedSlug embed tweak; YT id ambiguous) ---
  {
    id: "ted-gilbert-creative-genius",
    type: "ted",
    tedSlug: "elizabeth_gilbert_your_elusive_creative_genius",
    title: "Your elusive creative genius",
    creator: "Elizabeth Gilbert",
    themes: ["creativity", "craft", "fear", "resilience"],
    ikigaiDimension: "skill",
  },
  {
    id: "ted-dinsmore-work-you-love",
    type: "ted",
    tedSlug: "scott_dinsmore_how_to_find_work_you_love",
    title: "How to find work you love",
    creator: "Scott Dinsmore",
    themes: ["work-you-love", "career-change", "purpose", "courage"],
    ikigaiDimension: "paid",
  },
  {
    id: "ted-smith-great-career",
    type: "ted",
    tedSlug: "larry_smith_why_you_will_fail_to_have_a_great_career",
    title: "Why you will fail to have a great career",
    creator: "Larry Smith",
    themes: ["career-change", "passion", "fear", "courage"],
    ikigaiDimension: "paid",
  },

  // --- Expansion (verified via web search on 2026-06-22) ---
  // Curated to Majoriti's themes; each TED slug copied from the canonical
  // TED.com page, each YouTube id from the official channel upload.

  // Fear / courage / vulnerability
  {
    id: "ted-brown-vulnerability",
    type: "ted",
    tedSlug: "brene_brown_the_power_of_vulnerability",
    title: "The power of vulnerability",
    creator: "Brené Brown",
    themes: ["courage", "fear", "resilience"],
    ikigaiDimension: "love",
  },
  {
    id: "ted-david-emotional-courage",
    type: "ted",
    tedSlug: "susan_david_the_gift_and_power_of_emotional_courage",
    title: "The gift and power of emotional courage",
    creator: "Susan David",
    themes: ["fear", "courage", "resilience"],
    ikigaiDimension: "love",
  },
  {
    id: "ted-cuddy-body-language",
    type: "ted",
    tedSlug: "amy_cuddy_your_body_language_may_shape_who_you_are",
    title: "Your body language may shape who you are",
    creator: "Amy Cuddy",
    themes: ["identity", "courage", "growth"],
    ikigaiDimension: "skill",
    // CONTENT NOTE: the "power posing" hormonal claims have a well-documented
    // replication debate (see TED's own "Corrections & Updates"). Still a
    // resonant talk on confidence/identity, but keep it out of DEFAULT_FALLBACK.
  },

  // Skill / mastery / craft
  {
    id: "ted-duckworth-grit",
    type: "ted",
    tedSlug: "angela_lee_duckworth_grit_the_power_of_passion_and_perseverance",
    title: "Grit: the power of passion and perseverance",
    creator: "Angela Lee Duckworth",
    themes: ["passion", "mastery", "resilience"],
    ikigaiDimension: "skill",
  },
  {
    id: "ted-lewis-near-win",
    type: "ted",
    tedSlug: "sarah_lewis_embrace_the_near_win",
    title: "Embrace the near win",
    creator: "Sarah Lewis",
    themes: ["mastery", "craft", "growth"],
    ikigaiDimension: "skill",
  },
  {
    id: "ted-csikszentmihalyi-flow",
    type: "ted",
    tedSlug: "mihaly_csikszentmihalyi_flow_the_secret_to_happiness",
    title: "Flow, the secret to happiness",
    creator: "Mihaly Csikszentmihalyi",
    themes: ["mastery", "craft", "fulfillment"],
    ikigaiDimension: "skill",
  },

  // Meaning / purpose / contribution
  {
    id: "ted-sinek-inspire-action",
    type: "ted",
    tedSlug: "simon_sinek_how_great_leaders_inspire_action",
    title: "How great leaders inspire action",
    creator: "Simon Sinek",
    themes: ["purpose", "contribution", "identity"],
    ikigaiDimension: "world",
  },
  {
    id: "ted-brooks-resume-eulogy",
    type: "ted",
    tedSlug: "david_brooks_should_you_live_for_your_resume_or_your_eulogy",
    title: "Should you live for your résumé ... or your eulogy?",
    creator: "David Brooks",
    themes: ["meaning", "purpose"],
    ikigaiDimension: "love",
  },
  {
    id: "ted-solomon-worst-moments",
    type: "ted",
    tedSlug: "andrew_solomon_how_the_worst_moments_in_our_lives_make_us_who_we_are",
    title: "How the worst moments in our lives make us who we are",
    creator: "Andrew Solomon",
    themes: ["meaning", "resilience"],
    ikigaiDimension: "love",
  },
  {
    id: "ted-grant-original-thinkers",
    type: "ted",
    tedSlug: "adam_grant_the_surprising_habits_of_original_thinkers",
    title: "The surprising habits of original thinkers",
    creator: "Adam Grant",
    themes: ["creativity", "contribution", "risk"],
    ikigaiDimension: "world",
  },

  // Career-change / work-you-love / reinvention
  {
    id: "ted-wapnick-true-calling",
    type: "ted",
    tedSlug: "emilie_wapnick_why_some_of_us_don_t_have_one_true_calling",
    title: "Why some of us don't have one true calling",
    creator: "Emilie Wapnick",
    themes: ["identity", "career-change", "creativity"],
    ikigaiDimension: "paid",
  },
  {
    id: "yt-newport-passion-bad-advice",
    type: "youtube",
    youtubeId: "IIMu1PGbG-0",
    title: '"Follow your passion" is bad advice',
    creator: "Cal Newport",
    themes: ["career-change", "mastery"],
    ikigaiDimension: "paid",
  },
  {
    id: "ted-burnett-designing-life",
    type: "ted",
    // Officially on TED.com as a TEDxStanford talk; embed by slug.
    tedSlug: "bill_burnett_5_steps_to_designing_the_life_you_want",
    title: "5 steps to designing the life you want",
    creator: "Bill Burnett",
    themes: ["career-change", "work-you-love"],
    ikigaiDimension: "paid",
  },
  {
    id: "yt-jobs-stanford-2005",
    type: "youtube",
    youtubeId: "UF8uR6Z6KLc",
    title: "Stanford Commencement Address (2005)",
    creator: "Steve Jobs",
    themes: ["purpose", "career-change", "meaning"],
    ikigaiDimension: "paid",
  },
  {
    id: "yt-rivers-focus-behaviors",
    type: "youtube",
    // TEDxCrestmoorParkED — not on TED.com, so embed by YouTube id.
    youtubeId: "V2PP3p4_4R8",
    title: "If you want to achieve your goals, don't focus on them",
    creator: "Reggie Rivers",
    themes: ["growth", "purpose"],
    ikigaiDimension: "skill",
  },

  // Fulfillment / growth
  {
    id: "ted-achor-happy-secret",
    type: "ted",
    tedSlug: "shawn_achor_the_happy_secret_to_better_work",
    title: "The happy secret to better work",
    creator: "Shawn Achor",
    themes: ["fulfillment", "growth"],
    ikigaiDimension: "paid",
  },
  {
    id: "ted-headlee-better-conversation",
    type: "ted",
    tedSlug: "celeste_headlee_10_ways_to_have_a_better_conversation",
    title: "10 ways to have a better conversation",
    creator: "Celeste Headlee",
    themes: ["skill", "contribution", "relationships"],
    ikigaiDimension: "world",
  },
];

/**
 * Evergreen, emotionally-safe, universally-fitting fallbacks.
 * (Esfahani Smith + Waldinger — both about meaning / a good life. Ferriss is
 * intentionally NOT here due to the content note above.)
 */
export const DEFAULT_FALLBACK: string[] = ["ted-esfahani-smith-meaning", "ted-waldinger-good-life"];

const POOL_BY_ID = new Map(VIDEO_POOL.map((video) => [video.id, video]));

export function getPoolVideo(id: string): PoolVideo | undefined {
  return POOL_BY_ID.get(id);
}

export function isPoolId(id: string): boolean {
  return POOL_BY_ID.has(id);
}

/**
 * Resolve the embeddable iframe URL for a pool video.
 *
 *   - TED talks with a `tedSlug` embed via TED's official player. TED talks have
 *     multiple YouTube uploads, so the slug is the reliable identifier.
 *   - Everything else (YouTube-only, or a TED entry without a slug) embeds via
 *     youtube-nocookie when a `youtubeId` is present.
 *
 * Returns `null` when neither identifier yields a working embed, so callers can
 * skip the entry instead of rendering a broken iframe.
 */
export function getVideoEmbedSrc(video: PoolVideo): string | null {
  if (video.type === "ted" && video.tedSlug) {
    return `https://embed.ted.com/talks/${video.tedSlug}`;
  }

  if (video.youtubeId) {
    return `https://www.youtube-nocookie.com/embed/${video.youtubeId}`;
  }

  return null;
}

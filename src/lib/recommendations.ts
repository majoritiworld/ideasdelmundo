import API_ROUTES from "@/constants/api-routes.constants";
import { DEFAULT_FALLBACK, getPoolVideo, type PoolVideo } from "@/lib/videos";

export interface VideoRecommendation {
  video: PoolVideo;
  /** 1-2 sentences, second person, referencing something specific the person said. */
  why: string;
}

/**
 * Client-side safety net: when the recommendations call fails entirely, resolve
 * the evergreen DEFAULT_FALLBACK ids so the reward screen never shows an empty
 * video section. Rationale ("why") is intentionally empty here.
 */
export function buildFallbackRecommendations(): VideoRecommendation[] {
  return DEFAULT_FALLBACK.flatMap((id) => {
    const video = getPoolVideo(id);
    return video ? [{ video, why: "" }] : [];
  }).slice(0, 2);
}

export interface RecommendationsResult {
  recommendations: [VideoRecommendation, VideoRecommendation];
}

export interface GenerateRecommendationsPayload {
  transcript: string;
  /** Conversation language, used to keep the rationale localized. */
  locale?: string;
}

export async function generateRecommendations(
  payload: GenerateRecommendationsPayload
): Promise<RecommendationsResult> {
  const response = await fetch(API_ROUTES.RECOMMENDATIONS, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  const data = (await response.json()) as RecommendationsResult & { error?: string };

  if (!response.ok) {
    throw new Error(data.error ?? "Unable to generate recommendations");
  }

  return data;
}

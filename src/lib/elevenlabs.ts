"use client";

import API_ROUTES from "@/constants/api-routes.constants";

type TokenResponse = {
  ok?: boolean;
  token?: string;
  error?: string;
};

type SignedUrlResponse = {
  ok?: boolean;
  signedUrl?: string;
  error?: string;
};

export function logElevenLabsEvent(scope: string, event: string, payload?: unknown) {
  console.debug(`[elevenlabs:${scope}] ${event}`, payload ?? "");
}

export async function getElevenLabsSignedUrl(): Promise<string> {
  const response = await fetch(API_ROUTES.ELEVENLABS.SIGNED_URL, {
    method: "POST",
  });

  const data = (await response.json()) as SignedUrlResponse;

  if (!response.ok || !data.signedUrl) {
    throw new Error(data.error ?? "Unable to start voice conversation");
  }

  return data.signedUrl;
}

export async function getElevenLabsConversationToken(): Promise<string> {
  const response = await fetch(API_ROUTES.ELEVENLABS.TOKEN, {
    method: "POST",
  });

  const data = (await response.json()) as TokenResponse;

  if (!response.ok || !data.token) {
    throw new Error(data.error ?? "Unable to start voice conversation");
  }

  return data.token;
}

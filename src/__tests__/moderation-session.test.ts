import { describe, it, expect } from "vitest";

import { deriveModerationState } from "@/lib/moderation/session";

describe("deriveModerationState", () => {
  it("is active with no strikes", () => {
    expect(deriveModerationState({ status: "in_progress", moderation_strikes: 0 })).toEqual({
      strikes: 0,
      status: "active",
      terminationReason: undefined,
    });
  });

  it("is warned after the first strike", () => {
    expect(deriveModerationState({ status: "in_progress", moderation_strikes: 1 })).toEqual({
      strikes: 1,
      status: "warned",
      terminationReason: undefined,
    });
  });

  it("is terminated once strikes reach two", () => {
    expect(deriveModerationState({ status: "in_progress", moderation_strikes: 2 })).toMatchObject({
      strikes: 2,
      status: "terminated",
    });
  });

  it("is terminated when the row status is terminated regardless of count", () => {
    expect(
      deriveModerationState({
        status: "terminated",
        moderation_strikes: 1,
        termination_reason: "hate",
      })
    ).toEqual({ strikes: 1, status: "terminated", terminationReason: "hate" });
  });

  it("treats a null strike count as zero", () => {
    expect(deriveModerationState({ status: "started", moderation_strikes: null })).toMatchObject({
      strikes: 0,
      status: "active",
    });
  });
});

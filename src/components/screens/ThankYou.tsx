"use client";

import { useEffect } from "react";
import Sphere from "@/components/Sphere";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce } from "@/lib/journey-context";
import { updateSession } from "@/lib/tracking";

export default function ThankYou() {
  const { state } = useJourney();
  const logThanksViewed = useLogEventOnce(EVENTS.THANKS_VIEWED);

  useEffect(() => {
    void logThanksViewed();
    void updateSession(state.sessionId, { current_screen: "thanks" });
  }, [logThanksViewed, state.sessionId]);

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col items-center justify-center px-5 py-8 text-center sm:px-8">
      <Sphere state="idle" size={72} />
      <p className="mt-8 text-xs font-medium uppercase tracking-[0.12em] text-[#7B8FA8]">Thank you for showing up</p>
      <h2 className="mt-4 text-2xl font-medium leading-tight text-[#0F1B2D]">Your reflection is on its way</h2>
      <p className="mt-4 max-w-xl text-[15px] leading-[1.65] text-[#5A6B82]">
        In the next 24 to 48 hours you&apos;ll receive a personalized report based on what you shared today.
      </p>
      <div className="mt-10 grid w-full max-w-md gap-3 rounded-2xl border border-[#D5DCE6] bg-white p-4 text-left">
        <button type="button" className="rounded-xl px-4 py-3 text-left text-[15px] font-medium text-[#1B3DD4] transition-colors hover:bg-[#EEF2FE]">
          Watch the masterclass →
        </button>
        <button type="button" className="rounded-xl px-4 py-3 text-left text-[15px] font-medium text-[#1B3DD4] transition-colors hover:bg-[#EEF2FE]">
          Reserve a spot in the cohort →
        </button>
      </div>
    </section>
  );
}

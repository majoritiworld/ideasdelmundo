"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ProgressDots from "@/components/ui/ProgressDots";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce } from "@/lib/journey-context";
import { logEvent, updateSession } from "@/lib/tracking";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Intake() {
  const { state, dispatch } = useJourney();
  const logIntakeViewed = useLogEventOnce(EVENTS.INTAKE_VIEWED);
  const logNameEntered = useLogEventOnce(EVENTS.INTAKE_NAME_ENTERED);
  const logEmailEntered = useLogEventOnce(EVENTS.INTAKE_EMAIL_ENTERED);
  const canContinue = state.name.trim().length > 0 && state.email.trim().length > 0;

  useEffect(() => {
    void logIntakeViewed();
    void updateSession(state.sessionId, { current_screen: "intake" });
  }, [logIntakeViewed, state.sessionId]);

  function submitIntake() {
    void updateSession(state.sessionId, {
      name: state.name.trim(),
      email: state.email.trim(),
      status: "in_progress",
      intake_completed_at: new Date().toISOString(),
    });
    void logEvent(state.sessionId, EVENTS.INTAKE_SUBMITTED);
    dispatch({ type: "GO_TO", screen: "meet" });
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-center sm:px-8">
      <div className="m-auto w-full">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-[#7B8FA8]">Before we begin</p>
        <h2 className="text-2xl font-medium leading-tight text-[#0F1B2D]">Let&apos;s introduce ourselves</h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-[1.65] text-[#5A6B82]">So your guide knows what to call you.</p>

        <div className="mx-auto mt-9 grid max-w-xl gap-4 text-left">
          <label className="grid gap-2 text-sm font-medium text-[#0F1B2D]">
            name
            <Input
              value={state.name}
              onChange={(event) => dispatch({ type: "SET_NAME", name: event.target.value })}
              onBlur={() => {
                if (state.name.trim()) void logNameEntered();
              }}
              placeholder="Your name"
              className="h-12 rounded-xl border-[#D5DCE6] bg-white px-4 text-[#0F1B2D] shadow-none placeholder:text-[#7B8FA8] focus-visible:border-[#1B3DD4] focus-visible:ring-[#1B3DD4]/15"
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-[#0F1B2D]">
            email
            <Input
              type="email"
              value={state.email}
              onChange={(event) => dispatch({ type: "SET_EMAIL", email: event.target.value })}
              onBlur={() => {
                if (emailPattern.test(state.email.trim())) void logEmailEntered();
              }}
              placeholder="you@example.com"
              className="h-12 rounded-xl border-[#D5DCE6] bg-white px-4 text-[#0F1B2D] shadow-none placeholder:text-[#7B8FA8] focus-visible:border-[#1B3DD4] focus-visible:ring-[#1B3DD4]/15"
            />
          </label>
        </div>

        <Button
          type="button"
          disabled={!canContinue}
          onClick={submitIntake}
          className="mt-10 h-12 rounded-full bg-[#1B3DD4] px-7 text-white transition-all hover:-translate-y-px hover:bg-[#1632B0] active:scale-[0.98]"
        >
          Meet your guide
        </Button>
      </div>
      <ProgressDots activeIndex={1} />
    </section>
  );
}

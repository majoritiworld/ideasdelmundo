"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import ProgressDots from "@/components/ui/ProgressDots";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EVENTS } from "@/lib/events";
import { useJourney, useLogEventOnce } from "@/lib/journey-context";
import { logEvent, markCompleted, updateSession } from "@/lib/tracking";

const sourceOptions = [
  "Instagram — @sebastian_majoriti",
  "A friend told me",
  "LinkedIn",
  "Newsletter or article",
  "Somewhere else",
];

export default function EndCapture() {
  const { state, dispatch } = useJourney();
  const logEndCaptureViewed = useLogEventOnce(EVENTS.END_CAPTURE_VIEWED);

  useEffect(() => {
    void logEndCaptureViewed();
    void updateSession(state.sessionId, { current_screen: "end" });
  }, [logEndCaptureViewed, state.sessionId]);

  function selectSource(source: string) {
    dispatch({ type: "SET_SOURCE", source });
    void logEvent(state.sessionId, EVENTS.SOURCE_SELECTED, { source });
    void updateSession(state.sessionId, { source });
  }

  function completeSession() {
    void markCompleted(state.sessionId);
    void logEvent(state.sessionId, EVENTS.SESSION_COMPLETED);
    dispatch({ type: "GO_TO", screen: "thanks" });
  }

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-5 py-8 text-center sm:px-8">
      <div className="m-auto w-full">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.12em] text-[#7B8FA8]">Almost there</p>
        <h2 className="text-2xl font-medium leading-tight text-[#0F1B2D]">One last thing</h2>
        <p className="mx-auto mt-4 max-w-xl text-[15px] leading-[1.65] text-[#5A6B82]">
          We&apos;ll send your reflection report to the email you gave us. How did you find majoriti?
        </p>

        <div className="mx-auto mt-9 max-w-xl text-left">
          <Select value={state.source} onValueChange={selectSource}>
            <SelectTrigger className="h-12 w-full rounded-xl border-[#D5DCE6] bg-white px-4 text-[#0F1B2D] shadow-none focus:ring-[#1B3DD4]/15">
              <SelectValue placeholder="Choose one" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-[#D5DCE6] bg-white">
              {sourceOptions.map((option) => (
                <SelectItem key={option} value={option} className="rounded-lg text-[#0F1B2D] focus:bg-[#EEF2FE]">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          type="button"
          disabled={!state.source}
          onClick={completeSession}
          className="mt-10 h-12 rounded-full bg-[#1B3DD4] px-7 text-white transition-all hover:-translate-y-px hover:bg-[#1632B0] active:scale-[0.98]"
        >
          Send me my report
        </Button>
      </div>
      <ProgressDots activeIndex={3} />
    </section>
  );
}

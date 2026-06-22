"use client";

import { motion } from "framer-motion";
import { useMemo } from "react";
import {
  getAnimatedWordClassName,
  splitRevealWords,
  WORD_REVEAL_EASING,
  WORD_REVEAL_TRANSITION_MS,
} from "@/lib/text-reveal";

type AnimatedWordProps = {
  visible: boolean;
  children: React.ReactNode;
  className?: string;
  ariaHidden?: boolean;
};

export function AnimatedWord({ visible, children, className, ariaHidden }: AnimatedWordProps) {
  return (
    <span
      aria-hidden={ariaHidden ?? !visible}
      className={getAnimatedWordClassName(visible, className)}
    >
      {children}
    </span>
  );
}

type AnimatedWordRevealProps = {
  text: string;
  visibleWordCount: number;
  wordIndexOffset?: number;
  className?: string;
  wordClassName?: string;
  renderBeforeWord?: (index: number) => React.ReactNode;
  shouldRenderSpaceAfter?: (index: number) => boolean;
};

export function AnimatedWordReveal({
  text,
  visibleWordCount,
  wordIndexOffset = 0,
  className,
  wordClassName,
  renderBeforeWord,
  shouldRenderSpaceAfter,
}: AnimatedWordRevealProps) {
  const words = useMemo(() => splitRevealWords(text), [text]);

  return (
    <span className={className}>
      {words.map((word, index) => {
        const globalIndex = wordIndexOffset + index;
        const isVisible = globalIndex < visibleWordCount;
        const showSpaceAfter =
          shouldRenderSpaceAfter?.(index) ?? index < words.length - 1;

        return (
          <span key={`${word}-${globalIndex}`}>
            {renderBeforeWord?.(index)}
            <AnimatedWord visible={isVisible} className={wordClassName}>
              {word}
            </AnimatedWord>
            {showSpaceAfter ? " " : null}
          </span>
        );
      })}
    </span>
  );
}

type TimedAnimatedWordRevealProps = {
  text: string;
  delayMs?: number;
  wordDelayMs: number;
  className?: string;
};

export function TimedAnimatedWordReveal({
  text,
  delayMs = 0,
  wordDelayMs,
  className,
}: TimedAnimatedWordRevealProps) {
  const words = useMemo(() => splitRevealWords(text), [text]);
  const transitionDuration = WORD_REVEAL_TRANSITION_MS / 1000;

  return (
    <span className={className}>
      {words.map((word, index) => (
        <motion.span
          key={`${word}-${index}`}
          className="inline"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            delay: (delayMs + index * wordDelayMs) / 1000,
            duration: transitionDuration,
            ease: WORD_REVEAL_EASING,
          }}
        >
          {word}
          {index < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </span>
  );
}

type AnimatedWordsProps = {
  words: readonly string[];
  visibleWordCount: number;
  wordClassName?: string;
  getWordKey?: (word: string, index: number) => string;
  renderBeforeWord?: (index: number) => React.ReactNode;
  shouldRenderSpaceAfter?: (index: number) => boolean;
};

export function AnimatedWords({
  words,
  visibleWordCount,
  wordClassName,
  getWordKey,
  renderBeforeWord,
  shouldRenderSpaceAfter,
}: AnimatedWordsProps) {
  return (
    <>
      {words.map((word, index) => {
        const isVisible = index < visibleWordCount;
        const showSpaceAfter =
          shouldRenderSpaceAfter?.(index) ?? index < words.length - 1;

        return (
          <span key={getWordKey?.(word, index) ?? `${word}-${index}`}>
            {renderBeforeWord?.(index)}
            <AnimatedWord visible={isVisible} className={wordClassName}>
              {word}
            </AnimatedWord>
            {showSpaceAfter ? " " : null}
          </span>
        );
      })}
    </>
  );
}

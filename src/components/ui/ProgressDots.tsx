"use client";

interface ProgressDotsProps {
  activeIndex: number;
  count?: number;
}

export default function ProgressDots({ activeIndex, count = 4 }: ProgressDotsProps) {
  return (
    <div className="flex items-center justify-center gap-2" aria-label={`step ${activeIndex + 1} of ${count}`}>
      {Array.from({ length: count }).map((_, index) => (
        <span
          key={index}
          className={`h-2 rounded-full transition-all duration-500 ${
            index === activeIndex ? "w-7 bg-[#1B3DD4]" : "w-2 bg-[#D5DCE6]"
          }`}
        />
      ))}
    </div>
  );
}

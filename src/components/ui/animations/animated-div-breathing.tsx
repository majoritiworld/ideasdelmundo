"use client";

type Props = {
  className?: string;
  children: React.ReactNode;
};

const AnimatedDivBreathing = ({ className, children }: Props) => {
  return (
    <div
      className={className}
      style={{
        animation: "breathing 4s ease-in-out infinite",
      }}
    >
      <style jsx>{`
        @keyframes breathing {
          0%,
          100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.03);
            opacity: 0.8;
          }
        }
      `}</style>
      {children}
    </div>
  );
};

export default AnimatedDivBreathing;

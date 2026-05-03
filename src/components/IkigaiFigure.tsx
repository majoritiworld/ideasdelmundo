"use client";

interface IkigaiFigureProps {
  size?: number;
}

export default function IkigaiFigure({ size = 200 }: IkigaiFigureProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      role="img"
      aria-label="Complete Ikigai figure"
      className="overflow-visible"
    >
      <circle cx="100" cy="70" r="56" fill="#CEA41A" opacity="0.3" style={{ mixBlendMode: "multiply" }} />
      <circle cx="130" cy="100" r="56" fill="#1A35CE" opacity="0.3" style={{ mixBlendMode: "multiply" }} />
      <circle cx="100" cy="130" r="56" fill="#CE1ABC" opacity="0.3" style={{ mixBlendMode: "multiply" }} />
      <circle cx="70" cy="100" r="56" fill="#008925" opacity="0.3" style={{ mixBlendMode: "multiply" }} />
    </svg>
  );
}

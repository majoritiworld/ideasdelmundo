import { categoryColors } from "@/lib/sections";

const INACTIVE_CIRCLE_COLOR = "#AEB8C6";

const CIRCLE_COLORS_BY_POSITION = {
  top: categoryColors.passion,
  right: categoryColors.vocation,
  bottom: categoryColors.mission,
  left: categoryColors.profession,
} as const;

export function getSectionSphereCircleColors(
  sectionId: number
): readonly [string, string, string, string] {
  return [
    sectionId === 1 ? CIRCLE_COLORS_BY_POSITION.top : INACTIVE_CIRCLE_COLOR,
    sectionId === 3 ? CIRCLE_COLORS_BY_POSITION.bottom : INACTIVE_CIRCLE_COLOR,
    sectionId === 4 ? CIRCLE_COLORS_BY_POSITION.left : INACTIVE_CIRCLE_COLOR,
    sectionId === 2 ? CIRCLE_COLORS_BY_POSITION.right : INACTIVE_CIRCLE_COLOR,
  ];
}

export function getSectionSphereCircleOpacities(
  sectionId: number
): readonly [number, number, number, number] {
  return [
    sectionId === 1 ? 0.5 : 0.3,
    sectionId === 3 ? 0.5 : 0.3,
    sectionId === 4 ? 0.5 : 0.3,
    sectionId === 2 ? 0.5 : 0.3,
  ];
}

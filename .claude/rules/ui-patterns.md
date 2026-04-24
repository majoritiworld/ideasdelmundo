# UI, Styling, and Layout Rules

The UI should remain consistent, reusable, and easy to extend.

## Rules

- Reuse shared UI components before creating new ones
- Reuse shared page layout wrappers
- Reuse dialog patterns
- Reuse existing table / filter / form layouts
- Keep spacing and sizing consistent
- Preserve the general visual language of the skeleton

## Styling

- Prefer Tailwind utility classes
- Use `cn()` for conditional classes
- Avoid inline style objects unless truly needed for dynamic values
- Avoid one-off styling that breaks consistency

## Layout

Use shared layout patterns for:

- page headers
- page containers
- actions rows
- dialogs
- forms
- filter bars
- tables
- cards / content sections

## UX Guidance

- keep interactions clear
- avoid unnecessary visual complexity
- prefer consistency over novelty
- make components easy to reuse in future projects

## Responsiveness

When adjusting layout:

- prefer shared/global fixes before page-specific fixes
- avoid hardcoded widths/heights unless clearly intentional
- ensure common layouts work well across standard laptop and desktop widths

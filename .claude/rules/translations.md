# Translation Rules

All user-visible text must be translatable.

## Rules

- Never hardcode user-facing strings in JSX
- Always use translation files
- Keep locale keys consistent across languages
- Use existing namespaces when possible
- Add new keys to all supported locale files

## Preferred Pattern

Use `useTranslations()` for component text.

For shared form components, pass translation keys instead of translated strings when that is the existing project pattern.

## Writing Style

Because this skeleton is intended for broad reuse:

- prefer simple, human, product-friendly language
- avoid overly technical phrasing in UI copy
- favor clarity over jargon
- write text that regular users can understand, not just developers

## Locale Consistency

When adding or editing text:

- update `en.json`
- update `he.json`
- update any other supported locale files used by the project

Do not leave partial translation coverage.

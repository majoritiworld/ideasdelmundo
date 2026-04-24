# App Structure, Routes, Config, and Storage Rules

## Imports

Always use `@/` imports.

Do not use long relative imports.

## Routes

Do not hardcode route strings in components.

Use:

- web route constants for frontend navigation
- API route constants for backend endpoints

## Environment / Config

Do not read `process.env` inside components or hooks.

Use the typed `CONFIG` object.

## Storage

Do not use `localStorage` directly.

Use:

- `useLocalStorage`
- `getStorage`
- `setStorage`
- `removeStorage`

## File Placement

- routes → `src/app`
- shared components → `src/components`
- hooks → `src/hooks`
- pure utilities → `src/utils`
- state → `src/store`
- constants → `src/constants`
- types → `src/types`
- API client, toast helpers, app config → `src/lib`

## API Route Constants

Do not hardcode API endpoint strings inside components, hooks, or utilities.

Add API route constants to `src/constants/api-routes.constants.ts`:

```ts
const API_ROUTES = {
  USERS: {
    LIST: "/users",
    BY_ID: (id: string) => `/users/${id}`,
  },
} as const;
export default API_ROUTES;
```

Import `API_ROUTES` wherever a URL is passed to `useFetch` or `useMutation`. Use the nested domain-grouped structure to keep the file organized as it grows.

## Philosophy

This skeleton should feel predictable.

Prefer:

- obvious file placement
- central constants
- typed configuration
- shared primitives

Avoid scattered one-off logic.

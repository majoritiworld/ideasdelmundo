# Hooks and Utilities Rules

This project includes shared hooks and utilities to avoid reinventing common logic.

## Rules

- Before writing custom logic, check whether a hook or utility already exists
- Prefer existing abstractions over duplicate implementations
- Add new helpers only when the need is real and recurring
- Keep utilities pure when possible
- Keep hooks focused and reusable

## Available Hooks

All hooks are exported from `src/hooks/index.ts`. Check there for the full list.

| Hook                 | Use for                                                            |
| -------------------- | ------------------------------------------------------------------ |
| `useBoolean`         | toggle state (open/close, enabled/disabled)                        |
| `useDebounce`        | delaying search input processing                                   |
| `useFetch`           | GET requests (SWR-powered, conditional with `null`)                |
| `useMutation`        | POST / PUT / PATCH / DELETE                                        |
| `useLocalStorage`    | persisted client-side state                                        |
| `useCountdown`       | OTP cooldowns, expiry timers                                       |
| `useCopyToClipboard` | copy-to-clipboard with "copied" feedback                           |
| `useOutsideClick`    | closing dropdowns / popovers on outside click                      |
| `useInView`          | scroll-triggered animations and lazy loading                       |
| `useWindowSize`      | numeric window dimensions (debounced, SSR-safe)                    |
| `usePrevious`        | comparing previous vs current value after a render                 |
| `useMediaQuery`      | CSS media query in JS (`"(max-width: 768px)"`)                     |
| `useEventListener`   | safe `addEventListener` with ref-stable callback + cleanup         |
| `useInterval`        | safe `setInterval` — pass `null` to pause                          |
| `useTimeout`         | safe `setTimeout` — fires once, clears on unmount                  |
| `useScrollPosition`  | `{ x, y }` scroll position (debounced, SSR-safe)                   |
| `useKeyPress`        | keyboard shortcut handler with optional `enabled` flag             |
| `usePermissions`     | `{ role, isAdmin, isAuthenticated, hasRole() }` from auth store    |
| `useAsync`           | one-shot async state: `{ data, isLoading, error, execute, reset }` |

## Available Utils

All utilities are exported from `src/utils/index.ts`.

| File            | Functions                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `string.utils`  | `randomID`, `truncate`, `capitalize`, `slugify`, `camelToTitleCase`, `removeAllSpaces`, `hasSubString`, `getShortCode`, social URL builders |
| `arr.utils`     | `groupBy`, `unique`, `chunk`                                                                                                                |
| `object.utils`  | `omit`, `pick`                                                                                                                              |
| `number.utils`  | `clamp`, `formatNumber`, `randomInt`, `getMinMaxOfLength`                                                                                   |
| `date.utils`    | `formatDate` — use `DateFormatting` enum for format strings                                                                                 |
| `formatters.ts` | `inputFormatter` (for formatted inputs), `formatBytes`                                                                                      |
| `error.utils`   | `isApiError`, `parseApiError`                                                                                                               |
| `general.utils` | `isEqual`, `merge`, `getRandomPastelColor`                                                                                                  |

## Adding New Helpers

Only add a new hook or utility when:

- the logic is reused or clearly reusable
- no current project helper covers the need
- the name and location match the project structure
- it improves clarity rather than adding abstraction for its own sake

# Data Fetching and Mutation Rules

Use the project’s shared API patterns.

## Reads

Use `useFetch`.

Do not use:

- `useEffect + fetch`
- `useEffect + axios.get`
- ad hoc loading / error state for standard GET requests

## Writes

Use `useMutation`.

Do not call:

- `axios.post`
- `axios.put`
- `axios.patch`
- `axios.delete`

directly inside components.

## Rules

- API URLs should come from route constants
- loading state should come from the shared hooks
- error handling should follow the shared behavior
- avoid duplicating data-fetching patterns per component

## Preferred Behavior

- `useFetch` for query-like reads
- `useMutation` for creates / updates / deletes
- conditional fetches should pass `null` when not ready
- component code should stay focused on UI behavior, not networking ceremony

## When to Break the Pattern

Only bypass shared hooks when:

- the use case is clearly unsupported
- there is a technical reason
- the alternative is documented in the code

## The API Proxy

All API requests go through the Next.js proxy route at `src/app/api/proxy/[...path]/route.ts`.

The `apiClient` base URL is `/api/proxy` on the client, which forwards to `CONFIG.serverUrl`.

This means:

- `useFetch("/users")` → proxies to `{CONFIG.serverUrl}/users`
- CORS is handled server-side — do not configure CORS headers client-side
- Cookies and Authorization headers are forwarded automatically

## Toast Patterns

After a successful mutation, use `toastSuccess` from `@/lib/toast`.

The API client's response interceptor automatically fires `toastError` for HTTP 4xx/5xx responses. Do not double-fire by also calling `toastError` in the same catch block unless you need a custom message.

Use `toastPromise` for long-running operations to show a loading → success/error flow in one call:

```ts
toastPromise(trigger({ method: "POST", data }), {
  loading: t("saving"),
  success: t("saved"),
  error: t("saveFailed"),
});
```

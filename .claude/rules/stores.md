# Stores and State Management Rules

## The Three Stores

The project has exactly three Zustand stores:

| Store            | File                        | Purpose                              |
| ---------------- | --------------------------- | ------------------------------------ |
| `useAuthStore`   | `src/store/auth.store.ts`   | user, token, isAuthenticated, logout |
| `useLoaderStore` | `src/store/loader.store.ts` | global HTTP loading state            |
| `useThemeStore`  | `src/store/theme.store.ts`  | light/dark theme                     |

## Rules

Do not create a new Zustand store unless state needs to be shared across components that do not share a common parent.

If state is local to a component or a subtree, use `useState` or `useReducer`.

Do not put server-fetched data into a store — use `useFetch` (SWR handles caching).

## Using the Auth Store

```ts
const { user, isAuthenticated, logout } = useAuthStore();
const { isAdmin, hasRole } = usePermissions(); // preferred for role checks
```

Do not read `user.role` directly — use `usePermissions()` instead. It provides a clean API (`isAdmin`, `hasRole(["admin", "editor"])`) that is easier to reason about and refactor later.

## Using the Loader Store

The loader store is wired to the axios interceptors automatically. You do not need to call `add`/`remove` manually for standard API requests.

Only call it directly for non-axios async operations:

```ts
const { add, remove } = useLoaderStore();
add("exportPdf");
// ... async work
remove("exportPdf");
```

Check loading state in UI with `useIsLoading()` (any request) or `useIsLoading("exportPdf")` (specific key).

## Adding to a Store

Only add a field to an existing store when:

- the data is genuinely global (not page-local)
- multiple unrelated components need to read or write it
- the state does not belong in URL query params, form state, or local `useState`

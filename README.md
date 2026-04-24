# skeleton-app

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178c6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-38bdf8?logo=tailwindcss&logoColor=white)
![shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-4-000000?logo=shadcnui&logoColor=white)
![SWR](https://img.shields.io/badge/SWR-2.4-black)
![React](https://img.shields.io/badge/React-19-61dafb?logo=react&logoColor=black)

A **production-ready Next.js 16 starter kit and GitHub template.** Every common building block is already wired up — forms with Zod validation, API proxy, SWR data fetching, i18n (EN, HE, ES, AR), dark mode, charts, animations, Zustand stores, and 19 custom hooks — so you can focus on building features from day one.

> This project ships with a `CLAUDE.md` file that instructs AI coding assistants (Claude Code, Cursor, etc.) to automatically follow every best practice described here — including which hook to use, how to call APIs, and where to put constants.

---

## For the vibe coder

This starter is built for product builders, founders, and designers who want to ship real products with AI tools like Claude Code or Cursor — without getting slowed down by setup choices, inconsistent code, or architectural drift.

You do not need to understand every file before you start. Most of the infrastructure is already in place. `CLAUDE.md` tells your AI assistant exactly how the project works — which patterns to use, which files to create, where to put things — so you don't have to explain it on every prompt.

**What this gives you on day one:**

- Forms, API calls, routing, translations, and state management already follow consistent patterns
- AI assistants know how to extend the project correctly without being told each time
- Every new feature you add will look and behave like the rest of the codebase

**To add a feature:** describe what you want to build to your AI assistant and ask it to follow the patterns in this repo. Or follow [How to add a new feature](#how-to-add-a-new-feature) yourself.

**The working example:** a complete contact form lives at `src/features/contact/` — built exactly as any new feature should be built. Open `http://localhost:3000/contact` to see it, then read the files to understand the pattern before building your own.

---

## What you can safely ignore at first

This repo has many files. Most are either infrastructure you never touch or optional features you can delete later.

| File / folder                            | You can ignore it because                                                                       |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `src/components/demo/`                   | Home page showcase only. Delete when you build your real app's home page.                       |
| `src/components/ui/charts/`              | Chart components. Remove if your app has no dashboards.                                         |
| `src/components/ui/animations/`          | Lottie + CSS animation. Remove if unused.                                                       |
| `MEMORY.md`, `.claude/rules/`            | Claude Code memory system. Ignore if you're not using Claude Code.                              |
| `components.json`                        | Only relevant when adding new shadcn/ui components via the `shadcn` CLI.                        |
| `pnpm-workspace.yaml`                    | pnpm install config. Ignore unless you're troubleshooting package installs.                     |
| `src/store/auth.store.ts`                | Auth placeholder — stores user and token. Replace with your real auth logic when you add login. |
| `messages/he.json`, `es.json`, `ar.json` | Remove locales your app doesn't need. Only `en.json` is required.                               |

**Do not remove:** `src/app/api/proxy/`, `src/lib/`, `src/constants/`, `src/components/form/`, or `messages/en.json`. Those are load-bearing.

---

## Live Demo

### Check it out now

**[Live Preview](https://skeleton-ui-app.vercel.app)** — opens the deployed demo site.

### Local

Run `pnpm dev` and open [http://localhost:3000](http://localhost:3000) — it redirects to `/demo/guide`.

The demo section uses route-per-tab navigation (`/demo/guide`, `/demo/forms`, `/demo/dashboard`, etc.) with a shared layout at `src/app/demo/layout.tsx`. Each tab is its own Next.js page. Active tab state comes from the pathname — no duplicated local state. Tab config lives in `src/constants/demo-tabs.constants.ts`.

---

## What's Included

| Category             | What you get                                                                                                                                                                                                                                                                |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Custom Hooks**     | 19 hooks — boolean toggle, data fetching, mutations, local storage, debounce, clipboard, countdown, outside-click, intersection observer, window size, previous value, media query, event listener, interval, timeout, scroll position, key press, permissions, async state |
| **Form System**      | React Hook Form + Zod + 12 typed field components + `formValidator` helpers + auto error translation                                                                                                                                                                        |
| **API Layer**        | Axios instance + SWR fetcher/mutator + `/api/proxy` route that hides the backend URL from the client                                                                                                                                                                        |
| **UI Components**    | shadcn/ui primitives, data table (sortable, searchable, paginated), line/bar/pie charts, animated numbers, Lottie, dialogs, drawers                                                                                                                                         |
| **i18n**             | next-intl with English, Hebrew, Spanish, and Arabic; locale stored in a cookie, switchable at runtime                                                                                                                                                                       |
| **State Management** | Zustand stores for auth, theme, and loading — all persisted in localStorage                                                                                                                                                                                                 |
| **Loading System**   | Spinner, full-screen overlay, skeleton rows, disabled-region wrapper, button loading prop                                                                                                                                                                                   |
| **Utilities**        | Date formatting (`DateFormatting` enum), string helpers, number/currency formatters, deep equality, general utils                                                                                                                                                           |
| **Best Practices**   | `CLAUDE.md` AI guide with rules covering every system — works with Claude Code, Cursor, and similar tools                                                                                                                                                                   |

---

## Core vs Optional

**Core** — load-bearing infrastructure. Do not delete.

| File / folder                               | Why it's load-bearing                                                                      |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `src/app/api/proxy/`                        | All API calls go through this Next.js proxy route. Remove it and all data fetching breaks. |
| `src/constants/`                            | Centralized web and API route strings. Every component imports from here.                  |
| `src/lib/`                                  | API client, SWR fetcher, toast helpers, typed `CONFIG`, `cn()` — used everywhere.          |
| `src/components/form/`                      | Shared form field components and `formValidator` helpers. Used by every form.              |
| `messages/en.json`                          | Required translation file. The app will not build without it.                              |
| `src/store/loader.store.ts`                 | Wired into the API client interceptors. Required for loading state to work.                |
| `src/hooks/use-fetch.ts`, `use-mutation.ts` | Project-wide data fetching pattern. All components use these.                              |

**Optional** — safe to remove or replace.

| File / folder                            | Notes                                                              |
| ---------------------------------------- | ------------------------------------------------------------------ |
| `src/components/demo/`                   | Home page showcase only. Delete when you ship your real home page. |
| `src/components/ui/charts/`              | Recharts wrappers. Remove if you have no dashboards.               |
| `src/components/ui/animations/`          | Lottie + CSS animations. Remove if unused.                         |
| `src/store/auth.store.ts`                | Placeholder — stores user and token. Replace with your real auth.  |
| `messages/he.json`, `es.json`, `ar.json` | Keep only the locales your app needs.                              |
| `src/features/contact/`                  | Example feature. Use it as a template, then delete or adapt it.    |

---

## Tech Stack

| Layer         | Library                                    | Version    |
| ------------- | ------------------------------------------ | ---------- |
| Framework     | [Next.js](https://nextjs.org) (App Router) | 16         |
| Language      | TypeScript                                 | 5.9        |
| Styling       | Tailwind CSS                               | 4          |
| UI Primitives | shadcn/ui + Radix UI                       | 4 / 1.4    |
| Icons         | Iconify (`@iconify/react`)                 | 6          |
| Forms         | React Hook Form + Zod                      | 7.7 / 4.3  |
| Data Fetching | SWR + Axios                                | 2.4 / 1.13 |
| State         | Zustand                                    | 5          |
| i18n          | next-intl                                  | 4.8        |
| Charts        | Recharts                                   | 3.8        |
| Animations    | Lottie React                               | 2.4        |
| Date          | date-fns                                   | 4.1        |
| Toast         | Sonner                                     | 2          |
| Combobox      | cmdk                                       | 1.1        |
| OTP Input     | input-otp                                  | 1.4        |
| Drawer        | Vaul                                       | 1.1        |

---

## Quick Start

```bash
# 1. On GitHub, click "Use this template" to create your own repository.
#    That gives you a fresh copy without this template's git history and does not affect the upstream project.
# 2. Clone the repository you just created (replace the URL with yours):
git clone https://github.com/your-username/your-repo.git my-app
cd my-app

# 3. Install dependencies (pnpm recommended)
pnpm install

# 4. Set up environment variables
cp .env.example .env.local
# Edit .env.local — set NEXT_PUBLIC_SERVER_URL to your backend

# 5. Start the dev server
pnpm dev
```

---

## Scripts

```bash
pnpm dev             # start dev server
pnpm build           # production build
pnpm start           # start production server
pnpm lint            # run ESLint
pnpm typecheck       # run TypeScript type check
pnpm format          # format all files with Prettier
pnpm format:check    # check formatting without writing
pnpm test            # run tests once
pnpm test:watch      # run tests in watch mode
pnpm test:coverage   # run tests with coverage report
pnpm ci              # format:check + lint + typecheck + test + build
```

---

## Common mistakes this starter helps you avoid

| Mistake                                      | What to do instead                                                         |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| Hardcoding page URLs (`href="/contact"`)     | Add to `WEB_ROUTES` and import the constant                                |
| Hardcoding API endpoints (`"/users"` inline) | Add to `API_ROUTES` and import the constant                                |
| Skipping translations (`<p>Submit</p>`)      | Add the key to `messages/en.json` and use `useTranslations()`              |
| Reading `process.env` in a component         | Use `CONFIG` from `@/lib/app-config`                                       |
| Calling `fetch` or `axios` directly          | Use `useFetch` for reads, `useMutation` for writes                         |
| Using raw `<input>` in a form                | Use `TextInput`, `FormTextarea`, or another shared field component         |
| Calling `toast()` or `sonner` directly       | Use `toastSuccess`, `toastError`, etc. from `@/lib/toast`                  |
| Storing server-fetched data in Zustand       | Let SWR cache it via `useFetch`                                            |
| Creating a Zustand store for local UI state  | Use `useState` or `useBoolean`                                             |
| Scattering feature files across the codebase | Group types, validation, and components under `src/features/your-feature/` |
| Calling `toastError` in a `catch` block      | The API client fires it automatically — calling it twice shows two toasts  |

---

## Environment Variables

Create `.env.local` at the project root:

```env
NEXT_PUBLIC_APP_NAME=My App
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_PUBLIC_SERVER_URL=http://localhost:3005   # Your backend API base URL
NEXT_PUBLIC_WEB_URL=http://localhost:3000      # Frontend origin
NEXT_PUBLIC_REGION=IL
```

All variables are prefixed with `NEXT_PUBLIC_` and are safe to expose to the browser. There are no server-only secrets in the default setup — add them unprefixed if your app needs them.

**Never read `process.env` directly in components.** Use the typed `CONFIG` object instead:

```typescript
import { CONFIG } from "@/lib/app-config";

CONFIG.serverUrl; // → process.env.NEXT_PUBLIC_SERVER_URL
CONFIG.appName; // → process.env.NEXT_PUBLIC_APP_NAME
```

---

## Project Structure

```
skeleton-app/
├── messages/
│   ├── en.json               # English translations
│   ├── he.json               # Hebrew translations
│   ├── es.json               # Spanish translations
│   └── ar.json               # Arabic translations
├── public/                   # Static assets
├── CLAUDE.md                 # AI assistant best-practices guide
└── src/
    ├── app/
    │   ├── api/proxy/        # ← API proxy route (hides backend URL)
    │   │   └── [...path]/route.ts
    │   ├── layout.tsx
    │   └── page.tsx          # Interactive demo / showcase
    ├── components/
    │   ├── app/              # PageContainer, AppDialog, ThemeProvider, LocaleDialog
    │   ├── form/             # 12 form field components + validators
    │   └── ui/               # shadcn/ui primitives, charts, animations
    ├── constants/
    │   ├── api-routes.constants.ts    # ← add your API paths here
    │   └── web-routes.constants.ts    # ← add your page routes here
    ├── hooks/                # 19 custom hooks (barrel-exported from index.ts)
    ├── i18n/                 # next-intl request config
    ├── lib/
    │   ├── api-client.ts     # Axios instance (proxied)
    │   ├── app-config.ts     # Typed CONFIG from env vars
    │   ├── swr-client.ts     # SWR fetcher + mutator
    │   ├── toast.ts          # Typed toast helpers
    │   └── utils.ts          # cn() for Tailwind class merging
    ├── store/
    │   ├── auth.store.ts     # User + token (localStorage-persisted)
    │   ├── loader.store.ts   # Global loading keys
    │   └── theme.store.ts    # light / dark (localStorage-persisted)
    ├── types/
    │   └── ui.types.ts       # SelectOption, MultiSelectOption, Tab
    └── utils/
        ├── date.utils.ts         # formatDate + DateFormatting enum
        ├── formatters.ts         # inputFormatter (dollar, phone, bytes…)
        ├── general.utils.ts      # isEqual, merge, getRandomPastelColor
        ├── local-storage.utils.ts
        ├── number.utils.ts
        └── string.utils.ts       # randomID, buildWhatsappUrl, etc.
```

---

## How to add a new feature

The AI will know how to do it for you, this is just a manual explaination.
The contact form at `src/features/contact/` is the canonical example. Follow the same steps for any new feature.

**1. Add a web route constant** (`src/constants/web-routes.constants.ts`)

```ts
const WEB_ROUTES = {
  HOME: "/",
  CONTACT: "/contact",
  YOUR_FEATURE: "/your-feature", // ← add here
} as const;
```

**2. Add an API route constant** (`src/constants/api-routes.constants.ts`)

```ts
const API_ROUTES = {
  YOUR_FEATURE: {
    LIST: "/your-feature",
    BY_ID: (id: string) => `/your-feature/${id}`,
  },
} as const;
```

**3. Add translations** (`messages/en.json` — then copy to all other locale files)

```json
{
  "yourFeature": {
    "pageTitle": "Your Feature",
    "pageSubtitle": "Do something useful here."
  }
}
```

**4. Add types** (`src/features/your-feature/types/your-feature.types.ts`)

```ts
export type YourFeatureRequest = { name: string };
export type YourFeatureResponse = { success: boolean };
```

**5. Write a Zod schema** (`src/features/your-feature/validation/your-feature.schema.ts`)

```ts
import { z } from "zod";
import { formValidator } from "@/components/form/utils/form-validator";

export const yourFeatureSchema = z.object({
  name: formValidator.requiredString(),
});
export type YourFeatureFormValues = z.infer<typeof yourFeatureSchema>;
```

**6. Build the form or UI** (`src/features/your-feature/components/YourFeatureForm.tsx`)

Use `useFetch` for reads, `useMutation` for writes. Use shared form components. See `ContactForm.tsx` as a reference.

**7. Add a page** (`src/app/your-feature/page.tsx`)

```tsx
import { PageContainer } from "@/components/app";
import { YourFeatureForm } from "@/features/your-feature/components/YourFeatureForm";

export default function YourFeaturePage() {
  return (
    <PageContainer title="Your Feature">
      <YourFeatureForm />
    </PageContainer>
  );
}
```

**8. Keep files grouped** under `src/features/your-feature/` — types, validation, and components together.

| Step         | File location                                 |
| ------------ | --------------------------------------------- |
| Web route    | `src/constants/web-routes.constants.ts`       |
| API route    | `src/constants/api-routes.constants.ts`       |
| Translations | `messages/en.json` (+ all other locale files) |
| Types        | `src/features/your-feature/types/`            |
| Schema       | `src/features/your-feature/validation/`       |
| Components   | `src/features/your-feature/components/`       |
| Page         | `src/app/your-feature/page.tsx`               |

---

## Custom Hooks

All hooks are exported from `@/hooks`. Import what you need:

```typescript
import { useBoolean, useFetch, useMutation, useDebounce } from "@/hooks";
```

| Hook                                    | Purpose                                   | Key return values                                |
| --------------------------------------- | ----------------------------------------- | ------------------------------------------------ |
| `useBoolean(default?)`                  | Boolean toggle state                      | `{ value, onTrue, onFalse, onToggle, setValue }` |
| `useFetch<T>(url)`                      | SWR GET request                           | `{ data, isLoading, error, mutate }`             |
| `useMutation<T>(url)`                   | POST / PUT / PATCH / DELETE               | `{ trigger, isMutating, data, error }`           |
| `useLocalStorage<T>(key, init)`         | State synced to localStorage              | `{ state, setState, setField, resetState }`      |
| `useDebounce(value, delay?)`            | Debounced string value                    | `string`                                         |
| `useCopyToClipboard(resetMs?)`          | Copy to clipboard                         | `{ copy, copied }`                               |
| `useCountdown(seconds?)`                | Countdown timer                           | `{ seconds, isRunning, start, reset }`           |
| `useOutsideClick(ref, cb, enabled?)`    | Detect clicks outside an element          | `void`                                           |
| `useInView(threshold?)`                 | Intersection Observer                     | `{ ref, inView }`                                |
| `useWindowSize(debounceMs?)`            | Debounced window dimensions               | `{ width, height }`                              |
| `usePrevious<T>(value)`                 | Previous render value                     | `T \| undefined`                                 |
| `useMediaQuery(query)`                  | CSS media query in JS                     | `boolean`                                        |
| `useEventListener(event, handler, el?)` | Safe `addEventListener` with cleanup      | `void`                                           |
| `useInterval(callback, delay)`          | Safe `setInterval` — pass `null` to pause | `void`                                           |
| `useTimeout(callback, delay)`           | Safe `setTimeout` — clears on unmount     | `void`                                           |
| `useScrollPosition(debounceMs?)`        | Debounced scroll position                 | `{ x, y }`                                       |
| `useKeyPress(key, handler, enabled?)`   | Keyboard shortcut handler                 | `void`                                           |
| `usePermissions()`                      | Role and auth state                       | `{ role, isAdmin, isAuthenticated, hasRole() }`  |
| `useAsync<T>()`                         | One-shot async state machine              | `{ data, isLoading, error, execute, reset }`     |

---

## Form System

Forms use **React Hook Form** + **Zod** + `formValidator` + 12 typed field components. All field components accept a translation key for `label`, `placeholder`, and `helperText` — errors are translated automatically.

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z as zod } from "zod";
import { formValidator } from "@/components/form/utils/form-validator";
import Form from "@/components/form/Form";
import { TextInput, FormSelect } from "@/components/form";

const schema = zod.object({
  name:  formValidator.requiredString(),
  email: formValidator.requiredEmail(),
  role:  formValidator.requiredString(),
});

const form = useForm({ resolver: zodResolver(schema), defaultValues: { name: "" } });

<Form form={form} onSubmit={handleSubmit}>
  <TextInput name="name"  label="labels.name"  required />
  <TextInput name="email" label="labels.email" type="email" required />
  <FormSelect name="role" label="labels.role"  options={roleOptions} />
  <Button type="submit">Save</Button>
</Form>
```

### `formValidator` helpers

| Helper                                        | Use for                                          |
| --------------------------------------------- | ------------------------------------------------ |
| `requiredString()`                            | Any required text field                          |
| `optionalString()`                            | Optional text                                    |
| `requiredEmail()`                             | Email address                                    |
| `requiredPassword()`                          | 8–64 chars, upper + lower + digit + special char |
| `requiredPasswordRelaxed()`                   | Password without complexity rules                |
| `requiredPositiveNumber()`                    | Required number ≥ 1                              |
| `optionalPositiveNumber()`                    | Optional number ≥ 0                              |
| `requiredPhoneNumber({ isValidPhoneNumber })` | Phone with external validator                    |
| `requiredStringDate()`                        | ISO date string                                  |
| `singleFile({ required })`                    | Single file upload                               |
| `multipleFiles({ minFiles })`                 | Multiple file upload                             |
| `requiredBoolean()`                           | Must be checked / true                           |
| `requiredWebUrl()`                            | Valid URL                                        |
| `optionalWebUrl()`                            | Optional URL                                     |
| `stringWithLength(n)`                         | Exactly n digits (ID numbers)                    |
| `autocompleteSelection()`                     | Array of `{ value, label }` objects              |

### Form field components

| Component         | Description                                        |
| ----------------- | -------------------------------------------------- |
| `TextInput`       | Text / password / email inputs                     |
| `FormTextarea`    | Multi-line text with optional char counter         |
| `FormSelect`      | Dropdown select                                    |
| `FormCombobox`    | Searchable select (cmdk-based)                     |
| `FormMultiSelect` | Multi-select with groups and tree support          |
| `FormSwitch`      | Toggle switch                                      |
| `FormCheckbox`    | Checkbox                                           |
| `FormOTPInput`    | OTP digit slots                                    |
| `DateInput`       | Single date or date range picker                   |
| `FileUpload`      | Drag-and-drop file input with size/type validation |
| `FormattedInput`  | Masked input (currency, phone, SSN, credit card…)  |
| `Slider`          | Range slider                                       |

---

## API Layer

All requests route through a local Next.js proxy:

```
Browser → /api/proxy/[...path] → NEXT_PUBLIC_SERVER_URL/[...path]
```

- The backend URL never reaches the client's browser.
- Cookies and `Authorization` headers are forwarded automatically.
- 4xx / 5xx responses trigger a toast notification **automatically** — no per-request try/catch needed.

### Define paths as constants

```typescript
// src/constants/api-routes.constants.ts
export const API_ROUTES = {
  USERS: {
    LIST: "/users",
    DETAIL: (id: string) => `/users/${id}`,
  },
  AUTH: {
    LOGIN: "/auth/login",
    LOGOUT: "/auth/logout",
  },
} as const;

// Usage:
const { data } = useFetch<User[]>(API_ROUTES.USERS.LIST);
const { trigger } = useMutation<User>(API_ROUTES.USERS.DETAIL(id));
```

---

## Internationalization (i18n)

- **Library:** next-intl 4.8
- **Locales:** `en`, `he`, `es`, `ar` (Hebrew and Arabic are RTL)
- **Locale switching:** `LocaleDialog` component sets the `NEXT_LOCALE` cookie
- **Translation files:** `messages/en.json`, `messages/he.json`, `messages/es.json`, `messages/ar.json`

```typescript
import { useTranslations } from "next-intl";

const t = useTranslations("forms");
<label>{t("labels.email")}</label>   // "Email" / "אימייל" / "Correo" / "البريد"
```

**Never hardcode user-visible strings.** Add the key to all locale JSON files and reference via `t()`.

---

## State Management

Three Zustand stores, all persisted in localStorage:

| Store  | Import                          | State                                                               |
| ------ | ------------------------------- | ------------------------------------------------------------------- |
| Auth   | `useAuthStore` from `@/store`   | `user`, `token`, `isAuthenticated`, `setUser`, `setToken`, `logout` |
| Theme  | `useThemeStore` from `@/store`  | `theme` (`"light" \| "dark"`), `setTheme`                           |
| Loader | `useLoaderStore` from `@/store` | `keys` map, `add`, `remove` — managed by Axios interceptor          |

---

## Loading System

```tsx
// Full-screen overlay while any Axios request is in flight (wired in layout.tsx)
<LoadingIndicator variant="overlay" loadingKey="axios" />

// Inline spinner
<LoadingIndicator variant="spinner" loadingKey="my-key" />

// Skeleton placeholder rows
<LoadingIndicator variant="skeleton" skeletonRows={4} loadingKey="my-key" />

// Disable + overlay a UI region while loading
<LoadingIndicator variant="disabled" loadingKey="save-form">
  <MyForm />
</LoadingIndicator>

// Button with built-in spinner + auto-disabled
<Button loading={isMutating}>Save</Button>
```

---

## Utilities

### Date formatting

Never call `date-fns/format` directly. Use `formatDate` with the `DateFormatting` enum:

```typescript
import { formatDate, DateFormatting } from "@/utils/date.utils";

formatDate(date, DateFormatting.ISO_DATE); // "2025-03-27"
formatDate(date, DateFormatting.SLASH_DATE); // "27/03/2025"
formatDate(date, DateFormatting.FULL_DATE); // "March 27, 2025"
formatDate(date, DateFormatting.TIME_12_HOUR); // "03:45 PM"
formatDate(date, DateFormatting.DATE_TIME_SHORT); // "Mar 27, 2025 15:45"
formatDate(date, DateFormatting.SHORT_DAY_DATE); // "Thu, Mar 27"
formatDate(date, DateFormatting.DAY_NAME); // "Thursday"
```

### Input formatters

```typescript
import { inputFormatter } from "@/utils/formatters";

inputFormatter.dollar.format("1234.56"); // "$1,234.56"
inputFormatter.euro.format("1234.56"); // "€1.234,56"
inputFormatter.percent.format("12.5"); // "12.5%"
inputFormatter.phone.format("1234567890"); // "(123) 456-7890"
inputFormatter.bytes.format("1048576"); // "1 MB"

inputFormatter.dollar.parse("$1,234.56"); // "1234.56"
```

### Toasts

```typescript
import { toastSuccess, toastError, toastWarning, toastInfo, toastPromise } from "@/lib/toast";

toastSuccess("Saved!", "Your changes have been applied.");
toastError("Something went wrong.");
toastPromise(saveUser(data), {
  loading: "Saving…",
  success: "User saved!",
  error: "Failed to save.",
});
```

---

## Styling

- All styling uses **Tailwind CSS 4** utility classes.
- Use `cn()` from `@/lib/utils` when combining classes conditionally:

```typescript
import { cn } from "@/lib/utils";
<div className={cn("base-class", isActive && "active-class", className)} />
```

- **Icons:** Iconify only — `<Icon icon="lucide:trash-2" />`. Browse all icon sets at [icon-sets.iconify.design](https://icon-sets.iconify.design/).
- No inline `style={{}}` for static values.

---

## UI Components at a Glance

### `src/components/ui/`

| Component               | Description                                              |
| ----------------------- | -------------------------------------------------------- |
| `button.tsx`            | Variants + sizes + `loading` prop                        |
| `card.tsx`              | Card / CardHeader / CardContent / CardFooter             |
| `badge.tsx`             | Inline status badge                                      |
| `data-table.tsx`        | Sortable, searchable, paginated generic table            |
| `dialog.tsx`            | Radix Dialog                                             |
| `drawer.tsx`            | Vaul Drawer (bottom sheet)                               |
| `loading-indicator.tsx` | `spinner` / `overlay` / `skeleton` / `disabled` variants |
| `tabs.tsx`              | Radix Tabs (`default` / `line` variants)                 |
| `sidebar.tsx`           | Full sidebar layout with mobile sheet                    |
| `search-input.tsx`      | Debounced search with clear button                       |
| `empty.tsx`             | Empty-state layout                                       |
| `typography.tsx`        | Heading, body, label, caption components                 |
| `avatar.tsx`            | Radix Avatar with fallback                               |
| `tooltip.tsx`           | Radix Tooltip                                            |
| `sheet.tsx`             | Radix Sheet (side panel)                                 |
| `scroll-area.tsx`       | Radix ScrollArea                                         |
| `skeleton.tsx`          | Skeleton placeholder                                     |
| `fade-in.tsx`           | Scroll-triggered fade-in                                 |
| `iconify.tsx`           | Iconify icon wrapper                                     |

### `src/components/ui/charts/`

| Component                | Description                                 |
| ------------------------ | ------------------------------------------- |
| `stat-card.tsx`          | KPI card with animated number + trend delta |
| `balance-line-chart.tsx` | Area/line chart for time-series data        |
| `bar-chart.tsx`          | Grouped or stacked bar chart                |
| `pie-chart.tsx`          | Pie or donut chart                          |

### `src/components/ui/animations/`

| Component                    | Description                                |
| ---------------------------- | ------------------------------------------ |
| `animated-number.tsx`        | Count-up animation with optional formatter |
| `animated-div-breathing.tsx` | CSS keyframe breathing pulse               |

### `src/components/app/`

| Component       | Description                                                          |
| --------------- | -------------------------------------------------------------------- |
| `PageContainer` | Standard page layout — title, subtitle, actions slot                 |
| `AppDialog`     | Reusable dialog — trigger, title, description, footer, size variants |
| `ThemeProvider` | Applies persisted `light`/`dark` class to `<html>` on mount          |
| `LocaleDialog`  | Language switcher — sets `NEXT_LOCALE` cookie                        |

---

## Best Practices & AI Guide

This project ships with `CLAUDE.md` — a machine-readable guide that AI coding assistants load automatically when you open the project. It covers rules with **WRONG → CORRECT** examples for every system.

### The golden rules (quick reference)

| #   | Use                                           | Never                                     |
| --- | --------------------------------------------- | ----------------------------------------- |
| 1   | `useBoolean`                                  | `useState(false)` for toggles             |
| 2   | `formatDate(date, DateFormatting.X)`          | Raw `format()` or `.toLocaleDateString()` |
| 3   | `useTranslations`                             | Hardcoded strings in JSX                  |
| 4   | `useFetch`                                    | `useEffect + axios.get`                   |
| 5   | `useMutation`                                 | `axios.post/put/delete` in components     |
| 6   | Constants in `api-routes.constants.ts`        | Inline API path strings                   |
| 7   | `WEB_ROUTES` from `web-routes.constants.ts`   | Inline `"/path"` in links                 |
| 8   | `formValidator` + `<Form>` + field components | Raw `<input>` elements                    |
| 9   | `toastSuccess/Error/...` from `@/lib/toast`   | `sonner` directly                         |
| 10  | `useLocalStorage` / `getStorage`              | `localStorage` directly                   |
| 11  | `CONFIG` from `@/lib/app-config`              | `process.env` in components               |
| 12  | `cn()` + Tailwind utilities                   | Static inline `style={{}}`                |
| 13  | Iconify `<Icon icon="..." />`                 | Other icon libraries                      |

For the full guide with code examples, see [`CLAUDE.md`](./CLAUDE.md).

---

## Why are these files here?

You may notice some files in this repo that look unfamiliar. Here's what they do:

| File / Directory      | What it is                                                                                                                                                                                                                                                                            |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CLAUDE.md`           | A machine-readable guide for AI coding assistants (Claude Code, Cursor, etc.). When you open this project, tools like Claude Code automatically load this file and follow its rules — enforcing the correct hooks, patterns, and conventions without you having to explain them.      |
| `MEMORY.md`           | An index file used by Claude Code's memory system to track project-specific notes across conversations. You can ignore this if you're not using Claude Code.                                                                                                                          |
| `.claude/rules/*.md`  | Topic-specific rule files referenced by `CLAUDE.md` — one file per domain (forms, data fetching, translations, etc.). They keep the main guide concise while providing full detail where needed.                                                                                      |
| `pnpm-workspace.yaml` | A pnpm configuration file. Here it controls which packages are allowed to run native build scripts during install (e.g., `@swc/core`, `@parcel/watcher`). This speeds up installs and avoids unexpected postinstall scripts.                                                          |
| `components.json`     | The configuration file for [shadcn/ui](https://ui.shadcn.com). It tells the `shadcn` CLI where to put new components, which style preset to use, and how aliases are configured. You only interact with this when adding new shadcn components via `pnpm dlx shadcn add <component>`. |

---

## Example Feature — Contact Form

The repo includes a canonical feature vertical at `src/features/contact/` that demonstrates the intended way to build features in this starter. Use it as a copy-paste template.

**Works out of the box** — no backend required. A local demo API route at `src/app/api/proxy/contact/route.ts` handles the submission and simulates a short processing delay so you can see the loading and success states immediately.

**Navigate to it:** `http://localhost:3000/contact`

**Files:**

```
src/features/contact/
├── types/contact.types.ts              # typed request + response shapes
├── validation/contact.schema.ts        # Zod schema (source of truth for validation)
└── components/ContactForm.tsx          # form with loading, success, and error states

src/app/contact/page.tsx                # page route using PageContainer
src/app/api/proxy/contact/route.ts      # demo API handler (replace with real backend later)
src/__tests__/contact.schema.test.ts    # schema validation tests
```

**Patterns it demonstrates:**

| Pattern                      | Where                                                                  |
| ---------------------------- | ---------------------------------------------------------------------- |
| Web route constant           | `WEB_ROUTES.CONTACT` in `src/constants/web-routes.constants.ts`        |
| API route constant           | `API_ROUTES.CONTACT.SUBMIT` in `src/constants/api-routes.constants.ts` |
| Typed request/response       | `ContactRequest`, `ContactResponse` in `types/contact.types.ts`        |
| Zod schema + `formValidator` | `contactSchema` in `validation/contact.schema.ts`                      |
| `useMutation` for writes     | `trigger({ method: "POST", data })` in `ContactForm.tsx`               |
| `useBoolean` for UI state    | success state toggle in `ContactForm.tsx`                              |
| `toastSuccess` after success | `ContactForm.tsx` onSubmit handler                                     |
| `Form` + field components    | `TextInput`, `FormTextarea` with translation keys                      |
| `useTranslations`            | `contact` namespace in all 4 locale files                              |
| `PageContainer`              | `src/app/contact/page.tsx`                                             |
| Server-side validation       | `src/app/api/proxy/contact/route.ts` (plain Zod, no client deps)       |

**How the demo flow works:**

1. Form submits via `useMutation` → `POST /api/proxy/contact`
2. Next.js matches the specific route at `src/app/api/proxy/contact/route.ts` (static routes take priority over the `[...path]` catch-all)
3. Demo handler validates the body, waits 700ms, returns `{ success: true, message: "..." }`
4. Form shows the success state and fires a toast

**To connect a real backend:** delete `src/app/api/proxy/contact/route.ts` and set `NEXT_PUBLIC_SERVER_URL` to your API server in `.env.local`. The proxy catch-all will then forward `POST /contact` to your backend automatically.

---

## Bug reports

Report bugs on GitHub: open this repository and use **Issues** → **New issue**.

---

## Contributing

1. Fork this repository if you want to propose changes back to the template. To start your own app from this starter, use **Use this template** on GitHub instead of cloning the template repo directly ([Quick Start](#quick-start)).
2. Follow the patterns in `CLAUDE.md` — or just use Claude Code and it will follow them for you
3. Add new API paths to `src/constants/api-routes.constants.ts`
4. Add new page routes to `src/constants/web-routes.constants.ts`
5. Add new hooks to `src/hooks/` and export from `src/hooks/index.ts`
6. Keep all locale files in sync: `messages/en.json`, `messages/he.json`, `messages/es.json`, `messages/ar.json`

---

_Built with Next.js 16, TypeScript 5, and Tailwind CSS 4._

**Author:** [David Even-Haim on LinkedIn](https://www.linkedin.com/in/david-even-haim-0657bb1a5/)

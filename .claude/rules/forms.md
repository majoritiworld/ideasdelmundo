# Forms Rules

Use the project’s form system by default.

## Default Stack

- `react-hook-form`
- `zod`
- `zodResolver`
- project form components
- `formValidator` helpers

## Rules

- Do not use raw `<input>` / `<select>` / `<textarea>` for app forms unless clearly justified.
- Use the shared `<Form>` wrapper.
- Use form field components from `src/components/form`.
- Use `formValidator` helpers for common validation patterns.
- Keep labels, placeholders, helper text, and errors translatable.
- Reuse existing field patterns before creating new field variants.

## Preferred Pattern

1. define schema
2. infer form type from schema
3. create form with `useForm`
4. render with `<Form>`
5. use shared field components

## Validation Guidance

Prefer `formValidator` helpers for:

- required strings → `requiredString()`
- select fields → `requiredSelect()`
- multi-select with minimum → `requiredMultiSelect(min?)`
- email → `requiredEmail()` / `optionalEmail()`
- password → `requiredPassword()` / `requiredPasswordRelaxed()`
- password confirmation → use `confirmPassword(pwField, confirmField)` as a schema-level `.refine()`
- phone → `requiredPhoneNumber()` / `optionalPhoneNumber()`
- positive numbers → `requiredPositiveNumber()`
- dates → `requiredDate()`
- booleans → `booleanField()` / `requiredBoolean()`
- file uploads → `singleFile()` / `multipleFiles()`
- URLs → `requiredWebUrl()` / `optionalWebUrl()`

Only write raw custom zod validation when the project helpers do not cover the use case clearly.

## List Views and Tables

For displaying paginated, searchable, sortable data — use the `DataTable` component.

```tsx
import { DataTable } from "@/components/ui/data-table";
```

`DataTable` handles sorting, client-side search, and pagination internally. Do not build a custom table with manual sort/filter/pagination state.

```tsx
const columns = [
  { key: "name", header: "Name", sortable: true },
  { key: "email", header: "Email" },
  { key: "id", header: "Actions", cell: (row) => <ActionsMenu id={row.id} /> },
]
<DataTable data={users} columns={columns} searchable searchKeys={["name", "email"]} />
```

## Translation Guidance

Form labels / placeholders / helper text should use translation keys, not hardcoded strings.

## UX Guidance

- Keep field spacing and heights consistent
- Reuse existing field layouts
- Prefer explicit validation over implicit assumptions
- Preserve current UX patterns across forms

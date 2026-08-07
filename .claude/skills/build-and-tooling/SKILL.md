---
name: build-and-tooling
description: Project setup, scripts, linting, formatting, environment config, and CI for Meridian. Use when configuring the repo, adding dependencies, setting up scripts, or debugging build and env issues.
---

# Build and Tooling

## Scripts

```json
{
  "dev": "next dev",
  "build": "next build",
  "lint": "eslint . --max-warnings 0",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:e2e": "playwright test",
  "test:a11y": "vitest run --project a11y",
  "db:migrate": "drizzle-kit migrate",
  "db:seed": "tsx db/seed/index.ts",
  "verify": "pnpm lint && pnpm typecheck && pnpm test && pnpm test:a11y"
}
```

`pnpm verify` is the gate. Run it before claiming work is done.

## Structure

```
app/            routes
components/
  ui/           shadcn primitives — generated, minimally edited
  meridian/     product components (GapCard, EvidenceChain, NodeBadge, MetricDelta)
lib/
  queries/      database access
  types/        domain types
  ai/           prompts, schemas, parsing
  utils/
db/             schema, migrations, seed
tests/
```

`components/ui` is shadcn output. Do not restyle primitives there — compose in
`components/meridian` instead. This keeps `npx shadcn@latest add` non-destructive.

## Dependencies

Before adding one, ask whether shadcn, Radix, or the platform already covers it.

Reasonable additions when needed:

- Canvas graph — React Flow, or D3 if the layout demands custom force behaviour
- Charts — Recharts, or hand-rolled SVG for anything small
- URL state — `nuqs`
- Dates — `date-fns`

Avoid: a global state library, a component kit that competes with shadcn, a CSS-in-JS
runtime, moment, lodash for things `Array.prototype` already does.

## Environment

Validate env at startup, not at first use.

```ts
// lib/env.ts
export const env = z.object({
  DATABASE_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  SEARCH_API_KEY: z.string().min(1),
}).parse(process.env)
```

Ship `.env.example` with every key and a comment. A new contributor should get running
without asking anyone for the list.

## Lint rules that matter here

- `@typescript-eslint/no-explicit-any`: error
- `@typescript-eslint/no-floating-promises`: error
- `jsx-a11y` recommended set: error, not warn — accessibility is a build gate, see
  `accessibility-core`
- `no-restricted-imports`: block importing `db` directly from `app/**` components

## Formatting

Prettier with the Tailwind class-sort plugin. Formatting is never discussed in review.

## CI

On every PR: install → lint → typecheck → unit → a11y → build → e2e on main flows.

Any failure blocks merge. The a11y suite is not advisory.

## Performance budget

The Research Full view is the risk — it is a large document with heavy interactivity.

- Route JS under 200 KB gzipped
- LCP under 2.5s on a mid-tier laptop
- Canvas holds 60fps while panning at 100 nodes

If the budget is breached, fix it before adding features. A consultant loading this
minutes before a call has no tolerance for a slow page.

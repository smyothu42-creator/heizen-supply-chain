---
name: typescript-conventions
description: TypeScript style, type modelling, and naming rules for Meridian. Use when defining types, modelling domain entities, handling nullability, writing function signatures, or deciding between type and interface.
---

# TypeScript Conventions

`strict: true`, `noUncheckedIndexedAccess: true`. No exceptions.

## Never use `any`

Use `unknown` and narrow. If you are reaching for `any`, the type model is wrong.
`as` casts require a comment explaining why the compiler cannot know what you know.

## Model the domain, not the database

Domain types live in `lib/types/`. They describe what the product means, not what the
schema stores.

```ts
export type ProcessLevel = 0 | 1 | 2

export type ProcessHealth = "critical" | "watch" | "healthy"

/** Whether we have client evidence for this node. Orthogonal to health. */
export type DataCompleteness = "none" | "partial" | "full"

export type ConfidenceLevel = "low" | "medium" | "medium-high" | "high"
```

`ProcessHealth` and `DataCompleteness` are **separate types on purpose**. They were
conflated in the prototype and that was the bug. Never merge them into one status enum.

## Make illegal states unrepresentable

A gap always has a price. A question never does. Model that in the type system rather
than with optional fields and runtime checks.

```ts
type Finding = {
  id: string
  title: string
  rationale: string          // "why we believe it"
  evidence: EvidenceRef[]    // never empty — every claim traces to a source
}

export type Gap = Finding & {
  kind: "gap"
  annualImpact: Money        // required
  effort: "low" | "medium" | "high"
  durationWeeks: number
}

export type Question = Finding & {
  kind: "question"
  askOrder: number           // sequencing is the product
  targetStakeholder?: string
}

export type Item = Gap | Question   // discriminate on `kind`
```

Gaps and Questions share a component. They share a **base type**, not a merged type with
everything optional. The renderer switches on `kind`.

## Money and units are never bare numbers

```ts
export type Money = { amount: number; currency: "INR" | "USD" }
export type Days = number & { readonly __brand: "Days" }
```

The product's entire persuasion mechanic is comparing numbers. A unit mix-up in a
benchmark comparison is a credibility failure in front of a client.

## Every metric carries its benchmark

```ts
export type Benchmarked<T> = {
  actual: T
  bestInClass: T
  source: string          // where the benchmark came from
}
```

If a metric type has no benchmark slot, the UI will end up showing a bare number, and a
bare number does not sell anything. Bake the comparator into the type.

## Nullability

Distinguish *absent* from *empty* from *zero*.

- `undefined` — we have not researched this yet
- `null` — we researched it and there is genuinely nothing
- `[]` / `0` — a real, measured value

These render differently. "Not yet researched" and "confirmed none" are opposite
messages to a consultant preparing for a call.

## Naming

- Types and components: `PascalCase`
- Functions and variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Booleans read as assertions: `hasEvidence`, `isConfirmed`, `canDrillDown`
- Domain terms match the vocabulary in `CLAUDE.md`. It is `firstTimeMatchRate`, not
  `matchPercent`. Consultants and code use the same words.

`type` for unions, intersections, and object shapes. `interface` only when declaration
merging is genuinely needed — which is almost never.

## Validation boundaries

Zod schemas at every trust boundary: API input, AI model output, file ingestion. Infer
types from schemas, never duplicate them.

```ts
export const GapSchema = z.object({ /* ... */ })
export type Gap = z.infer<typeof GapSchema>
```

AI output is untrusted input. Parse it. A malformed gap that renders as `undefined Cr`
in front of a client is worse than a caught error.

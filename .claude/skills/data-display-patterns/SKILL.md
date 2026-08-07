---
name: data-display-patterns
description: How to display metrics, gaps, questions, evidence, confidence, comparisons, and empty states in Meridian. Use when rendering any data — numbers, lists, benchmarks, provenance, or node status.
---

# Data Display Patterns

## Never show a bare number

Every metric appears with its comparator. This is not decoration — the delta is the
entire pitch.

```
✗  9.5 days
✓  9.5 days        best-in-class 2 days        +7.5 days
```

`MetricDelta` renders actual, best-in-class, and the difference, with the difference
carrying the most visual weight. If a metric has no benchmark, show the actual and label
the benchmark as unavailable — never silently drop the comparator, or the number becomes
meaningless.

## Money

Indian format throughout: `₹14.7 Cr`, `₹50 L`. Never `₹147000000`.

Large monetary figures are the emotional payload of the product. Give the headline
leakage figure display-scale type. Give per-gap figures a consistent, smaller, aligned
treatment so they can be scanned down a column.

Missing money is `—`. Never `₹0`, which is a claim, not an absence.

## Gaps and Questions

Shared component, different register. Both are `FindingCard`; the `kind` discriminator
changes the presentation.

**Gap** — a finding. Past-tense evidence, priced.

```
1   Email/WhatsApp approvals, no audit trail
    Low effort · 6 weeks                          ₹50 L / yr
    ▸ Why we believe it   ▸ Expected impact   ▸ 3 sources
```

**Question** — an action. Future-tense, sequenced, no price.

```
Ask 1st   What's your first-time match rate on 3-way match?
          → Head of Procurement
    ▸ Why this matters   ▸ What a bad answer tells you
```

A price on a question, or an ask-order on a gap, means the model is wrong.

Sequencing is the product for Questions. *"Ask this first, then this"* is what saves
three calls. Make order structurally visible, not just a sort key.

## "Why we believe it" and "Expected impact"

These are third-read content. Collapsed by default, expandable in place — not a
navigation away from the list. A consultant scanning ten gaps must not lose their place
to check one.

When expanded, they show reasoning and evidence together, because the reasoning is only
credible with the sources attached.

## Evidence

Provenance is always reachable in one click, from anywhere.

```
Gap  →  3 sources  →  ┌ Discovery call 2 · transcript
                      │ "approvals live in email and WhatsApp"
                      └ FY25 procurement pain points · email
```

Show the excerpt, not just the filename. The excerpt is what a consultant reads aloud in
a meeting. Link the excerpt back to the full source.

## Confidence

Always paired with its reason. A level alone is noise.

```
Medium-high
Based on FY25 annual report, 2 discovery calls, and public hiring signals
```

Confidence is a trust feature. Never hide it to make output look stronger — the moment a
consultant is contradicted by a client on a claim the product presented as certain, the
whole tool loses credibility.

## Node status — two axes, two encodings

```
health       → colour     critical / watch / healthy
completeness → fill·stroke  none / partial / full
```

Never one combined indicator. The legend must show both axes separately. See
`design-system`.

## Empty states — three different messages

| State | Meaning | Message | Action |
|---|---|---|---|
| Not researched | We have not looked | "Not yet researched" | Run research |
| No sources | We looked, we lack input | "Add a transcript or filing to research this" | Upload |
| Confirmed none | We looked, nothing found | "No issues found here" | — |

These are opposite messages. Rendering all three as a blank cell or as `N/A` is a real
bug, not a polish issue. Most nodes will be in one of these states most of the time —
they are the common case and deserve real design.

## Comparison

Align lanes on shared process stages. Emphasise the delta between lanes over each lane's
absolute values.

```
                PR & Approvals   Sourcing/RFQ   Vendor Onboarding
This client     63 · 4.4d        47 · 10.1d     52 · 21d
Best in class   82 · 1.4d        79 · 3.5d      80 · 7d
                −3d              −6.6d          −14d          ← loudest row
```

The delta row is the argument. Everything else is supporting evidence.

## Tables

Right-align numbers, left-align text, `tabular-nums` everywhere. Sticky header on any
table taller than a viewport. Column sort is fine; hidden columns behind a menu are not —
a consultant will not find them mid-call.

## Long lists

Rank explicitly with a visible number when order carries meaning (gap impact rank, ask
order). Do not rely on position alone — position is invisible once a user scrolls.

---
name: design-system
description: shadcn/ui usage, design tokens, colour semantics, and typography for Meridian. Use when building any UI component, choosing colours, adding a shadcn primitive, or defining visual style.
---

# Design System — shadcn/ui

shadcn/ui on Tailwind. Primitives in `components/ui` are generated and left close to
stock. Product components live in `components/meridian` and compose primitives.

Never restyle a primitive in place — it makes future `shadcn add` runs destructive.

## The two-axis colour problem

This is the most important rule in this file.

Meridian encodes **two independent things** that the prototype collapsed into one:

| Axis | Values | Encoded by |
|---|---|---|
| **Process health** | critical / watch / healthy | **Colour** |
| **Data completeness** | none / partial / full | **Not colour** — fill, stroke, or an explicit marker |

A healthy node we know nothing about and a critical node with full evidence are opposite
situations. If both axes use colour, they read as adjacent. They are not.

Suggested treatment (open to the designer, but keep them separable):

```
health      → hue          critical=danger, watch=warning, healthy=success
completeness→ fill + stroke  none=dashed outline/no fill, partial=hatched, full=solid
```

An outsider should be able to read the legend once and never be confused again.

## Tokens

Semantic tokens only. Never a raw hex or a bare Tailwind palette class in a component.

```css
:root {
  --background, --foreground
  --card, --card-foreground
  --muted, --muted-foreground
  --border, --ring
  --primary, --primary-foreground

  /* health */
  --health-critical, --health-watch, --health-healthy

  /* evidence and confidence */
  --evidence, --evidence-muted
  --confidence-low, --confidence-medium, --confidence-high

  /* benchmark comparison */
  --metric-actual, --metric-best-in-class, --metric-delta
}
```

`bg-health-critical`, not `bg-red-500`. When the palette changes, one file changes.

## Colour never carries meaning alone

Every health state also carries a shape, an icon, or a label. Roughly 1 in 12 men has a
colour vision deficiency, red/green is the most common axis, and this product is shown to
investors on unknown projectors in unknown lighting.

## Typography

Two roles, no more.

- **Display** — headings, the leakage number, the thesis. Something with character.
- **Body / UI** — everything else. Highly legible at small sizes.
- **Optional mono** — only for identifiers, system names (`SAP MM`), and metric values
  where digit alignment matters in a column.

Type scale is fixed and small. Four sizes for body text, three for headings. A dense
product with eleven type sizes reads as noise.

Numbers in tabular contexts use `tabular-nums`. A comparison column where digits do not
line up is harder to scan and looks unconsidered.

## Component inventory

Build these once in `components/meridian` and reuse everywhere:

| Component | Job |
|---|---|
| `MetricDelta` | actual vs best-in-class with the gap made visually obvious |
| `EvidenceChain` | source → claim → finding, traversable |
| `ConfidenceBadge` | level plus its reason on hover/expand |
| `NodeCard` | health + completeness, two-axis encoding |
| `FindingCard` | shared base for Gap and Question |
| `EmptyState` | absent vs confirmed-none, with the right next action |
| `LevelBreadcrumb` | Level 0 → 1 → 2 position |
| `SourceChip` | source type, name, ingestion state |

`FindingCard` is shared by Gaps and Questions. Same component, different visual register —
see `data-display-patterns`.

## Density

This is a dense professional tool, not a marketing page. Default to shadcn's `sm` sizes.
Generous padding on a screen with forty data points means the consultant scrolls instead
of reading. See `layout-and-density`.

## Dark mode

Support it. Health colours need separate dark values — the naive light-mode red on a dark
background fails contrast and reads as an error state rather than a severity level.

## Restraint

Spend visual boldness in one place per screen. On Research it is the thesis and the
leakage number. On Gaps it is the ROI total. On Compare it is the delta between lanes.
Everything else stays quiet. A screen where five things shout is a screen where a
consultant reads nothing.

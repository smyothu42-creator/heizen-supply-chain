# Meridian — working prototype

All six surfaces are built and navigable. Research is the only one carrying
competing design directions; the rest have one design each.

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

The landing page explains the four Research directions and links into every surface.
Inside the app, the tab bar moves between surfaces and never disappears.

## The six surfaces

| Tab | What it does |
|---|---|
| **Canvas** | A real spatial map: scroll to zoom, drag to pan, minimap, curved edges labelled with what actually moves along them. Two graphs of the same business — **Processes** (what happens) and **Entities** (what moves) — plus a **List** view for keyboard and phone. |
| **Research** | The company dossier, in **four different organising principles** — see below. Brief and Full for each. |
| **Gaps** | Twelve findings, eleven priced. Sortable by value, effort or confidence, filterable by area, with tick-box plan selection and a live running total. |
| **Questions** | The same component family as Gaps in the opposite register: sequenced, future tense, no prices anywhere. Arrange by ask order or by who you are asking. |
| **Compare** | Lanes stacked and aligned on six shared process stages. Ticking a company adds a lane below rather than navigating away. The delta row carries the most weight because the delta is the argument. |
| **Sources** | The four ingested sources, what each one produced, and the claims that have nothing behind them. Connectors are designed as real and labelled as not built. |

### Canvas — how it works

Three levels of process graph. Level 0 is the value chain, Level 1 is the whole
operation with its cross-links and return flows, Level 2 opens one process. Double-click
a node to go deeper, or use the crumbs. Edges route three ways — forward, bowed down a
column, or looped underneath for return flows — and stagger themselves so no two labels
land on top of each other.

The Entities graph is the same business seen as the records that move through it: a
requisition becomes an order, meets a goods receipt and an invoice, and either matches or
does not. Each record carries its own health and evidence state, and its own system of
record.

### Canvas — the two-axis encoding

The prototype's original problem was collapsing two independent things into one colour
system. Here they are separate and neither is ever encoded by the other:

```
health       → colour + shape   critical (▲) / watch (■) / running well (●)
completeness → fill + stroke    none = dashed, no fill
                                partial = solid stroke, hatched fill
                                full = solid stroke, solid fill
             → plus a 3-segment evidence bar, monochrome
```

Both carry a non-colour marker, so the pair survives greyscale, a colour vision
deficiency and an unknown projector. The legend shows all nine combinations as a grid.
Fifteen of the thirty-seven boxes have no evidence behind them, and the screen says so
rather than letting a green box imply we checked.

### Research — four organising principles

Each is sorted by a different axis, so the first screen changes completely.

| Direction | Sorted by | The idea |
|---|---|---|
| **Money-first** | Rupees | The dossier is a decomposition of ₹14.7 Cr. Company facts only appear where they explain a slice of it. |
| **Call-first** | Time | Laid out in the order the discovery call happens: open, establish, probe, land, next. |
| **Certainty-first** | Confidence | A claim ledger — confirmed, inferred, unverified — with the basis always attached. |
| **Stakeholder-first** | Person | Pick who you are meeting and the whole dossier re-sorts to what they own and are measured on. |

Open Brief first and give yourself thirty seconds, the way Aryan would. If you cannot
say something useful out loud at the end of it, that direction has failed regardless of
how good its Full is.

## Verify

```bash
pnpm check:data                     # no server needed
pnpm build && pnpm start -p 4311
pnpm check:ui                       # fit, contrast, keyboard, panel focus
pnpm check:stakeholder              # fit for every stakeholder selection
pnpm shots                          # writes screenshots/
```

Current state:

- Research Brief fits 375×667 and 390×844 with nothing clipped, in all four directions
  and all five stakeholder selections
- Zero AA contrast failures across fourteen pages in both light and dark
- Every interactive element keyboard reachable on all fourteen pages; the detail panel
  opens on Enter, closes on Escape, and returns focus to its trigger on all seven pages
  that have one
- Every subtotal reconciles to ₹14.7 Cr — by money bucket, by evidence tier, by
  stakeholder — and no gap is priced twice

## Where things live

```
src/lib/suvarna.ts            gaps, sources, claims, questions, stakeholders, metrics
src/lib/canvas.ts             the 37-node three-level tree
src/lib/compare.ts            comparison lanes and shared stages
src/lib/directions.ts         the four principles, and what each sacrifices
src/app/globals.css           semantic tokens, light + dark
src/components/meridian/      MetricDelta, EvidenceChain, ConfidenceBadge, NodeCard,
                              GapRow, QuestionRow, EmptyState, the shared detail panel
src/components/surfaces/      Canvas, Gaps, Questions, Compare, Sources
src/components/directions/    the four Research directions, Brief and Full each
```

One detail panel is shared by every surface — gaps, claims, sources and process nodes
all open in the same right-hand slot, never two at once. Change a price or an excerpt in
`src/lib/suvarna.ts` and it updates everywhere. Nothing is hard-coded into a layout.

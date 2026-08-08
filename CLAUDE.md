# Meridian — Project Context

> This file is loaded automatically by Claude Code at the start of every session.
> It is the single source of truth for what Meridian is, who uses it, and how to build for it.
> Skills in `.claude/skills/` carry the detailed rules. This file carries the *why*.

---

## 0. Assumptions to confirm

These were inferred, not confirmed. Correct them and delete this section once verified.

| Assumption | Confirm with |
|---|---|
| Next.js (App Router) + TypeScript + Tailwind + shadcn/ui | Jeet |
| TanStack Query for server state, Zod for validation | Jeet |
| Postgres via Drizzle or Prisma | Jeet |
| Vitest (unit) + Playwright (e2e) | Jeet |
| "Stable version before August" likely means **end of August 2026** | Sai Myo Thu |
| Design work is React prototypes, then Jeet productionises | Sai Myo Thu |

If the real stack differs, update the relevant skill file rather than working around it.

---

## 1. What Meridian is

Meridian is Heizen's internal **supply-chain discovery platform**.

A consultant enters a company name, a sector, and (optionally) the stakeholders they
already know. Meridian researches that company from public sources — news, filings,
websites — plus any files or meeting transcripts the consultant uploads. It then
produces four things:

1. A **map** of how that company's supply chain operates.
2. A **dossier** on the company.
3. A ranked list of **gaps** — problems Heizen can pitch a solution to, each priced.
4. A set of **questions** to ask on the next client call.

The purpose is commercial, not analytical. Meridian exists to compress four discovery
calls into one, and to shorten the distance between "first meeting" and "signed".

**One-line framing to hold in mind while building: this is a sales instrument that
happens to be built out of research.**

---

## 2. Users

### Primary — the discovery consultant

Referred to internally by the archetype name **Aryan**.

His situation, in his own team's words: *"I got a lead. I have a call with them today.
I only know their company, their sector, and maybe which stakeholder I'm meeting.
I want quick research so I understand what problems they could have."*

What follows from that:

- He is **time-poor**, often minutes before a call, sometimes on a phone.
- He is **not a supply-chain expert** — he cannot decode dense domain jargon at speed.
- He needs **recall under pressure**: the three things worth saying out loud on the call.
- He will **not read a long report**. Assume he reads the first screen and nothing else
  unless something pulls him deeper.

Design consequence: every screen must answer *"what do I say on this call?"* within
one viewport. Depth is available on demand, never by default.

### Secondary — investors and prospective clients

Heizen demos Meridian to investors as evidence of a compounding asset, and sometimes
to prospective clients directly.

- Weight this persona **lower** than Aryan — do not compromise the working tool for the
  demo. But an outsider with zero domain knowledge should still grasp a screen in ~30 seconds.
- Practical test: *would a person who has never heard the term "3-way match" understand
  what this screen is telling them?* If no, add a plain-language line, not a tooltip.

### Not a user (yet)

The client company. **Client-facing presentation mode is explicitly out of scope** —
Sai raised it, and the team deferred it. Do not build it. Do not design for it.

---

## 3. Product surfaces

Six tabs. Two exist only as prototype, four are live and in use.

| Surface | Status | What it does |
|---|---|---|
| **Canvas** | Prototype only — Jeet has not built it | Node graph of the company's supply chain |
| **Research** | **Live, in active use** | Company dossier, Brief / Full toggle |
| **Gaps** | Live | Ranked problems Heizen can solve, priced |
| **Questions** | Live | Discovery-call questions, ordered |
| **Compare** | Live | Workflow comparison across projects |
| **Sources** | Live (ingestion works, connectors are mock) | Uploaded files and transcripts |

### Where the pain actually is

Ranked by what the team said, not by what looks most interesting to design:

1. **Research** — *"there's a lot of information being shown everywhere."* Both Brief
   and Full need optimising. Full has everything Aryan needs but is unreadable.
   **This is the highest-value problem in the product.**
2. **Gaps** — the list is clean, but the detail view (*why we believe it*, *expected
   impact*) needs a better shape.
3. **Questions** — same component family as Gaps; needs ordering and sequencing logic
   made visible ("ask this first, this second").
4. **Compare** — currently basic. Side-by-side or flow-chart representations both open.
5. **Canvas** — unbuilt. Highest design freedom, lowest immediate urgency.

Gaps and Questions **share a component**. Design them as one system with two data shapes.

---

## 4. Domain model

### The three levels

This is the core structural idea of Canvas and it must survive any redesign:

- **Level 0 — Value chain.** Identical across every manufacturing company on earth.
  Plan → Source → Make → Deliver → Return. Universal, so it is context, not insight.
- **Level 1 — Process.** Broadly similar between companies. Some variation.
- **Level 2 — Sub-process.** **This is where companies actually differ, and therefore
  where all the value is.** Level 2 is where a gap becomes visible and priceable.

The visual weight of the interface should increase as you descend. Level 0 should feel
like a map legend; Level 2 should feel like the destination.

### Gaps vs Questions

Consultants confuse these. The UI must not.

- A **gap** is a problem Heizen can sell a fix for. Backward-looking, evidence-based,
  priced in currency. *"AP hand-keys invoices into SAP — ₹1.8 Cr/yr."*
- A **question** is what to ask to learn more. Forward-looking, call-time ammunition,
  measured in calls saved. *"What's your first-time match rate on 3-way match?"*

They share a component but must never share a visual register. A gap is a finding.
A question is an action.

### Data completeness is a first-class state

Clients never hand over everything. **Most nodes will have no data, and that is normal,
not an error.** The current prototype conflates two different things in one colour
system — process health (critical / watch / healthy) and data presence (has data /
empty). Sai identified this correctly and it is an open design problem.

Rule going forward: **colour encodes health. Something other than colour encodes data
presence.** Fill, stroke style, opacity, an explicit marker — designer's call, but they
must be separable, because a healthy node with no data and a critical node with full
evidence are opposite situations that currently look adjacent.

### Benchmarking is the persuasion mechanic

Every process node should be able to answer: *this company takes 6 days, best-in-class
takes 1 day.* That delta is the pitch. It is not a nice-to-have stat — it is the reason
the screen exists. Give it room.

### Evidence and provenance

Nothing in Meridian should be unattributable. Every claim traces back to a source —
an email, a transcript line, a public filing. The chain is:

```
Source → extracted claim → node / gap / question → priced impact
```

A user must always be able to walk that chain backwards. If a UI pattern breaks the
chain, the pattern is wrong.

### Confidence, not certainty

The product states how sure it is (e.g. "Medium-high") and why. This is deliberate and
must be preserved. An AI research tool that sounds certain and is occasionally wrong is
worse than useless in front of a client — it destroys the consultant's credibility.
Confidence display is a trust feature, not a disclaimer.

---

## 5. Interaction decisions already made

Do not re-litigate these without raising it first.

| Decision | Detail |
|---|---|
| **No manual editing** | Users never hand-edit AI output. Instead a **prompt box** where they describe the correction and the AI applies it. Preserves the audit log. |
| **"Needs correction"** | Opens that prompt box. It is not a flag-and-forget. |
| **Chat exists, placement open** | AI chat is wanted. The prototype's bottom bar is **not** the answer. Side panel, popover, or contextual click-to-ask are all open. Reference point: Heizen Studio. |
| **Client mode** | Cut. Out of scope. |
| **Project-first creation** | Create the project, *then* ingest sources. Deliberate — it survives failed uploads and lets a consultant open a project before they have any files. Preserve this. |
| **Data-source connectors** | UI only, not functional. Live ERP/warehouse ingestion is roadmap. Design them as real, label them honestly. |
| **Research inputs** | Company, sector, known stakeholders, plus a free-text prompt that biases the research (e.g. *"Vedanta Goa copper"*). |
| **Comparison overlay** | Selecting another company should stack its lane below the current one. Tick-box selection, not a separate page. |

---

## 6. Working agreement

### Deliverable shape

The team explicitly asked for **two or three distinct high-level directions first**,
not one refined answer. They select, then you go deep on the selection.

So: breadth before depth. Directions should differ in *organising principle* — how
information is structured and prioritised — not in colour palette. Three variants of
the same layout with different accent colours is not three directions.

### Review chain

Sai (design) → Aman, Abhilasha, Jeet (feedback) → Jeet (implementation).

Jeet needs implementation time after design lands. Fewer, sharper options beat many
half-formed ones.

### Timeline

Stable version targeted before end of August 2026. Speed is explicitly valued over
polish at this stage.

---

## 7. Standing rules for any UI work in this repo

1. **Information density is the whole problem.** Meridian's failure mode is not ugliness,
   it is overwhelm. Every screen should have an obvious first read, a second read on
   scroll, and a third read on click. Never all three at once.
2. **Progressive disclosure by default.** Full detail lives one interaction away.
3. **Every number needs a comparator.** "9.5 days" means nothing. "9.5 days vs 2 days
   best-in-class" is the product.
4. **Evidence stays one click away, always.**
5. **State confidence honestly.** Never imply certainty the pipeline doesn't have.
6. **Plain language over domain jargon.** Aryan is not an expert and neither are
   investors. Where a term must appear, gloss it inline once.
7. **Empty is normal.** Design empty and partial states as first-class, not afterthoughts.
   Most nodes will be empty most of the time.
8. **Accessible by default.** Keyboard-operable, visible focus, AA contrast, reduced
   motion respected. Not a later pass.
9. **Gaps and Questions share code, not visual voice.**
10. **When a choice is genuinely open, build the variants rather than describing them.**

---

## 8. Vocabulary

Terms that appear throughout the product and the source material.

| Term | Meaning |
|---|---|
| **P2P** | Procure-to-Pay — the full cycle from requisition to supplier payment |
| **PR / RFQ / PO / GR** | Purchase Requisition / Request for Quotation / Purchase Order / Goods Receipt |
| **3-way match** | Reconciling PO + Goods Receipt + Invoice before paying. Mismatch → exception |
| **Exception** | An invoice that failed automatic matching and needs manual work |
| **First-time match rate** | % of invoices that match automatically on the first attempt |
| **Touchless** | % of transactions completed with no human handling |
| **Maverick buying** | Purchasing outside official process — loses negotiated pricing |
| **Early-payment discount** | Supplier discount for paying early; commonly under-captured |
| **Cycle time** | Elapsed time for one pass through a process |
| **Leakage** | Money lost annually to process inefficiency — Meridian's headline number |
| **SCOR** | The Plan / Source / Make / Deliver / Return reference model behind Level 0 |
| **S&OP** | Sales & Operations Planning |
| **ERP** | Enterprise Resource Planning — the system of record (SAP, Oracle) |
| **SAP MM / FI / SD / WM** | Materials Mgmt / Finance / Sales & Distribution / Warehouse Mgmt |
| **AP** | Accounts Payable |
| **CPO** | Chief Procurement Officer |
| **3PL** | Third-party logistics provider |

---

## 9. Skills

Detailed rules live in `.claude/skills/`. Load the relevant one before working.

**Stack** — `framework-patterns` · `typescript-conventions` · `api-layer` ·
`database-layer` · `state-and-forms` · `build-and-tooling` · `testing`

**Design** — `design-system` · `layout-and-density` · `data-display-patterns` ·
`ux-copy` · `motion`

**Accessibility** — `accessibility-core` · `keyboard-navigation` · `aria-patterns` ·
`a11y-testing`

---

## 10. What this repo actually runs

Recorded from the working prototype, not inferred. Section 0 above is still open —
these are the choices this repo makes today, not a decision on Jeet's behalf.

| Thing | Actual |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + TypeScript 5 |
| Styling | Tailwind v4 with semantic tokens in `src/app/globals.css` |
| shadcn/ui | **Not installed.** Nothing in the Research directions needed a Radix primitive, and the config is Jeet's call. Token names follow `design-system` exactly so it drops in without a rewrite. |
| Server state / validation / DB | None. The prototypes read one static file, `src/lib/suvarna.ts`. |
| Tests | No Vitest or Playwright test suite. There is a headless verification harness in `scripts/` — see below. |
| Surfaces built | All six. Canvas, Research (four directions × Brief/Full), Gaps, Questions, Compare, Sources. |

### Verification harness

`scripts/verify.mjs` (`pnpm check:ui`) checks the constraints that are easy to claim
and easy to get wrong. Run the production server first (`pnpm build && pnpm start -p
4311`):

- Research Brief does not scroll, and nothing inside it is clipped, at 375×667 and 390×844
- Text contrast meets AA against its computed background, in light **and** dark, across all fourteen pages
- Every interactive element is reachable by Tab; the detail panel opens on Enter, closes on Escape, and returns focus to its trigger

One known blind spot: the contrast check reads the nearest opaque ancestor background,
so it cannot see decorative overlays such as Canvas's hatch fill. Those have to be
checked by eye — `pnpm shots` exists for that.

`scripts/check-data.ts` (`pnpm check:data`) reconciles the numbers: every gap price,
every money bucket, every stakeholder subtotal and every evidence tier must sum to
₹14.7 Cr, no gap may be priced by two claims, and nothing may appear without a
source. It needs no server.

`scripts/audit-density.mjs` (`pnpm check:density`) counts the visible words,
focusable controls and screens of scroll on every page. Information density is the
whole problem in this product, so it is measured rather than argued about. Baseline
before the density pass was 9,244 words across 13 pages; it is now around 5,200.

`scripts/verify-stakeholder.mjs` repeats the fit check for every stakeholder
selection, because that direction's Brief changes height with the person chosen.
`scripts/shots.mjs` writes `screenshots/` for review.

Both harnesses emulate `prefers-reduced-motion: reduce`. Without it, reading a
computed colour immediately after a theme switch returns the mid-transition value
and every element carrying `transition-colors` reports a false contrast failure.

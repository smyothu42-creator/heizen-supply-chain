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

**It is called *Heizen Discovery Tool* in the product.** That is the name in
the masthead, the `<title>` of every page, and anywhere a user can read it.
*Meridian* is the internal name and stays that way in this document, in the
repo, and in code comments — a four-word product name does not survive being
used as a subject in prose ("Heizen Discovery Tool's failure mode is
overwhelm"), and renaming the codebase buys nothing. It was *Heizen Supply
Chain Tool* for about an hour; the shorter name is the one in the product. If a UI string needs to
refer to the tool, prefer a pronoun: Sources says *"Every claim in here traces
back to one of these"*, not the product name.

The masthead carries Heizen's own mark — see *The wordmark* in `DECISIONS.md`.

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

Eight tabs. One exists only as prototype, seven are live and in use.

| Surface | Status | What it does |
|---|---|---|
| **What to build** | Live | The project's front page, and where opening a project lands. A strip of four platform metrics, then three recommended builds ranked with a plain-language line each, then the rest of the findings at row density. The only surface that answers a question about Heizen rather than about the client. Ranking is computed in `src/lib/recommend.ts`, never authored. See *What to build is the project's front page* in `DECISIONS.md`. |
| **Operations** | Prototype only — Jeet has not built it | Node graph of the company's supply chain |
| **Research** | **Live, in active use** | Company dossier. Eleven directions, and four tabs on one View switch: Brief, Full, and two call agendas (*Intro call*, *Discovery call*) that sequence the directions for a given meeting. See *Research has two call agendas as well as two readings* in `DECISIONS.md`. |
| **Atlas** | Live | Heizen's own capability map, not this company's: every domain worked in, and which past project already proves the fix. Feeds Gaps' effort estimate via `Gap.precedentId`. See the header comment in `src/lib/atlas.ts` for why it is a two-level canvas plus a detail rail rather than a fourth level bolted onto Operations' `GraphCanvas`. |
| **Gaps** | Live | Problems Heizen can solve, what each needs first, and a plan with dates. **Not priced. See *Gaps has no money on it* in `DECISIONS.md`.** |
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
4. **Compare** — was basic; it is two tabs now. Time is the original stage-by-stage
   benchmark, Workflow is the flow-chart representation this line left open. See
   *Compare is two tabs*.
5. **Operations** — unbuilt. Highest design freedom, lowest immediate urgency.

Gaps and Questions **share a component**. Design them as one system with two data shapes.

---

## 4. Domain model

### The three levels

This is the core structural idea of Operations and it must survive any redesign:

- **Level 0 — Value chain.** Identical across every manufacturing company on earth.
  Plan → Source → Make → Deliver → Return. Universal, so it is context, not insight.
- **Level 1 — Process.** Broadly similar between companies. Some variation.
- **Level 2 — Sub-process.** **This is where companies actually differ, and therefore
  where all the value is.** Level 2 is where a gap becomes visible and priceable.

The visual weight of the interface should increase as you descend. Level 0 should feel
like a map legend; Level 2 should feel like the destination.

### Two three-word scales, and only one of them on the row

`GapRow` carries **confidence** (is the observation true) and **effort** (what
it costs to fix). Both run Low / Medium / High and they are unrelated
questions. For a while both were on the collapsed row, which is what forced
every rule below.

**Everything in this section describes `mode="value"`, which is what Research
renders.** Gaps passes `mode="delivery"`, where there is no price on the row at
all and the chip has moved to the far end in its place. The two rows are one
component and one prop; see *Gaps has no money on it* in `DECISIONS.md`, and read the differences
noted inline below.

**Effort leads the row now, as a coloured chip, in front of the finding.**
`EffortChip` in `Confidence.tsx`. Confidence has moved into the expanded
detail, beside its reason. The trade, stated plainly: what a fix costs to
deliver is what decides whether a gap is the one you open a call with, and it
is the axis a consultant sorts on; how sure we are changes what you may say
about it, which is a question you ask once you have picked the gap. Twelve rows
carrying both scales made neither readable.

- **The chip carries a hue, and that is only safe because it is alone.** Low is
  green, Medium amber, High red — `--effort-*` in `globals.css`, its own token
  family. Two three-word scales on one row could not both be coloured without
  reading as one axis, which is exactly why `ConfidenceChip` is neutral and
  stays neutral. **If confidence ever comes back to the collapsed row, the
  colour has to come off this chip.**
- **Low is green, which runs opposite to health.** Cheap to fix is good news.
  The chip keeps its noun — **"Low effort"**, never a bare "Low" — because next
  to a rupee figure "Low" could be read as a low number. That reason has expired
  on Gaps, where there is no rupee figure left to be confused with. The noun
  stays anyway: one chip that reads the same on both surfaces beats two, and
  "Low" on its own still does not say low *what*.
- **Colour is not the only carrier.** Three dots, filled to the level, so the
  scale survives greyscale and a projector that eats saturation.
- **Confidence is stated once, in the expanded detail**, as `ConfidenceChip`
  plus `confidenceReason` under *Why we believe it*. It is a chip there rather
  than a sentence because the level still has to survive being scanned. §7.5
  wants both axes shown; they are, one read apart.
- **The tier mark and the weeks are gone from the row on every surface**,
  Gaps included. They went in two steps — off Research first, off Gaps a
  revision later — and the `showMeta` prop that carried the distinction is
  deleted rather than left defaulting to something nothing passes. They were a
  second and third subject sharing the money column, and twelve rows of shape
  plus estimate is a lot of ignoring to do before the list can be read. Both
  are in the expanded detail's meta line, one click away.
- **The known cost, recorded so it stays a decision.** Gaps' Order dropdown
  still offers *How sure*, and the row no longer shows the tier it is being
  sorted by. The order is real and the shapes are one click down, but nothing on
  the collapsed list says which end is which. **If that turns out to matter, the
  cheap fix is to bring `TierMark` back only while that ordering is active** —
  a sort key visible because it is the sort key, rather than a mark on every
  row for the eleven-twelfths of the time nobody is sorting by it. Do not put
  it back unconditionally; that is the thing that was just removed.
- **`gap.rank` is off the Gaps list and still on Research's.** It is the *value*
  ranking, and on a surface with no value on it a column reading 8, 9, 11, 12, 3
  looks like a fault rather than an ordering. `showRank={false}`, so putting it
  back is one prop if the list turns out to need a handle to point at.
- **Weeks are spelled out where they appear: `14 weeks`.** It is weeks to
  deliver, not age. There is no recency field on a gap — if a "researched N
  weeks ago" reading is wanted, `sources` carry real dates (`27 June 2026`) and
  that is where it would come from.
- **The one-off cash figure survives on Research, and is the only qualifier
  left.** `+₹18.2 Cr once` sits between the finding and the price on the two
  gaps that have one. ₹1.6 Cr a year hiding ₹18 Cr off the balance sheet is a
  different sentence from ₹1.6 Cr a year, and it changes what is said out loud,
  so it cannot be one click away **on any surface that shows the annual figure
  it qualifies**. Gaps shows neither, which is the only reason it may drop both.
- **A gap with no price says "Not priced", not "—".** §6a. It was the last
  no-value dash on the row, and the same fix went into Certainty's claim rows.
  Delivery mode has no price column, so nothing there says it either way.

**Putting a chip on this row broke it at 375, and the fix is worth keeping.**
The title carried `flex-1` with `min-w-0` — `flex: 1 1 0%` plus permission to
shrink below its own content — so beside a `shrink-0` chip it collapsed to
almost nothing and rendered one word per line, straight through the price. The
wrapper's `flex-wrap` cannot rescue a child that has agreed to be zero wide.
The title is `w-full` below `sm` and `sm:w-auto sm:flex-1` above it: giving it
a hypothetical size the chip's line cannot hold is what actually forces the
wrap, so the chip takes the first line and the finding takes the next.

**Delivery mode hit the same wall from the other end, and needed the opposite
fix.** With the chip at the tail there is nothing to squeeze the title, so it is
a plain `flex-1` again — but a `shrink-0` chip 104px wide out of a 319px row
still left the title 150px and five lines deep. The row wraps instead: `order-1`
title, `order-2` chevron, `order-3` chip at `w-full`, and from `sm` the chip
takes `order-2` and a fixed `7.5rem` slot. **The ordering is what avoids a
second copy of the chip in the markup** — a `sm:hidden` duplicate would have
been two elements a screen reader has to be trusted to hide one of.

**The fixed slot is what stops the chips reading as a ragged column.** Three
labels of three different widths, right-aligned down twelve rows, line up on
one edge and not the other. The price they replaced never had this problem,
because `tabular` figures solved it for free.

**`check:ui` is blind to this.** Two boxes overlapping is not a clipped
element, an unreachable control or a contrast failure. Same blind spot as the
project switcher running over the first surface tab, and found the same way: by
looking at the 375 screenshot. **`pnpm shots` is part of reviewing a row
change, not an optional extra.**

### Gaps vs Questions

Consultants confuse these. The UI must not.

- A **gap** is a problem Heizen can sell a fix for. Backward-looking, evidence-based,
  priced in currency. *"Indirect spend bought off-contract — ₹2.1 Cr/yr."*
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

**Resolved, with one addition.** Colour is health, fill and stroke are evidence. But
separating the axes was not enough on its own: nine processes were still painted green
with no evidence behind them, including Make at a company with three plants. A sector
default is not a health reading. There is now a fourth health state, `unknown` —
neutral, dashed, dash-shaped mark — and `check:data` fails the build if a node with no
evidence carries a colour. The exception is `emptyKind: "confirmed-none"`: we looked
and found nothing, which is a real result and keeps its green.

**And there is a third axis, which is not about the client at all.**
`needsCorrection` says somebody has read our output and thinks it is wrong. It
is ink rather than a hue, precisely so it cannot be mistaken for a reading about
the process: *this is running badly* and *we have described this badly* are
different sentences and the second must never borrow the first's red. See *The
node carries three axes* under the Operations notes in `DECISIONS.md`.

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
| **Chat is a side panel** | Settled. `AiPanel`, triggered from the masthead beside the theme control, pushing the page from `lg` and overlaying below it. Popover and contextual click-to-ask were the alternatives; see *The assistant* in `DECISIONS.md`. |
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
   **But a screen does not get to explain itself.** *About this view* was a
   closed disclosure on six surfaces holding a paragraph or two about how to
   read the page. It is gone, along with `AboutView` and the `PageHeader` file
   it lived in. Progressive disclosure is for *more of the material* — the
   evidence behind a claim, the base behind a price. A collapsed essay about
   the screen is not a third read, it is an admission that the first two did
   not land, and the honest fix is the screen. Anything in one of those
   paragraphs that a consultant genuinely needs belongs where it is read
   without being opened: Certainty's three tiers are glossed on the summary line
   of each tier's own section,
   and Money's overlap deduction is a line in its bridge rather than a footnote
   under it. That deduction used to be quoted here as living in Gaps' plan
   panel; it moved with the money, and *Gaps has no money on it* is why.
3. **Every number needs a comparator.** "9.5 days" means nothing. "9.5 days vs 2 days
   best-in-class" is the product.
4. **Evidence stays one click away, always.**
5. **State confidence honestly.** Never imply certainty the pipeline doesn't have.
   Note that this is two questions, not one: *is the observation true* and *is the
   number right* are separate, and a confirmed fact routinely carries a modelled
   price. Show both or the badge is lying.
6. **Plain language over domain jargon.** Aryan is not an expert and neither are
   investors. Where a term must appear, gloss it inline once.
6a. **No dashes as punctuation, anywhere a user reads.** Em dashes are gone from
   every visible string in the product — about seventy of them, mostly in
   `suvarna.ts`. A dash in a sentence is nearly always a second sentence in
   disguise, and it is the join that costs the most when a line has to wrap. Use
   a full stop, a comma or a colon. **Hyphens inside compound words stay**:
   *3-way match*, *e-invoicing*, *early-payment*, *best-in-class*, *one-off* are
   the terms and breaking them is an error, not a simplification. Ranges take
   *to* rather than an en dash — *4 to 10%*, which also reads out loud on a
   call. The same rule already applied to hero band lines; this is it
   everywhere. A "—" used as a no-value marker in a table is also gone, replaced
   by what the blank means: *None*, *Not priced*, *Not measured*, *Not stated*.
7. **Empty is normal.** Design empty and partial states as first-class, not afterthoughts.
   Most nodes will be empty most of the time.
8. **Accessible by default.** Keyboard-operable, visible focus, AA contrast, reduced
   motion respected. Not a later pass.
9. **Gaps and Questions share code, not visual voice.**
10. **When a choice is genuinely open, build the variants rather than describing them.**
11. **Every price shows its base.** A rupee figure with no visible "percentage of what"
    is the number a client challenges first and the one an error hides behind longest.
    Named base × stated rate = claim, with the range and whose numbers they are.
12. **Savings do not add.** Two gaps that fix one root cause cannot both bank the full
    number. Model the overlap and show the deduction — asking the consultant to
    remember it in prose is not a control.
13. **Never blend kinds of money.** Annual P&L cost, margin net of what it costs to
    fund, and a one-off working-capital release are three different things. A CFO
    separates them in the first minute, so the screen has to separate them first.
14. **Say what you have not looked at.** A total is only a total of what was researched.
    Coverage is a first-class thing to display, not a footnote.

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
| Styling | Tailwind v4 with semantic tokens in `src/app/globals.css`. One theme, Heizen's own, in four modes: Brand (the default, and `:root`), Dark, Contrast, Broadsheet. See *One theme, four modes* in `DECISIONS.md` |
| shadcn/ui | **Installed**, on request, so the prototype reads as production rather than as a one-off. `components.json` (new-york, cssVariables), primitives in `src/components/ui`, Radix + `class-variance-authority` + `lucide-react` in `package.json`. See *The design system is shadcn's now* in `DECISIONS.md`. |
| Server state / validation / DB | None. The prototypes read one static file, `src/lib/suvarna.ts`. |
| Tests | No Vitest or Playwright test suite. There is a headless verification harness in `scripts/` — see *Verification harness* in `DECISIONS.md`. |
| Surfaces built | All six. Operations, Research (six directions × Brief/Full), Gaps, Questions, Compare, Sources. |

### The decision record lives in `DECISIONS.md`

Everything below this table used to be here and outgrew the file: the theme,
the type scale, the masthead, the assistant, every surface's layout decisions,
and the verification harness are all recorded in `DECISIONS.md` at the repo
root, in the same voice and at the same depth. **Read the relevant section
there before changing an area it covers, and record new decisions of that
kind there, not here.** This file stays for what Meridian is, who uses it,
and the standing rules; that file stays for how the current build got its
shape and what each alternative cost.


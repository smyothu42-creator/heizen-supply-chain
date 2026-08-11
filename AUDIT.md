# Supply-chain audit of Meridian — 8 August 2026

Read as: a supply-chain / procurement practitioner sitting with Aryan five minutes before
he walks into Suvarna, checking whether anything on these screens would get him hurt.

The interface is good. The **numbers behind it are not survivable in front of a CFO**, and
the model underneath has two structural faults that will keep producing the same class of
error. Everything below is fixed in this change.

---

## A. Findings that a client breaks in the first thirty seconds

### A1. The #1 gap was priced above the entire cost of the function it fixes — CRITICAL

`g1` "Invoices are hand-keyed into SAP" was ranked 1 at **₹3.2 Cr/yr**, justified by
`m-ap-fte = 3.1 staff per 10,000 invoices` and the line *"about 3.4× the headcount a
comparable automated operation needs."*

Both are arithmetically impossible against the company's own stated facts:

| Stated in the file | Value |
|---|---|
| AP team | **9 people** (`company.facts`, and Rohan's email: *"AP is nine people"*) |
| Invoices a year | **~96,000** |

96,000 / 10,000 = 9.6 → **9 ÷ 9.6 = 0.94 staff per 10,000 invoices.**
Best-in-class is 0.9. **Suvarna's AP is already at benchmark headcount.** The metric said
3.1 — that would need a team of 30.

And the price cannot exist regardless of the ratio: nine fully-loaded AP clerks cost roughly
**₹0.6 Cr a year in total**. A gap claiming ₹3.2 Cr of annual saving on that function is
claiming five times the cost of the thing being automated. Anand — who supplied the 58%
figure and will be in the room — knows his own salary bill.

The file already contained the correct read, in Anand's opening line: *"Nine people is not
the problem — the 42% that fall out is."* One screen contradicted another.

**Fixed:** metric corrected to 0.94 vs 0.9 with an explicit "already at benchmark" reading;
`g1` repriced to ₹30 L on avoided hiring against the Sangli volume increase plus keying-error
rework, and reclassified as an **enabler** of g2 and g4 rather than a standalone case.
It falls from rank 1 to rank 9.

### A2. Overlapping savings were added together — CRITICAL

`g1` (capture) + `g2` (matching) + `g4` (discounts) + `g11` (warehouse) are one root-cause
cluster, and the product said so in prose — g4's own impact text reads *"this gap resolves
largely as a side effect of fixing gaps 1 and 2"*. The Call script then added them:
**"about ₹5.8 Cr a year across capture and matching."**

Nothing in the model prevented it. The plan builder let you tick all four and reported the
straight sum. The Gaps "about" text asked the consultant to *"check before this goes in a
proposal"* — an instruction, not a control.

**Fixed:** `overlapGroups` with a hard cap, applied everywhere a total is computed. The
platform now reports **gross (sum of parts) and net (claimable)** as two different numbers,
and the difference is shown rather than hidden.

### A3. Early-payment discount was presented as free cash — CRITICAL

Meera's opening line: *"That gap alone is ₹1.6 Cr a year of **pure cash**."*

It is the opposite. 2/10 net 45 means paying **35 days earlier**. Capturing the discount on
~₹126 Cr of covered spend consumes roughly **₹12 Cr of working capital**, costing ~₹1.1 Cr a
year to fund at 9%. The discount is a **margin** gain, and it **spends** cash.

Saying "pure cash" to a CFO whose job is cash conversion ends the meeting.

**Fixed:** g4 now carries an explicit funding deduction — ₹2.09 Cr gross margin less
₹1.09 Cr funding cost = **₹1.0 Cr net** — and the money kind is labelled *margin*, not cost.
Meera's opening line now leads with the funding cost, because hearing it from us is worth
more than being caught by it.

### A4. Balance-sheet and P&L money were summed into one headline

`g8` (finished-goods cover 38 → 22 days) is a **one-off working-capital release**, not annual
leakage, but ₹0.95 Cr of it sat inside "₹14.7 Cr leaking a year". Separately, Vikram's line
called ₹95 L *"a year in working capital"* — mixing a flow and a stock in five words.

The real shape: 16 days of cover at ₹2.27 Cr/day of COGS is **₹36 Cr released once**, worth
~₹3.3 Cr/yr in carry. Taking the full 22-day benchmark inside a year is not credible in a
seasonal agri business, so we claim 8 days.

**Fixed:** three money kinds — *cost avoided*, *margin gained*, *carrying cost released* —
and a `oneOffCr` field that is **never** added to the annual total. Headline is now
"₹9.1 Cr a year **and** ₹18.2 Cr released once."

### A5. No bridge from benchmark gap to claimable value

`m-freight` says 4.6% vs 3.2% of revenue. On ₹1,150 Cr that is a **₹16.1 Cr** benchmark gap.
The gap beside it claimed ₹1.1 Cr. Both numbers on screen, no explanation, and the client
does that multiplication faster than you do.

Also: freight as a share of revenue is a weak benchmark — it moves with product density, lane
length and mix. It sizes the question; it does not price the prize.

**Fixed:** every priced gap now carries a `Valuation` — named base × stated rate, with an
honest low/high range, whose numbers are whose, and (where one exists) the naive benchmark
gap alongside the claim. New `ValuationBridge` component renders
`benchmark ₹16.1 Cr → addressable ₹32 Cr × 5% → claimed ₹1.6 Cr`.

---

## B. Structural faults in the model

### B1. Gaps and Canvas were two different models of the same company

`Gap.level2` mixed registers freely — "Accounts Payable → Invoice capture",
"Procure-to-Pay → Approval workflow", "Deliver → Freight procurement". Eight of twelve did
not roll up to a SCOR Level 0 stage, so the three-level structure that Canvas is built on
did not reconcile to the list that gets sold.

**Fixed:** every gap now carries `scor` (Plan/Source/Make/Deliver/Return), `level1`, `level2`
and a `nodeId` pointing at its Canvas Level-2 node. `check:data` fails the build if a gap's
node is missing, if the node does not list the gap back, or if the node's SCOR root disagrees
with the gap's.

### B2. Inbound receiving was filed under Deliver

`g11` (no warehouse module) was `"Deliver → Warehouse operations"`, and Canvas put putaway
under `l0-deliver`. But the putaway that matters here is **inbound raw material at the
plants** — SCOR `sS1.3 Transfer Product` — and it is the stated root cause of the 42% match
failure sitting under Source. The single most important causal chain in the dossier
(paper receiving → late goods receipt → match fails → invoice ages → discount missed) ran
backwards across two branches of the tree and was invisible on the map.

**Fixed:** new `l1-receiving` under Source, holding goods-receipt posting and inbound putaway;
`l1-warehouse` under Deliver keeps outbound picking and stock counts. The cross-process edge
`receiving → accounts payable` is drawn and labelled "goods receipts, posted late".

### B3. Evidence tier conflated "is it true" with "is the number right"

`g1` displayed **Confirmed**. The observation was confirmed — Anand said it on a call. The
₹3.2 Cr was pure model, and wrong. One badge covered both, which is exactly how A1 survived.

**Not one gap in this dossier has a price measured from Suvarna's own data.** The old badge
implied eight of them did.

**Fixed:** `tier` now means the observation only. New `valuationBasis` —
`measured` / `modelled` / `sector-default` — travels with every price. Currently: zero
measured, five modelled, six sector-default. The Gaps and Certainty screens show both.

### B4. Dependencies existed in prose, not in data

g11 → g2, g1+g2 → g4, g9 → g3 were all stated in `why`/`impact` text and modelled nowhere.
The plan builder happily returned "₹1.6 Cr, 6 weeks" for g4 alone, which is unachievable —
you cannot capture a 10-day discount window on a 9.5-day posting cycle.

**Fixed:** `requires` on each gap; the plan panel sequences selections into waves and names
any prerequisite you have not ticked.

### B5. Unresearched nodes were coloured "healthy"

Make, Return, production scheduling, maintenance, forecasting and six others carried
`health: "healthy"` with `completeness: "none"`. Green, on a screen shown to clients, for
processes nobody has looked at. That is the precise failure CLAUDE.md §4 warns about — and
the two axes being separable does not help when one of them is a fabricated reading.

A sector default is not a health reading.

**Fixed:** fourth health state `unknown` (neutral, dashed, dash-shaped mark). Rule enforced in
`check:data`: `completeness === "none"` and not `confirmed-none` ⇒ health must be `unknown`.
Nodes we genuinely checked and cleared (`confirmed-none`) may stay healthy — that distinction
is worth having.

---

## C. Coverage — the thing nobody had said out loud

Twelve gaps: **eleven in Source, one in Plan, two in Deliver, zero in Make, zero in Return.**

This is a procure-to-pay and finance audit wearing a supply-chain costume, and it is being
sold to a company with **three processing plants**. For an agri-processor, yield and giveaway
in Make is normally the largest single line on the board — 0.5–1.5% of ₹713 Cr of material
is **₹3.6–10.7 Cr a year**, which would dwarf everything currently on the list.

Not researching it is fine. Not *saying* we have not researched it, while presenting a total,
is not.

**Fixed:** a Coverage section on Money Full and a coverage strip on Canvas, stating which SCOR
stages the total covers, which it does not, and — for Make — what the untouched range is
likely to be. Two new questions (q10, q11) exist to open it.

---

## D. Question set

Eight questions, ordered 1–8, presented as one call. But they addressed **three different
people**, two of whom have never been met. Following the order as printed is impossible.

Also missing: the two questions that would convert the weakest numbers on the list into real
ones — the funding-cost question behind g4, and the rate-per-tonne question behind g7.

**Fixed:** `askOn` — `this-call` / `after-this-call` / `data-request` — with the this-call set
renumbered 1–4 and the indirect-spend question (which gates the largest gap on the list)
promoted into it. Two questions added; eleven total.

---

## E. Numbers before and after

| | Before | After |
|---|---|---|
| Headline | ₹14.7 Cr/yr | **₹9.1 Cr/yr net**, ₹9.68 Cr gross, **₹18.2 Cr released once** |
| As % of revenue | 1.3% | 0.79% |
| Rank 1 | Invoices hand-keyed, ₹3.2 Cr | **Indirect spend off-contract, ₹2.1 Cr** |
| Invoices hand-keyed | ₹3.2 Cr, rank 1 | **₹30 L, rank 9, enabler** |
| Prices measured from client data | implied 8 of 12 | **stated: 0 of 12** |
| Overlap between gaps | none modelled | **₹60 L, deducted and shown** |

The headline fell 38%. That is the finding, not a side effect: ₹14.7 Cr was not defensible,
and the first client who checked the AP arithmetic would have taken every other number down
with it.

₹9.1 Cr on ₹1,150 Cr of revenue is a normal, sellable P2P-and-logistics leakage position.
It has the advantage of being true.

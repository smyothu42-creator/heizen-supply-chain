/**
 * Data integrity.
 *
 * Two jobs. The first is reconciliation: every direction shows a different
 * subtotal of the same money — by bucket, by tier, by stakeholder. If those do
 * not agree, one of the four screens is lying, and it will be the one the client
 * reads.
 *
 * The second is arithmetic sanity, and it exists because the reconciliation
 * checks passed for four commits while the headline gap was priced at five times
 * the total cost of the function it automated. Everything summed correctly to a
 * number that could not be true. See AUDIT.md.
 *
 * Run: node scripts/check-data.ts
 */
import {
  buckets,
  bucketTotal,
  businessContext,
  businessFactById,
  businessFacts,
  claims,
  company,
  coverage,
  gapById,
  gaps,
  grossValue,
  metricById,
  netValue,
  oneOffValue,
  overlapGroups,
  pricedGaps,
  dealRisks,
  questions,
  sources,
  timingSignals,
  spendBase,
  stakeholders,
  valueForStakeholder,
  techSystems,
  valueForSystem,
} from "../src/lib/suvarna.ts";
import { entities, nodeById, nodes, pathTo } from "../src/lib/canvas.ts";
import { lanes, precedentBands, priorWork, reusedValueCr } from "../src/lib/compare.ts";

const r = (n: number) => Math.round(n * 100) / 100;
const tierValue = (t: string) =>
  r(gaps.filter((g) => g.tier === t).reduce((s, g) => s + (g.amountCr ?? 0), 0));

let failed = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(
    `${ok ? "OK  " : "FAIL"}  ${label.padEnd(42)} ${actual}${ok ? "" : `  (expected ${expected})`}`,
  );
};
const expect = (label: string, ok: boolean, detail = "") => {
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "FAIL"}  ${label.padEnd(42)} ${ok ? "" : detail}`);
};

const section = (name: string) => console.log(`\n── ${name}`);

/* ------------------------------------------------------------------ totals */
section("Totals reconcile");

const gross = company.grossLeakageCr;
check("sum of every gap price", r(gaps.reduce((s, g) => s + (g.amountCr ?? 0), 0)), gross);
check("sum of money buckets", r(buckets.reduce((s, b) => s + bucketTotal(b.id), 0)), gross);
check("sum by stakeholder", r(stakeholders.reduce((s, p) => s + valueForStakeholder(p.id), 0)), gross);
check(
  "sum by evidence tier",
  r(tierValue("confirmed") + tierValue("inferred") + tierValue("unverified")),
  gross,
);
check("net of overlap", netValue(gaps.map((g) => g.id)), company.netLeakageCr);
check("overlap deduction", r(gross - company.netLeakageCr), company.overlapCr);
check("one-off release", oneOffValue(gaps.map((g) => g.id)), company.workingCapitalReleaseCr);

// The net figure is the one that goes in front of a client. It must be smaller
// than the sum of its parts, or the overlap model is doing nothing.
expect(
  "net is below gross",
  company.netLeakageCr < gross,
  `net ${company.netLeakageCr} >= gross ${gross}`,
);

/* ------------------------------------------------------- valuation sanity */
section("Every price shows its working");

check(
  "priced gaps carrying a valuation",
  pricedGaps.filter((g) => !g.valuation).length,
  0,
);
check(
  "unpriced gaps carrying a reason",
  gaps.filter((g) => g.amountCr == null && !g.unpricedReason).length,
  0,
);
check(
  "unpriced gaps wrongly carrying a valuation",
  gaps.filter((g) => g.amountCr == null && g.valuation).length,
  0,
);

for (const g of pricedGaps) {
  const v = g.valuation!;
  const amount = g.amountCr!;

  // The claim has to sit inside the range we published for it, or the range is
  // decoration.
  expect(
    `${g.id} claim inside its own range`,
    amount >= v.lowCr && amount <= v.highCr,
    `${amount} not in ${v.lowCr}..${v.highCr}`,
  );

  // THE CHECK THAT WOULD HAVE CAUGHT THE ₹3.2 Cr. You cannot save more than the
  // thing you are saving it from is worth.
  expect(
    `${g.id} claim below its own base`,
    v.baseCr == null || amount <= v.baseCr,
    `claims ${amount} Cr against a base of ${v.baseCr} Cr`,
  );

  // A one-off balance-sheet release is not annual money and must never be the
  // amount itself.
  expect(
    `${g.id} one-off kept out of the annual figure`,
    v.oneOffCr == null || v.oneOffCr !== amount,
    "one-off equals the annual claim",
  );

  expect(`${g.id} states whose numbers they are`, v.whoseNumbers.trim().length > 20);
}

// Nothing is measured yet, and the product says so on three screens. If that
// ever changes, the copy has to change with it.
check(
  "gaps claiming a measured price",
  gaps.filter((g) => g.valuation?.basis === "measured").length,
  0,
);

/* ---------------------------------------------------------- overlap groups */
section("Savings that do not add");

for (const group of overlapGroups) {
  const raw = grossValue(group.gapIds);
  expect(
    `${group.id} cap is below its raw sum`,
    group.capCr < raw,
    `cap ${group.capCr} >= raw ${raw}`,
  );
  expect(
    `${group.id} members all point back`,
    group.gapIds.every((id) => gapById(id).overlapGroupId === group.id),
  );
}
check(
  "gaps in a group that does not exist",
  gaps.filter((g) => g.overlapGroupId && !overlapGroups.some((o) => o.id === g.overlapGroupId))
    .length,
  0,
);
// A gap in two groups would be deducted twice.
check(
  "gaps appearing in two overlap groups",
  gaps.filter((g) => overlapGroups.filter((o) => o.gapIds.includes(g.id)).length > 1).length,
  0,
);

/* ------------------------------------------------------------ dependencies */
section("Sequencing");

check(
  "requires pointing at a gap that exists",
  gaps.flatMap((g) => g.requires.filter((rq) => !gaps.some((x) => x.id === rq))).length,
  0,
);
check("gaps requiring themselves", gaps.filter((g) => g.requires.includes(g.id)).length, 0);

// A cycle would make sequenceWaves fall back to dumping everything in one wave,
// silently. Detect it here instead.
const cyclic = gaps.filter((g) =>
  g.requires.some((rq) => gapById(rq).requires.includes(g.id)),
);
check("circular dependencies", cyclic.length, 0);

/* --------------------------------------------------- Canvas reconciliation */
section("Gaps and Canvas are one model");

const nodeIds = new Set(nodes.map((n) => n.id));
for (const g of gaps) {
  expect(`${g.id} points at a real Canvas node`, nodeIds.has(g.nodeId), `no node ${g.nodeId}`);
  if (!nodeIds.has(g.nodeId)) continue;

  const node = nodeById(g.nodeId);
  expect(
    `${g.id} listed by its own node`,
    node.gapIds.includes(g.id),
    `${g.nodeId} does not list ${g.id}`,
  );
  expect(`${g.id} priced at Level 2`, node.level === 2, `${g.nodeId} is level ${node.level}`);

  // The whole point of the three-level model is that Gaps and Canvas describe
  // the same company. They used to disagree on eight of twelve.
  const stage = pathTo(g.nodeId)[0]?.name;
  expect(
    `${g.id} SCOR stage agrees with Canvas`,
    stage === g.scor,
    `gap says ${g.scor}, canvas says ${stage}`,
  );
}

// Every gapId referenced anywhere on Canvas has to be a real gap.
const gapIds = new Set(gaps.map((g) => g.id));
check(
  "canvas nodes referencing a missing gap",
  nodes.flatMap((n) => n.gapIds.filter((id) => !gapIds.has(id))).length,
  0,
);
check(
  "canvas nodes referencing a missing metric",
  nodes.flatMap((n) => n.metricIds.filter((id) => !metricById(id))).length,
  0,
);

/* ------------------------------------------------------- health honesty */
section("Colour is never a guess");

// A process nobody has looked at must not wear a health colour. The only
// exception is one we checked and cleared, which is a real result.
const painted = nodes.filter(
  (n) => n.completeness === "none" && n.emptyKind !== "confirmed-none" && n.health !== "unknown",
);
check("unresearched nodes wearing a colour", painted.length, 0);
if (painted.length) console.log("      ", painted.map((n) => `${n.id}:${n.health}`).join(", "));

// And the reverse: "unknown" means we have nothing. A node with evidence has a
// reading, and refusing to give one is its own kind of dishonesty.
const mute = nodes.filter((n) => n.health === "unknown" && n.completeness !== "none");
check("evidenced nodes refusing a reading", mute.length, 0);

// Same shape as the counter rule, and here for the same reason: the failure is
// silent. A node flagged with an empty string renders a perfectly tidy ink chip
// that says something is wrong and nothing about what — which is a red mark a
// consultant cannot act on, so they stop trusting the mark rather than the node.
const emptyFlag = nodes.filter((n) => n.needsCorrection !== undefined && !n.needsCorrection.trim());
expect(
  "every flagged node says what is wrong",
  emptyFlag.length === 0,
  emptyFlag.map((n) => n.id).join(", "),
);
// It is read seconds before somebody decides whether to raise it on a call.
// Anything shorter than a sentence is a label, not a correction.
const thinFlag = nodes.filter(
  (n) => n.needsCorrection && n.needsCorrection.trim().split(/\s+/).length < 8,
);
expect(
  "flags long enough to act on",
  thinFlag.length === 0,
  thinFlag.map((n) => n.id).join(", "),
);

// A flag is a statement about our reading of a process, so there has to be a
// reading to be wrong about. Flagging a node nobody has looked at is either a
// mistake or a request for research, and the empty states already say that.
const flaggedBlank = nodes.filter((n) => n.needsCorrection && n.completeness === "none");
check("flagged nodes with no evidence behind them", flaggedBlank.length, 0);

/* ------------------------------------------------------------- provenance */
section("Nothing is unattributable");

const srcIds = new Set(sources.map((s) => s.id));
check("gaps with no evidence", gaps.filter((g) => g.evidence.length === 0).length, 0);
check(
  "broken source references",
  gaps.flatMap((g) => g.evidence.filter((e) => !srcIds.has(e.sourceId))).length,
  0,
);

// A gap priced by two claims would make the ledger's rows disagree with its header.
const owners = new Map<string, string[]>();
for (const c of claims) {
  if (c.linkedGapId) owners.set(c.linkedGapId, [...(owners.get(c.linkedGapId) ?? []), c.id]);
}
const dupes = [...owners].filter(([, cs]) => cs.length > 1);
check("gaps priced by more than one claim", dupes.length, 0);
if (dupes.length) console.log("     ", JSON.stringify(dupes));
check(
  "claims linked to a gap that does not exist",
  claims.filter((c) => c.linkedGapId && !gapIds.has(c.linkedGapId)).length,
  0,
);

for (const t of ["confirmed", "inferred", "unverified"] as const) {
  const rows = r(
    claims
      .filter((c) => c.tier === t && c.linkedGapId)
      .reduce((s, c) => s + (gapById(c.linkedGapId!).amountCr ?? 0), 0),
  );
  check(`ledger rows sum, ${t}`, rows, tierValue(t));
}

/* ------------------------------------------------------------ plausibility */
section("Arithmetic a client would check");

// The spend split has to add to something less than revenue, or the base under
// every rate on the list is nonsense.
const thirdParty = spendBase.directCr + spendBase.indirectCr + spendBase.freightCr;
expect(
  "third-party spend below revenue",
  thirdParty < spendBase.revenueCr,
  `${thirdParty} >= ${spendBase.revenueCr}`,
);

// Total leakage as a share of revenue. Above ~3% and the number is a fantasy;
// this is a procure-to-pay engagement, not a turnaround.
const share = (company.netLeakageCr / spendBase.revenueCr) * 100;
expect(
  "leakage is a credible share of revenue",
  share > 0.1 && share < 3,
  `${share.toFixed(2)}% of revenue`,
);

// AP headcount, from their own two figures. The gap that broke claimed 3.1.
const AP_HEADCOUNT = 9;
const INVOICES = 96_000;
const perTenK = r((AP_HEADCOUNT / (INVOICES / 10_000)) * 100) / 100;
check("AP staff per 10,000 invoices", r(metricById("m-ap-fte").actual!), r(perTenK));

/* -------------------------------------------------------------- questions */
section("Questions");

check(
  "questions targeting someone who exists",
  questions.filter((q) => !stakeholders.some((s) => s.id === q.targetId)).length,
  0,
);
check(
  "questions linked to a gap that does not exist",
  questions.flatMap((q) => q.linkedGapIds.filter((id) => !gapIds.has(id))).length,
  0,
);
check(
  "duplicate ask order",
  questions.length - new Set(questions.map((q) => q.askOrder)).size,
  0,
);
// Every question tagged for this call must belong to someone already met, or the
// call plan is asking Aryan to speak to a person who is not there.
const impossible = questions.filter(
  (q) => q.askWhen !== "after-this-call" && !stakeholders.find((s) => s.id === q.targetId)!.met,
);
check("this-call questions for people not met", impossible.length, 0);

/* The conversation tree. Every one of these failures is silent: a broken branch
   renders as a perfectly tidy row that simply never appears under anything, and
   a drill-down with no condition on it renders as a question with no reason to
   be asked at that point, which is the fault the tiers exist to fix. */
const qById = new Map(questions.map((q) => [q.id, q]));
check(
  "questions below tier 1 with no parent",
  questions.filter((q) => q.tier !== 1 && !q.parentId).length,
  0,
);
check(
  "questions whose parent does not exist",
  questions.filter((q) => q.parentId && !qById.has(q.parentId)).length,
  0,
);
// A tier-3 question hanging off an opener has skipped the question that decides
// whether it is the right one to ask.
check(
  "questions not exactly one tier below their parent",
  questions.filter((q) => q.parentId && qById.get(q.parentId)!.tier !== q.tier - 1).length,
  0,
);
check(
  "openers with a parent",
  questions.filter((q) => q.tier === 1 && q.parentId).length,
  0,
);
// The follow-up logic itself, guarded the way the counter rule is: a branch with
// no condition on it is a branch nobody can take.
check(
  "follow-ups with no condition, or one too short to act on",
  questions.filter((q) => q.tier !== 1 && (q.askIf ?? "").split(" ").length < 4).length,
  0,
);
check("openers stating a condition", questions.filter((q) => q.tier === 1 && q.askIf).length, 0);
// A question nothing follows from is a thread that stops one tier short of the
// specifics, which is where the money is.
check(
  "openers and follow-ups with nothing under them",
  questions.filter((q) => q.tier !== 3 && !questions.some((c) => c.parentId === q.id)).length,
  0,
);
// Ask order has to run down the tree, or the numbers on the page say ask this
// first about a question that only exists because of a later one.
check(
  "children asked before their parent",
  questions.filter((q) => q.parentId && qById.get(q.parentId)!.askOrder > q.askOrder).length,
  0,
);
// A thread that changes subject halfway is two threads.
check(
  "children in a different domain from their parent",
  questions.filter((q) => q.parentId && qById.get(q.parentId)!.domain !== q.domain).length,
  0,
);

/* --------------------------------------------------------------- coverage */
section("Coverage");

check("coverage covers all five SCOR stages", coverage.length, 5);
for (const c of coverage) {
  const found = gaps.filter((g) => g.scor === c.stage).length;
  expect(
    `${c.stage} state matches what was found`,
    c.state === "not-researched" ? found === 0 : found > 0,
    `state ${c.state} with ${found} gaps`,
  );
}

/* -------------------------------------------------------- business context */
section("Business context");

const allSourceIds = new Set(sources.map((s) => s.id));

// The context page is the one screen a client reads for facts about themselves
// rather than for findings, so a figure that disagrees with the base every price
// is built on is worse here than anywhere else: it is wrong about them.
check(
  "revenue matches the spend base",
  businessFactById("bf-revenue").amountCr,
  spendBase.revenueCr,
);
check("cost of goods matches the spend base", businessFactById("bf-cogs").amountCr, spendBase.cogsCr);
check("direct material matches the spend base", businessFactById("bf-direct").amountCr, spendBase.directCr);
check("indirect spend matches the spend base", businessFactById("bf-indirect").amountCr, spendBase.indirectCr);
check("freight matches the spend base", businessFactById("bf-freight").amountCr, spendBase.freightCr);
// The one derived total on the page, and the base the ₹9.68 Cr is a percentage
// of. If it stops being the sum of its three parts, the "1.2% of what they buy"
// comparator beside it becomes a made-up number.
check(
  "what they buy is its three parts",
  businessFactById("bf-bought-in").amountCr,
  r(spendBase.directCr + spendBase.indirectCr + spendBase.freightCr),
);
// Bought-in cannot exceed what they sell, and profit cannot exceed revenue: two
// failures that sound impossible and are exactly what a mistyped figure looks
// like.
expect(
  "bought-in cost is below revenue",
  businessFactById("bf-bought-in").amountCr! < spendBase.revenueCr,
  `${businessFactById("bf-bought-in").amountCr} vs ${spendBase.revenueCr}`,
);
expect(
  "profit is below revenue",
  businessFactById("bf-pat").amountCr! < businessFactById("bf-ebitda").amountCr!,
  "profit after tax should sit below EBITDA",
);
check(
  "facts citing a source that does not exist",
  businessFacts.flatMap((f) => f.sourceIds.filter((id) => !allSourceIds.has(id))).length,
  0,
);
// Nothing on this platform is unattributable (§4), and a fact about the client's
// own business is the last place to start.
check("facts with no source at all", businessFacts.filter((f) => f.sourceIds.length === 0).length, 0);
check(
  "facts with a duplicate id",
  businessFacts.length - new Set(businessFacts.map((f) => f.id)).size,
  0,
);
// §7.3. A group where nothing is measured against anything is a table of trivia,
// so at least half of every group has to carry a comparator.
for (const g of businessContext) {
  expect(
    `${g.title} states what its numbers mean`,
    g.facts.filter((f) => f.benchmark).length * 2 >= g.facts.length,
    `${g.facts.filter((f) => f.benchmark).length} of ${g.facts.length} carry a comparator`,
  );
}

/* ----------------------------------------------------------------- timing */
section("Timing signals");

const sourceIds = allSourceIds;

// A signal with no readings behind it is a count with no base — the same
// failure §7.11 forbids for a price, arriving through a different door.
check(
  "signals with no readings behind them",
  timingSignals.filter((s) => s.items.length === 0).length,
  0,
);
check(
  "signals citing a source that does not exist",
  timingSignals.flatMap((s) => s.items.filter((i) => !sourceIds.has(i.sourceId))).length,
  0,
);
// The value on the row usually states the count. Where it does, it has to be
// the count — a stale "2 signals" over three readings is the kind of thing
// nobody notices and a client does.
const miscounted = timingSignals.filter((s) => {
  const m = /^(\d+) signals?$/.exec(s.value);
  return m && Number(m[1]) !== s.items.length;
});
check("signal counts disagreeing with their readings", miscounted.length, 0);

/* ------------------------------------------------------------------- risks */
section("Deal risks");

// THE RULE. A risk without a counter does not prepare a consultant, it
// frightens him — and a frightened consultant avoids the subject, which is how
// the objection ends up deciding the deal off-screen. The type makes `counter`
// required; this makes it non-empty, which the type cannot.
const uncountered = dealRisks.filter((r) => r.counter.trim().length === 0);
expect(
  "every risk carries a counter",
  uncountered.length === 0,
  uncountered.map((r) => r.label).join(", "),
);
// A counter is said out loud. One that is shorter than the risk it answers is
// almost always a label rather than a line.
const thin = dealRisks.filter((r) => r.counter.trim().split(/\s+/).length < 8);
expect(
  "counters long enough to say out loud",
  thin.length === 0,
  thin.map((r) => r.label).join(", "),
);
check(
  "risks citing a source that does not exist",
  dealRisks.flatMap((r) => r.sourceIds.filter((id) => !sourceIds.has(id))).length,
  0,
);

/* ---------------------------------------------------------------- entities */
section("Entities");

// Entities are grouped by area rather than drawn as a graph, and the areas are
// Gaps' four buckets. The grouping is a field on the entity rather than derived
// from its gaps, so that a deliberate choice is visible in the data — and this
// is what stops the two drifting apart silently. An entity filed under the
// wrong area renders as a perfectly tidy list in the wrong place.
const bucketIds = new Set(buckets.map((b) => b.id));
const strayBucket = entities.filter((e) => !bucketIds.has(e.bucketId));
check("entities filed under an area that does not exist", strayBucket.length, 0);

const misfiled = entities.filter((e) =>
  e.gapIds.some((id) => gapById(id).bucketId !== e.bucketId),
);
expect(
  "every entity sits in the same area as its gaps",
  misfiled.length === 0,
  misfiled.map((e) => e.id).join(", "),
);
check(
  "entities citing a gap that does not exist",
  entities.flatMap((e) => e.gapIds.filter((id) => !gaps.some((g) => g.id === id))).length,
  0,
);

/* --------------------------------------------------- what a gap does not say */
section("Gap hypotheses and next steps");

// Same argument as the counter rule above, and it is here for the same reason:
// the failure is silent. A gap with an empty `stillUnknown` renders as a
// perfectly tidy detail panel that happens to claim the finding is finished,
// and none of them are. §7.14 is about totals; it applies to a finding too.
const noHypothesis = gaps.filter((g) => g.hypothesis.trim().split(/\s+/).length < 12);
expect(
  "every gap says what it thinks is happening",
  noHypothesis.length === 0,
  noHypothesis.map((g) => g.id).join(", "),
);
const nothingOpen = gaps.filter((g) => g.stillUnknown.length === 0);
expect(
  "every gap states what is still unknown",
  nothingOpen.length === 0,
  nothingOpen.map((g) => g.id).join(", "),
);
const noNext = gaps.filter((g) => g.nextSteps.length === 0);
expect(
  "every gap says what to do next",
  noNext.length === 0,
  noNext.map((g) => g.id).join(", "),
);
// A next step is an instruction. Under six words it is a heading.
const stub = gaps.filter((g) =>
  [...g.stillUnknown, ...g.nextSteps].some((s) => s.trim().split(/\s+/).length < 6),
);
expect(
  "open points long enough to act on",
  stub.length === 0,
  stub.map((g) => g.id).join(", "),
);

/* ------------------------------------------------------- the system estate */
/* The Tech direction files every finding under the one system where the work
   lands on a person. That is only worth anything if the filing is total and
   exclusive — a gap on two systems double-counts the money, and a gap on none
   is a finding that quietly stops appearing on a screen that claims to show
   all of them. Both halves are checked here, and the subtotals are reconciled
   against the same gross every other direction ties to. */
section("System estate");

const filed = techSystems.flatMap((sys) => sys.gapIds);
const unfiled = gaps.filter((g) => !filed.includes(g.id));
expect(
  "every gap sits on a system",
  unfiled.length === 0,
  unfiled.map((g) => g.id).join(", "),
);
const twice = filed.filter((id, i) => filed.indexOf(id) !== i);
expect("no gap filed under two systems", twice.length === 0, [...new Set(twice)].join(", "));

check(
  "system subtotals sum to the gross",
  r(techSystems.reduce((sum, sys) => sum + valueForSystem(sys.id), 0)),
  company.grossLeakageCr,
);

const ghostGap = techSystems.filter((sys) => sys.gapIds.some((id) => !gaps.some((g) => g.id === id)));
expect("systems citing a gap that does not exist", ghostGap.length === 0, ghostGap.map((s) => s.id).join(", "));

const ghostSrc = techSystems.filter((sys) =>
  sys.sourceIds.some((id) => !sources.some((src) => src.id === id)),
);
expect("systems citing a source that does not exist", ghostSrc.length === 0, ghostSrc.map((s) => s.id).join(", "));

/* Same shape as the counter rule on `DealRisk`, and here for the same reason:
   the failure is silent. A system marked absent with no line saying who absorbs
   the work renders as a perfectly tidy row that raises a problem and names
   nobody who has it. */
const noOwner = techSystems.filter(
  (sys) => sys.state !== "live" && (sys.fallsTo ?? "").trim().split(/\s+/).length < 8,
);
expect(
  "every gap in the estate says who absorbs it",
  noOwner.length === 0,
  noOwner.map((s) => s.id).join(", "),
);
/* A live module with a `fallsTo` is a contradiction: the work has not fallen
   anywhere. Cheap to write by accident when copying a row. */
const liveWithFallback = techSystems.filter((sys) => sys.state === "live" && sys.fallsTo);
expect(
  "no live system claims a workaround",
  liveWithFallback.length === 0,
  liveWithFallback.map((s) => s.id).join(", "),
);

/* --------------------------------------------------- gaps and questions */
section("One vocabulary, two surfaces");

/* The findings and the questions carry the same three axes so one filter row
   serves both. Authored twice means they can disagree, and the disagreement is
   silent: a gap filed under `payables` that only procurement questions test
   simply stops appearing where a consultant looks for it. */
for (const g of gaps) {
  const asking = questions.filter((q) => q.linkedGapIds.includes(g.id));
  if (asking.length === 0) continue;
  const domains = [...new Set(asking.map((q) => q.domain))];
  expect(
    `${g.id} filed where its questions ask`,
    domains.includes(g.domain),
    `gap says ${g.domain}, questions say ${domains.join(", ")}`,
  );
}
// A tag on a finding has to come from the same closed list the questions use,
// or the Tag filter offers a value on one surface and not the other.
const questionTagSet = new Set(questions.flatMap((q) => q.tags));
check(
  "gap tags outside the question vocabulary",
  gaps.flatMap((g) => g.tags.filter((t) => !questionTagSet.has(t))).length,
  0,
);

/* ------------------------------------------------------------- precedent */
section("What we have built before");

/* A reuse figure is the most flattering number on the platform, which makes it
   the one to guard hardest. Every failure here inflates it silently. */
const laneIds = new Set(lanes.map((l) => l.id));
check(
  "prior work on a lane that does not exist",
  priorWork.filter((w) => !laneIds.has(w.laneId)).length,
  0,
);
// Nothing has ever been built at a benchmark, and we cannot have built this
// client's own findings at this client.
check(
  "prior work claimed on the benchmark or on this client",
  priorWork.filter((w) => {
    const lane = lanes.find((l) => l.id === w.laneId);
    return lane?.isBenchmark || lane?.isCurrent;
  }).length,
  0,
);
check(
  "prior work covering a gap that does not exist",
  priorWork.flatMap((w) => w.gapIds.filter((id) => !gapIds.has(id))).length,
  0,
);
// THE ONE THAT MATTERS. A gap credited to two past projects is counted twice in
// the reuse total, which is §7.12's error in a different currency and reads as
// more reuse than there is.
check(
  "gaps credited to two past projects",
  gaps.filter((g) => priorWork.filter((w) => w.gapIds.includes(g.id)).length > 1).length,
  0,
);
// The bands are the whole findings list, cut four ways. If they stop adding up,
// the bar is drawn against a total it does not sum to.
check(
  "bands cover every finding",
  precedentBands().reduce((s, b) => s + b.gaps.length, 0),
  gaps.length,
);
check(
  "bands sum to the gross total",
  r(precedentBands().reduce((s, b) => s + b.valueCr, 0)),
  company.grossLeakageCr,
);
expect(
  "reuse is below the whole list",
  reusedValueCr() < company.grossLeakageCr,
  `${reusedValueCr()} of ${company.grossLeakageCr}`,
);
// Same doctrine as the counter rule. A row claiming "built before" with nothing
// against it is a promise made on a call by somebody who will not deliver it,
// and it renders as a perfectly confident row.
const noCaveat = priorWork.filter((w) => w.caveat.trim().split(/\s+/).length < 8);
expect(
  "every reuse claim says what is different",
  noCaveat.length === 0,
  noCaveat.map((w) => w.id).join(", "),
);
expect(
  "every reuse claim says what it took",
  priorWork.every((w) => w.weeksThere > 0),
  "a build that took no time did not happen",
);
// A match with no verified date cannot go stale, which means it never stops
// being believed. The row reads the date to decide whether to warn.
const undated = priorWork.filter((w) => Number.isNaN(new Date(w.verifiedOn).getTime()));
expect(
  "every match says when it was last checked",
  undated.length === 0,
  undated.map((w) => w.id).join(", "),
);

console.log(failed === 0 ? "\nAll data checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);

/**
 * Compare — other projects, laid out against this one.
 *
 * Lanes align on shared process stages. The delta between lanes is the content;
 * each lane's own values are supporting evidence. Selecting a company stacks a
 * lane below rather than replacing the view — see CLAUDE.md section 5.
 */

/* The `.ts` is deliberate and must stay. `scripts/check-data.ts` runs under
   node's own TypeScript stripping rather than a bundler, and node's ESM
   resolver will not guess an extension — so an extensionless import here makes
   `pnpm check:data` fail to load the module at all, which is how the reuse
   figures would end up unguarded. `canvas.ts` avoids the question by importing
   nothing; `plan.ts` gets away with it because the checker never loads it. */
import { gaps, grossValue, techSystems, type Gap } from "./suvarna.ts";

/**
 * How a company does one step.
 *
 * **`none` is the interesting one and it runs both ways.** It does not mean
 * "not measured", it means the step is not in that company's flow at all —
 * best in class has no "chase the sign-off" because nothing needs chasing, and
 * Suvarna has no "check they are not already on the system", which is why it
 * has 8.4% duplicate suppliers. A step one company has and another does not is
 * the single most legible thing on this surface, and a duration cannot show it.
 *
 * A lane with no entry at all for a stage's steps is a third state, rendered as
 * "not mapped", the same way the Time view says "not measured". Absent data and
 * an absent step are different claims.
 */
export type Handling = "auto" | "assisted" | "manual" | "none";

export const HANDLING_LABEL: Record<Handling, string> = {
  auto: "automatic",
  assisted: "part automatic",
  manual: "by hand",
  none: "not in this flow",
};

export interface FlowStep {
  id: string;
  /** Plain words. Aryan is not an expert and this is read at speed. */
  name: string;
}

export interface Stage {
  id: string;
  name: string;
  /** Plain-language line, because half these terms mean nothing to a non-expert. */
  gloss: string;
  /** Lower days is always better; the score is 0-100 where higher is better. */
  unit: "days";
  /** The shared spine the Workflow view aligns every lane on. In order. */
  steps: FlowStep[];
}

export interface Lane {
  id: string;
  company: string;
  sector: string;
  /**
   * The two facts the sector string already carries, as fields.
   *
   * They were only ever in "Packaged foods · ₹880 Cr", which is fine to read
   * and impossible to compute with. The similarity scores need both, and
   * parsing them back out of a display string is how a comparison ends up
   * wrong in a way nobody can see.
   */
  revenueCr?: number;
  /** The band a sector sits in, for the domain comparison. Two companies in the
   *  same family are a reference the client recognises; two in different ones
   *  are a case study they discount. */
  sectorFamily?: string;
  /** The lane this view is anchored on. Always shown, never deselectable. */
  isCurrent?: boolean;
  /** A synthetic lane, not a real client. */
  isBenchmark?: boolean;
  note: string;
  values: Record<string, { score: number; days: number } | null>;
  /** Keyed by step id. A stage whose steps are all absent from this map is not
   *  mapped for that lane, which is a different statement from `none`. */
  flow: Record<string, Handling>;
}

export const stages: Stage[] = [
  {
    id: "s-approval",
    name: "Request and approval",
    gloss: "Someone asks to buy something and a manager signs it off.",
    unit: "days",
    steps: [
      { id: "f-raise", name: "Raise the request" },
      { id: "f-signoff", name: "Manager signs it off" },
      { id: "f-chase", name: "Chase the sign-off" },
    ],
  },
  {
    id: "s-rfq",
    name: "Sourcing and quotes",
    gloss: "Asking suppliers what they would charge, then picking one.",
    unit: "days",
    steps: [
      { id: "f-ask", name: "Ask suppliers for a price" },
      { id: "f-compare", name: "Put the quotes side by side" },
      { id: "f-pick", name: "Pick one, record why" },
    ],
  },
  {
    id: "s-onboarding",
    name: "Vendor onboarding",
    gloss: "Getting a new supplier set up so you can order from them.",
    unit: "days",
    steps: [
      { id: "f-dupe", name: "Check they are not already on the system" },
      { id: "f-papers", name: "Collect their papers" },
      { id: "f-bank", name: "Verify the bank details" },
      { id: "f-create", name: "Create the supplier record" },
    ],
  },
  {
    id: "s-invoice",
    name: "Invoice to posting",
    gloss: "An invoice arrives and ends up recorded in the system.",
    unit: "days",
    steps: [
      { id: "f-receive", name: "Receive the invoice" },
      { id: "f-key", name: "Key it into the system" },
      { id: "f-post", name: "Post it to the ledger" },
    ],
  },
  {
    id: "s-match",
    name: "Three-way match",
    gloss: "Checking the invoice against the order and the delivery note.",
    unit: "days",
    steps: [
      { id: "f-match", name: "Match order, receipt and invoice" },
      { id: "f-except", name: "Work the mismatches" },
      { id: "f-release", name: "Get someone to release payment" },
    ],
  },
  {
    id: "s-freight",
    name: "Freight booking",
    gloss: "Arranging a lorry for a load that needs to move.",
    unit: "days",
    steps: [
      { id: "f-rate", name: "Ask carriers for a rate" },
      { id: "f-award", name: "Award the load" },
      { id: "f-book", name: "Book and confirm" },
    ],
  },
];

export const lanes: Lane[] = [
  {
    id: "lane-suvarna",
    company: "Suvarna Agro Foods",
    sector: "Agri-processing · ₹1,150 Cr",
    revenueCr: 1150,
    sectorFamily: "Food and beverage manufacturing",
    isCurrent: true,
    note: "This client. Four sources, medium-high confidence, no ERP data yet.",
    values: {
      "s-approval": { score: 63, days: 4.4 },
      "s-rfq": { score: 47, days: 10.1 },
      "s-onboarding": { score: 52, days: 21 },
      "s-invoice": { score: 41, days: 9.5 },
      "s-match": { score: 58, days: 6.2 },
      "s-freight": { score: 55, days: 2.5 },
    },
    flow: {
      "f-raise": "manual",
      "f-signoff": "manual",
      "f-chase": "manual",
      "f-ask": "manual",
      "f-compare": "manual",
      "f-pick": "manual",
      "f-dupe": "none",
      "f-papers": "manual",
      "f-bank": "manual",
      "f-create": "manual",
      "f-receive": "manual",
      "f-key": "manual",
      "f-post": "assisted",
      "f-match": "assisted",
      "f-except": "manual",
      "f-release": "manual",
      "f-rate": "manual",
      "f-award": "manual",
      "f-book": "manual",
    },
  },
  {
    id: "lane-bic",
    company: "Best in class",
    sector: "Food and beverage benchmark",
    isBenchmark: true,
    note: "Upper quartile for food and beverage manufacturers of comparable turnover.",
    values: {
      "s-approval": { score: 82, days: 1.4 },
      "s-rfq": { score: 79, days: 3.5 },
      "s-onboarding": { score: 80, days: 7 },
      "s-invoice": { score: 88, days: 2 },
      "s-match": { score: 90, days: 1.1 },
      "s-freight": { score: 78, days: 0.8 },
    },
    flow: {
      "f-raise": "auto",
      "f-signoff": "auto",
      "f-chase": "none",
      "f-ask": "auto",
      "f-compare": "auto",
      "f-pick": "assisted",
      "f-dupe": "auto",
      "f-papers": "auto",
      "f-bank": "auto",
      "f-create": "auto",
      "f-receive": "auto",
      "f-key": "none",
      "f-post": "auto",
      "f-match": "auto",
      "f-except": "assisted",
      "f-release": "assisted",
      "f-rate": "auto",
      "f-award": "auto",
      "f-book": "auto",
    },
  },
  {
    id: "lane-kesarwani",
    company: "Kesarwani Foods",
    sector: "Packaged foods · ₹880 Cr",
    revenueCr: 880,
    sectorFamily: "Food and beverage manufacturing",
    note: "Heizen project, delivered Q4 FY25. Invoice automation and vendor onboarding.",
    values: {
      "s-approval": { score: 74, days: 2.1 },
      "s-rfq": { score: 61, days: 6.8 },
      "s-onboarding": { score: 77, days: 8 },
      "s-invoice": { score: 81, days: 2.8 },
      "s-match": { score: 84, days: 1.6 },
      "s-freight": null,
    },
    /* No freight steps: that stage was never mapped on this project, which
       is why the Workflow view says so rather than drawing an empty flow. */
    flow: {
      "f-raise": "auto",
      "f-signoff": "assisted",
      "f-chase": "manual",
      "f-ask": "manual",
      "f-compare": "assisted",
      "f-pick": "manual",
      "f-dupe": "auto",
      "f-papers": "auto",
      "f-bank": "assisted",
      "f-create": "auto",
      "f-receive": "auto",
      "f-key": "none",
      "f-post": "auto",
      "f-match": "auto",
      "f-except": "manual",
      "f-release": "assisted",
    },
  },
  {
    id: "lane-deccan",
    company: "Deccan Beverages",
    sector: "Beverages · ₹2,400 Cr",
    revenueCr: 2400,
    sectorFamily: "Food and beverage manufacturing",
    note: "Heizen project, in flight. Larger and further along on planning than procurement.",
    values: {
      "s-approval": { score: 69, days: 3.2 },
      "s-rfq": { score: 72, days: 4.9 },
      "s-onboarding": { score: 58, days: 16 },
      "s-invoice": { score: 66, days: 5.1 },
      "s-match": { score: 71, days: 3.4 },
      "s-freight": { score: 83, days: 0.9 },
    },
    flow: {
      "f-raise": "auto",
      "f-signoff": "assisted",
      "f-chase": "manual",
      "f-ask": "assisted",
      "f-compare": "assisted",
      "f-pick": "manual",
      "f-dupe": "none",
      "f-papers": "manual",
      "f-bank": "manual",
      "f-create": "assisted",
      "f-receive": "assisted",
      "f-key": "manual",
      "f-post": "auto",
      "f-match": "assisted",
      "f-except": "manual",
      "f-release": "manual",
      "f-rate": "auto",
      "f-award": "auto",
      "f-book": "assisted",
    },
  },
];

export const laneById = (id: string) => lanes.find((l) => l.id === id)!;
export const currentLane = lanes.find((l) => l.isCurrent)!;

/** Real projects Heizen has run. Best in class is a benchmark, not a client, and
 *  nothing has ever been built there. */
export const pastProjects = lanes.filter((l) => !l.isCurrent && !l.isBenchmark);

/* -------------------------------------------------------------------------- */
/* Precedent — how much of this opportunity we have built before               */
/*                                                                             */
/* Time says they are slower than the benchmark. Workflow says which steps they */
/* run that the benchmark does not. Neither answers the question that decides   */
/* whether Heizen wants this deal and what it would cost to deliver: how much   */
/* of it have we already built, and for whom.                                   */
/*                                                                             */
/* It is a sales instrument first. "We have done seven of your twelve, two of   */
/* them at a packaged-foods company your size" is the strongest sentence        */
/* available on a first call, and it is currently in somebody's head rather     */
/* than on a screen. It is a delivery instrument second: the five with no        */
/* precedent are where the estimate is softest, and saying so is §7.14 applied  */
/* to reuse.                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * How close the past build is to this one.
 *
 * Three, not two, because "we have done this" and "we have done something like
 * it" are different promises and the second one is the one that goes wrong in
 * delivery. `partial` covers both halves of a job and a job that has not
 * finished yet: in either case what exists is real and is not the whole thing.
 */
export type MatchKind = "same" | "adapted" | "partial";

export const MATCH_LABEL: Record<MatchKind, string> = {
  same: "Built before",
  adapted: "Built, needs adapting",
  partial: "Part of it built",
};

/** Ordered from most reusable to least. The bar and the sort both read it. */
export const MATCH_ORDER: MatchKind[] = ["same", "adapted", "partial"];

export interface PriorWork {
  id: string;
  /** The project it was built on. Never the current lane, never the benchmark. */
  laneId: string;
  /** What was built, in the words a consultant would use on the call. */
  built: string;
  /**
   * The findings here that this is the same work as. Exactly one prior work per
   * gap, checked by `check:data`: a gap counted at two clients would be counted
   * twice in the reuse figure, which is §7.12's mistake in a different currency.
   */
  gapIds: string[];
  match: MatchKind;
  /**
   * What was different there, and it is required.
   *
   * Same doctrine as the counter rule on `DealRisk`. A reuse claim with nothing
   * against it is a promise a delivery lead has to keep, made by somebody on a
   * call who will not be the one keeping it. The failure is silent: a row
   * claiming "built before" with no caveat renders as a perfectly confident
   * row.
   */
  caveat: string;
  /** What it took there, in weeks. The comparator for our own estimate. */
  weeksThere: number;
  /**
   * When somebody last checked that this match is still true, and it is
   * required.
   *
   * A reuse claim ages badly and silently. The project it points at keeps
   * running after we stopped looking, the finding here gets re-scoped, and the
   * row goes on saying "built before" in exactly the same confident voice. A
   * date on the row is what lets a consultant discount it himself rather than
   * discovering on a call that the thing we built was a different thing.
   */
  verifiedOn: string;
  /** What it moved at that client. Their numbers, not a claim about this one. */
  outcome: string;
}

export const priorWork: PriorWork[] = [
  {
    id: "pw-k-capture",
    laneId: "lane-kesarwani",
    built: "Invoice capture, so nothing is keyed by hand",
    gapIds: ["g1"],
    match: "same",
    caveat: "Their invoices arrive as PDFs. About a third of Suvarna's are paper, which needs scanning before any of this starts.",
    weeksThere: 10,
    verifiedOn: "2 August 2026",
    outcome: "Invoice to posting went from 9 days to 2.8. Nobody types an invoice there any more.",
  },
  {
    id: "pw-k-match",
    laneId: "lane-kesarwani",
    built: "Automatic three-way match, with an exception queue behind it",
    gapIds: ["g2"],
    match: "same",
    caveat: "Kesarwani post their goods receipts on the day. Suvarna do not, so the match cannot be fixed without the receiving work.",
    weeksThere: 12,
    verifiedOn: "2 August 2026",
    outcome: "First-time match went from 61% to 89%, and the queue is one person for half a day.",
  },
  {
    id: "pw-k-onboarding",
    laneId: "lane-kesarwani",
    built: "Vendor onboarding, with a duplicate check on the way in",
    gapIds: ["g6", "g9"],
    match: "same",
    caveat: "Same SAP module and the same two-letter country problem in the master data. The cleanse itself is sized off their record count, not ours.",
    weeksThere: 9,
    verifiedOn: "14 May 2026",
    outcome: "Onboarding went from 19 days to 8, and duplicate supplier records from 7% to under 1%.",
  },
  {
    id: "pw-d-freight",
    laneId: "lane-deccan",
    built: "Freight tendering, rates tested every quarter",
    gapIds: ["g7"],
    match: "adapted",
    caveat: "Beverages moves full loads on fixed lanes. Agri moves part loads on seasonal ones, so the tender model needs rebuilding rather than copying.",
    weeksThere: 12,
    verifiedOn: "2 August 2026",
    outcome: "Freight booking is 0.9 days, and every lane has been tendered at least once.",
  },
  {
    id: "pw-d-planning",
    laneId: "lane-deccan",
    built: "Demand planning off the spreadsheet",
    gapIds: ["g8"],
    match: "partial",
    caveat: "Still in flight, live in two plants of four, so nothing here is a delivered result yet and the last two plants are where it usually gets hard.",
    weeksThere: 20,
    verifiedOn: "11 August 2026",
    outcome: "Stock cover is down 6 days where it has landed. The other two plants go live in Q3.",
  },
  {
    id: "pw-d-approvals",
    laneId: "lane-deccan",
    built: "Purchase requests and sign-off, in the system",
    gapIds: ["g5"],
    match: "partial",
    caveat: "Only the raise and the sign-off. Chasing an approval is still email at Deccan, which is half of what makes this slow at Suvarna.",
    weeksThere: 5,
    /* The oldest check on the board, and the one the row warns about. Deccan is
       in flight, so this is exactly where a match goes quietly out of date. */
    verifiedOn: "6 December 2025",
    outcome: "Every request has a record. Approval time went from 3.2 days to 1.9.",
  },
];

/**
 * How long a match may sit unchecked before the row says so.
 *
 * Six months is one delivery cycle: past it, the project we are pointing at has
 * moved on and so has the finding. It is a threshold on a date rather than a
 * flag somebody has to remember to set, because the flag is what nobody sets.
 */
export const STALE_AFTER_DAYS = 180;

/** Today, for the fixture. A constant, not `new Date()`: a date computed in a
 *  client component renders one value on the server and another in the browser,
 *  which is a hydration error. Same trap `PLAN_START` records. */
export const TODAY_ISO = "2026-08-17";

export function daysSinceVerified(work: PriorWork): number {
  const then = new Date(work.verifiedOn).getTime();
  const now = new Date(TODAY_ISO).getTime();
  return Math.round((now - then) / 86_400_000);
}

export const isStale = (work: PriorWork) => daysSinceVerified(work) > STALE_AFTER_DAYS;

export const priorWorkFor = (gapId: string) =>
  priorWork.find((w) => w.gapIds.includes(gapId)) ?? null;

export const priorWorkOn = (laneId: string) => priorWork.filter((w) => w.laneId === laneId);

/**
 * The whole findings list, cut by how much of it exists already.
 *
 * Four bands, and they are exhaustive and exclusive by construction: every gap
 * lands in exactly one, so the four values add to the same ₹9.68 Cr every other
 * screen reconciles to. `check:data` holds that, because a reuse figure that
 * quietly double-counts a finding is the most flattering possible error and
 * therefore the one to guard hardest.
 *
 * `new` is last and is not a failure state. It is where the estimate is softest
 * and it is the half a delivery lead reads first.
 */
export type PrecedentBand = MatchKind | "new";

export const BAND_LABEL: Record<PrecedentBand, string> = {
  ...MATCH_LABEL,
  new: "New build",
};

export function precedentBands(): { band: PrecedentBand; gaps: Gap[]; valueCr: number }[] {
  const bands: PrecedentBand[] = [...MATCH_ORDER, "new"];
  return bands.map((band) => {
    const inBand = gaps.filter((g) => (priorWorkFor(g.id)?.match ?? "new") === band);
    return { band, gaps: inBand, valueCr: grossValue(inBand.map((g) => g.id)) };
  });
}

/* -------------------------------------------------------------------------- */
/* How close a past project is, on four axes                                   */
/*                                                                             */
/* "Have you done this before" is really four questions, and a single yes       */
/* answers none of them well. A client in the same sector at half the size, a   */
/* project that automated the same steps, a project that fixed the same         */
/* problems, and a project that covered most of what is on this list are four   */
/* different kinds of reassurance, and a consultant needs to know which one he  */
/* is holding before he says it out loud.                                       */
/*                                                                             */
/* **Three of the four are computed and the fourth is two fields.** Nothing     */
/* here is a score somebody typed: process similarity is read off the flow maps */
/* the Workflow view already draws, problem and scope similarity off the prior  */
/* work already recorded, and domain off the sector family and the turnover.    */
/* A hand-set "85% match" would be the most persuasive number on the surface    */
/* and the only one nobody could check.                                        */
/* -------------------------------------------------------------------------- */

/** How close, in three words rather than a percentage. A percentage implies a
 *  precision none of these four has. */
export type Closeness = "close" | "partial" | "different";

export const CLOSENESS_LABEL: Record<Closeness, string> = {
  close: "Close match",
  partial: "Partly",
  different: "Not really",
};

export interface Similarity {
  key: "domain" | "process" | "problem" | "tech" | "stakeholder" | "confidence" | "evidence";
  label: string;
  closeness: Closeness;
  /**
   * The reading itself, and it has to compare itself: *8 of 16 steps* needs no
   * sentence under it. Each of these used to carry an explanatory line as well,
   * which was seven sentences per card before any of the detail underneath.
   */
  value: string;
  /**
   * The reading as a share, where it is one. `overallMatch` is the mean of
   * these and nothing else, so a metric that is a count rather than a
   * proportion — the source count — is deliberately left out of it rather than
   * quietly scaled into it.
   */
  share?: number;
}

const band = (share: number): Closeness =>
  share >= 0.6 ? "close" : share >= 0.3 ? "partial" : "different";

/** Every step in the shared spine, for the process comparison. */
const ALL_STEPS = stages.flatMap((st) => st.steps);

/**
 * The seven readings, for one past project.
 *
 * Process similarity is the interesting one and it is not "do they run the same
 * steps": every company here runs most of the same nineteen. What matters is
 * **how many of the steps this client does by hand are already automatic at that
 * project**, because those are the ones we would be doing again rather than for
 * the first time.
 *
 * **Every one is computed.** Nothing here is a score somebody typed: the estate
 * overlap is the systems this client's covered findings sit under, the function
 * overlap is who owns them, the confidence reading is their evidence tier, and
 * the source count is the documents behind them. A hand-set number would be the
 * most persuasive thing on the surface and the only one nobody could check.
 */
export function similarityFor(laneId: string): Similarity[] {
  const lane = laneById(laneId);
  const us = currentLane;

  const ratio = lane.revenueCr && us.revenueCr ? lane.revenueCr / us.revenueCr : 1;
  const sameFamily = lane.sectorFamily != null && lane.sectorFamily === us.sectorFamily;
  const sizeGap = Math.max(ratio, 1 / ratio);
  /* Domain is the one axis with no natural denominator, so it is quantised
     rather than measured: same family and within twice the size, same family
     and beyond it, or neither. The steps are stated here rather than hidden
     inside a weighting, because this is the number a client would push on. */
  const domainShare = !sameFamily ? 0 : sizeGap <= 2 ? 1 : 0.5;

  const byHand = ALL_STEPS.filter((f) => us.flow[f.id] === "manual");
  const solvedThere = byHand.filter((f) => {
    const h = lane.flow[f.id];
    return h === "auto" || h === "assisted";
  });

  const work = priorWorkOn(laneId);
  const coveredIds = work.flatMap((w) => w.gapIds);
  const covered = coveredIds.map((id) => gaps.find((g) => g.id === id)!);

  const systems = techSystems.filter((sys) => sys.gapIds.some((id) => coveredIds.includes(id)));
  const owners = new Set(covered.map((g) => g.ownerId));
  const people = new Set(gaps.map((g) => g.ownerId));
  const confirmed = covered.filter((g) => g.tier === "confirmed");
  const sourceIds = new Set(covered.flatMap((g) => g.evidence.map((e) => e.sourceId)));

  const processShare = solvedThere.length / byHand.length;
  const problemShare = covered.length / gaps.length;
  const techShare = systems.length / techSystems.length;
  const ownerShare = owners.size / people.size;
  const confidenceShare = covered.length === 0 ? 0 : confirmed.length / covered.length;

  return [
    {
      key: "domain",
      label: "Domain",
      closeness: band(domainShare),
      /* The comparison, not the sector string: the card already prints
         "Packaged foods · ₹880 Cr" under the company name. */
      value: sameFamily ? `Same sector, ${ratio.toFixed(1)}× the size` : "Different sector",
      share: domainShare,
    },
    {
      key: "process",
      label: "Process",
      closeness: band(processShare),
      value: `${solvedThere.length} of ${byHand.length} manual steps solved`,
      share: processShare,
    },
    {
      key: "problem",
      label: "Use case",
      closeness: band(problemShare),
      value: `${covered.length} of ${gaps.length} findings`,
      share: problemShare,
    },
    {
      key: "tech",
      label: "Tech stack",
      closeness: band(techShare),
      value: `${systems.length} of ${techSystems.length} systems`,
      share: techShare,
    },
    {
      key: "stakeholder",
      label: "Function",
      closeness: band(ownerShare),
      value: `${owners.size} of ${people.size} owners`,
      share: ownerShare,
    },
    {
      key: "confidence",
      label: "Confidence",
      closeness: band(confidenceShare),
      value: `${confirmed.length} of ${covered.length} confirmed`,
      share: confidenceShare,
    },
    {
      key: "evidence",
      label: "Evidence",
      /* A count, not a share, so it is banded on its own scale and kept out of
         the overall mean. Five documents behind a match is a different kind of
         reassurance from five percent of anything. */
      closeness: sourceIds.size >= 4 ? "close" : sourceIds.size >= 2 ? "partial" : "different",
      value: `${sourceIds.size} ${sourceIds.size === 1 ? "source" : "sources"}`,
    },
  ];
}

/**
 * One percentage, and it is the mean of the six axes that are shares.
 *
 * **It is stated as an average rather than presented as a verdict**, because a
 * single "68% match" with no working is the most persuasive number a surface
 * like this can carry and the only one nobody can check. The six it averages
 * are on screen directly underneath it, so the arithmetic is visible: if the
 * figure looks generous, the axis dragging it up is one line below.
 *
 * The source count is excluded on purpose. It is a count rather than a
 * proportion, and scaling it into a mean would be inventing a denominator.
 */
export function overallMatch(laneId: string): number {
  const shares = similarityFor(laneId)
    .map((a) => a.share)
    .filter((n): n is number => n != null);
  return Math.round((shares.reduce((sum, n) => sum + n, 0) / shares.length) * 100);
}


/**
 * The sentence to say on the call, composed rather than authored.
 *
 * It is the outcome of whichever build on that project covers the most of this
 * client's list, because that is the one with the most claim on their
 * attention. Composing it means it cannot go stale against the prior work it
 * quotes.
 */
export function proofFor(laneId: string): { built: string; outcome: string } | null {
  const work = [...priorWorkOn(laneId)].sort((a, b) => b.gapIds.length - a.gapIds.length);
  return work[0] ? { built: work[0].built, outcome: work[0].outcome } : null;
}

/** Everything with a precedent of any kind: the headline count and figure. */
export const reusedGaps = () => gaps.filter((g) => priorWorkFor(g.id));
export const reusedValueCr = () => grossValue(reusedGaps().map((g) => g.id));

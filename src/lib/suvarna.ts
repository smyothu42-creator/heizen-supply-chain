/**
 * Suvarna Agro Foods — the worked example behind all four Research directions.
 *
 * Fictional company, realistic shape: ₹1,150 Cr revenue, 12 gaps (11 priced,
 * 1 not), 4 sources.
 *
 * Every claim in here carries its provenance, because nothing in Meridian
 * should be unattributable. If a number appears on a screen without a route
 * back to a source in this file, that screen has a bug.
 *
 * THREE THINGS THAT MUST STAY SEPARATE. See AUDIT.md.
 *
 *   tier            — is the OBSERVATION true?   confirmed / inferred / unverified
 *   valuationBasis  — is the NUMBER right?       measured / modelled / sector-default
 *   moneyKind       — what kind of money is it?  cost / margin / carry
 *
 * Collapsing the first two is how a ₹3.2 Cr price built on a broken ratio wore a
 * "Confirmed" badge for four commits. Collapsing the third is how a one-off
 * balance-sheet release got summed into an annual P&L headline.
 *
 * And savings do not add. Gaps that share a root cause are capped by an entry in
 * `overlapGroups`; `netLeakageCr` is what may be claimed, `grossLeakageCr` is the
 * sum of the parts. Every subtotal on every screen reconciles to gross; only the
 * headline uses net.
 */

export type Tier = "confirmed" | "inferred" | "unverified";
export type Effort = "Low" | "Medium" | "High";
export type SourceKind = "filing" | "transcript" | "email" | "web";
export type ConfidenceLevel = "Low" | "Medium" | "Medium-high" | "High";

/** Which SCOR Level 0 stage this belongs to. Canvas and Gaps must agree. */
export type ScorStage = "Plan" | "Source" | "Make" | "Deliver" | "Return";

/**
 * What kind of money the number is. Never blend these in one total.
 *   cost   — annual P&L cost avoided
 *   margin — annual margin gained, net of what it costs to fund
 *   carry  — annual carrying cost released, with a one-off cash release beside it
 */
export type MoneyKind = "cost" | "margin" | "carry";

/**
 * Where the PRICE comes from — independent of whether the observation is true.
 *   measured        — computed from data the client gave us
 *   modelled        — their base, our rate
 *   sector-default  — our base and our rate
 */
export type ValuationBasis = "measured" | "modelled" | "sector-default";

export const MONEY_KIND_LABEL: Record<MoneyKind, string> = {
  cost: "cost avoided",
  margin: "margin gained",
  carry: "carrying cost released",
};

export const VALUATION_BASIS_LABEL: Record<ValuationBasis, string> = {
  measured: "Measured",
  modelled: "Modelled",
  "sector-default": "Sector default",
};

export const VALUATION_BASIS_MEANING: Record<ValuationBasis, string> = {
  measured: "Computed from data Suvarna gave us. Defensible line by line.",
  modelled: "Their number underneath, our rate on top. The rate is arguable.",
  "sector-default": "Both the base and the rate are ours. Treat as a size, not a price.",
};

export interface Source {
  id: string;
  name: string;
  kind: SourceKind;
  date: string;
  detail: string;
  /** Where a `web` source lives. The other three kinds are files that were
      handed to us, and a file has no address — which is why this is optional
      and why the edit form asks for it on one kind only. */
  url?: string;
}

export interface Evidence {
  sourceId: string;
  locator: string;
  excerpt: string;
}

export interface Metric {
  id: string;
  label: string;
  /** Plain-language line. Aryan is not an expert; a term appears once, glossed. */
  gloss: string;
  actual: number | null;
  bestInClass: number;
  unit: string;
  betterWhen: "lower" | "higher";
  sourceIds: string[];
  /**
   * What to do with the delta. Present when the naive reading is wrong — either
   * because the gap is not the prize, or because there is no gap at all.
   */
  readAs?: string;
}

/**
 * How a price was arrived at, in the form a client can argue with.
 *
 * A gap without one of these is a number with no working shown, and a number
 * with no working shown is the one that gets challenged first.
 */
export interface Valuation {
  /** What the rate is applied to, in plain words. */
  baseLabel: string;
  baseCr: number | null;
  /** The rate applied, written the way it would be said out loud. */
  rateLabel: string;
  /** Taken off before the headline — funding cost, mostly. */
  deduction?: { label: string; amountCr: number };
  /** Honest range around the claim. The claim sits at or below the middle. */
  lowCr: number;
  highCr: number;
  kind: MoneyKind;
  basis: ValuationBasis;
  /** Whose number is the base, whose is the rate. One line, always stated. */
  whoseNumbers: string;
  /**
   * What closing the benchmark gap outright would be worth. Present only where a
   * metric on screen implies a much larger number than we are claiming — the
   * client will do that multiplication, so we do it first.
   */
  benchmarkGapCr?: number;
  benchmarkNote?: string;
  /** One-off balance-sheet movement. NEVER added to an annual total. */
  oneOffCr?: number;
  oneOffLabel?: string;
}

export interface Gap {
  id: string;
  rank: number;
  bucketId: string;
  /** Domain-accurate title. */
  title: string;
  /** The version Aryan can say out loud without knowing the domain. */
  plainLine: string;
  /** SCOR Level 0 → Level 1 → Level 2. Must match the Canvas node below. */
  scor: ScorStage;
  level1: string;
  level2: string;
  /** The Canvas Level-2 node this gap is priced at. Verified by check:data. */
  nodeId: string;
  amountCr: number | null;
  /** Present only when amountCr is null. Never render a null price as ₹0. */
  unpricedReason?: string;
  /** How the price was built. Present whenever amountCr is. */
  valuation?: Valuation;
  effort: Effort;
  weeks: number;
  /** Is the OBSERVATION true. Says nothing about the price — see valuation.basis. */
  tier: Tier;
  confidence: ConfidenceLevel;
  confidenceReason: string;
  /** Gaps that must land before this one pays. Modelled, not just described. */
  requires: string[];
  /** Set when this gap's saving overlaps others. See overlapGroups. */
  overlapGroupId?: string;
  why: string;
  impact: string;
  /** The mechanism we think is behind the finding, not the finding itself.
   *  A gap says what is wrong; this says why it happens, which is what a
   *  consultant has to be able to say out loud when asked "how come?". */
  hypothesis: string;
  /** What we have not established. Stated, because §7.14 applies to a finding
   *  as much as to a total: a gap with no open questions is either finished or
   *  overclaimed, and none of these are finished. */
  stillUnknown: string[];
  /** What to actually do next. Written as instructions, in order. */
  nextSteps: string[];
  metricIds: string[];
  evidence: Evidence[];
  ownerId: string;
}

export interface Bucket {
  id: string;
  name: string;
  plainLine: string;
  gapIds: string[];
}

export interface Stakeholder {
  id: string;
  name: string;
  role: string;
  met: boolean;
  /** What this person is actually judged on at review time. */
  measuredOn: string[];
  owns: string[];
  /** Things that land badly with this specific person. */
  avoid: string;
  openingLine: string;
}

/** Which conversation a question belongs to. Eight questions across three people
 *  is not one call, and printing them as one ordered list implied it was. */
export type AskWhen = "this-call" | "after-this-call" | "data-request";

export const ASK_WHEN_LABEL: Record<AskWhen, string> = {
  "this-call": "Ask today",
  "after-this-call": "Needs another meeting",
  "data-request": "Ask for this at the end",
};

export interface Question {
  id: string;
  askOrder: number;
  askWhen: AskWhen;
  text: string;
  gloss?: string;
  targetId: string;
  whyItMatters: string;
  badAnswer: string;
  goodAnswer: string;
  linkedGapIds: string[];
}

export interface Claim {
  id: string;
  tier: Tier;
  statement: string;
  basis: string;
  sourceIds: string[];
  category: "Company" | "Systems" | "Process" | "Commercial" | "People";
  linkedGapId?: string;
}

export interface CallBeat {
  id: string;
  phase: string;
  minutes: string;
  intent: string;
  lines: { label: string; body: string; detail?: string }[];
}

/* -------------------------------------------------------------------------- */
/* Spend base — every valuation below is a rate applied to one of these         */
/*                                                                             */
/* Stated once, in one place, so a base can be challenged rather than           */
/* discovered inside a gap's prose. Only revenue is theirs; the split is our    */
/* estimate from sector structure and is labelled as such everywhere it lands.  */
/* -------------------------------------------------------------------------- */

export const spendBase = {
  revenueCr: 1150,
  /** Raw material and packaging. ~62% of revenue is normal for agri-processing. */
  directCr: 713,
  /** MRO, services, consumables, travel. ~5.7% of revenue. */
  indirectCr: 66,
  /** From the FY25 report: 4.6% of revenue. */
  freightCr: 53,
  /** Cost of goods sold, for converting inventory days into rupees. */
  cogsCr: 828,
  /** Working-capital line. Indian mid-cap, FY26. */
  costOfCapitalPct: 9,
  /** Fully loaded AP clerk, a year. */
  apClerkCr: 0.065,
  note: "Revenue is theirs. The split into direct, indirect and freight is our estimate from sector structure. No spend cube has been shared.",
};

/* -------------------------------------------------------------------------- */
/* Company                                                                     */
/* -------------------------------------------------------------------------- */

export const company = {
  name: "Suvarna Agro Foods",
  sector: "Agri-processing and packaged foods",
  revenueCr: 1150,
  /** Sum of every gap, before overlap. Every subtotal on every screen ties to this. */
  grossLeakageCr: 9.68,
  /** What may actually be claimed, after the shared-root-cause deduction. */
  netLeakageCr: 9.08,
  overlapCr: 0.6,
  /** One-off cash off the balance sheet. Never added to the annual figure. */
  workingCapitalReleaseCr: 18.2,
  confidence: "Medium-high" as ConfidenceLevel,
  confidenceReason:
    "Based on the FY25 annual report, 2 discovery calls, and one email thread from the Head of Procurement. No ERP data has been shared yet, so no price on this list is measured. Every one is modelled.",
  researchedOn: "6 August 2026",
  /** The single sentence Aryan says first. */
  thesis:
    "Suvarna has scaled to ₹1,150 Cr on a procurement process still run on email, spreadsheets and manual data entry. About ₹9.1 Cr a year leaks out of it, and a further ₹18 Cr of cash sits in stock they do not need.",
  facts: [
    { label: "Revenue", value: "₹1,150 Cr", detail: "FY25, up 18% on FY24" },
    { label: "Plants", value: "3", detail: "Sangli, Nashik, Hubli" },
    { label: "ERP", value: "SAP ECC 6.0", detail: "MM, FI and SD live. No warehouse module." },
    { label: "Active suppliers", value: "~2,400", detail: "61% of spend sits with the top 40" },
    { label: "Headcount", value: "~4,200", detail: "AP team of 9, benchmark for the volume" },
    { label: "Invoices a year", value: "~96,000", detail: "Roughly 8,000 a month" },
  ],
};

/* -------------------------------------------------------------------------- */
/* Coverage — what this total is, and is not, a total of                       */
/*                                                                             */
/* Eleven of twelve gaps sit in Source. Nobody has looked at Make, and Suvarna  */
/* runs three plants. Stating that is worth more than the total is.             */
/* -------------------------------------------------------------------------- */

export interface Coverage {
  stage: ScorStage;
  state: "researched" | "thin" | "not-researched";
  line: string;
  /** Rough size of what is not being claimed, where we can honestly bound it. */
  unclaimedRange?: string;
}

export const coverage: Coverage[] = [
  {
    stage: "Plan",
    state: "thin",
    line: "One gap, from the annual report. Nobody in planning has been spoken to.",
  },
  {
    stage: "Source",
    state: "researched",
    line: "Nine gaps, two calls and an email thread. Where the work has been done.",
  },
  {
    stage: "Make",
    state: "not-researched",
    line: "Three plants, and not one question asked about them.",
    unclaimedRange: "Yield and giveaway on ₹713 Cr of material is normally the largest line on an agri-processor's board. ₹3.6 to ₹10.7 Cr a year, on a 0.5 to 1.5% sector range.",
  },
  {
    stage: "Deliver",
    state: "thin",
    line: "Two gaps, both inferred from the FY25 report. Nobody in logistics has been spoken to.",
  },
  {
    stage: "Return",
    state: "not-researched",
    line: "Raised once in passing, never followed up.",
  },
];

/* -------------------------------------------------------------------------- */
/* Sources — four, each with excerpts a consultant could read aloud            */
/* -------------------------------------------------------------------------- */

export const sources: Source[] = [
  {
    id: "src-ar25",
    name: "FY25 Annual Report",
    kind: "filing",
    date: "27 June 2026",
    detail: "Public filing · 148 pages · fully ingested",
  },
  {
    id: "src-call1",
    name: "Discovery call 1",
    kind: "transcript",
    date: "12 March 2026",
    detail: "Transcript · 41 min · Rohan Deshpande",
  },
  {
    id: "src-call2",
    name: "Discovery call 2",
    kind: "transcript",
    date: "2 April 2026",
    detail: "Transcript · 55 min · Rohan Deshpande, Anand Kulkarni",
  },
  {
    id: "src-email",
    name: "FY25 procurement pain points",
    kind: "email",
    date: "9 April 2026",
    detail: "Email thread · 6 messages · from Rohan Deshpande",
  },
  /* The fifth source, and the first `web` one — added with Timing and Risk.
     Those two directions rest on things the client never tells you and a
     filing does not record: who joined when, what is being hired for, what the
     estate has to do before 2027. Attributing them to a call would have been
     the tidier number and a false one. Kind `web` already existed in the type
     and had nothing behind it until now. */
  {
    id: "src-web",
    name: "Public web",
    kind: "web",
    date: "3 August 2026",
    detail: "Careers page, press and trade coverage · 11 items",
  },
  /* Four more, ingested and read but not yet cited by a gap, a claim, a signal
     or a risk. That is a true state and not a gap in the fixture: a consultant
     drops a folder in, the pipeline reads all of it, and most documents turn
     out to corroborate rather than to carry a finding of their own. Certainty's
     source ledger shows them at "0 claims", which is the honest reading and the
     reason the count is there.

     They are also what makes the strip's horizontal scroll a real behaviour
     rather than a claim about one. Five chips fitted on a wide monitor; nine do
     not fit anywhere. */
  {
    id: "src-inv",
    name: "Investor deck, Q1 FY26",
    kind: "filing",
    date: "14 July 2026",
    detail: "Public filing · 32 slides · fully ingested",
  },
  {
    id: "src-mca",
    name: "MCA filings FY23 to FY25",
    kind: "filing",
    date: "27 June 2026",
    detail: "Public filing · 3 years · fully ingested",
  },
  {
    id: "src-call3",
    name: "Finance follow-up",
    kind: "transcript",
    date: "21 April 2026",
    detail: "Transcript · 28 min · Anand Kulkarni",
  },
  {
    id: "src-email2",
    name: "Freight tender thread",
    kind: "email",
    date: "6 May 2026",
    detail: "Email thread · 9 messages · from the logistics team",
  },
];

export const sourceById = (id: string) => sources.find((s) => s.id === id)!;

/* -------------------------------------------------------------------------- */
/* Metrics — never a bare number, every one carries best-in-class              */
/* -------------------------------------------------------------------------- */

export const metrics: Metric[] = [
  {
    id: "m-ftmr",
    label: "First-time match rate",
    gloss:
      "Invoices that reconcile automatically on the first attempt, with no one touching them.",
    actual: 58,
    bestInClass: 90,
    unit: "%",
    betterWhen: "higher",
    sourceIds: ["src-call2"],
  },
  {
    id: "m-invoice-cycle",
    label: "Invoice cycle time",
    gloss: "Days from an invoice arriving to it being posted in the ERP.",
    actual: 9.5,
    bestInClass: 2,
    unit: " days",
    betterWhen: "lower",
    sourceIds: ["src-call2", "src-email"],
    readAs:
      "Measured from arrival, not from the invoice date. The real miss on a 10-day discount window is worse than 9.5 days suggests.",
  },
  {
    id: "m-touchless",
    label: "Touchless invoices",
    gloss: "Invoices completed end to end with no human handling at all.",
    actual: 6,
    bestInClass: 65,
    unit: "%",
    betterWhen: "higher",
    sourceIds: ["src-call2"],
  },
  {
    id: "m-onboarding",
    label: "Vendor onboarding time",
    gloss: "Days from picking a new supplier to being able to raise an order on them.",
    actual: 21,
    bestInClass: 7,
    unit: " days",
    betterWhen: "lower",
    sourceIds: ["src-call1", "src-email"],
  },
  {
    id: "m-pr-po",
    label: "Request to order",
    gloss:
      "Days from someone asking to buy something to the purchase order actually going out.",
    actual: 4.4,
    bestInClass: 1.4,
    unit: " days",
    betterWhen: "lower",
    sourceIds: ["src-call1"],
  },
  {
    id: "m-rfq",
    label: "Sourcing cycle",
    gloss: "Days to run a quote exercise and pick a supplier.",
    actual: 10.1,
    bestInClass: 3.5,
    unit: " days",
    betterWhen: "lower",
    sourceIds: ["src-call1"],
  },
  {
    id: "m-discount",
    label: "Early-payment discounts captured",
    gloss:
      "Suppliers offer a small discount for paying early. This is the share Suvarna actually collects.",
    actual: 12,
    bestInClass: 70,
    unit: "%",
    betterWhen: "higher",
    sourceIds: ["src-email"],
    readAs: "Closing this gains margin and spends cash. The gap below is net of the funding cost.",
  },
  {
    id: "m-contracted",
    label: "Indirect spend under contract",
    gloss:
      "Services, MRO and travel bought at a negotiated rate rather than ad hoc.",
    actual: 47,
    bestInClass: 85,
    unit: "%",
    betterWhen: "higher",
    sourceIds: ["src-call2"],
    readAs:
      "Rohan's estimate out loud, not a system report. It is the single most load-bearing number on the list.",
  },
  {
    id: "m-dupes",
    label: "Duplicate supplier records",
    gloss: "The same supplier entered more than once, so spend with them looks smaller than it is.",
    actual: 8.4,
    bestInClass: 1,
    unit: "%",
    betterWhen: "lower",
    sourceIds: ["src-call2"],
  },
  {
    id: "m-fg-cover",
    label: "Finished goods cover",
    gloss: "Days of stock sitting in the warehouse waiting to be sold.",
    actual: 38,
    bestInClass: 22,
    unit: " days",
    betterWhen: "lower",
    sourceIds: ["src-ar25"],
    readAs:
      "All 16 days would be ₹36 Cr released, but this is a seasonal crop business. We claim 8 days.",
  },
  {
    id: "m-freight",
    label: "Freight as a share of revenue",
    gloss: "What it costs to move goods, measured against what the company sells.",
    actual: 4.6,
    bestInClass: 3.2,
    unit: "%",
    betterWhen: "lower",
    sourceIds: ["src-ar25"],
    readAs:
      "A weak benchmark. This ratio moves with product density, lane length and mix, so it sizes the question rather than the prize. Rate per tonne-km is the number to ask for.",
  },
  {
    id: "m-ap-fte",
    label: "AP staff per 10,000 invoices",
    gloss: "How many people it takes to process the paperwork. Lower means more of it is automated.",
    // Nine people against ~96,000 invoices a year is 0.94 per 10,000. The
    // previous 3.1 would have needed a team of thirty. See AUDIT.md A1.
    actual: 0.94,
    bestInClass: 0.9,
    unit: "",
    betterWhen: "lower",
    sourceIds: ["src-call2", "src-email"],
    readAs:
      "Already at benchmark. There is no headcount case here. The AP argument is throughput, error and control, not salary.",
  },
];

export const metricById = (id: string) => metrics.find((m) => m.id === id)!;

/* -------------------------------------------------------------------------- */
/* Stakeholders                                                                */
/* -------------------------------------------------------------------------- */

export const stakeholders: Stakeholder[] = [
  {
    id: "sh-rohan",
    name: "Rohan Deshpande",
    role: "Head of Procurement",
    met: true,
    measuredOn: [
      "Savings delivered against the negotiated-rate baseline",
      "Share of spend bought under contract",
      "Supplier onboarding turnaround",
    ],
    owns: ["Sourcing and RFQ", "Contracts and rates", "Vendor onboarding", "Supplier master data"],
    avoid:
      "Do not open with invoice processing. It sits with Finance, and leading there tells him the research was not about his function.",
    openingLine:
      "You told us onboarding a new supplier takes about three weeks. That is the number we would go after first. It is the one that stops your plants.",
  },
  {
    id: "sh-meera",
    name: "Meera Iyer",
    role: "Chief Financial Officer",
    met: false,
    measuredOn: [
      "Working capital and cash conversion",
      "Cost of the finance function",
      "Audit findings and control gaps",
    ],
    owns: ["Accounts payable", "Payment terms", "Financial controls", "Audit"],
    avoid:
      "Do not present process elegance, and do not call a discount 'free cash'. Capturing it spends working capital. She buys cash released and audit exposure closed, in that order.",
    // The funding cost is stated by us, first. Being caught on it by a CFO costs
    // more than the ₹1.1 Cr it takes off the number. See AUDIT.md A3.
    openingLine:
      "You are collecting early-payment discounts on one invoice in eight. Closing that is ₹2.1 Cr of margin, less about ₹1.1 Cr to fund it, because you pay 35 days early. Call it ₹1 Cr net.",
  },
  {
    id: "sh-vikram",
    name: "Vikram Rao",
    role: "VP Supply Chain",
    met: false,
    measuredOn: [
      "On-time in-full delivery",
      "Freight cost per tonne",
      "Finished goods stock cover",
    ],
    owns: ["Planning and S&OP", "Warehousing", "Freight and 3PL", "Plant logistics"],
    avoid:
      "Do not frame spreadsheets as the problem. He built the planning spreadsheet and it is currently the thing holding the operation together.",
    openingLine:
      "You are carrying 38 days of finished goods against a sector best of 22. Take out eight of those days and about ₹18 Cr of cash comes back once, with ₹1.6 Cr a year of carry behind it.",
  },
  {
    id: "sh-anand",
    name: "Anand Kulkarni",
    role: "Accounts Payable Lead",
    met: true,
    measuredOn: [
      "Invoices posted per day",
      "Ageing of unposted invoices",
      "Supplier payment complaints",
    ],
    owns: ["Invoice entry", "Three-way matching", "Exception handling", "Supplier queries"],
    avoid:
      "Do not describe the work as low value, and do not arrive with a headcount case. Nine people against 96,000 invoices is benchmark. His team absorbs the failure of every upstream process and he knows it.",
    openingLine:
      "Nine people clearing 96,000 invoices a year is benchmark headcount. You are not overstaffed. The problem is the 42% that falls out of matching, and it starts at the plant gate, not at your desk.",
  },
];

export const stakeholderById = (id: string) => stakeholders.find((s) => s.id === id)!;

/* -------------------------------------------------------------------------- */
/* Money buckets — the tree Direction 1 hangs off                              */
/* -------------------------------------------------------------------------- */

export const buckets: Bucket[] = [
  {
    id: "b-pay",
    name: "Paying for what they buy",
    plainLine: "Everything between an invoice arriving and money leaving the bank.",
    gapIds: ["g1", "g2", "g4", "g5"],
  },
  {
    id: "b-buy",
    name: "Buying it in the first place",
    plainLine: "Choosing suppliers, agreeing rates, and getting them set up to trade.",
    gapIds: ["g3", "g6", "g9"],
  },
  {
    id: "b-move",
    name: "Moving and holding stock",
    plainLine: "Freight, warehousing, and how much inventory sits still.",
    gapIds: ["g7", "g8", "g11", "g12"],
  },
  {
    id: "b-recover",
    name: "Getting money back",
    plainLine: "Claims owed to Suvarna by distributors and suppliers.",
    gapIds: ["g10"],
  },
];

/* -------------------------------------------------------------------------- */
/* Overlap groups — savings that do not add                                    */
/*                                                                             */
/* Two gaps that fix the same root cause cannot both bank the full number. The */
/* product used to say so in prose and then let the plan builder add them up.  */
/* -------------------------------------------------------------------------- */

export interface OverlapGroup {
  id: string;
  name: string;
  gapIds: string[];
  /** Ceiling on the combined saving, regardless of how many are selected. */
  capCr: number;
  why: string;
}

export const overlapGroups: OverlapGroup[] = [
  {
    id: "og-p2p",
    name: "The invoice chain",
    gapIds: ["g1", "g2", "g4", "g11"],
    capCr: 1.9,
    why: "All four move the same invoice through the same 9.5 days. The avoided hiring in capture and in matching is the same heads, and the expedite cost in receiving is the same cost as the expedite cost in matching. Doing all four is worth ₹1.9 Cr, not the ₹2.3 Cr they add to.",
  },
  {
    id: "og-spend",
    name: "Seeing the spend",
    gapIds: ["g3", "g9"],
    capCr: 2.3,
    why: "Cleaning duplicate vendor records recovers negotiating leverage on tail spend. Routing indirect through contracts recovers some of the same leverage. Both are worth doing; they are not additive.",
  },
];

export const overlapGroupById = (id: string) => overlapGroups.find((o) => o.id === id)!;
export const overlapGroupFor = (gapId: string) =>
  overlapGroups.find((o) => o.gapIds.includes(gapId));

/* -------------------------------------------------------------------------- */
/* Gaps — 12, ranked by annual value. One deliberately unpriced.               */
/*                                                                             */
/* Every price is a rate on a named base, with the range and whose numbers      */
/* they are stated. Nothing here is measured from Suvarna's data, and the       */
/* valuation basis says so on all eleven.                                       */
/* -------------------------------------------------------------------------- */

export const gaps: Gap[] = [
  {
    id: "g3",
    rank: 1,
    bucketId: "b-buy",
    title: "Indirect spend bought outside negotiated rates",
    plainLine:
      "More than half of non-production buying happens outside agreed pricing, so Suvarna pays list price.",
    scor: "Source",
    level1: "Sourcing",
    level2: "Indirect category management",
    nodeId: "l2-category",
    amountCr: 2.1,
    valuation: {
      baseLabel: "Indirect spend not under contract",
      baseCr: 35,
      rateLabel: "6% price leakage against contracted rates",
      lowCr: 1.4,
      highCr: 3.5,
      kind: "cost",
      basis: "sector-default",
      whoseNumbers:
        "Rohan's 'less than half' gives the 53% uncontracted share; the ₹66 Cr indirect line and the 6% rate are both ours.",
      benchmarkNote:
        "The published range for food processing is 4 to 10%. We carry the low end because the base itself is an estimate.",
    },
    effort: "Medium",
    weeks: 16,
    tier: "inferred",
    confidence: "Medium",
    confidenceReason:
      "The 47% figure is Rohan's own estimate on call 2, not a system report. Neither the base nor the rate has been checked against Suvarna's ledger.",
    requires: ["g9"],
    overlapGroupId: "og-spend",
    why: "Rohan estimated that under half of indirect spend runs through contracted rates. Buying outside the official process, known as maverick buying, loses the negotiated discount and the volume leverage that produced it.",
    impact:
      "Catalogue the top 12 indirect categories and route them through contracted suppliers. This is the largest number on the list and the least verified. The vendor master has to be cleaned first or the spend cannot even be counted.",
    hypothesis:
      "Nobody has decided that indirect buying has to go through a contract, so it is not that a rule is being broken. There is no rule, and a category nobody owns behaves exactly like this one is behaving.",
    stillUnknown: [
      "Which categories the uncontracted spend actually sits in. Rohan's impression is that it is everywhere, which is not a category list.",
      "Whether contracted rates exist and are being bypassed, or were never put in place for these categories at all.",
    ],
    nextSteps: [
      "Pull twelve months of indirect spend by vendor and category from SAP MM, split by whether a contract record exists.",
      "Clean the vendor master first. Spend split across duplicate records cannot be counted, let alone challenged.",
    ],
    metricIds: ["m-contracted"],
    evidence: [
      {
        sourceId: "src-call2",
        locator: "38:10",
        excerpt:
          "\"Indirect is the wild west, honestly. Plants buy what they need. I would guess less than half of it touches a contract.\"",
      },
    ],
    ownerId: "sh-rohan",
  },
  {
    id: "g8",
    rank: 2,
    bucketId: "b-move",
    title: "Planning runs on spreadsheets, so stock cover runs high",
    plainLine:
      "Demand planning is done in Excel, so the warehouses carry more days of stock than they need to.",
    scor: "Plan",
    level1: "Demand planning",
    level2: "Sales and operations planning",
    nodeId: "l2-sop",
    amountCr: 1.6,
    valuation: {
      baseLabel: "8 days of finished-goods cover at ₹2.27 Cr a day of COGS",
      baseCr: 18.2,
      rateLabel: "9% cost of capital on the cash released",
      lowCr: 0.9,
      highCr: 3.3,
      kind: "carry",
      basis: "modelled",
      whoseNumbers:
        "The 38 days is from their FY25 report. The COGS ratio and the 9% funding rate are ours.",
      benchmarkGapCr: 3.3,
      benchmarkNote:
        "Closing all 16 days to the sector best of 22 would release ₹36 Cr and save ₹3.3 Cr of carry. This is a seasonal crop business, so we claim half the move.",
      oneOffCr: 18.2,
      oneOffLabel: "released once, off the balance sheet",
    },
    effort: "High",
    weeks: 24,
    tier: "confirmed",
    confidence: "Medium-high",
    confidenceReason:
      "Stock cover and the spreadsheet planning cycle are both in the FY25 report. How much of the 16-day gap is seasonality rather than planning has not been tested.",
    requires: [],
    why: "Finished goods cover sits at 38 days against a sector best of 22. The FY25 report describes a monthly planning cycle maintained in spreadsheets. Excess cover is the normal consequence. Without a live picture, planners buffer, and the buffer never comes back down.",
    impact:
      "Cash off the balance sheet, not cost out of the P&L. Meera will care about the ₹18 Cr release; Vikram will care that it does not break service. Note that he owns the spreadsheet.",
    hypothesis:
      "This is a visibility problem being paid for in cash. Stock is what an organisation buys when it cannot see far enough ahead, and it will keep buying it until the planning cycle is faster than the demand it is planning for.",
    stillUnknown: [
      "Whether the 38 days of cover is spread evenly or concentrated in a few products at one plant.",
      "How much of the cover is deliberate protection for the Sangli ramp rather than drift.",
    ],
    nextSteps: [
      "Ask Vikram for cover by product and location for the last four quarters, not the average.",
      "Check with Meera whether a working-capital release is a target this year. This is cash, not cost, and it lands with a different person.",
    ],
    metricIds: ["m-fg-cover"],
    evidence: [
      {
        sourceId: "src-ar25",
        locator: "p. 44, Inventory",
        excerpt:
          "\"Finished goods inventory stood at 38 days of cover as at 31 March 2026 (FY24: 35 days).\"",
      },
      {
        sourceId: "src-ar25",
        locator: "p. 58, Operations",
        excerpt:
          "\"The monthly sales and operations planning cycle is coordinated centrally by the supply chain team.\"",
      },
    ],
    ownerId: "sh-vikram",
  },
  {
    id: "g7",
    rank: 3,
    bucketId: "b-move",
    title: "Freight is tendered manually, one carrier per lane",
    plainLine:
      "Transport is booked by phone and email with a single hauler per route, so rates are never tested.",
    scor: "Deliver",
    level1: "Transport",
    level2: "Freight procurement",
    nodeId: "l2-freight-buy",
    amountCr: 1.6,
    valuation: {
      baseLabel: "Tenderable freight spend, ~60% of the ₹53 Cr freight line",
      baseCr: 32,
      rateLabel: "5% on first competitive tender",
      lowCr: 1.6,
      highCr: 3.8,
      kind: "cost",
      basis: "sector-default",
      whoseNumbers:
        "The ₹53 Cr freight line is from their FY25 report. The tenderable share and the 5% are both ours.",
      benchmarkGapCr: 16.1,
      benchmarkNote:
        "Freight at 4.6% of revenue against a 3.2% sector best implies ₹16.1 Cr. Do not say that number. The ratio moves with product density and lane length. We claim 5% of what can realistically be tendered, against a first-tender range of 8 to 12%.",
    },
    effort: "Medium",
    weeks: 14,
    tier: "inferred",
    confidence: "Medium",
    confidenceReason:
      "The freight cost line is from the FY25 report. The single-carrier structure is inferred from the report's logistics commentary. Nobody in logistics has been spoken to.",
    requires: [],
    why: "Freight runs at 4.6% of revenue against a sector best of 3.2%. The annual report describes long-standing regional transport relationships, which usually means rates are renewed rather than tested. We have not spoken to anyone in logistics, so the mechanism here is an inference from a cost position, not an observation.",
    impact:
      "Competitive lane tendering typically returns 8-12% on the tendered portion on the first pass. Confirm the single-carrier assumption and get rate-per-tonne-km before this number goes in front of the client.",
    hypothesis:
      "Nothing here has gone wrong, which is what makes it easy to miss. A cost that is never tested drifts, and freight is the largest line in this business with no moment in the year when somebody has to defend it.",
    stillUnknown: [
      "Whether it really is one carrier per lane. Nobody in logistics has been spoken to yet.",
      "Rate per tonne-kilometre by lane, which is what turns this from a cost ratio into a finding.",
    ],
    nextSteps: [
      "Get the lane list with volumes, current rates, and when each was last renegotiated.",
      "Add a logistics owner to the next call. This is the one area of the map with no named contact.",
    ],
    metricIds: ["m-freight"],
    evidence: [
      {
        sourceId: "src-ar25",
        locator: "p. 62, Logistics",
        excerpt:
          "\"The Company continues to work with established regional transport partners across its Maharashtra and Karnataka lanes.\"",
      },
    ],
    ownerId: "sh-vikram",
  },
  {
    id: "g4",
    rank: 4,
    bucketId: "b-pay",
    title: "Early-payment discounts are going uncollected",
    plainLine:
      "Suppliers offer money off for paying early. Suvarna collects it on about one invoice in eight.",
    scor: "Source",
    level1: "Accounts payable",
    level2: "Payment scheduling",
    nodeId: "l2-payment",
    amountCr: 1.0,
    valuation: {
      baseLabel: "Ingredient spend on 2/10 net 45 terms",
      baseCr: 180,
      rateLabel: "2% discount, capture from 12% to 70%",
      deduction: {
        label: "Funding 35 days early on ₹126 Cr, at 9%",
        amountCr: 1.09,
      },
      lowCr: 0.4,
      highCr: 1.6,
      kind: "margin",
      basis: "modelled",
      whoseNumbers:
        "The 2/10 net 45 terms and the 12% capture rate are Rohan's, from email. How much spend actually carries those terms is our estimate.",
      benchmarkGapCr: 2.09,
      benchmarkNote:
        "₹2.09 Cr is the gross discount. Never present it on its own: capturing it pulls about ₹12 Cr of working capital forward, and a CFO will find that in the first minute.",
    },
    effort: "Low",
    weeks: 6,
    tier: "confirmed",
    confidence: "Medium-high",
    confidenceReason:
      "The 12% capture rate came from Rohan's email. How many invoices carry discount terms has not been confirmed, and the funding cost depends on their actual borrowing rate.",
    requires: ["g1", "g2"],
    overlapGroupId: "og-p2p",
    why: "Discount terms exist on a large share of Suvarna's ingredient contracts, but invoices take 9.5 days to post from arrival, and the clock started earlier, at the invoice date. Most miss the window before anyone can act. This is not a negotiation problem; the terms are already agreed. It is a speed problem, and taking the discount costs cash to fund.",
    impact:
      "Every day cut from invoice cycle time converts into discount capture, so this lands as a consequence of fixing capture and matching rather than as a project of its own. Present it net of funding cost or not at all.",
    hypothesis:
      "This is not a procurement problem wearing a finance hat. The discount has already been won and is being lost in the handling, so it comes back when the paperwork moves faster and not when somebody renegotiates.",
    stillUnknown: [
      "What share of contracts carry discount terms, and at what rate.",
      "Whether Treasury would fund early payment at all, and what that funding costs internally.",
    ],
    nextSteps: [
      "Ask Meera for the payment terms on the top 50 suppliers by spend.",
      "Establish the funding cost before this is quoted. Presented gross it is the first number a CFO takes apart.",
    ],
    metricIds: ["m-discount", "m-invoice-cycle"],
    evidence: [
      {
        sourceId: "src-email",
        locator: "Message 5",
        excerpt:
          "\"We have 2/10 net 45 on a lot of the ingredient contracts and we almost never hit it. Finance flagged it last year and nothing changed.\"",
      },
    ],
    ownerId: "sh-meera",
  },
  {
    id: "g6",
    rank: 5,
    bucketId: "b-buy",
    title: "Vendor onboarding takes 21 days",
    plainLine:
      "Setting up a new supplier takes three weeks, so plants buy at spot prices while they wait.",
    scor: "Source",
    level1: "Sourcing",
    level2: "Vendor onboarding",
    nodeId: "l2-onboarding",
    amountCr: 0.75,
    valuation: {
      baseLabel: "Spot and emergency purchases made while waiting on onboarding",
      baseCr: 25,
      rateLabel: "3% premium over the contracted alternative",
      lowCr: 0.4,
      highCr: 1.5,
      kind: "cost",
      basis: "modelled",
      whoseNumbers:
        "The 21 days and the spot-buy behaviour are Rohan's, given twice. The ₹25 Cr of affected spend and the 3% premium are ours.",
    },
    effort: "Medium",
    weeks: 12,
    tier: "confirmed",
    confidence: "Medium-high",
    confidenceReason:
      "The 21-day figure is Rohan's, given twice. How much spend is actually diverted to spot is entirely our estimate. Question 2 exists to get it from him.",
    requires: [],
    why: "Onboarding runs sequentially through procurement, finance, quality and legal, with documents chased over email. Three weeks is long enough that plants under pressure buy from an already-approved supplier at a worse rate, or raise an emergency purchase. Rohan described both happening in the cane and packaging categories.",
    impact:
      "Run the checks in parallel with a single intake form. Getting to a week releases the spot-buy premium and shortens every sourcing exercise downstream. It is also the gap that opens on his ground rather than Finance's.",
    hypothesis:
      "The three weeks is not the cost. The cost is what a plant does while it waits, and a plant under production pressure will always take the supplier it can buy from today over the price it could have had in a month.",
    stillUnknown: [
      "How much of the 21 days is waiting rather than working. That split decides whether this is a process fix or a staffing one.",
      "What the spot-buy premium actually is here. The figure in use is a sector one.",
    ],
    nextSteps: [
      "Ask Rohan for the last twenty onboardings with the date stamp at each stage.",
      "Open the call with this one. It is his problem, on his ground, and it does not need Finance to agree first.",
    ],
    metricIds: ["m-onboarding", "m-rfq"],
    evidence: [
      {
        sourceId: "src-call1",
        locator: "27:33",
        excerpt:
          "\"Realistically three weeks to onboard someone new. By then the plant has already bought from whoever was on the list.\"",
      },
    ],
    ownerId: "sh-rohan",
  },
  {
    id: "g2",
    rank: 6,
    bucketId: "b-pay",
    title: "Three-way match fails on 42% of invoices",
    plainLine:
      "Four invoices in ten do not line up with the order and the delivery note, so someone has to chase each one.",
    scor: "Source",
    level1: "Accounts payable",
    level2: "Three-way match",
    nodeId: "l2-three-way",
    amountCr: 0.7,
    valuation: {
      baseLabel: "40,300 exceptions a year against ₹832 Cr of third-party spend",
      baseCr: 832,
      rateLabel:
        "0.04% overpayment and duplicate leakage, plus 2 FTE of hiring avoided on the Sangli volume and expedite cost on blocked suppliers",
      lowCr: 0.4,
      highCr: 1.1,
      kind: "cost",
      basis: "modelled",
      whoseNumbers:
        "The 58% match rate and the exception volume are Anand's. The leakage rate and the expedite estimate are ours.",
      benchmarkNote:
        "The 12,000 hours a year spent clearing exceptions is real, but it is not bankable. AP is already at benchmark headcount and two weeks behind. The saving is avoided hiring against growth, not salary removed.",
    },
    effort: "Medium",
    weeks: 14,
    tier: "confirmed",
    confidence: "High",
    confidenceReason:
      "The 58% figure was given by the AP Lead on call 2 and is consistent with the cycle time. What the exceptions cost is our model, not their data.",
    requires: ["g11"],
    overlapGroupId: "og-p2p",
    why: "A three-way match reconciles the purchase order, the goods receipt and the invoice before payment goes out. At Suvarna only 58% pass first time against a best-in-class 90%. Anand attributed most failures to goods receipts being posted late by the plants, which means the invoice arrives before the system believes the goods did.",
    impact:
      "Fixing goods-receipt timing and tolerance rules is the cheapest half. Expect the exception queue to fall by roughly two thirds and cycle time to drop from 9.5 days towards 3, which is what makes the discount gap collectable.",
    hypothesis:
      "The match is not failing. It is correctly reporting that the system does not yet know the goods arrived, and somebody is being paid to hold open the gap between the physical world and the record of it.",
    stillUnknown: [
      "The split between late goods receipts, price tolerance breaches and quantity differences.",
      "Whether the tolerance rules were ever configured, or left at the SAP default.",
    ],
    nextSteps: [
      "Ask Anand for one month of the exception queue, broken down by failure reason.",
      "Walk one failed invoice end to end with the person who clears it, from order to payment.",
    ],
    metricIds: ["m-ftmr", "m-invoice-cycle", "m-ap-fte"],
    evidence: [
      {
        sourceId: "src-call2",
        locator: "22:47",
        excerpt:
          "\"First-time match is running about 58%. The rest go to a queue and someone works through them, mostly because the goods receipt has not been done at the plant yet.\"",
      },
    ],
    ownerId: "sh-anand",
  },
  {
    id: "g10",
    rank: 7,
    bucketId: "b-recover",
    title: "Distributor claims are reconciled by hand",
    plainLine:
      "Money owed back by distributors is worked out in spreadsheets, so some of it is never collected.",
    scor: "Deliver",
    level1: "Trade claims",
    level2: "Distributor rebates",
    nodeId: "l2-rebates",
    amountCr: 0.68,
    valuation: {
      baseLabel: "Distributor scheme value, ~2% of revenue across four regions",
      baseCr: 23,
      rateLabel: "3% unclaimed and over-settled",
      lowCr: 0.45,
      highCr: 0.9,
      kind: "cost",
      basis: "sector-default",
      whoseNumbers:
        "The scheme structure is in their FY25 report. The scheme value and the 3% leakage rate are both ours.",
    },
    effort: "Medium",
    weeks: 12,
    tier: "inferred",
    confidence: "Medium",
    confidenceReason:
      "The scheme structure is described in the FY25 report. Nobody at Suvarna has confirmed how claims are processed, or what the schemes are worth.",
    requires: [],
    why: "The FY25 report describes a distributor scheme and rebate structure across four regions. Where these are reconciled manually, unclaimed and over-paid amounts typically run at 2-4% of scheme value. We have inferred the manual process from company size and the absence of any claims system in the SAP footprint described on call 2.",
    impact:
      "Worth confirming early because it is the one gap where Suvarna is owed money rather than spending it, which is an easier first conversation than cost.",
    hypothesis:
      "Where a claim has to be proved by whoever is owed the money, the amount that goes uncollected is never the amount that gets over-claimed. That asymmetry, rather than arithmetic error, is what makes manual reconciliation expensive.",
    stillUnknown: [
      "Whether the reconciliation really is manual. That is inferred from the SAP footprint, not observed.",
      "The value of the scheme, which is what any number here would have to be a percentage of.",
    ],
    nextSteps: [
      "Ask for the claims process and one worked example on the next call.",
      "Establish who owns distributor claims. There is no owner against this on the map today.",
    ],
    metricIds: [],
    evidence: [
      {
        sourceId: "src-ar25",
        locator: "p. 71, Trade schemes",
        excerpt:
          "\"Distributor incentive schemes operate across the Company's four sales regions and are settled quarterly.\"",
      },
    ],
    ownerId: "sh-meera",
  },
  {
    id: "g9",
    rank: 8,
    bucketId: "b-buy",
    title: "Duplicate supplier records in SAP",
    plainLine:
      "The same supplier is entered several times, so nobody can see how much Suvarna really spends with them.",
    scor: "Source",
    level1: "Sourcing",
    level2: "Supplier master data",
    nodeId: "l2-vendor-master",
    amountCr: 0.4,
    valuation: {
      baseLabel: "Tail spend whose true volume is hidden by split records",
      baseCr: 40,
      rateLabel: "1% recovered by negotiating against consolidated volume",
      lowCr: 0.2,
      highCr: 0.7,
      kind: "cost",
      basis: "sector-default",
      whoseNumbers:
        "Anand confirmed duplicates exist. The 8.4% rate, the affected tail-spend base and the 1% recovery are all ours.",
    },
    effort: "Low",
    weeks: 8,
    tier: "confirmed",
    confidence: "Medium",
    confidenceReason:
      "Anand said duplicates are common. The 8.4% rate is our estimate from the pattern he described, not a system count.",
    requires: [],
    overlapGroupId: "og-spend",
    why: "Suppliers get re-created when a plant cannot find the existing record, typically with a slightly different name or GST entry. Spend then splits across records, so category managers negotiate against understated volumes and the duplicate records slow every match.",
    impact:
      "A one-off cleanse plus a duplicate check at creation. Small money on its own, but it is the reason the ₹2.1 Cr indirect number above cannot currently be verified, which makes it the first thing to do rather than the eighth.",
    hypothesis:
      "This is a small problem holding several larger ones hostage. Nothing in the supplier master is expensive by itself. It is expensive because every question anybody asks about supplier spend has to be answered out of it.",
    stillUnknown: [
      "How many records are genuine duplicates. The estimate comes from the pattern, not from a match run.",
      "Whether a duplicate check exists at creation and is being skipped, or was never configured.",
    ],
    nextSteps: [
      "Run a duplicate match on the vendor master by tax number and bank account.",
      "Do this one first. Three other findings on this list cannot be verified until the master is clean.",
    ],
    metricIds: ["m-dupes"],
    evidence: [
      {
        sourceId: "src-call2",
        locator: "44:51",
        excerpt:
          "\"There are definitely duplicates. Same vendor, two codes, sometimes three. It happens when the plant cannot find them and just creates a new one.\"",
      },
    ],
    ownerId: "sh-rohan",
  },
  {
    id: "g1",
    rank: 9,
    bucketId: "b-pay",
    title: "Invoices are hand-keyed into SAP",
    plainLine: "Nine people retype 96,000 supplier invoices a year into the system by hand.",
    scor: "Source",
    level1: "Accounts payable",
    level2: "Invoice capture",
    nodeId: "l2-invoice-capture",
    amountCr: 0.3,
    valuation: {
      baseLabel: "AP cost base of nine clerks, against a 20% volume rise from Sangli",
      baseCr: 0.59,
      rateLabel: "~1 FTE of hiring avoided, plus rework on keying errors",
      lowCr: 0.15,
      highCr: 0.5,
      kind: "cost",
      basis: "modelled",
      whoseNumbers:
        "The team size and the invoice volume are theirs. The fully loaded clerk cost and the error rate are ours.",
      benchmarkNote:
        "There is no headcount case here. Nine people against 96,000 invoices is 0.94 per 10,000, against a best-in-class 0.9. The value of automating capture is that it makes matching and discount capture possible, not that it removes salary.",
    },
    effort: "Low",
    weeks: 8,
    tier: "confirmed",
    confidence: "High",
    confidenceReason:
      "The process was stated directly by the AP Lead on call 2 and repeated in email. The price is small and modelled. It is an enabler, not a case on its own.",
    requires: [],
    overlapGroupId: "og-p2p",
    why: "Anand described the AP team keying invoices from PDF and paper into SAP, with no scanning or e-invoicing layer. The obvious argument, that this is overstaffed, does not hold. They are at benchmark headcount and two weeks behind at month end, which is what benchmark headcount on a manual process looks like. The money is the hiring avoided when Sangli adds volume, plus rework on keying errors.",
    impact:
      "Sell this as the thing that makes the other three work, not on its own merits. Capture and code invoices automatically, and the matching queue, the cycle time and the discount window all move together.",
    hypothesis:
      "The team is not the problem, and treating them as one is how this conversation goes wrong. Nine people at benchmark headcount, two weeks behind at month end, is what a missing capture layer looks like from the inside.",
    stillUnknown: [
      "The invoice mix between PDF, paper and portal, which decides how much can be captured automatically.",
      "What the Sangli ramp adds in volume, and whether the plan is already to hire for it.",
    ],
    nextSteps: [
      "Ask Anand for invoice volumes by channel and the keying error rate.",
      "Frame this as the enabler for the other three. On its own it is a headcount conversation, which is the wrong one to open with.",
    ],
    metricIds: ["m-ap-fte", "m-touchless", "m-invoice-cycle"],
    evidence: [
      {
        sourceId: "src-call2",
        locator: "14:22",
        excerpt:
          "\"Everything comes in as a PDF on email or as a hard copy from the plant, and the team types it into SAP. There is no scanning.\"",
      },
      {
        sourceId: "src-email",
        locator: "Message 3",
        excerpt:
          "\"AP is nine people and we are still two weeks behind at month end. Volume is up but the process has not changed since 2019.\"",
      },
    ],
    ownerId: "sh-anand",
  },
  {
    id: "g11",
    rank: 10,
    bucketId: "b-move",
    title: "No warehouse module, so goods receipts are posted late",
    plainLine:
      "Deliveries are booked in on paper at all three plants, so the system finds out days after the goods arrived.",
    // Inbound receiving is a Source activity (SCOR sS1.2-1.4), not Deliver. It
    // was filed under Deliver, which hid the causal chain into the match failure
    // above. See AUDIT.md B2.
    scor: "Source",
    level1: "Receiving",
    level2: "Goods receipt posting",
    nodeId: "l2-gr-posting",
    amountCr: 0.3,
    valuation: {
      baseLabel: "Stock write-off and expedite cost from receipts posted days late",
      baseCr: 6,
      rateLabel: "5% of the value in transit-to-posting limbo at any time",
      lowCr: 0.15,
      highCr: 0.6,
      kind: "cost",
      basis: "sector-default",
      whoseNumbers:
        "The missing warehouse module is confirmed from their SAP footprint. The exposure and the rate are both ours.",
    },
    effort: "High",
    weeks: 20,
    tier: "confirmed",
    confidence: "Medium-high",
    confidenceReason:
      "The SAP footprint and the paper process were confirmed on call 2. The cost is entirely modelled.",
    requires: [],
    overlapGroupId: "og-p2p",
    why: "Suvarna runs SAP MM, FI and SD but no warehouse management. Booking in and putaway are paper-based at all three plants, which is the direct cause of the late goods receipts behind the 42% match failure. It is the first link in the chain that ends with a missed discount.",
    impact:
      "Do not sell this on its own merits. Sell it as the fix that makes the matching problem stay fixed. It is the only gap on the list that another gap strictly requires.",
    hypothesis:
      "One missing module is setting the clock for three other findings on this list. The plant knows the goods arrived. The system does not, and everything downstream is working from the system rather than from the plant.",
    stillUnknown: [
      "The actual gap between physical receipt and the posting. Nobody has measured it.",
      "Whether the three plants differ, and whether Sangli is being set up the same way.",
    ],
    nextSteps: [
      "Time the receipt-to-posting gap at one plant for a week.",
      "Sell it as what keeps the matching fix fixed. Alone it is a systems project with no visible return.",
    ],
    metricIds: ["m-ftmr"],
    evidence: [
      {
        sourceId: "src-call2",
        locator: "31:18",
        excerpt:
          "\"We have MM, FI and SD. No WM. The plants do putaway on paper and post the receipt when they get to it.\"",
      },
    ],
    ownerId: "sh-vikram",
  },
  {
    id: "g5",
    rank: 11,
    bucketId: "b-pay",
    title: "Approvals happen on email and WhatsApp with no audit trail",
    plainLine:
      "Purchases get approved in chat messages, so there is no record of who agreed to what.",
    scor: "Source",
    level1: "Purchasing",
    level2: "Requisition and approval",
    nodeId: "l2-requisition",
    amountCr: 0.25,
    valuation: {
      baseLabel: "Rework and dispute handling on off-system approvals",
      baseCr: 5,
      rateLabel: "5% of the value approved outside the system",
      lowCr: 0.1,
      highCr: 0.5,
      kind: "cost",
      basis: "sector-default",
      whoseNumbers:
        "The behaviour is theirs, volunteered twice. Both the exposure and the rate are ours.",
      benchmarkNote:
        "Do not lead with the money. The argument here is that an auditor cannot reconstruct who authorised a purchase, and neither can Suvarna if a supplier disputes one.",
    },
    effort: "Low",
    weeks: 6,
    tier: "confirmed",
    confidence: "High",
    confidenceReason:
      "Described unprompted on both discovery calls. The number is small and modelled; the case is control, not cost.",
    requires: [],
    why: "Approvals above the plant threshold are routed by email and, for anything urgent, WhatsApp. Nothing lands in SAP until after the fact. The direct cost is small; the exposure is not. An auditor cannot reconstruct who authorised a purchase, and neither can Suvarna if a supplier disputes one.",
    impact:
      "Move approvals into the system with mobile sign-off so the urgent path stays fast. Priced conservatively on rework. Take this to Meera as an audit finding, not to Rohan as a saving.",
    hypothesis:
      "The process lost an argument with urgency, and it will lose it again next week. Until the fast path runs inside the system, the record will keep being written after the decision rather than by it.",
    stillUnknown: [
      "How much spend is approved outside the system. Nobody can currently answer that.",
      "Whether the statutory auditor has raised this already, which would change who raises it here.",
    ],
    nextSteps: [
      "Ask Meera whether approvals have come up in an audit observation.",
      "Take it to Finance as an exposure. Taken to Rohan as a saving it reads as an accusation about his team.",
    ],
    metricIds: ["m-pr-po"],
    evidence: [
      {
        sourceId: "src-call1",
        locator: "19:05",
        excerpt:
          "\"If it is urgent, someone WhatsApps me and I say yes. It goes into the system later, or it does not.\"",
      },
      {
        sourceId: "src-email",
        locator: "Message 2",
        excerpt: "\"Approvals live in email and WhatsApp. We know it is not ideal.\"",
      },
    ],
    ownerId: "sh-rohan",
  },
  {
    id: "g12",
    rank: 12,
    bucketId: "b-move",
    title: "No supplier scorecard behind goods-receipt rejections",
    plainLine:
      "Deliveries get rejected on quality, but nobody tracks which suppliers cause it.",
    scor: "Source",
    level1: "Incoming quality",
    level2: "Goods receipt inspection",
    nodeId: "l2-gr-inspection",
    amountCr: null,
    unpricedReason:
      "Rejection volumes have not been shared. Ask for 12 months of rejection data by supplier and this becomes priceable.",
    effort: "Low",
    weeks: 8,
    tier: "unverified",
    confidence: "Low",
    confidenceReason: "One passing remark on call 2. No supporting data of any kind.",
    requires: [],
    why: "Anand mentioned rework at goods receipt in passing. Without rejection volumes there is no basis for a number, and putting one on this would be a guess presented as a finding.",
    impact:
      "Unknown until rejection data is shared. Listed because it is a cheap ask on the next call, not because it is currently a case.",
    hypothesis:
      "Nothing is being concealed here. There is simply nowhere that the same supplier failing twice becomes one fact, so it stays a dozen separate irritations and never turns into a conversation with that supplier.",
    stillUnknown: [
      "Rejection volumes and reasons, which have never been shared.",
      "Whether quality keeps any of this outside SAP, on paper or in a spreadsheet.",
    ],
    nextSteps: [
      "Ask for goods-receipt rejections by supplier for six months. It is a cheap ask on any call.",
      "Leave it unpriced until that arrives. A number here would be a guess wearing a finding's clothes.",
    ],
    metricIds: [],
    evidence: [
      {
        sourceId: "src-call2",
        locator: "49:02",
        excerpt: "\"Sometimes a load gets rejected at the gate and that whole thing has to be redone.\"",
      },
    ],
    ownerId: "sh-rohan",
  },
];

export const gapById = (id: string) => gaps.find((g) => g.id === id)!;
export const gapsByRank = [...gaps].sort((a, b) => a.rank - b.rank);
export const pricedGaps = gaps.filter((g) => g.amountCr !== null);

/* -------------------------------------------------------------------------- */
/* Totals — gross adds, net does not                                           */
/* -------------------------------------------------------------------------- */

const sumOf = (ids: Iterable<string>) =>
  [...ids].reduce((s, id) => s + (gapById(id).amountCr ?? 0), 0);

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Straight sum. What every bucket, tier and stakeholder subtotal ties to. */
export const grossValue = (ids: Iterable<string>) => round2(sumOf(ids));

/**
 * What may actually be claimed for a set of gaps. Any overlap group with two or
 * more members selected is capped, pro rata across the members present.
 */
export function netValue(ids: Iterable<string>): number {
  const set = new Set(ids);
  let total = 0;
  const handled = new Set<string>();

  for (const group of overlapGroups) {
    const present = group.gapIds.filter((id) => set.has(id));
    if (present.length < 2) continue;
    const raw = sumOf(present);
    const groupRaw = sumOf(group.gapIds);
    // Cap scales with how much of the group is selected, so ticking three of
    // four does not get charged the full-group deduction.
    const cap = groupRaw === 0 ? 0 : group.capCr * (raw / groupRaw);
    total += Math.min(raw, cap);
    present.forEach((id) => handled.add(id));
  }

  for (const id of set) {
    if (!handled.has(id)) total += gapById(id).amountCr ?? 0;
  }
  return round2(total);
}

/** What the overlap deduction costs a given selection. */
export const overlapDeduction = (ids: Iterable<string>) =>
  round2(grossValue(ids) - netValue(ids));

/** One-off balance-sheet money. Kept apart from every annual total, always. */
export const oneOffValue = (ids: Iterable<string>) =>
  round2([...ids].reduce((s, id) => s + (gapById(id).valuation?.oneOffCr ?? 0), 0));

const ALL_GAP_IDS = gaps.map((g) => g.id);

/**
 * Gaps in `requires` that a selection has not picked up. The plan builder used
 * to happily quote g4 on its own — a 10-day discount window on a 9.5-day
 * posting cycle, which cannot be delivered.
 */
export function missingPrerequisites(ids: Iterable<string>): { gapId: string; needs: string[] }[] {
  const set = new Set(ids);
  return [...set]
    .map((id) => ({ gapId: id, needs: gapById(id).requires.filter((r) => !set.has(r)) }))
    .filter((r) => r.needs.length > 0);
}

/**
 * Selection split into waves: nothing appears before what it requires.
 * Sequencing is the first question a client asks about a list of twelve fixes.
 */
export function sequenceWaves(ids: Iterable<string>): string[][] {
  const remaining = new Set(ids);
  const waves: string[][] = [];
  const placed = new Set<string>();

  while (remaining.size > 0) {
    const wave = [...remaining].filter((id) =>
      gapById(id).requires.every((r) => placed.has(r) || !remaining.has(r)),
    );
    // A cycle would loop forever; take everything left rather than hang.
    const batch = wave.length > 0 ? wave : [...remaining];
    batch.sort((a, b) => (gapById(b).amountCr ?? 0) - (gapById(a).amountCr ?? 0));
    waves.push(batch);
    batch.forEach((id) => {
      remaining.delete(id);
      placed.add(id);
    });
  }
  return waves;
}

/* -------------------------------------------------------------------------- */
/* Questions — sequenced, and split by who is actually in the room             */
/* -------------------------------------------------------------------------- */

export const questions: Question[] = [
  {
    id: "q1",
    askOrder: 1,
    askWhen: "this-call",
    text: "How long does it take you to get a new supplier trading?",
    targetId: "sh-rohan",
    whyItMatters:
      "It is his number, it is a problem he already admits to, and it opens the conversation on his ground rather than Finance's.",
    badAnswer:
      "\"A few days.\" Then the 21-day figure is stale or applies only to some categories. Stop and find out which.",
    goodAnswer:
      "Anything over two weeks confirms the gap and gives you permission to ask what it stops him doing.",
    linkedGapIds: ["g6"],
  },
  {
    id: "q2",
    askOrder: 2,
    askWhen: "this-call",
    text: "When a plant needs something and the supplier is not set up yet, what actually happens, and roughly how much goes that way in a year?",
    targetId: "sh-rohan",
    whyItMatters:
      "This is where the onboarding delay converts into money, and the ₹25 Cr base under that ₹75 L is currently ours, not his. Getting a number here is what makes the gap real.",
    badAnswer: "\"They wait.\" Then the cost is production disruption, not price. Reprice the gap.",
    goodAnswer:
      "\"They buy from whoever is on the list, maybe twenty, thirty crore of it.\" That is the base and the behaviour, in his own words, without you having asked for either.",
    linkedGapIds: ["g6", "g3"],
  },
  {
    id: "q3",
    askOrder: 3,
    askWhen: "this-call",
    text: "How much of your indirect buying goes through a contracted rate, and where does that figure come from?",
    gloss:
      "Indirect is everything that is not raw material: services, maintenance, packaging consumables, travel.",
    targetId: "sh-rohan",
    whyItMatters:
      "The largest number on the list at ₹2.1 Cr, and the only thing under it is his own guess on a call. Do not present that figure until this is answered.",
    badAnswer:
      "\"Most of it.\" Ask how he knows. If the answer is the duplicate-ridden vendor master, it is not knowable yet, and that is itself the finding.",
    goodAnswer: "Any figure he can source. Even a bad number with a system behind it is progress.",
    linkedGapIds: ["g3", "g9"],
  },
  {
    id: "q4",
    askOrder: 4,
    askWhen: "data-request",
    text: "Could you share twelve months of goods-receipt rejections by supplier, and a spend extract by vendor?",
    targetId: "sh-rohan",
    whyItMatters:
      "Two open items in one ask. The rejections price gap 12; the spend extract is the only thing that turns the ₹2.1 Cr indirect estimate into a number. Ask last. It is a data request, not a discovery question, and it changes the register of the call.",
    badAnswer:
      "Hesitation usually means the data does not exist in a usable form. Note that as a finding in itself.",
    goodAnswer: "A yes converts the biggest and the smallest thing on the list at the same time.",
    linkedGapIds: ["g12", "g3"],
  },
  {
    id: "q5",
    askOrder: 5,
    askWhen: "after-this-call",
    text: "What is your first-time match rate?",
    gloss:
      "The share of invoices that reconcile against the order and the delivery note automatically, with nobody touching them.",
    targetId: "sh-anand",
    whyItMatters:
      "The single most diagnostic number in procure-to-pay. It sets the size of the invoice chain, though not a headcount case: his team is already at benchmark.",
    badAnswer:
      "\"We do not measure that.\" More common than not, and more useful. It means nobody owns the exception queue.",
    goodAnswer:
      "Any figure under 80% opens the conversation. Under 60% and it is the biggest thing on their desk.",
    linkedGapIds: ["g2", "g1"],
  },
  {
    id: "q6",
    askOrder: 6,
    askWhen: "after-this-call",
    text: "When an invoice does not match, who picks it up and how long does it sit?",
    targetId: "sh-anand",
    whyItMatters:
      "Turns a percentage into a person and a delay. This is the detail that makes the number feel real to the CFO later.",
    badAnswer: "\"It gets handled.\" Push once: ask how many are open right now.",
    goodAnswer: "A named queue and an ageing figure. That is the business case, given to you.",
    linkedGapIds: ["g2"],
  },
  {
    id: "q7",
    askOrder: 7,
    askWhen: "after-this-call",
    text: "Are your goods receipts posted at the plant as goods arrive, or later?",
    targetId: "sh-anand",
    whyItMatters:
      "The actual root cause behind the match failures, and the one link that has to hold for the whole invoice chain to be one story rather than four projects.",
    badAnswer:
      "\"As they arrive.\" Then the match failures are a tolerance or master-data problem. Different fix, and the warehouse gap loses its argument.",
    goodAnswer: "\"When they get to it.\" Confirms the chain from paper receiving to the exception queue.",
    linkedGapIds: ["g11", "g2"],
  },
  {
    id: "q8",
    askOrder: 8,
    askWhen: "after-this-call",
    text: "You have early-payment terms on the ingredient contracts. How often do you hit them?",
    targetId: "sh-meera",
    whyItMatters:
      "The cleanest margin argument available and the natural handover point into a CFO conversation.",
    badAnswer:
      "\"We do not track it.\" Fine. The answer is then in the payment data, which is a reasonable thing to ask for.",
    goodAnswer:
      "Any figure under 50% confirms roughly ₹2 Cr of margin sitting in the process. Bring the funding cost up yourself in the same breath.",
    linkedGapIds: ["g4"],
  },
  {
    id: "q9",
    askOrder: 9,
    askWhen: "after-this-call",
    // The question that makes g4 survivable in front of a CFO. Without it we are
    // quoting a gross discount and hoping she does not do the cash arithmetic.
    text: "If we pulled payment forward to hit the 2% discount, what would that do to your working capital line, and what does that money cost you today?",
    targetId: "sh-meera",
    whyItMatters:
      "Capturing the discount ties up roughly ₹12 Cr. We have costed that at 9% because we do not know her real rate. Get it, and the ₹1 Cr net becomes her number instead of ours.",
    badAnswer:
      "\"We would not do that.\" Then the gap is dead and it is better to know now than in a proposal.",
    goodAnswer:
      "Any borrowing rate she will state. Below about 12% the discount is worth taking and you can say so with her arithmetic.",
    linkedGapIds: ["g4"],
  },
  {
    id: "q10",
    askOrder: 10,
    askWhen: "after-this-call",
    text: "What do you pay per tonne-km on your main lanes, and when were those rates last tendered?",
    gloss: "Rate per tonne-km is the comparable number. Freight as a share of revenue is not.",
    targetId: "sh-vikram",
    whyItMatters:
      "The freight gap is the least-evidenced ₹1.6 Cr on the list. Nobody in logistics has been spoken to at all. This question replaces a weak benchmark with a real one.",
    badAnswer:
      "\"We do not measure it that way.\" That is itself the finding: rates that are never compared are never tested.",
    goodAnswer:
      "A rate card and a date. If the last tender is more than two years old, the 5% we have modelled is conservative.",
    linkedGapIds: ["g7"],
  },
  {
    id: "q11",
    askOrder: 11,
    askWhen: "after-this-call",
    // Nobody has asked a single question about Make, and they run three plants.
    // See AUDIT.md C.
    text: "What is your yield loss and giveaway across the three plants, and who watches it?",
    gloss:
      "Giveaway is product handed over above the declared pack weight. Yield loss is material that goes in and does not come out as sellable product.",
    targetId: "sh-vikram",
    whyItMatters:
      "We have not researched Make at all, and for an agri-processor it is usually the largest single line. Half a point of ₹713 Cr of material is ₹3.6 Cr. Everything currently on the list could be the smaller half of the opportunity.",
    badAnswer:
      "\"That sits with the plant heads.\" Then ask for one of them. Do not leave without a route in.",
    goodAnswer:
      "Any yield figure at all. Even a bad one tells you whether this is worth a second engagement.",
    linkedGapIds: [],
  },
];

export const questionById = (id: string) => questions.find((q) => q.id === id)!;
export const questionsWhen = (when: AskWhen) =>
  questions.filter((q) => q.askWhen === when).sort((a, b) => a.askOrder - b.askOrder);

/* -------------------------------------------------------------------------- */
/* Claim ledger — the spine of Direction 3                                     */
/* -------------------------------------------------------------------------- */

export const claims: Claim[] = [
  {
    id: "c1",
    tier: "confirmed",
    statement: "Suvarna turned over ₹1,150 Cr in FY25, up 18% on the prior year.",
    basis: "Stated in the audited FY25 annual report.",
    sourceIds: ["src-ar25"],
    category: "Company",
  },
  {
    id: "c2",
    tier: "confirmed",
    statement: "They run SAP ECC 6.0 with materials, finance and sales live, and no warehouse module.",
    basis: "Confirmed by the AP Lead on discovery call 2.",
    sourceIds: ["src-call2"],
    category: "Systems",
    // Deliberately unlinked. c10 owns g11's price — if two claims both carried
    // it, the ledger's row values would not sum to their tier total.
  },
  {
    id: "c3",
    tier: "confirmed",
    statement: "Invoices are typed into SAP by hand. There is no scanning or e-invoicing.",
    basis: "Described by the AP Lead on call 2 and repeated in the April email thread.",
    sourceIds: ["src-call2", "src-email"],
    category: "Process",
    linkedGapId: "g1",
  },
  {
    id: "c4",
    tier: "confirmed",
    statement: "First-time match rate is 58%. Best-in-class is 90%.",
    basis: "Given directly by the AP Lead on call 2.",
    sourceIds: ["src-call2"],
    category: "Process",
    linkedGapId: "g2",
  },
  {
    id: "c5",
    tier: "confirmed",
    statement: "Onboarding a new supplier takes about 21 days.",
    basis: "Given by the Head of Procurement on call 1 and repeated in email.",
    sourceIds: ["src-call1", "src-email"],
    category: "Process",
    linkedGapId: "g6",
  },
  {
    id: "c6",
    tier: "confirmed",
    statement: "Purchase approvals are given over email and WhatsApp, outside the system.",
    basis: "Volunteered on both discovery calls without being asked.",
    sourceIds: ["src-call1", "src-email"],
    category: "Process",
    linkedGapId: "g5",
  },
  {
    id: "c7",
    tier: "confirmed",
    statement:
      "Early-payment terms of 2/10 net 45 exist on many ingredient contracts and are rarely met.",
    basis:
      "Stated by the Head of Procurement in the April email thread. What capturing them would cost to fund is our arithmetic, not theirs.",
    sourceIds: ["src-email"],
    category: "Commercial",
    linkedGapId: "g4",
  },
  {
    id: "c8",
    tier: "confirmed",
    statement: "Finished goods cover was 38 days at 31 March 2026, up from 35 the year before.",
    basis: "Reported in the FY25 annual report.",
    sourceIds: ["src-ar25"],
    category: "Process",
    linkedGapId: "g8",
  },
  {
    id: "c9",
    tier: "confirmed",
    statement: "Duplicate supplier records exist in the vendor master, created by plants.",
    basis: "Described by the AP Lead on call 2. The rate is not confirmed.",
    sourceIds: ["src-call2"],
    category: "Systems",
    linkedGapId: "g9",
  },
  {
    id: "c10",
    tier: "confirmed",
    statement: "Goods receipts are posted at the plants on paper, after the fact.",
    basis: "Described by the AP Lead on call 2 as the main cause of match failures.",
    sourceIds: ["src-call2"],
    category: "Process",
    linkedGapId: "g11",
  },
  {
    id: "c14",
    // Was "AP is running at 3.4x the headcount needed" — arithmetically impossible
    // against their own stated team size. The corrected reading is a stronger
    // finding than the wrong one was. See AUDIT.md A1.
    tier: "confirmed",
    statement: "AP headcount is already at benchmark for its volume.",
    basis:
      "Arithmetic on two figures they gave us: nine people from the April email, ~96,000 invoices from call 2. That is 0.94 staff per 10,000 invoices against a best-in-class 0.9. There is no headcount saving available in accounts payable, and arriving with one would cost you the room.",
    sourceIds: ["src-call2", "src-email"],
    category: "People",
  },
  {
    id: "c11",
    tier: "inferred",
    statement: "Roughly ₹2.1 Cr a year is lost buying indirect goods outside contracted rates.",
    basis:
      "Built from the Head of Procurement's own estimate that under half of indirect spend is contracted, priced at the low end of the published sector leakage range. The ₹66 Cr indirect line is our estimate too. Nothing here has been checked against their ledger.",
    sourceIds: ["src-call2"],
    category: "Commercial",
    linkedGapId: "g3",
  },
  {
    id: "c12",
    tier: "inferred",
    statement: "Freight is likely tendered to a single carrier per lane rather than competitively.",
    basis:
      "Freight runs 1.4 points of revenue above sector best, and the annual report describes long-standing regional transport relationships. Nobody in logistics has been spoken to, and share-of-revenue is a weak comparator.",
    sourceIds: ["src-ar25"],
    category: "Commercial",
    linkedGapId: "g7",
  },
  {
    id: "c13",
    tier: "inferred",
    statement: "Distributor rebate claims are reconciled manually, leaking 2-4% of scheme value.",
    basis:
      "The scheme structure is described in the annual report. The manual process is inferred from company size and the absence of a claims system in the SAP footprint.",
    sourceIds: ["src-ar25", "src-call2"],
    category: "Commercial",
    linkedGapId: "g10",
  },
  {
    id: "c15",
    tier: "unverified",
    statement: "A new Chief Procurement Officer joined within the last year.",
    basis:
      "Suggested by public hiring signals and a change in tone between call 1 and call 2. Not confirmed by anyone at Suvarna and not in the annual report.",
    sourceIds: [],
    category: "People",
  },
  {
    id: "c16",
    tier: "unverified",
    statement: "Goods-receipt quality rejections cause meaningful rework.",
    basis: "One passing remark on call 2. No volumes, no cost, no supplier breakdown.",
    sourceIds: ["src-call2"],
    category: "Process",
    linkedGapId: "g12",
  },
  {
    id: "c17",
    tier: "unverified",
    statement:
      "The Sangli plant expansion announced in FY25 will add roughly 20% to procurement volume.",
    basis:
      "The expansion is in the annual report. The 20% volume figure is our own estimate from stated capacity, and has not been tested with anyone. It is doing real work in the model. The invoice-chain gaps are priced on hiring avoided against this growth.",
    sourceIds: ["src-ar25"],
    category: "Company",
  },
  {
    id: "c18",
    tier: "unverified",
    statement: "Finance, not procurement, holds the budget for process automation.",
    basis:
      "Assumed from the reporting line implied on call 2. This determines who the proposal is addressed to, so it is worth asking about directly.",
    sourceIds: [],
    category: "People",
  },
  {
    id: "c19",
    tier: "unverified",
    // Coverage stated as a claim, so it travels with everything else rather than
    // living only in a footnote. See AUDIT.md C.
    statement:
      "Nothing is known about how the three plants run. Yield and giveaway have never been discussed.",
    basis:
      "Eleven of twelve gaps sit in Source. For an agri-processor, half a point of yield on ₹713 Cr of material is ₹3.6 Cr, potentially larger than everything on this list. Its absence is a coverage limit, not a finding that the plants are fine.",
    sourceIds: [],
    category: "Process",
  },
];

export const claimsByTier = (tier: Tier) => claims.filter((c) => c.tier === tier);

/* -------------------------------------------------------------------------- */
/* Call beats — the spine of Direction 2                                       */
/* -------------------------------------------------------------------------- */

export const callBeats: CallBeat[] = [
  {
    id: "beat-open",
    phase: "Open",
    minutes: "0-3 min",
    intent: "Show you did the work, without presenting.",
    lines: [
      {
        label: "Say this",
        body: "You have grown 18% to ₹1,150 Cr on a procurement process that has not changed since 2019. I wanted to understand what that is costing you before I suggested anything.",
        detail:
          "Both halves are from their own material: the growth from the FY25 report, the 2019 line from Rohan's email. Quoting his sentence back is what buys the next twenty minutes.",
      },
      {
        label: "Do not say",
        body: "Anything with a rupee figure attached. The ₹9.1 Cr lands at minute 20, not minute 2.",
      },
    ],
  },
  {
    id: "beat-establish",
    phase: "Establish",
    minutes: "3-8 min",
    intent: "Two facts that prove you understand their operation specifically.",
    lines: [
      {
        label: "Fact one",
        body: "You run SAP MM, FI and SD across three plants, with no warehouse module, so receipts get booked in on paper and reach the system days later.",
        detail:
          "Confirmed on call 2. Naming the module gap and its downstream effect in one sentence is what separates you from a generic pitch.",
      },
      {
        label: "Fact two",
        body: "Sixty-one percent of your spend sits with forty suppliers, but you have around 2,400 active vendor records.",
        detail:
          "The tension between those two numbers is the whole indirect-spend conversation, set up without asserting anything.",
      },
    ],
  },
  {
    id: "beat-probe",
    phase: "Probe",
    minutes: "8-20 min",
    intent: "Three questions for the room, then the data ask. The rest need other people.",
    lines: [],
  },
  {
    id: "beat-land",
    phase: "Land",
    minutes: "20-27 min",
    intent: "Name two gaps out loud, priced. Not twelve.",
    lines: [
      {
        label: "Gap to name first",
        body: "Three weeks to onboard a supplier means plants buy at spot. Call it ₹75 L a year, and it is the one that stops your lines.",
        detail:
          "His number, handed back with a cost attached, on his function rather than Finance's. Ask him for the spend that goes that way. The base under it is currently ours.",
      },
      {
        label: "Gap to name second",
        body: "Invoices are keyed by hand at a 58% match rate, and it starts with receipts booked in on paper. Across capture, matching, receiving and the discounts you are missing, about ₹1.9 Cr a year, after taking out the double count between them.",
        detail:
          "Four gaps presented as one problem, because they are one problem. Saying the double count out loud before he finds it is worth more than the ₹40 L it costs you. Do not bring a headcount argument: nine people on 96,000 invoices is benchmark, and Anand knows it.",
      },
      {
        label: "Hold back",
        body: "The ₹2.1 Cr indirect number. It is our largest estimate, the base and the rate are both ours, and question 3 exists to fix that. If he pushes on it and it does not hold, the other figures lose credibility too.",
      },
    ],
  },
  {
    id: "beat-next",
    phase: "Next",
    minutes: "27-30 min",
    intent: "Leave with one commitment and one data request.",
    lines: [
      {
        label: "Ask for",
        body: "A spend extract by vendor, twelve months of goods-receipt rejections, and a half hour with whoever owns payment terms.",
        detail:
          "The extract is the only thing that converts the ₹2.1 Cr estimate. The rejections price gap 12. The second meeting is the route to Meera Iyer, who has not been met and who holds the budget.",
      },
      {
        label: "Offer",
        body: "A costed view of the invoice chain within two weeks of getting the data, with the working shown, including what the discount capture costs to fund.",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Derived                                                                     */
/* -------------------------------------------------------------------------- */

export const bucketTotal = (bucketId: string) =>
  grossValue(buckets.find((b) => b.id === bucketId)!.gapIds);

export const tierCounts = {
  confirmed: claimsByTier("confirmed").length,
  inferred: claimsByTier("inferred").length,
  unverified: claimsByTier("unverified").length,
};

/** Money resting on each tier of observation. */
export const tierValue = (tier: Tier) => grossValue(gaps.filter((g) => g.tier === tier).map((g) => g.id));

/** Money resting on each kind of price. Zero is measured — that is the point. */
export const basisValue = (basis: ValuationBasis) =>
  grossValue(gaps.filter((g) => g.valuation?.basis === basis).map((g) => g.id));

export const basisCounts = {
  measured: gaps.filter((g) => g.valuation?.basis === "measured").length,
  modelled: gaps.filter((g) => g.valuation?.basis === "modelled").length,
  "sector-default": gaps.filter((g) => g.valuation?.basis === "sector-default").length,
};

export const gapsForStakeholder = (id: string) => gaps.filter((g) => g.ownerId === id);
export const questionsForStakeholder = (id: string) =>
  questions.filter((q) => q.targetId === id).sort((a, b) => a.askOrder - b.askOrder);
export const valueForStakeholder = (id: string) =>
  grossValue(gapsForStakeholder(id).map((g) => g.id));
export const netValueForStakeholder = (id: string) =>
  netValue(gapsForStakeholder(id).map((g) => g.id));

/** Gaps grouped by SCOR stage, for the coverage strip. */
export const gapsByStage = (stage: ScorStage) => gaps.filter((g) => g.scor === stage);

export const allGapIds = ALL_GAP_IDS;

/* -------------------------------------------------------------------------- */
/* Timing — why now, and what is pushing against it                            */
/*                                                                             */
/* Direction 3. Everything else in this file answers "what is wrong and what is */
/* it worth". None of it answers the question that decides whether a deal moves */
/* this quarter or next year, which a consultant is asked on every call and     */
/* currently has to answer from memory: why now.                                */
/*                                                                             */
/* A signal is not a finding. It carries no rupee figure and never will — the   */
/* money is in Gaps, and a timing signal that quoted one would be a fourth      */
/* place the same total appears. What it carries is a direction: does this push */
/* the decision towards now, or away from it.                                   */
/* -------------------------------------------------------------------------- */

/** Which way a signal pushes the decision. Two of these are not good news. */
export type SignalPush = "accelerates" | "delays" | "neutral";

export interface TimingSignal {
  id: string;
  /** The row label. "Leadership changes". */
  label: string;
  /** The reading, short enough for a two-column row. "2 signals", "Mar FY-end". */
  value: string;
  push: SignalPush;
  /** What it means for the pitch, in one line Aryan could say out loud. */
  soWhat: string;
  /** The signals behind the count. Never a bare number: this is the base. */
  items: { text: string; sourceId: string }[];
}

export const timingSignals: TimingSignal[] = [
  {
    id: "t-leadership",
    label: "Leadership changes",
    value: "2 signals",
    push: "accelerates",
    soWhat:
      "A new head of function has about three quarters to name what is broken before it becomes his. That window is open now.",
    items: [
      {
        text: "Rohan Deshpande took Head of Procurement in January 2026. He is the budget holder and he is nine months in.",
        sourceId: "src-call1",
      },
      {
        text: "Vikram Rao joined as VP Supply Chain in 2025, so both of the functions this touches have new owners.",
        sourceId: "src-web",
      },
    ],
  },
  {
    id: "t-commitments",
    label: "Public commitments",
    value: "3 signals",
    push: "accelerates",
    soWhat:
      "Three things they have said in public that this work makes easier. Quoting their own commitment back is what turns a cost case into their case.",
    items: [
      {
        text: "The Sangli expansion, announced in FY25, adds roughly 20% to procurement volume on the same nine-person AP team.",
        sourceId: "src-ar25",
      },
      {
        text: "The FY25 report names working capital as a board priority, and 38 days of finished goods is where it is sitting.",
        sourceId: "src-ar25",
      },
      {
        text: "A stated intent to modernise the ERP estate, with no date attached to it yet.",
        sourceId: "src-ar25",
      },
    ],
  },
  {
    id: "t-hiring",
    label: "Hiring signals",
    value: "1 signal",
    push: "accelerates",
    soWhat:
      "They are already trying to solve part of this with a hire. A hire is twelve months to competence; this is not.",
    items: [
      {
        text: "An open role for a procurement systems analyst, posted twice since May and still open.",
        sourceId: "src-web",
      },
    ],
  },
  {
    id: "t-budget",
    label: "Budget cycle",
    value: "Mar FY-end",
    push: "delays",
    soWhat:
      "The Indian financial year ends in March and next year's numbers are argued in January. After February this becomes an FY28 conversation.",
    items: [
      {
        text: "FY25 accounts run to 31 March, so the planning cycle that decides new spend closes around February.",
        sourceId: "src-ar25",
      },
    ],
  },
  {
    id: "t-system",
    label: "System events",
    value: "S/4 move due",
    push: "accelerates",
    soWhat:
      "An ERP migration is the one moment a business will reopen a process it has run untouched for years. Being in the room before it is scoped is worth more than being right after.",
    items: [
      {
        text: "They run SAP ECC 6.0. Mainstream maintenance for ECC ends in 2027, so an S/4 decision is due whether or not it has been made.",
        sourceId: "src-ar25",
      },
      {
        text: "There is no warehouse module today, so whatever replaces ECC has to decide about goods receipt anyway.",
        sourceId: "src-call2",
      },
    ],
  },
  {
    id: "t-competing",
    label: "Competing priorities",
    value: "2 found",
    push: "delays",
    soWhat:
      "Two things already have the board's attention and the same money. Neither is a reason to wait, but both are what you will be argued against.",
    items: [
      {
        text: "Capex for the Sangli plant, which is committed and running.",
        sourceId: "src-ar25",
      },
      {
        text: "The S/4 migration itself, which will absorb the digital team for most of a year.",
        sourceId: "src-web",
      },
    ],
  },
];

export const timingSignalById = (id: string) => timingSignals.find((s) => s.id === id)!;

export const signalCounts = {
  accelerates: timingSignals.filter((s) => s.push === "accelerates").length,
  delays: timingSignals.filter((s) => s.push === "delays").length,
  neutral: timingSignals.filter((s) => s.push === "neutral").length,
};

/**
 * The verdict, and what it is a verdict on.
 *
 * A one-word answer with no working shown is the thing this product is not
 * allowed to do, so the reasoning and the thing that would change it both
 * travel with it.
 */
export const urgency = {
  verdict: "Strong",
  because:
    "Four of the six signals push towards now, and the two strongest are structural rather than moods: a budget holder nine months into the job, and an ERP decision that has to be made before 2027.",
  against:
    "The March year end is real. Nothing here survives being raised in April, which is what makes the window a window.",
  window: "Now to February 2027",
};

/* -------------------------------------------------------------------------- */
/* Risk — what could kill this, and what to say when it comes up               */
/*                                                                             */
/* Direction 4, and it has one rule the others do not: EVERY RISK CARRIES A     */
/* COUNTER. `counter` is not optional in the type, and `check:data` fails the   */
/* build on an empty one.                                                       */
/*                                                                             */
/* The reason is the user this product is for. Aryan is minutes from a call and */
/* not a domain expert. A list of six things that could go wrong, with no line  */
/* to say when any of them is raised, does not prepare him — it frightens him,  */
/* and a frightened consultant avoids the subject, which is exactly how an      */
/* incumbent vendor or a dead 2019 project ends up deciding the deal off-screen.*/
/* A risk with a counter is ammunition. A risk without one is a reason to stay  */
/* quiet.                                                                       */
/* -------------------------------------------------------------------------- */

export type RiskSeverity = "high" | "medium" | "low";

export interface DealRisk {
  id: string;
  /** The row label. "Incumbent vendors". */
  label: string;
  /** The reading. "TCS, on SAP AMS". */
  value: string;
  severity: RiskSeverity;
  /** What could go wrong, stated plainly and without softening. */
  risk: string;
  /**
   * The line to say when it comes up. Required, never empty.
   *
   * Written as speech, in the second person, because it is read seconds before
   * being said out loud. A counter phrased as advice ("position the offering as
   * complementary") has to be translated under pressure, which is when it will
   * not be.
   */
  counter: string;
  /** Who raises it, so Aryan knows whose objection he is answering. */
  raisedBy: string;
  sourceIds: string[];
}

export const dealRisks: DealRisk[] = [
  {
    id: "r-incumbent",
    label: "Incumbent vendors",
    value: "TCS, on SAP AMS",
    severity: "high",
    risk: "TCS holds the SAP application management contract. Anything that touches the procurement stack reads to them as encroachment, and they have the relationship and the room to say so first.",
    counter:
      "We are not replacing them. We sit on top of SAP, and everything we do lands as configuration and process inside the estate they already run.",
    raisedBy: "Rohan Deshpande, or TCS before him",
    sourceIds: ["src-call2"],
  },
  {
    id: "r-past-failure",
    label: "Past failed projects",
    value: "1 found",
    severity: "high",
    risk: "The process has not changed since 2019, in Rohan's own words. Something was tried and did not land, and anyone who was there will assume this ends the same way.",
    counter:
      "Ask what was tried in 2019 and why it stopped. Then say the first phase needs no new module and no plant downtime, which is usually what stopped the last one.",
    raisedBy: "Anyone who has been there more than five years",
    sourceIds: ["src-email"],
  },
  {
    id: "r-budget-timing",
    label: "Budget timing",
    value: "FY ends Mar",
    severity: "medium",
    risk: "New spend is argued in January and locked by February. Raised in April, this is a conversation about FY28.",
    counter:
      "The first phase sits inside the authority Rohan already holds, so it does not need a new budget line. The number that needs one is the phase after it, and by then it has evidence behind it.",
    raisedBy: "Meera Iyer",
    sourceIds: ["src-ar25"],
  },
  {
    id: "r-in-house",
    label: "In-house capability",
    value: "Digital team of ~12",
    severity: "medium",
    risk: "Twelve people is enough to make a credible case that this should be built internally, and it is the cheapest thing for a CFO to say.",
    counter:
      "Those twelve already own the S/4 move. This is the work that would otherwise sit in the queue behind it, and the queue is where the ₹9.1 Cr a year is being spent.",
    raisedBy: "Meera Iyer",
    sourceIds: ["src-web"],
  },
  {
    id: "r-competing",
    label: "Competing priorities",
    value: "New plant capex",
    severity: "medium",
    risk: "The Sangli expansion is committed and visible. Anything arriving beside it is competing with a project that already has a board sponsor.",
    counter:
      "This is opex against a cash release, not capex against capex. And the new plant is the reason the invoice volume grows 20% on the same nine people, so it is the argument rather than the obstacle.",
    raisedBy: "Meera Iyer, or the board through her",
    sourceIds: ["src-ar25"],
  },
  {
    id: "r-political",
    label: "Political risk",
    value: "CPO is new",
    severity: "high",
    risk: "Rohan is nine months into the job. A finding presented as a failure is heard either as an audit of his predecessor, which is awkward, or of him, which is fatal.",
    counter:
      "None of this is his. He inherited a process that has not changed since 2019, and naming it inside his first year is the strongest thing he can take to the board.",
    raisedBy: "Nobody. It goes wrong silently, which is what makes it the dangerous one.",
    sourceIds: ["src-call1"],
  },
];

export const riskById = (id: string) => dealRisks.find((r) => r.id === id)!;

export const riskCounts = {
  high: dealRisks.filter((r) => r.severity === "high").length,
  medium: dealRisks.filter((r) => r.severity === "medium").length,
  low: dealRisks.filter((r) => r.severity === "low").length,
};

/* -------------------------------------------------------------------------- */
/* The system estate — what they run, and where the work falls out of it       */
/*                                                                             */
/* The axis of the Tech direction. Every other direction sorts the finding set  */
/* by something about the *deal* — its money, its timing, its exposure, its     */
/* people. This one sorts it by the machine underneath, which is the question   */
/* nothing else answers and the one a vendor selling automation onto SAP has to */
/* answer before it can scope anything.                                         */
/*                                                                             */
/* THE SHAPE IS THE FINDING, and it is not invented: three modules live, three  */
/* processes running outside any system, three systems never bought. Six of the */
/* twelve gaps sit inside software they already own and six sit in the space    */
/* between. That split is the pitch.                                            */
/*                                                                             */
/* **Every gap belongs to exactly one system**, and `check:data` enforces both  */
/* halves of that — no gap missing, none counted twice. A gap can plausibly be  */
/* argued onto two systems (a match failure runs in FI and is *caused* by the   */
/* missing warehouse module), so the rule is: file it where the work actually   */
/* lands on a person. That keeps the subtotals addable, which is what lets them  */
/* be reconciled against the same ₹9.68 Cr every other direction ties to.        */
/* -------------------------------------------------------------------------- */

/**
 * Not health, and never coloured like it.
 *
 * `live` / `workaround` / `missing` is a statement about the software estate,
 * not about how well the company is running, and Operations already owns hue
 * for the second thing. This axis is carried by a mark and a word.
 */
export type SystemState = "live" | "workaround" | "missing";

export interface TechSystem {
  id: string;
  /** What it is called, as the client would say it. */
  name: string;
  /** What it is for, in one plain-language line. Aryan is not an expert. */
  does: string;
  state: SystemState;
  /**
   * Where the work goes when the system does not do it. Required on
   * `workaround` and `missing`, and `check:data` fails an empty one: a system
   * marked absent with no line saying who absorbs it is a row that raises a
   * problem and names no owner, which is the same failure the counter rule on
   * `DealRisk` exists to prevent.
   */
  fallsTo?: string;
  /** The findings that sit here. Each gap appears under exactly one system. */
  gapIds: string[];
  sourceIds: string[];
}

export const techSystems: TechSystem[] = [
  {
    id: "sys-mm",
    name: "SAP MM",
    does: "Buying: purchase orders, goods receipts and the supplier master.",
    state: "live",
    gapIds: ["g6", "g9", "g12"],
    sourceIds: ["src-call2", "src-ar25"],
  },
  {
    id: "sys-fi",
    name: "SAP FI",
    does: "Paying: invoices, matching and the payment run.",
    state: "live",
    gapIds: ["g2", "g4"],
    sourceIds: ["src-call2", "src-email"],
  },
  {
    id: "sys-sd",
    name: "SAP SD",
    does: "Selling: orders out, distributors and rebate schemes.",
    state: "live",
    gapIds: ["g10"],
    sourceIds: ["src-call2", "src-ar25"],
  },
  {
    id: "sys-approvals",
    name: "Purchase approvals",
    does: "Signing off a purchase above the plant threshold.",
    state: "workaround",
    fallsTo: "Email, and WhatsApp when it is urgent. The record is written after the decision, or not at all.",
    gapIds: ["g5"],
    sourceIds: ["src-call1", "src-email"],
  },
  {
    id: "sys-planning",
    name: "Demand planning",
    does: "Deciding how much to make and how much to hold.",
    state: "workaround",
    fallsTo: "One spreadsheet, maintained by the planning team. It is why stock cover runs at 38 days.",
    gapIds: ["g8"],
    sourceIds: ["src-ar25"],
  },
  {
    id: "sys-freight",
    name: "Freight tendering",
    does: "Getting a lorry for a load that needs to move.",
    state: "workaround",
    fallsTo: "Phone and email, one carrier per lane. Nothing compares a rate against the last one.",
    gapIds: ["g7"],
    sourceIds: ["src-ar25"],
  },
  {
    id: "sys-wm",
    name: "Warehouse management",
    does: "Booking goods in and telling the rest of SAP they arrived.",
    state: "missing",
    fallsTo:
      "Paper, at all three plants. The receipt is posted whenever somebody gets to it, which sets the clock on the match failure.",
    gapIds: ["g11"],
    sourceIds: ["src-call2"],
  },
  {
    id: "sys-capture",
    name: "Invoice capture",
    does: "Reading a supplier invoice so nobody has to type it.",
    state: "missing",
    fallsTo: "Nine people in AP, keying about 96,000 invoices a year from PDF and paper.",
    gapIds: ["g1"],
    sourceIds: ["src-call2", "src-email"],
  },
  {
    id: "sys-spend",
    name: "Spend analytics",
    does: "Showing what was bought, from whom, and against which contract.",
    state: "missing",
    fallsTo:
      "Nobody at all, which is why no price on this list is measured from their own data.",
    gapIds: ["g3"],
    sourceIds: ["src-call2", "src-email"],
  },
];

export const systemById = (id: string) => techSystems.find((s) => s.id === id)!;

/** What the findings on one system are worth a year. Unpriced gaps count zero. */
export const valueForSystem = (id: string) =>
  Math.round(
    systemById(id).gapIds.reduce((s, g) => s + (gapById(g).amountCr ?? 0), 0) * 100,
  ) / 100;

/** The same, for a whole state — the three-line summary the direction opens on. */
export const valueForSystemState = (state: SystemState) =>
  Math.round(
    techSystems
      .filter((s) => s.state === state)
      .reduce((sum, s) => sum + valueForSystem(s.id), 0) * 100,
  ) / 100;

export const systemsByState = (state: SystemState) =>
  techSystems.filter((s) => s.state === state);

/**
 * Inside software they already own, against outside it.
 *
 * The headline of the direction, derived rather than written: a sentence
 * claiming "half and half" goes stale the first time a gap moves.
 */
export const systemSplit = {
  insideGaps: systemsByState("live").reduce((n, s) => n + s.gapIds.length, 0),
  outsideGaps:
    systemsByState("workaround").reduce((n, s) => n + s.gapIds.length, 0) +
    systemsByState("missing").reduce((n, s) => n + s.gapIds.length, 0),
  insideValue: valueForSystemState("live"),
  outsideValue:
    Math.round((valueForSystemState("workaround") + valueForSystemState("missing")) * 100) / 100,
};

/**
 * Suvarna Agro Foods — the worked example behind all four Research directions.
 *
 * Fictional company, realistic shape: ₹1,150 Cr revenue, ₹14.7 Cr leakage,
 * medium-high confidence, 12 gaps (11 priced, 1 not), 4 sources.
 *
 * Every claim in here carries its provenance, because nothing in Meridian
 * should be unattributable. If a number appears on a screen without a route
 * back to a source in this file, that screen has a bug.
 */

export type Tier = "confirmed" | "inferred" | "unverified";
export type Effort = "Low" | "Medium" | "High";
export type SourceKind = "filing" | "transcript" | "email" | "web";
export type ConfidenceLevel = "Low" | "Medium" | "Medium-high" | "High";

export interface Source {
  id: string;
  name: string;
  kind: SourceKind;
  date: string;
  detail: string;
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
}

export interface Gap {
  id: string;
  rank: number;
  bucketId: string;
  /** Domain-accurate title. */
  title: string;
  /** The version Aryan can say out loud without knowing the domain. */
  plainLine: string;
  level2: string;
  amountCr: number | null;
  /** Present only when amountCr is null. Never render a null price as ₹0. */
  unpricedReason?: string;
  effort: Effort;
  weeks: number;
  tier: Tier;
  confidence: ConfidenceLevel;
  confidenceReason: string;
  why: string;
  impact: string;
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

export interface Question {
  id: string;
  askOrder: number;
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
/* Company                                                                     */
/* -------------------------------------------------------------------------- */

export const company = {
  name: "Suvarna Agro Foods",
  sector: "Agri-processing and packaged foods",
  revenueCr: 1150,
  leakageCr: 14.7,
  confidence: "Medium-high" as ConfidenceLevel,
  confidenceReason:
    "Based on the FY25 annual report, 2 discovery calls, and one email thread from the Head of Procurement. No ERP data has been shared yet.",
  researchedOn: "6 August 2026",
  /** The single sentence Aryan says first. */
  thesis:
    "Suvarna has scaled to ₹1,150 Cr on a procurement process that is still run on email, spreadsheets and manual data entry — and it is costing them roughly ₹14.7 Cr a year.",
  facts: [
    { label: "Revenue", value: "₹1,150 Cr", detail: "FY25, up 18% on FY24" },
    { label: "Plants", value: "3", detail: "Sangli, Nashik, Hubli" },
    { label: "ERP", value: "SAP ECC 6.0", detail: "MM, FI and SD live. No warehouse module." },
    { label: "Active suppliers", value: "~2,400", detail: "61% of spend sits with the top 40" },
    { label: "Headcount", value: "~4,200", detail: "AP team of 9" },
    { label: "Invoices a year", value: "~96,000", detail: "Roughly 8,000 a month" },
  ],
};

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
  },
  {
    id: "m-contracted",
    label: "Indirect spend under contract",
    gloss:
      "Non-production buying — services, MRO, travel — bought at a negotiated rate rather than ad hoc.",
    actual: 47,
    bestInClass: 85,
    unit: "%",
    betterWhen: "higher",
    sourceIds: ["src-call2"],
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
  },
  {
    id: "m-ap-fte",
    label: "AP staff per 10,000 invoices",
    gloss: "How many people it takes to process the paperwork. Lower means more of it is automated.",
    actual: 3.1,
    bestInClass: 0.9,
    unit: "",
    betterWhen: "lower",
    sourceIds: ["src-call2"],
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
      "You told us onboarding a new supplier takes about three weeks. That is the number we would go after first — it is the one that stops your plants.",
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
      "Do not present process elegance. She buys cash released and audit exposure closed, in that order.",
    openingLine:
      "Suvarna is collecting early-payment discounts on about one invoice in eight. Best-in-class is seven in ten. That gap alone is ₹1.6 Cr a year of pure cash.",
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
      "You are carrying 38 days of finished goods against a sector best of 22. On your revenue that difference is worth about ₹95 L a year in working capital.",
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
      "Do not describe the work as low value. His team absorbs the failure of every upstream process and he knows it.",
    openingLine:
      "Your team is clearing 96,000 invoices a year by hand at a 58% first-time match rate. Nine people is not the problem — the 42% that fall out is.",
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
/* Gaps — 12, ranked by annual value. One deliberately unpriced.               */
/* -------------------------------------------------------------------------- */

export const gaps: Gap[] = [
  {
    id: "g1",
    rank: 1,
    bucketId: "b-pay",
    title: "Invoices are hand-keyed into SAP",
    plainLine: "Nine people retype 96,000 supplier invoices a year into the system by hand.",
    level2: "Accounts Payable → Invoice capture",
    amountCr: 3.2,
    effort: "Low",
    weeks: 8,
    tier: "confirmed",
    confidence: "High",
    confidenceReason: "Stated directly by the AP Lead on discovery call 2 and repeated in email.",
    why: "Anand described the AP team keying invoices from PDF and paper into SAP with no scanning or e-invoicing layer. At roughly 96,000 invoices a year and 3.1 AP staff per 10,000 invoices, Suvarna runs about 3.4× the headcount a comparable automated operation needs. The cost is the salary load plus the error rate that feeds the matching failures below.",
    impact: "Capture and code invoices automatically. Expect first-time match to rise as keying errors disappear, and AP headcount to be redeployed rather than added to as volume grows.",
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
    id: "g2",
    rank: 2,
    bucketId: "b-pay",
    title: "Three-way match fails on 42% of invoices",
    plainLine:
      "Four invoices in ten do not line up with the order and the delivery note, so someone has to chase each one.",
    level2: "Accounts Payable → Three-way match",
    amountCr: 2.6,
    effort: "Medium",
    weeks: 14,
    tier: "confirmed",
    confidence: "High",
    confidenceReason: "The 58% figure was given by the AP Lead on call 2 and is consistent with the cycle time.",
    why: "A three-way match reconciles the purchase order, the goods receipt and the invoice before payment goes out. At Suvarna only 58% pass on the first attempt against a best-in-class 90%. Anand attributed most failures to goods receipts being posted late by the plants, which means the invoice arrives before the system believes the goods did.",
    impact: "Fixing goods-receipt timing and tolerance rules is the cheapest half of this. Expect the exception queue to fall by roughly two thirds and invoice cycle time to drop from 9.5 days towards 3.",
    metricIds: ["m-ftmr", "m-invoice-cycle"],
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
    id: "g3",
    rank: 3,
    bucketId: "b-buy",
    title: "Indirect spend bought outside negotiated rates",
    plainLine:
      "More than half of non-production buying happens outside agreed pricing, so Suvarna pays list price.",
    level2: "Sourcing → Indirect category management",
    amountCr: 2.1,
    effort: "Medium",
    weeks: 16,
    tier: "inferred",
    confidence: "Medium",
    confidenceReason:
      "The 47% figure is Rohan's own estimate on call 2, not a system report. The value is modelled from sector leakage rates, not from Suvarna's ledger.",
    why: "Rohan estimated that under half of indirect spend runs through contracted rates. Buying outside the official process — maverick buying — loses the negotiated discount and the volume leverage that produced it. We have modelled the loss at 6% of the uncontracted portion, which is the low end of the published range for food processing.",
    impact: "Catalogue the top 12 indirect categories and route them through contracted suppliers. This is the largest single number that has not been verified against their data.",
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
    id: "g4",
    rank: 4,
    bucketId: "b-pay",
    title: "Early-payment discounts are going uncollected",
    plainLine:
      "Suppliers offer money off for paying early. Suvarna collects it on about one invoice in eight.",
    level2: "Accounts Payable → Payment scheduling",
    amountCr: 1.6,
    effort: "Low",
    weeks: 6,
    tier: "confirmed",
    confidence: "Medium-high",
    confidenceReason:
      "The 12% capture rate came from Rohan's email. The rupee value depends on how many invoices carry discount terms, which has not been confirmed.",
    why: "Discount terms exist on a large share of Suvarna's supplier contracts, but because invoices take 9.5 days to post, most of them miss the discount window before anyone can act. This is not a negotiation problem — the terms are already agreed. It is a speed problem.",
    impact: "Every day cut from invoice cycle time converts directly into discount capture. This gap resolves largely as a side effect of fixing gaps 1 and 2, which makes it the cheapest money on the list.",
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
    id: "g5",
    rank: 8,
    bucketId: "b-pay",
    title: "Approvals happen on email and WhatsApp with no audit trail",
    plainLine:
      "Purchases get approved in chat messages, so there is no record of who agreed to what.",
    level2: "Procure-to-Pay → Approval workflow",
    amountCr: 0.5,
    effort: "Low",
    weeks: 6,
    tier: "confirmed",
    confidence: "High",
    confidenceReason: "Described unprompted on both discovery calls.",
    why: "Approvals above the plant threshold are routed by email and, for anything urgent, WhatsApp. Nothing lands in SAP until after the fact. The direct cost is small; the exposure is not. An auditor cannot reconstruct who authorised a purchase, and neither can Suvarna if a supplier disputes one.",
    impact: "Move approvals into the system with mobile sign-off so the urgent path stays fast. Priced conservatively on rework and dispute handling — the real argument here is control, not cost.",
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
    id: "g6",
    rank: 5,
    bucketId: "b-buy",
    title: "Vendor onboarding takes 21 days",
    plainLine:
      "Setting up a new supplier takes three weeks, so plants buy at spot prices while they wait.",
    level2: "Sourcing → Vendor onboarding",
    amountCr: 1.2,
    effort: "Medium",
    weeks: 12,
    tier: "confirmed",
    confidence: "Medium-high",
    confidenceReason:
      "The 21-day figure is Rohan's, given twice. The knock-on cost is modelled from the spot-buy behaviour he described, not measured.",
    why: "Onboarding runs sequentially through procurement, finance, quality and legal, with documents chased over email. Three weeks is long enough that plants under pressure buy from an already-approved supplier at a worse rate, or raise an emergency purchase. Rohan described both happening in the cane and packaging categories.",
    impact: "Run the checks in parallel with a single intake form. Getting to a week releases the spot-buy premium and shortens every sourcing exercise downstream.",
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
    id: "g7",
    rank: 6,
    bucketId: "b-move",
    title: "Freight is tendered manually, one carrier per lane",
    plainLine:
      "Transport is booked by phone and email with a single hauler per route, so rates are never tested.",
    level2: "Deliver → Freight procurement",
    amountCr: 1.1,
    effort: "Medium",
    weeks: 14,
    tier: "inferred",
    confidence: "Medium",
    confidenceReason:
      "Freight cost as a share of revenue comes from the FY25 report. The single-carrier structure is inferred from the report's logistics commentary, not confirmed by anyone at Suvarna.",
    why: "Freight runs at 4.6% of revenue against a sector best of 3.2%. The annual report describes long-standing regional transport relationships, which usually means rates are renewed rather than tested. We have not spoken to anyone in logistics, so the mechanism here is an inference from the cost position, not an observation.",
    impact: "Competitive lane tendering typically returns 8-12% on the tendered portion. Confirm the single-carrier assumption before this number is used in front of the client.",
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
    id: "g8",
    rank: 7,
    bucketId: "b-move",
    title: "Planning runs on spreadsheets, so stock cover runs high",
    plainLine:
      "Demand planning is done in Excel, so the warehouses carry 16 more days of stock than they need to.",
    level2: "Plan → Sales and operations planning",
    amountCr: 0.95,
    effort: "High",
    weeks: 24,
    tier: "confirmed",
    confidence: "Medium-high",
    confidenceReason: "Stock cover is from the FY25 report. The spreadsheet planning process is stated in the same report.",
    why: "Finished goods cover sits at 38 days against a sector best of 22. The FY25 report describes a monthly planning cycle maintained in spreadsheets. Excess cover is the normal consequence — without a live picture, planners buffer, and the buffer never comes back down.",
    impact: "Working capital released, not cost saved. Meera will care about this framing; Vikram may not. Note that he owns the spreadsheet.",
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
    id: "g9",
    rank: 10,
    bucketId: "b-buy",
    title: "Duplicate supplier records in SAP",
    plainLine:
      "The same supplier is entered several times, so nobody can see how much Suvarna really spends with them.",
    level2: "Sourcing → Supplier master data",
    amountCr: 0.42,
    effort: "Low",
    weeks: 8,
    tier: "confirmed",
    confidence: "Medium",
    confidenceReason:
      "Anand said duplicates are common. The 8.4% rate is our estimate from the pattern he described, not a system count.",
    why: "Suppliers get re-created when a plant cannot find the existing record, typically with a slightly different name or GST entry. Spend then splits across records, so category managers negotiate against understated volumes and the duplicate records slow every match.",
    impact: "A one-off cleanse plus a duplicate check at creation. Small money on its own, but it is the reason the indirect-spend number in gap 3 cannot currently be verified.",
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
    id: "g10",
    rank: 9,
    bucketId: "b-recover",
    title: "Distributor claims are reconciled by hand",
    plainLine:
      "Money owed back by distributors is worked out in spreadsheets, so some of it is never collected.",
    level2: "Deliver → Trade claims and rebates",
    amountCr: 0.68,
    effort: "Medium",
    weeks: 12,
    tier: "inferred",
    confidence: "Medium",
    confidenceReason:
      "The scheme structure is described in the FY25 report. Nobody at Suvarna has confirmed how claims are processed.",
    why: "The FY25 report describes a distributor scheme and rebate structure across four regions. Where these are reconciled manually, unclaimed and over-paid amounts typically run at 2-4% of scheme value. We have inferred the manual process from company size and the absence of any claims system in the SAP footprint described on call 2.",
    impact: "Worth confirming early because it is the one gap where Suvarna is owed money rather than spending it, which is an easier first conversation than cost.",
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
    id: "g11",
    rank: 11,
    bucketId: "b-move",
    title: "No warehouse module at any of the three plants",
    plainLine:
      "Putting stock away and picking it is done on paper, so goods receipts get posted late.",
    level2: "Deliver → Warehouse operations",
    amountCr: 0.35,
    effort: "High",
    weeks: 20,
    tier: "confirmed",
    confidence: "Medium-high",
    confidenceReason: "The SAP footprint was confirmed on call 2. The cost is modelled, not measured.",
    why: "Suvarna runs SAP MM, FI and SD but no warehouse management. Putaway and picking are paper-based at all three plants, which is the direct cause of the late goods receipts behind gap 2. Priced modestly on its own, but it is upstream of a much larger number.",
    impact: "Do not sell this on its own merits — sell it as the fix that makes the ₹2.6 Cr matching problem stay fixed.",
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
    id: "g12",
    rank: 12,
    bucketId: "b-move",
    title: "No supplier scorecard behind goods-receipt rejections",
    plainLine:
      "Deliveries get rejected on quality, but nobody tracks which suppliers cause it.",
    level2: "Source → Incoming quality",
    amountCr: null,
    unpricedReason:
      "Rejection volumes have not been shared. Ask for 12 months of rejection data by supplier and this becomes priceable.",
    effort: "Low",
    weeks: 8,
    tier: "unverified",
    confidence: "Low",
    confidenceReason:
      "One passing remark on call 2. No supporting data of any kind.",
    why: "Anand mentioned rework at goods receipt in passing. Without rejection volumes there is no basis for a number, and putting one on this would be a guess presented as a finding.",
    impact: "Unknown until rejection data is shared. Listed because it is a cheap ask on the next call, not because it is currently a case.",
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
/* Questions — sequenced. Order is the product.                                */
/* -------------------------------------------------------------------------- */

export const questions: Question[] = [
  {
    id: "q1",
    askOrder: 1,
    text: "How long does it take you to get a new supplier trading?",
    targetId: "sh-rohan",
    whyItMatters:
      "It is his number, it is a problem he already admits to, and it opens the conversation on his ground rather than Finance's.",
    badAnswer:
      "\"A few days.\" Then the 21-day figure is stale or applies only to some categories — stop and find out which.",
    goodAnswer:
      "Anything over two weeks confirms the gap and gives you permission to ask what it stops him doing.",
    linkedGapIds: ["g6"],
  },
  {
    id: "q2",
    askOrder: 2,
    text: "When a plant needs something and the supplier is not set up yet, what actually happens?",
    targetId: "sh-rohan",
    whyItMatters:
      "This is where the onboarding delay converts into money. He has to describe the spot buy himself for the number to be credible later.",
    badAnswer: "\"They wait.\" Then the cost is production disruption, not price — reprice the gap.",
    goodAnswer:
      "\"They buy from whoever is on the list.\" That is ₹1.2 Cr, in his own words, without you having asked for it.",
    linkedGapIds: ["g6", "g3"],
  },
  {
    id: "q3",
    askOrder: 3,
    text: "What is your first-time match rate?",
    gloss:
      "The share of invoices that reconcile against the order and the delivery note automatically, with nobody touching them.",
    targetId: "sh-anand",
    whyItMatters:
      "The single most diagnostic number in procure-to-pay. It sets the size of the two largest gaps on the list.",
    badAnswer:
      "\"We do not measure that.\" More common than not, and more useful — it means nobody owns the exception queue.",
    goodAnswer:
      "Any figure under 80% opens the ₹2.6 Cr conversation. Under 60% and it is the biggest thing on their desk.",
    linkedGapIds: ["g2", "g1"],
  },
  {
    id: "q4",
    askOrder: 4,
    text: "When an invoice does not match, who picks it up and how long does it sit?",
    targetId: "sh-anand",
    whyItMatters:
      "Turns a percentage into a person and a delay. This is the detail that makes the number feel real to the CFO later.",
    badAnswer: "\"It gets handled.\" Push once: ask how many are open right now.",
    goodAnswer: "A named queue and an ageing figure. That is the business case, given to you.",
    linkedGapIds: ["g2"],
  },
  {
    id: "q5",
    askOrder: 5,
    text: "Are your goods receipts posted at the plant as goods arrive, or later?",
    targetId: "sh-anand",
    whyItMatters:
      "This is the actual root cause behind the match failures. Establishing it here means the warehouse gap does not need selling separately.",
    badAnswer: "\"As they arrive.\" Then the match failures are a tolerance or master-data problem — different fix.",
    goodAnswer: "\"When they get to it.\" Confirms the chain from paper warehousing to ₹2.6 Cr.",
    linkedGapIds: ["g11", "g2"],
  },
  {
    id: "q6",
    askOrder: 6,
    text: "How much of your indirect buying goes through a contracted rate?",
    gloss:
      "Indirect is everything that is not raw material — services, maintenance, packaging consumables, travel.",
    targetId: "sh-rohan",
    whyItMatters:
      "The largest unverified number on the list, at ₹2.1 Cr. Do not present that figure until this is answered.",
    badAnswer: "\"Most of it.\" Ask how he knows — if the answer is the duplicate-ridden vendor master, it is not knowable yet.",
    goodAnswer: "Any figure he can source. Even a bad number with a system behind it is progress.",
    linkedGapIds: ["g3", "g9"],
  },
  {
    id: "q7",
    askOrder: 7,
    text: "You have early-payment terms on the ingredient contracts. How often do you hit them?",
    targetId: "sh-meera",
    whyItMatters:
      "The cleanest cash argument available and the natural handover point into a CFO conversation.",
    badAnswer:
      "\"We do not track it.\" Fine — the answer is then in the payment data, which is a reasonable thing to ask for.",
    goodAnswer: "Any figure under 50% confirms ₹1.6 Cr of cash sitting in the process rather than in the bank.",
    linkedGapIds: ["g4"],
  },
  {
    id: "q8",
    askOrder: 8,
    text: "Could you share twelve months of goods-receipt rejections by supplier?",
    targetId: "sh-rohan",
    whyItMatters:
      "The one open item we cannot price. Ask last — it is a data request, not a discovery question, and it changes the register of the call.",
    badAnswer: "Hesitation usually means the data does not exist in a usable form. Note that as a finding in itself.",
    goodAnswer: "A yes turns gap 12 from a guess into a priced case before the next meeting.",
    linkedGapIds: ["g12"],
  },
];

export const questionById = (id: string) => questions.find((q) => q.id === id)!;

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
    statement: "Early-payment terms of 2/10 net 45 exist on many ingredient contracts and are rarely met.",
    basis: "Stated by the Head of Procurement in the April email thread.",
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
    id: "c11",
    tier: "inferred",
    statement: "Roughly ₹2.1 Cr a year is lost buying indirect goods outside contracted rates.",
    basis:
      "Built from the Head of Procurement's own estimate that under half of indirect spend is contracted, priced at the low end of the published sector leakage range. Not verified against their ledger.",
    sourceIds: ["src-call2"],
    category: "Commercial",
    linkedGapId: "g3",
  },
  {
    id: "c12",
    tier: "inferred",
    statement: "Freight is likely tendered to a single carrier per lane rather than competitively.",
    basis:
      "Freight runs 1.4 points of revenue above sector best, and the annual report describes long-standing regional transport relationships. Nobody in logistics has been spoken to.",
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
    id: "c14",
    tier: "inferred",
    statement: "AP is running at roughly 3.4× the headcount an automated operation of this volume needs.",
    basis:
      "Derived from a stated team of nine against roughly 96,000 invoices a year, compared with a benchmark of 0.9 staff per 10,000 invoices.",
    sourceIds: ["src-call2", "src-email"],
    category: "People",
    // Supports g1 rather than pricing it — c3 owns that ₹3.2 Cr. Showing it
    // here too would put confirmed money inside the inferred tier.
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
    statement: "The Sangli plant expansion announced in FY25 will add roughly 20% to procurement volume.",
    basis:
      "The expansion is in the annual report. The 20% volume figure is our own estimate from stated capacity, and has not been tested with anyone.",
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
          "Both halves are from their own material — the growth from the FY25 report, the 2019 line from Rohan's email. Quoting his sentence back is what buys the next twenty minutes.",
      },
      {
        label: "Do not say",
        body: "Anything with a rupee figure attached. The ₹14.7 Cr lands at minute 20, not minute 2.",
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
        body: "You run SAP MM, FI and SD across three plants, with no warehouse module — so putaway and goods receipts are on paper.",
        detail: "Confirmed on call 2. Naming the module gap is what separates you from a generic pitch.",
      },
      {
        label: "Fact two",
        body: "Sixty-one percent of your spend sits with forty suppliers, but you have around 2,400 active vendor records.",
        detail: "The tension between those two numbers is the whole indirect-spend conversation, set up without asserting anything.",
      },
    ],
  },
  {
    id: "beat-probe",
    phase: "Probe",
    minutes: "8-20 min",
    intent: "Eight questions in order. Let them tell you the number.",
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
        body: "Invoices are hand-keyed by nine people at a 58% first-time match rate. That is about ₹5.8 Cr a year across capture and matching.",
        detail:
          "Two gaps presented as one problem, because they are one problem to the client. Highest confidence on the list and both figures came from their own team.",
      },
      {
        label: "Gap to name second",
        body: "Three weeks to onboard a supplier means plants buy at spot. Call it ₹1.2 Cr, and it is the one that stops your lines.",
        detail: "Rohan's own number, handed back with a cost attached. Ends on his function rather than Finance's.",
      },
      {
        label: "Hold back",
        body: "The ₹2.1 Cr indirect number. It is our largest estimate and the least verified — if he pushes on it and it does not hold, the other figures lose credibility too.",
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
        body: "Twelve months of invoice-level data, and a half hour with whoever owns payment terms.",
        detail:
          "The data prices gaps 3 and 12. The second meeting is the route to Meera Iyer, who has not been met and who holds the budget.",
      },
      {
        label: "Offer",
        body: "A costed view of the invoice process within two weeks of getting the data.",
      },
    ],
  },
];

/* -------------------------------------------------------------------------- */
/* Derived                                                                     */
/* -------------------------------------------------------------------------- */

export const bucketTotal = (bucketId: string) =>
  buckets
    .find((b) => b.id === bucketId)!
    .gapIds.reduce((sum, id) => sum + (gapById(id).amountCr ?? 0), 0);

export const tierCounts = {
  confirmed: claimsByTier("confirmed").length,
  inferred: claimsByTier("inferred").length,
  unverified: claimsByTier("unverified").length,
};

export const gapsForStakeholder = (id: string) => gaps.filter((g) => g.ownerId === id);
export const questionsForStakeholder = (id: string) =>
  questions.filter((q) => q.targetId === id).sort((a, b) => a.askOrder - b.askOrder);
export const valueForStakeholder = (id: string) =>
  gapsForStakeholder(id).reduce((sum, g) => sum + (g.amountCr ?? 0), 0);

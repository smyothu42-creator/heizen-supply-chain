/**
 * The Canvas node tree — Suvarna's supply chain at three levels.
 *
 * Level 0 is the SCOR value chain: identical for every manufacturing company on
 * earth, so it is context, not insight, and carries the least visual weight.
 * Level 2 is where companies actually differ and where a gap becomes priceable.
 * Visual weight increases as you descend. See CLAUDE.md section 4.
 *
 * TWO INDEPENDENT AXES. Do not collapse them:
 *   health       — how this is running        → colour
 *   completeness — what evidence we have      → fill and stroke, never colour
 *
 * A healthy node we know nothing about and a critical node with full evidence
 * are opposite situations.
 *
 * And a node we have not looked at has NO health. It used to be painted green,
 * which put "running well" on a client screen for nine processes nobody had
 * asked a question about — including Make, at a company with three plants.
 * `unknown` is a fourth state, neutral by design, and the rule is enforced in
 * check:data: completeness "none" ⇒ health "unknown", unless we looked and
 * genuinely found nothing (emptyKind "confirmed-none"), which is a real result.
 * See AUDIT.md B5.
 */

export type Health = "critical" | "watch" | "healthy" | "unknown";
export type Completeness = "none" | "partial" | "full";

export interface CanvasNode {
  id: string;
  level: 0 | 1 | 2;
  parentId: string | null;
  name: string;
  /** What this actually means, for someone who has never worked in supply chain. */
  plainLine: string;
  health: Health;
  completeness: Completeness;
  /** Only meaningful when completeness is "none" — the three states differ. */
  emptyKind?: "not-researched" | "no-sources" | "confirmed-none";
  /**
   * Somebody has read this and thinks the pipeline got it wrong. The string is
   * what is wrong, in words, and it is required rather than a boolean for the
   * same reason `DealRisk.counter` is: a flag with no reason is a red mark a
   * consultant cannot act on, and the failure is silent — the node renders
   * perfectly tidily while saying nothing about what to fix.
   *
   * **It is a third axis and not a fourth health state.** Health is a reading
   * about the client's process; this is a reading about *our* reading of it, so
   * a critical process and a wrong description of a healthy one are different
   * things and must not share a colour. `check:data` enforces the length.
   *
   * §5: users never hand-edit AI output. The flag opens the correction prompt;
   * it does not let anyone retype the finding.
   */
  needsCorrection?: string;
  gapIds: string[];
  metricIds: string[];
  sourceIds: string[];
}

export const HEALTH_LABEL: Record<Health, string> = {
  critical: "Critical",
  watch: "Watch",
  healthy: "Running well",
  unknown: "Not looked at",
};

export const HEALTH_MEANING: Record<Health, string> = {
  critical: "Costing real money now, and they know something is wrong.",
  watch: "Working, but behind where it should be.",
  healthy: "We looked and found nothing worth raising.",
  unknown: "No reading either way. Nobody has asked a question about this yet.",
};

export const COMPLETENESS_LABEL: Record<Completeness, string> = {
  none: "No evidence",
  partial: "Some evidence",
  full: "Well evidenced",
};

export const COMPLETENESS_MEANING: Record<Completeness, string> = {
  none: "Nothing from Suvarna. Whatever colour this is, treat it as a guess.",
  partial: "One source, or a figure they gave without data behind it.",
  full: "More than one source, including something they said or published.",
};

export const nodes: CanvasNode[] = [
  /* ---------------------------------------------------------------- Level 0 */
  {
    id: "l0-plan",
    level: 0,
    parentId: null,
    name: "Plan",
    plainLine: "Working out what they will need, and when.",
    health: "watch",
    completeness: "partial",
    gapIds: ["g8"],
    metricIds: ["m-fg-cover"],
    sourceIds: ["src-ar25"],
  },
  {
    id: "l0-source",
    level: 0,
    parentId: null,
    name: "Source",
    plainLine: "Finding suppliers, receiving what they send, and paying them.",
    health: "critical",
    completeness: "full",
    // g11 lives here, not under Deliver. Booking in raw material at the plant
    // gate is SCOR sS1.2-1.4, and it is the first link in the chain that ends
    // with a missed early-payment discount. See AUDIT.md B2.
    gapIds: ["g1", "g2", "g3", "g4", "g5", "g6", "g9", "g11", "g12"],
    metricIds: ["m-ftmr", "m-onboarding", "m-contracted"],
    sourceIds: ["src-call1", "src-call2", "src-email"],
  },
  {
    id: "l0-make",
    level: 0,
    parentId: null,
    name: "Make",
    plainLine: "Turning raw material into product at the three plants.",
    // Three plants, zero questions asked. This used to be green.
    health: "unknown",
    completeness: "none",
    emptyKind: "not-researched",
    gapIds: [],
    metricIds: [],
    sourceIds: [],
  },
  {
    id: "l0-deliver",
    level: 0,
    parentId: null,
    name: "Deliver",
    plainLine: "Storing finished product and getting it to customers.",
    health: "watch",
    completeness: "partial",
    gapIds: ["g7", "g10"],
    metricIds: ["m-freight"],
    sourceIds: ["src-ar25"],
  },
  {
    id: "l0-return",
    level: 0,
    parentId: null,
    name: "Return",
    plainLine: "Handling what comes back, from customers and to suppliers.",
    health: "unknown",
    completeness: "none",
    emptyKind: "not-researched",
    gapIds: [],
    metricIds: [],
    sourceIds: [],
  },

  /* ---------------------------------------------------------------- Level 1 */
  {
    id: "l1-demand",
    level: 1,
    parentId: "l0-plan",
    name: "Demand planning",
    plainLine: "Deciding how much of each product to make next month.",
    health: "watch",
    completeness: "partial",
    gapIds: ["g8"],
    metricIds: ["m-fg-cover"],
    sourceIds: ["src-ar25"],
  },
  {
    id: "l1-inventory",
    level: 1,
    parentId: "l0-plan",
    name: "Inventory planning",
    plainLine: "Deciding how much stock to hold and where.",
    health: "unknown",
    completeness: "none",
    emptyKind: "no-sources",
    gapIds: [],
    metricIds: ["m-fg-cover"],
    sourceIds: [],
  },
  {
    id: "l1-sourcing",
    level: 1,
    parentId: "l0-source",
    name: "Sourcing",
    plainLine: "Choosing who to buy from and what to pay.",
    health: "critical",
    completeness: "full",
    gapIds: ["g3", "g6", "g9"],
    metricIds: ["m-rfq", "m-onboarding", "m-contracted", "m-dupes"],
    sourceIds: ["src-call1", "src-call2"],
  },
  {
    id: "l1-purchasing",
    level: 1,
    parentId: "l0-source",
    name: "Purchasing",
    plainLine: "Raising the order once someone has asked to buy something.",
    health: "watch",
    completeness: "partial",
    gapIds: ["g5"],
    metricIds: ["m-pr-po"],
    sourceIds: ["src-call1", "src-email"],
  },
  {
    id: "l1-quality-in",
    level: 1,
    parentId: "l0-source",
    name: "Incoming quality",
    plainLine: "Checking deliveries before they are accepted.",
    health: "unknown",
    completeness: "none",
    emptyKind: "no-sources",
    gapIds: ["g12"],
    metricIds: [],
    sourceIds: ["src-call2"],
  },
  {
    // Inbound receiving, moved out of Deliver. This is where the 42% match
    // failure downstream actually starts.
    id: "l1-receiving",
    level: 1,
    parentId: "l0-source",
    name: "Receiving",
    plainLine: "Booking in raw material at the plant gate and putting it away.",
    health: "critical",
    completeness: "partial",
    gapIds: ["g11"],
    metricIds: ["m-ftmr"],
    sourceIds: ["src-call2"],
  },
  {
    id: "l1-ap",
    level: 1,
    parentId: "l0-source",
    name: "Accounts payable",
    plainLine: "Checking supplier invoices and paying them.",
    health: "critical",
    completeness: "full",
    gapIds: ["g1", "g2", "g4"],
    metricIds: ["m-ftmr", "m-invoice-cycle", "m-touchless", "m-ap-fte", "m-discount"],
    sourceIds: ["src-call2", "src-email"],
  },
  {
    id: "l1-production",
    level: 1,
    parentId: "l0-make",
    name: "Production scheduling",
    plainLine: "Deciding what each plant runs, and in what order.",
    health: "unknown",
    completeness: "none",
    emptyKind: "not-researched",
    gapIds: [],
    metricIds: [],
    sourceIds: [],
  },
  {
    id: "l1-maintenance",
    level: 1,
    parentId: "l0-make",
    name: "Plant maintenance",
    plainLine: "Keeping the machines running.",
    health: "unknown",
    completeness: "none",
    emptyKind: "not-researched",
    gapIds: [],
    metricIds: [],
    sourceIds: [],
  },
  {
    id: "l1-warehouse",
    level: 1,
    parentId: "l0-deliver",
    name: "Finished goods warehousing",
    plainLine: "Holding finished product and picking it for despatch.",
    // Outbound only now. The paper process we know about is inbound, and it
    // moved to Receiving under Source. Nobody has described despatch at all.
    health: "unknown",
    completeness: "none",
    emptyKind: "not-researched",
    gapIds: [],
    metricIds: [],
    sourceIds: [],
  },
  {
    id: "l1-transport",
    level: 1,
    parentId: "l0-deliver",
    name: "Transport",
    plainLine: "Booking lorries and moving goods between sites and customers.",
    health: "watch",
    completeness: "partial",
    needsCorrection:
      "Rohan said on the second call that the main lanes are tendered every year. This still reads as never tendered.",
    gapIds: ["g7"],
    metricIds: ["m-freight"],
    sourceIds: ["src-ar25"],
  },
  {
    id: "l1-claims",
    level: 1,
    parentId: "l0-deliver",
    name: "Trade claims",
    plainLine: "Settling what distributors are owed under incentive schemes.",
    health: "watch",
    completeness: "partial",
    gapIds: ["g10"],
    metricIds: [],
    sourceIds: ["src-ar25"],
  },
  {
    id: "l1-cust-returns",
    level: 1,
    parentId: "l0-return",
    name: "Customer returns",
    plainLine: "Product coming back from distributors and retailers.",
    health: "unknown",
    completeness: "none",
    emptyKind: "not-researched",
    gapIds: [],
    metricIds: [],
    sourceIds: [],
  },
  {
    id: "l1-supp-returns",
    level: 1,
    parentId: "l0-return",
    name: "Supplier returns",
    plainLine: "Sending rejected raw material back to whoever sent it.",
    health: "healthy",
    completeness: "none",
    emptyKind: "confirmed-none",
    gapIds: [],
    metricIds: [],
    sourceIds: ["src-call2"],
  },

  /* ---------------------------------------------------------------- Level 2 */
  {
    id: "l2-forecast",
    level: 2,
    parentId: "l1-demand",
    name: "Forecasting",
    plainLine: "Predicting what customers will order.",
    health: "unknown",
    completeness: "none",
    emptyKind: "no-sources",
    gapIds: [],
    metricIds: [],
    sourceIds: [],
  },
  {
    id: "l2-sop",
    level: 2,
    parentId: "l1-demand",
    name: "Sales and operations planning",
    plainLine: "The monthly meeting where sales and the plants agree a plan.",
    health: "watch",
    completeness: "partial",
    gapIds: ["g8"],
    metricIds: ["m-fg-cover"],
    sourceIds: ["src-ar25"],
  },
  {
    id: "l2-stock-policy",
    level: 2,
    parentId: "l1-inventory",
    name: "Stock policy",
    plainLine: "The rules for how much buffer to hold on each product.",
    health: "unknown",
    completeness: "none",
    emptyKind: "no-sources",
    gapIds: [],
    metricIds: ["m-fg-cover"],
    sourceIds: [],
  },
  {
    id: "l2-category",
    level: 2,
    parentId: "l1-sourcing",
    name: "Indirect category management",
    plainLine: "Managing spend on things that are not raw material.",
    health: "critical",
    completeness: "partial",
    gapIds: ["g3"],
    metricIds: ["m-contracted"],
    sourceIds: ["src-call2"],
  },
  {
    id: "l2-rfq",
    level: 2,
    parentId: "l1-sourcing",
    name: "Quotes and award",
    plainLine: "Asking suppliers to quote, then picking one.",
    health: "watch",
    completeness: "partial",
    gapIds: [],
    metricIds: ["m-rfq"],
    sourceIds: ["src-call1"],
  },
  {
    id: "l2-onboarding",
    level: 2,
    parentId: "l1-sourcing",
    name: "Vendor onboarding",
    plainLine: "Getting a new supplier set up so you can order from them.",
    health: "critical",
    completeness: "full",
    gapIds: ["g6"],
    metricIds: ["m-onboarding"],
    sourceIds: ["src-call1", "src-email"],
  },
  {
    id: "l2-vendor-master",
    level: 2,
    parentId: "l1-sourcing",
    name: "Supplier master data",
    plainLine: "The list of suppliers in SAP, and how clean it is.",
    health: "watch",
    completeness: "partial",
    needsCorrection:
      "The duplicate count came off a sample of one category. It is written here as if it were the whole vendor master.",
    gapIds: ["g9"],
    metricIds: ["m-dupes"],
    sourceIds: ["src-call2"],
  },
  {
    id: "l2-requisition",
    level: 2,
    parentId: "l1-purchasing",
    name: "Requisition and approval",
    plainLine: "Someone asks to buy something and a manager says yes.",
    health: "critical",
    completeness: "full",
    gapIds: ["g5"],
    metricIds: ["m-pr-po"],
    sourceIds: ["src-call1", "src-email"],
  },
  {
    id: "l2-po",
    level: 2,
    parentId: "l1-purchasing",
    name: "Order issue",
    plainLine: "Sending the actual purchase order to the supplier.",
    health: "healthy",
    completeness: "none",
    emptyKind: "confirmed-none",
    gapIds: [],
    metricIds: ["m-pr-po"],
    sourceIds: ["src-call1"],
  },
  {
    id: "l2-gr-inspection",
    level: 2,
    parentId: "l1-quality-in",
    name: "Goods receipt inspection",
    plainLine: "Checking a delivery at the gate before accepting it.",
    health: "unknown",
    completeness: "none",
    emptyKind: "no-sources",
    gapIds: ["g12"],
    metricIds: [],
    sourceIds: ["src-call2"],
  },
  {
    id: "l2-gr-posting",
    level: 2,
    parentId: "l1-receiving",
    name: "Goods receipt posting",
    plainLine: "Telling the system a delivery arrived, so the invoice can be matched against it.",
    health: "critical",
    completeness: "partial",
    needsCorrection:
      "The posting delay is averaged across three plants. Only Sangli was measured, and the other two may be nothing like it.",
    gapIds: ["g11"],
    metricIds: ["m-ftmr"],
    sourceIds: ["src-call2"],
  },
  {
    id: "l2-putaway-in",
    level: 2,
    parentId: "l1-receiving",
    name: "Inbound putaway",
    plainLine: "Moving accepted raw material from the gate to where it is stored.",
    health: "unknown",
    completeness: "none",
    emptyKind: "no-sources",
    gapIds: [],
    metricIds: [],
    sourceIds: [],
  },
  {
    id: "l2-invoice-capture",
    level: 2,
    parentId: "l1-ap",
    name: "Invoice capture",
    plainLine: "Getting a supplier's invoice into the system.",
    health: "critical",
    completeness: "full",
    gapIds: ["g1"],
    metricIds: ["m-ap-fte", "m-touchless", "m-invoice-cycle"],
    sourceIds: ["src-call2", "src-email"],
  },
  {
    id: "l2-three-way",
    level: 2,
    parentId: "l1-ap",
    name: "Three-way match",
    plainLine: "Checking the invoice against the order and the delivery note.",
    health: "critical",
    completeness: "full",
    gapIds: ["g2"],
    metricIds: ["m-ftmr", "m-invoice-cycle"],
    sourceIds: ["src-call2"],
  },
  {
    id: "l2-payment",
    level: 2,
    parentId: "l1-ap",
    name: "Payment scheduling",
    plainLine: "Deciding when each supplier actually gets paid.",
    health: "critical",
    completeness: "partial",
    gapIds: ["g4"],
    metricIds: ["m-discount"],
    sourceIds: ["src-email"],
  },
  {
    id: "l2-supplier-queries",
    level: 2,
    parentId: "l1-ap",
    name: "Supplier queries",
    plainLine: "Answering suppliers who ring up asking where their money is.",
    health: "unknown",
    completeness: "none",
    emptyKind: "not-researched",
    gapIds: [],
    metricIds: [],
    sourceIds: [],
  },
  {
    id: "l2-picking",
    level: 2,
    parentId: "l1-warehouse",
    name: "Picking and despatch prep",
    plainLine: "Finding finished product on the shelf and getting it onto a lorry.",
    health: "unknown",
    completeness: "none",
    emptyKind: "not-researched",
    gapIds: [],
    metricIds: [],
    sourceIds: [],
  },
  {
    id: "l2-stock-count",
    level: 2,
    parentId: "l1-warehouse",
    name: "Stock counts",
    plainLine: "Checking that what the system says is on the shelf actually is.",
    health: "unknown",
    completeness: "none",
    emptyKind: "not-researched",
    gapIds: [],
    metricIds: [],
    sourceIds: [],
  },
  {
    id: "l2-freight-buy",
    level: 2,
    parentId: "l1-transport",
    name: "Freight procurement",
    plainLine: "Choosing hauliers and agreeing what a route costs.",
    health: "critical",
    completeness: "partial",
    gapIds: ["g7"],
    metricIds: ["m-freight"],
    sourceIds: ["src-ar25"],
  },
  {
    id: "l2-despatch",
    level: 2,
    parentId: "l1-transport",
    name: "Despatch and tracking",
    plainLine: "Loading the lorry and knowing where it is.",
    health: "unknown",
    completeness: "none",
    emptyKind: "not-researched",
    gapIds: [],
    metricIds: [],
    sourceIds: [],
  },
  {
    id: "l2-rebates",
    level: 2,
    parentId: "l1-claims",
    name: "Distributor rebates",
    plainLine: "Working out what each distributor has earned back.",
    health: "watch",
    completeness: "partial",
    gapIds: ["g10"],
    metricIds: [],
    sourceIds: ["src-ar25"],
  },
];

export const nodeById = (id: string) => nodes.find((n) => n.id === id)!;
export const childrenOf = (id: string | null) => nodes.filter((n) => n.parentId === id);
export const level0 = nodes.filter((n) => n.level === 0);

/** Level 0 → Level 1 → Level 2, for the breadcrumb. */
export function pathTo(id: string): CanvasNode[] {
  const out: CanvasNode[] = [];
  let cur: CanvasNode | undefined = nodeById(id);
  while (cur) {
    out.unshift(cur);
    cur = cur.parentId ? nodeById(cur.parentId) : undefined;
  }
  return out;
}

/** Every node with data somewhere beneath it can be drilled into. */
export const canDrill = (id: string) => childrenOf(id).length > 0;

/** Everything at any depth under a node, not just its immediate children. */
export function descendantsOf(id: string): CanvasNode[] {
  const kids = childrenOf(id);
  return kids.flatMap((k) => [k, ...descendantsOf(k.id)]);
}

/**
 * How many flagged readings sit under this node.
 *
 * This is what makes a Level 0 box worth looking at rather than merely worth
 * passing through: a stage is a place you go *down* from, so the useful thing
 * it can say is what is waiting below. Counting descendants and not children,
 * because a flag two levels down is still a reason to open this one.
 */
export const correctionsUnder = (id: string) =>
  descendantsOf(id).filter((n) => n.needsCorrection).length;

export const counts = {
  total: nodes.length,
  withData: nodes.filter((n) => n.completeness !== "none").length,
  empty: nodes.filter((n) => n.completeness === "none").length,
  critical: nodes.filter((n) => n.health === "critical").length,
  /** Processes carrying no health reading at all. Worth saying out loud. */
  unknown: nodes.filter((n) => n.health === "unknown").length,
  /** Readings somebody has marked as wrong. */
  flagged: nodes.filter((n) => n.needsCorrection).length,
};

/** The Level 0 stage a node sits under. Gaps carry the same value; check:data
 *  fails the build if the two disagree. */
export function stageOf(id: string): string {
  const trail = pathTo(id);
  return trail[0]?.name ?? "";
}

/* -------------------------------------------------------------------------- */
/* Graph layout                                                                */
/*                                                                             */
/* Canvas is a spatial map, not a list. Positions are world coordinates within  */
/* whichever level is on screen; each level lays out independently, and Level 2 */
/* lays out within its own parent. Edges are labelled with the thing that       */
/* actually moves between two processes — a purchase order, a goods receipt —   */
/* because that is what makes a flow diagram legible to someone who has never   */
/* worked in supply chain.                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Node size per level, because §4 says visual weight increases as you descend
 * and until now it did not: every box in the graph was 264×112 whatever it
 * contained, so Level 0 — the SCOR chain, identical at every manufacturer on
 * earth and therefore pure context — drew itself exactly as heavily as the
 * sub-process where a gap becomes priceable.
 *
 * The three sizes are bounded by the hand-authored layout in `positions` and
 * are not free. Measured against the tightest spacing at each level:
 *
 *   L0  440 apart, one row              → 280 wide leaves 160
 *   L1  460 apart, rows 190 apart       → 280 wide leaves 180, 156 tall leaves 34
 *   L2  470 apart, rows 210 apart       → 312 wide leaves 158, 168 tall leaves 42
 *
 * **The horizontal figures are set by the edge labels, not by the boxes.** A
 * corridor has to hold a pill plus `LABEL_MARGIN` either side plus the
 * arrowhead's own `EDGE_GAP`, both in `GraphCanvas`. L0 was 360 apart and L2
 * 380, leaving 80 and 68 — against a "finished goods" pill that wants 102. The
 * pill was capped to the corridor, wrapped to two lines and still ran within
 * eight units of both cards with the arrow cutting into it. That is what the
 * spacing pass fixed, and it is why these numbers are larger than the boxes
 * need.
 *
 * **The cost is paid in fit zoom, and it is measured rather than guessed.**
 * Level 0's span went 1720 world units to 2040, so it fits at a smaller `k` and
 * crosses `COMPACT_BELOW` at a wider window: the value chain drops its
 * plain-language line below about **1390px** of window, where it used to hold
 * to about **1157px**. A 1280 laptop now meets Level 0 compact. Measured at
 * 1440 (k 0.643, full), 1360 (0.605, compact) and 1280 (0.566, compact).
 *
 * The number is not free to reduce. A one-line "finished goods" pill is 100
 * units, and with `LABEL_MARGIN` either side plus the arrowhead's `EDGE_GAP`
 * the corridor cannot go below about 160 without the pill either wrapping
 * again or touching the arrow. **If the compact crossover matters more than the
 * spacing, the lever is the label, not the pitch** — a shorter word costs
 * nothing anywhere else.
 *
 * Change a position and re-check the pair. `scripts/` has a node-overlap check
 * for exactly this, because two boxes touching is not something `check:ui` can
 * see — it is not a clip, not a contrast failure and not an unreachable control.
 */
export const NODE_SIZE: Record<0 | 1 | 2, { w: number; h: number }> = {
  // Level 0 is one row, so its height is bounded by nothing. It was 104 for one
  // revision and that was too short by about the height of the line it was
  // meant to show: the box is a column with `mt-auto` on the footer, so the
  // squeeze landed on the subtitle and three of the five stages rendered with a
  // blank band where their plain-language line should have been. Nothing said
  // so — a clamped line that clamps to zero is not a clip.
  // Grown to fit the plain-language line at `text-small` on three lines. At
  // 11px on two lines every Level 0 subtitle was cut mid-sentence, which is the
  // worst kind of text: paid for, and not readable.
  0: { w: 280, h: 164 },
  1: { w: 280, h: 156 },
  2: { w: 312, h: 168 },
};

/** The Level 1 size, kept as the default for anything that has not said which
 *  level it is drawing. */
export const NODE_W = NODE_SIZE[1].w;
export const NODE_H = NODE_SIZE[1].h;

export interface GraphEdge {
  from: string;
  to: string;
  /** What travels along this edge. Shown as a small pill on the curve. */
  label: string;
  /** Where the pill sits along the curve, 0-1. Default 0.5; nudged where two
   *  labels would otherwise land on top of each other. */
  t?: number;
}

export const positions: Record<string, { x: number; y: number }> = {
  /* Level 0 — the value chain, left to right */
  "l0-plan": { x: 0, y: 240 },
  "l0-source": { x: 440, y: 240 },
  "l0-make": { x: 880, y: 240 },
  "l0-deliver": { x: 1320, y: 240 },
  "l0-return": { x: 1760, y: 240 },

  /* Level 1 — every process, grouped in columns under its parent */
  "l1-demand": { x: 0, y: 130 },
  "l1-inventory": { x: 0, y: 320 },
  "l1-sourcing": { x: 460, y: 20 },
  "l1-purchasing": { x: 460, y: 215 },
  "l1-quality-in": { x: 460, y: 410 },
  "l1-receiving": { x: 460, y: 605 },
  "l1-ap": { x: 460, y: 800 },
  "l1-production": { x: 940, y: 130 },
  "l1-maintenance": { x: 940, y: 340 },
  "l1-warehouse": { x: 1420, y: 60 },
  "l1-transport": { x: 1420, y: 265 },
  "l1-claims": { x: 1420, y: 470 },
  "l1-cust-returns": { x: 1900, y: 155 },
  "l1-supp-returns": { x: 1900, y: 355 },

  /* Level 2 — laid out inside the parent that was opened */
  "l2-forecast": { x: 0, y: 160 },
  "l2-sop": { x: 470, y: 160 },
  "l2-stock-policy": { x: 0, y: 160 },
  "l2-category": { x: 0, y: 60 },
  "l2-rfq": { x: 470, y: 60 },
  "l2-onboarding": { x: 0, y: 270 },
  "l2-vendor-master": { x: 470, y: 270 },
  "l2-requisition": { x: 0, y: 160 },
  "l2-po": { x: 470, y: 160 },
  "l2-gr-inspection": { x: 0, y: 160 },
  "l2-gr-posting": { x: 0, y: 160 },
  "l2-putaway-in": { x: 470, y: 160 },
  "l2-invoice-capture": { x: 0, y: 60 },
  "l2-three-way": { x: 470, y: 60 },
  "l2-payment": { x: 940, y: 60 },
  "l2-supplier-queries": { x: 470, y: 270 },
  "l2-picking": { x: 0, y: 160 },
  "l2-stock-count": { x: 470, y: 160 },
  "l2-freight-buy": { x: 0, y: 160 },
  "l2-despatch": { x: 470, y: 160 },
  "l2-rebates": { x: 0, y: 160 },
};

export const processEdges: GraphEdge[] = [
  /* Level 0 */
  { from: "l0-plan", to: "l0-source", label: "demand plan" },
  { from: "l0-source", to: "l0-make", label: "materials" },
  { from: "l0-make", to: "l0-deliver", label: "finished goods" },
  { from: "l0-deliver", to: "l0-return", label: "shipments" },
  { from: "l0-return", to: "l0-plan", label: "returns data" },

  /* Level 1 */
  { from: "l1-demand", to: "l1-sourcing", label: "demand plan" },
  { from: "l1-demand", to: "l1-inventory", label: "stock targets" },
  { from: "l1-inventory", to: "l1-purchasing", label: "reorder points" },
  { from: "l1-sourcing", to: "l1-purchasing", label: "approved vendors" },
  { from: "l1-purchasing", to: "l1-quality-in", label: "purchase orders" },
  { from: "l1-quality-in", to: "l1-receiving", label: "accepted deliveries" },
  // The chain the old model could not draw: paper receiving is what makes the
  // invoice arrive before the system believes the goods did.
  { from: "l1-receiving", to: "l1-ap", label: "goods receipts, posted late" },
  { from: "l1-purchasing", to: "l1-ap", label: "invoice matching", t: 0.62 },
  { from: "l1-ap", to: "l1-sourcing", label: "spend data", t: 0.3 },
  { from: "l1-receiving", to: "l1-production", label: "materials to line" },
  { from: "l1-maintenance", to: "l1-production", label: "line availability" },
  { from: "l1-production", to: "l1-warehouse", label: "finished goods" },
  { from: "l1-warehouse", to: "l1-transport", label: "picked loads" },
  { from: "l1-transport", to: "l1-claims", label: "proof of delivery", t: 0.62 },
  { from: "l1-claims", to: "l1-ap", label: "rebate claims" },
  { from: "l1-transport", to: "l1-cust-returns", label: "deliveries", t: 0.62 },
  { from: "l1-cust-returns", to: "l1-warehouse", label: "returned stock", t: 0.7 },
  /* `t` moves the label along the curve, and this one is why it is only ever a
     starting point. At 0.32 it sat on top of Plant maintenance: the edge runs
     from the second column to the fifth, so a third of the way along is over
     the middle of the graph rather than in a gap between two boxes. 0.56 puts
     it in the corridor after that column, and `GraphCanvas` lifts it clear of
     *proof of delivery*, which bows into the same corridor. */
  { from: "l1-quality-in", to: "l1-supp-returns", label: "rejections", t: 0.56 },
  { from: "l1-warehouse", to: "l1-demand", label: "stock position", t: 0.35 },

  /* Level 2 */
  { from: "l2-forecast", to: "l2-sop", label: "forecast" },
  { from: "l2-category", to: "l2-rfq", label: "category plan" },
  { from: "l2-rfq", to: "l2-onboarding", label: "awarded supplier" },
  { from: "l2-onboarding", to: "l2-vendor-master", label: "new vendor" },
  { from: "l2-requisition", to: "l2-po", label: "approved request" },
  { from: "l2-invoice-capture", to: "l2-three-way", label: "keyed invoice" },
  { from: "l2-three-way", to: "l2-payment", label: "matched" },
  { from: "l2-three-way", to: "l2-supplier-queries", label: "exceptions" },
  { from: "l2-gr-posting", to: "l2-putaway-in", label: "accepted stock" },
  { from: "l2-picking", to: "l2-stock-count", label: "stock moves" },
  { from: "l2-freight-buy", to: "l2-despatch", label: "booked lane" },
];

/* -------------------------------------------------------------------------- */
/* Entities — the same operation seen as the things that move through it       */
/* -------------------------------------------------------------------------- */

export interface EntityNode {
  id: string;
  name: string;
  plainLine: string;
  /** The area of the business this record belongs to, and the same four the
   *  Gaps surface filters by. Entities are grouped by it rather than drawn as a
   *  graph. `check:data` fails the build if it disagrees with the bucket of the
   *  gaps this entity carries. */
  bucketId: string;
  health: Health;
  completeness: Completeness;
  /** Where this record actually lives. */
  system: string;
  volume: string;
  gapIds: string[];
  sourceIds: string[];
}

export const entities: EntityNode[] = [
  {
    id: "e-forecast",
    name: "Forecast",
    plainLine: "The monthly view of what they expect to sell.",
    bucketId: "b-move",
    health: "watch",
    completeness: "partial",
    system: "Excel",
    volume: "~1,400 lines a month",
    gapIds: ["g8"],
    sourceIds: ["src-ar25"],
  },
  {
    id: "e-requisition",
    name: "Purchase requisition",
    plainLine: "Someone inside the business asking to buy something.",
    bucketId: "b-pay",
    health: "critical",
    completeness: "full",
    system: "SAP MM · email · WhatsApp",
    volume: "~2,100 a month",
    gapIds: ["g5"],
    sourceIds: ["src-call1", "src-email"],
  },
  {
    id: "e-vendor",
    name: "Vendor master record",
    plainLine: "The entry in SAP that says a supplier exists and how to pay them.",
    bucketId: "b-buy",
    health: "watch",
    completeness: "partial",
    system: "SAP MM",
    volume: "~2,400 active",
    gapIds: ["g9", "g6"],
    sourceIds: ["src-call2"],
  },
  {
    id: "e-po",
    name: "Purchase order",
    plainLine: "The formal commitment sent to a supplier.",
    bucketId: "b-buy",
    health: "watch",
    completeness: "full",
    system: "SAP MM",
    volume: "~1,900 a month",
    gapIds: ["g3"],
    sourceIds: ["src-call1", "src-call2"],
  },
  {
    id: "e-gr",
    name: "Goods receipt",
    plainLine: "The record that says a delivery turned up and was accepted.",
    bucketId: "b-move",
    health: "critical",
    completeness: "partial",
    system: "Paper, then SAP MM",
    volume: "~2,600 a month",
    gapIds: ["g11", "g12"],
    sourceIds: ["src-call2"],
  },
  {
    id: "e-invoice",
    name: "Supplier invoice",
    plainLine: "The bill the supplier sends.",
    bucketId: "b-pay",
    health: "critical",
    completeness: "full",
    system: "PDF and paper, keyed into SAP FI",
    volume: "~8,000 a month",
    gapIds: ["g1"],
    sourceIds: ["src-call2", "src-email"],
  },
  {
    id: "e-match",
    name: "Match result",
    plainLine: "Whether the order, the delivery and the bill agree.",
    bucketId: "b-pay",
    health: "critical",
    completeness: "full",
    system: "SAP FI",
    volume: "58% pass first time",
    gapIds: ["g2"],
    sourceIds: ["src-call2"],
  },
  {
    id: "e-payment",
    name: "Payment",
    plainLine: "Money actually leaving the bank.",
    bucketId: "b-pay",
    health: "critical",
    completeness: "partial",
    system: "SAP FI",
    volume: "~7,600 a month",
    gapIds: ["g4"],
    sourceIds: ["src-email"],
  },
  {
    id: "e-stock",
    name: "Stock record",
    plainLine: "What the system believes is on the shelf.",
    bucketId: "b-move",
    health: "watch",
    completeness: "partial",
    system: "SAP MM, no warehouse module",
    volume: "38 days of cover",
    gapIds: ["g8", "g11"],
    sourceIds: ["src-ar25", "src-call2"],
  },
  {
    id: "e-freight",
    name: "Freight booking",
    plainLine: "A lorry arranged for a load that needs to move.",
    bucketId: "b-move",
    health: "watch",
    completeness: "partial",
    system: "Phone and email",
    volume: "not measured",
    gapIds: ["g7"],
    sourceIds: ["src-ar25"],
  },
  {
    id: "e-claim",
    name: "Rebate claim",
    plainLine: "What a distributor says they are owed back.",
    bucketId: "b-recover",
    health: "watch",
    completeness: "partial",
    system: "Excel",
    volume: "quarterly, 4 regions",
    gapIds: ["g10"],
    sourceIds: ["src-ar25"],
  },
];

export const entityEdges: GraphEdge[] = [
  { from: "e-forecast", to: "e-requisition", label: "planned demand" },
  { from: "e-requisition", to: "e-po", label: "approved" },
  { from: "e-vendor", to: "e-po", label: "supplier record" },
  { from: "e-po", to: "e-gr", label: "expected delivery" },
  { from: "e-po", to: "e-invoice", label: "matched against" },
  { from: "e-gr", to: "e-match", label: "receipt line" },
  { from: "e-invoice", to: "e-match", label: "invoice line", t: 0.64 },
  { from: "e-match", to: "e-payment", label: "cleared" },
  { from: "e-gr", to: "e-stock", label: "putaway", t: 0.33 },
  { from: "e-stock", to: "e-freight", label: "despatch" },
  { from: "e-freight", to: "e-claim", label: "proof of delivery" },
];

export const entityById = (id: string) => entities.find((e) => e.id === id)!;

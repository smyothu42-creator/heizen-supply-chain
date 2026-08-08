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
 * are opposite situations. Health here is our reading of the process; where
 * completeness is "none" that reading is a sector default, and the node detail
 * says so rather than implying we checked.
 */

export type Health = "critical" | "watch" | "healthy";
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
  gapIds: string[];
  metricIds: string[];
  sourceIds: string[];
}

export const HEALTH_LABEL: Record<Health, string> = {
  critical: "Critical",
  watch: "Watch",
  healthy: "Running well",
};

export const HEALTH_MEANING: Record<Health, string> = {
  critical: "Costing real money now, and they know something is wrong.",
  watch: "Working, but behind where it should be.",
  healthy: "No reason to think this is a problem.",
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
    plainLine: "Finding suppliers, agreeing prices, and paying them.",
    health: "critical",
    completeness: "full",
    gapIds: ["g1", "g2", "g3", "g4", "g5", "g6", "g9", "g12"],
    metricIds: ["m-ftmr", "m-onboarding", "m-contracted"],
    sourceIds: ["src-call1", "src-call2", "src-email"],
  },
  {
    id: "l0-make",
    level: 0,
    parentId: null,
    name: "Make",
    plainLine: "Turning raw material into product at the three plants.",
    health: "healthy",
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
    gapIds: ["g7", "g10", "g11"],
    metricIds: ["m-freight"],
    sourceIds: ["src-ar25", "src-call2"],
  },
  {
    id: "l0-return",
    level: 0,
    parentId: null,
    name: "Return",
    plainLine: "Handling what comes back — from customers, and to suppliers.",
    health: "healthy",
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
    health: "watch",
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
    health: "watch",
    completeness: "none",
    emptyKind: "no-sources",
    gapIds: ["g12"],
    metricIds: [],
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
    health: "healthy",
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
    health: "healthy",
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
    name: "Warehousing",
    plainLine: "Putting stock away and picking it for despatch.",
    health: "critical",
    completeness: "partial",
    gapIds: ["g11"],
    metricIds: ["m-ftmr"],
    sourceIds: ["src-call2"],
  },
  {
    id: "l1-transport",
    level: 1,
    parentId: "l0-deliver",
    name: "Transport",
    plainLine: "Booking lorries and moving goods between sites and customers.",
    health: "watch",
    completeness: "partial",
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
    health: "healthy",
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
    health: "watch",
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
    health: "watch",
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
    health: "watch",
    completeness: "none",
    emptyKind: "no-sources",
    gapIds: ["g12"],
    metricIds: [],
    sourceIds: ["src-call2"],
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
    health: "watch",
    completeness: "none",
    emptyKind: "not-researched",
    gapIds: [],
    metricIds: [],
    sourceIds: [],
  },
  {
    id: "l2-putaway",
    level: 2,
    parentId: "l1-warehouse",
    name: "Putaway and picking",
    plainLine: "Moving stock to a shelf, then finding it again to despatch.",
    health: "critical",
    completeness: "partial",
    gapIds: ["g11"],
    metricIds: ["m-ftmr"],
    sourceIds: ["src-call2"],
  },
  {
    id: "l2-stock-count",
    level: 2,
    parentId: "l1-warehouse",
    name: "Stock counts",
    plainLine: "Checking that what the system says is on the shelf actually is.",
    health: "watch",
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
    health: "healthy",
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

export const counts = {
  total: nodes.length,
  withData: nodes.filter((n) => n.completeness !== "none").length,
  empty: nodes.filter((n) => n.completeness === "none").length,
  critical: nodes.filter((n) => n.health === "critical").length,
};

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

export const NODE_W = 264;
export const NODE_H = 112;

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
  "l0-source": { x: 360, y: 240 },
  "l0-make": { x: 720, y: 240 },
  "l0-deliver": { x: 1080, y: 240 },
  "l0-return": { x: 1440, y: 240 },

  /* Level 1 — every process, grouped in columns under its parent */
  "l1-demand": { x: 0, y: 130 },
  "l1-inventory": { x: 0, y: 320 },
  "l1-sourcing": { x: 460, y: 20 },
  "l1-purchasing": { x: 460, y: 215 },
  "l1-quality-in": { x: 460, y: 410 },
  "l1-ap": { x: 460, y: 605 },
  "l1-production": { x: 940, y: 130 },
  "l1-maintenance": { x: 940, y: 340 },
  "l1-warehouse": { x: 1420, y: 60 },
  "l1-transport": { x: 1420, y: 265 },
  "l1-claims": { x: 1420, y: 470 },
  "l1-cust-returns": { x: 1900, y: 155 },
  "l1-supp-returns": { x: 1900, y: 355 },

  /* Level 2 — laid out inside the parent that was opened */
  "l2-forecast": { x: 0, y: 160 },
  "l2-sop": { x: 380, y: 160 },
  "l2-stock-policy": { x: 0, y: 160 },
  "l2-category": { x: 0, y: 60 },
  "l2-rfq": { x: 380, y: 60 },
  "l2-onboarding": { x: 0, y: 270 },
  "l2-vendor-master": { x: 380, y: 270 },
  "l2-requisition": { x: 0, y: 160 },
  "l2-po": { x: 380, y: 160 },
  "l2-gr-inspection": { x: 0, y: 160 },
  "l2-invoice-capture": { x: 0, y: 60 },
  "l2-three-way": { x: 380, y: 60 },
  "l2-payment": { x: 760, y: 60 },
  "l2-supplier-queries": { x: 380, y: 270 },
  "l2-putaway": { x: 0, y: 160 },
  "l2-stock-count": { x: 380, y: 160 },
  "l2-freight-buy": { x: 0, y: 160 },
  "l2-despatch": { x: 380, y: 160 },
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
  { from: "l1-quality-in", to: "l1-ap", label: "goods receipts" },
  { from: "l1-purchasing", to: "l1-ap", label: "invoice matching", t: 0.62 },
  { from: "l1-ap", to: "l1-sourcing", label: "spend data", t: 0.3 },
  { from: "l1-quality-in", to: "l1-production", label: "accepted materials" },
  { from: "l1-maintenance", to: "l1-production", label: "line availability" },
  { from: "l1-production", to: "l1-warehouse", label: "finished goods" },
  { from: "l1-warehouse", to: "l1-transport", label: "picked loads" },
  { from: "l1-transport", to: "l1-claims", label: "proof of delivery", t: 0.62 },
  { from: "l1-claims", to: "l1-ap", label: "rebate claims" },
  { from: "l1-transport", to: "l1-cust-returns", label: "deliveries", t: 0.62 },
  { from: "l1-cust-returns", to: "l1-warehouse", label: "returned stock", t: 0.7 },
  { from: "l1-quality-in", to: "l1-supp-returns", label: "rejections", t: 0.32 },
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
  { from: "l2-putaway", to: "l2-stock-count", label: "stock moves" },
  { from: "l2-freight-buy", to: "l2-despatch", label: "booked lane" },
];

/* -------------------------------------------------------------------------- */
/* Entities — the same operation seen as the things that move through it       */
/* -------------------------------------------------------------------------- */

export interface EntityNode {
  id: string;
  name: string;
  plainLine: string;
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
    health: "watch",
    completeness: "partial",
    system: "Excel",
    volume: "quarterly, 4 regions",
    gapIds: ["g10"],
    sourceIds: ["src-ar25"],
  },
];

export const entityPositions: Record<string, { x: number; y: number }> = {
  "e-forecast": { x: 0, y: 60 },
  "e-requisition": { x: 380, y: 60 },
  "e-vendor": { x: 380, y: 300 },
  "e-po": { x: 760, y: 180 },
  "e-gr": { x: 1140, y: 60 },
  "e-invoice": { x: 1140, y: 300 },
  "e-match": { x: 1520, y: 180 },
  "e-payment": { x: 1900, y: 180 },
  "e-stock": { x: 1520, y: 440 },
  "e-freight": { x: 1900, y: 440 },
  "e-claim": { x: 2280, y: 440 },
};

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

/**
 * Compare — other projects, laid out against this one.
 *
 * Lanes align on shared process stages. The delta between lanes is the content;
 * each lane's own values are supporting evidence. Selecting a company stacks a
 * lane below rather than replacing the view — see CLAUDE.md section 5.
 */

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

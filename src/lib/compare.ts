/**
 * Compare — other projects, laid out against this one.
 *
 * Lanes align on shared process stages. The delta between lanes is the content;
 * each lane's own values are supporting evidence. Selecting a company stacks a
 * lane below rather than replacing the view — see CLAUDE.md section 5.
 */

export interface Stage {
  id: string;
  name: string;
  /** Plain-language line, because half these terms mean nothing to a non-expert. */
  gloss: string;
  /** Lower days is always better; the score is 0-100 where higher is better. */
  unit: "days";
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
}

export const stages: Stage[] = [
  {
    id: "s-approval",
    name: "Request and approval",
    gloss: "Someone asks to buy something and a manager signs it off.",
    unit: "days",
  },
  {
    id: "s-rfq",
    name: "Sourcing and quotes",
    gloss: "Asking suppliers what they would charge, then picking one.",
    unit: "days",
  },
  {
    id: "s-onboarding",
    name: "Vendor onboarding",
    gloss: "Getting a new supplier set up so you can order from them.",
    unit: "days",
  },
  {
    id: "s-invoice",
    name: "Invoice to posting",
    gloss: "An invoice arrives and ends up recorded in the system.",
    unit: "days",
  },
  {
    id: "s-match",
    name: "Three-way match",
    gloss: "Checking the invoice against the order and the delivery note.",
    unit: "days",
  },
  {
    id: "s-freight",
    name: "Freight booking",
    gloss: "Arranging a lorry for a load that needs to move.",
    unit: "days",
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
  },
];

export const laneById = (id: string) => lanes.find((l) => l.id === id)!;
export const currentLane = lanes.find((l) => l.isCurrent)!;

/**
 * Atlas — Heizen's own capability map, not any one client's.
 *
 * Research and Operations describe *this* company. Atlas describes Heizen:
 * every domain it has worked in, broken into the sub-processes a gap actually
 * gets fixed at, and which past engagement (if any) already proves the fix
 * works. A gap whose sub-process has a past project behind it is cheaper and
 * safer to promise than one nobody has built before — that is the whole
 * argument for the tab, and `Gap.precedentId` in `suvarna.ts` is where it
 * lands on Gaps.
 *
 * **Mock, on the same terms as everything else in this prototype.** The past
 * projects below are invented the way `projects.ts`'s pipeline rows are:
 * named like real Indian mid-market industry, checked against real companies
 * and moved when they collided, revenue and dates sat where a company that
 * size really sits. Kesarwani is the one entry that also appears in
 * `projects.ts` — it is a real row there (`p-kesarwani`, archived, delivered
 * Q4 FY25) and its capability record belongs here too, rather than inventing
 * a second company to avoid the overlap.
 */

export interface AtlasDomain {
  id: string;
  name: string;
  /** What this domain is, for a reader with no supply-chain background. */
  plainLine: string;
}

export interface AtlasSubdomain {
  id: string;
  domainId: string;
  name: string;
  plainLine: string;
  /** A `PastProject.id`, when Heizen has already built this somewhere. Most
      subdomains do not have one yet, and that absence is the honest state
      (§7.7) — not every corner of the territory has been walked. */
  pastProjectId?: string;
}

export interface PastProject {
  id: string;
  name: string;
  sector: string;
  /** ISO. Read with `formatDay`. */
  deliveredOn: string;
  /** What was actually built, in the words a consultant would say on a call. */
  built: string;
  /** `projects.ts`'s own id, when this past project is also a row in the
      pipeline list — Kesarwani is both a delivered engagement and a lead on
      file. Most past projects here are older than the pipeline list starts
      and carry no cross-link. */
  pipelineProjectId?: string;
}

export const atlasDomains: AtlasDomain[] = [
  {
    id: "dom-p2p",
    name: "Procure-to-pay",
    plainLine: "From raising a request to paying the supplier for it.",
  },
  {
    id: "dom-sourcing",
    name: "Sourcing and indirect spend",
    plainLine: "Who gets bought from, and whether the agreed price is the one actually paid.",
  },
  {
    id: "dom-planning",
    name: "Demand and supply planning",
    plainLine: "Deciding how much to make and hold before an order asks for it.",
  },
  {
    id: "dom-logistics",
    name: "Logistics and distribution",
    plainLine: "Moving finished goods out, and settling what distributors claim back.",
  },
  {
    id: "dom-warehouse",
    name: "Warehouse and receiving",
    plainLine: "What happens the moment goods arrive on a dock.",
  },
];

export const pastProjects: PastProject[] = [
  {
    id: "pp-kesarwani",
    name: "Kesarwani Foods",
    sector: "Packaged foods",
    deliveredOn: "2025-11-04",
    built:
      "Invoice capture off SAP MM, three-way match rebuilt against PO and GR, and a five-day vendor onboarding flow to replace a three-week one.",
    pipelineProjectId: "p-kesarwani",
  },
  {
    id: "pp-cauvery",
    name: "Cauvery Paperboard Mills",
    sector: "Paper and packaging",
    deliveredOn: "2025-06-19",
    built:
      "A supplier scorecard driven off goods-receipt rejections, so a quality problem shows up against the vendor before the next PO goes out.",
  },
  {
    id: "pp-konkan",
    name: "Konkan Marine Foods",
    sector: "Seafood processing and export",
    deliveredOn: "2025-03-27",
    built: "Freight tendering moved off phone calls onto a lane-by-lane bid sheet, re-run quarterly instead of never.",
  },
  {
    id: "pp-tarang",
    name: "Tarang Precision Forgings",
    sector: "Auto components, forging",
    deliveredOn: "2024-09-12",
    built: "Requisition and approval taken off email and WhatsApp onto a workflow with a real audit trail.",
  },
  {
    id: "pp-sahyadri",
    name: "Sahyadri Dairy Foods",
    sector: "Dairy and packaged foods",
    deliveredOn: "2024-05-30",
    built: "Payment scheduling rebuilt to catch early-payment discounts automatically instead of on whoever remembered.",
  },
  {
    id: "pp-malwa",
    name: "Malwa Auto Components",
    sector: "Auto components, Tier 2",
    deliveredOn: "2023-11-08",
    built: "Twelve indirect categories routed through contracted suppliers, closing the maverick-buying gap they had been carrying for years.",
  },
];

export const atlasSubdomains: AtlasSubdomain[] = [
  {
    id: "sub-vendor-onboarding",
    domainId: "dom-p2p",
    name: "Vendor onboarding and master data",
    plainLine: "Getting a new supplier approved and into the system cleanly.",
    pastProjectId: "pp-kesarwani",
  },
  {
    id: "sub-invoice-capture",
    domainId: "dom-p2p",
    name: "Invoice capture and three-way match",
    plainLine: "Reading an invoice in and reconciling it against the order and the goods receipt.",
    pastProjectId: "pp-kesarwani",
  },
  {
    id: "sub-payment-scheduling",
    domainId: "dom-p2p",
    name: "Payment scheduling and early-payment capture",
    plainLine: "Choosing when to pay, and catching the discount for paying sooner.",
    pastProjectId: "pp-sahyadri",
  },
  {
    id: "sub-requisition",
    domainId: "dom-p2p",
    name: "Requisition and approval",
    plainLine: "Asking to buy something, and who has to say yes before it happens.",
    pastProjectId: "pp-tarang",
  },
  {
    id: "sub-indirect-category",
    domainId: "dom-sourcing",
    name: "Indirect category management",
    plainLine: "Everything that is not raw material: packaging, MRO, services.",
    pastProjectId: "pp-malwa",
  },
  {
    id: "sub-supplier-scorecard",
    domainId: "dom-sourcing",
    name: "Supplier scorecards and quality",
    plainLine: "Tracking a vendor's own record, not just this month's rejections.",
    pastProjectId: "pp-cauvery",
  },
  {
    id: "sub-sop",
    domainId: "dom-planning",
    name: "Sales and operations planning",
    plainLine: "Turning a sales forecast into a production and stocking plan.",
  },
  {
    id: "sub-inventory",
    domainId: "dom-planning",
    name: "Inventory optimisation",
    plainLine: "Holding enough stock to cover demand, and not much more than that.",
  },
  {
    id: "sub-freight",
    domainId: "dom-logistics",
    name: "Freight procurement",
    plainLine: "Who carries the goods out, and what that costs per lane.",
    pastProjectId: "pp-konkan",
  },
  {
    id: "sub-distributor-claims",
    domainId: "dom-logistics",
    name: "Distributor claims and rebates",
    plainLine: "What a distributor says it is owed back, and whether that is checked before it is paid.",
  },
  {
    id: "sub-goods-receipt",
    domainId: "dom-warehouse",
    name: "Goods receipt posting",
    plainLine: "Recording that something arrived, at the moment it arrives rather than days later.",
  },
  {
    id: "sub-wms",
    domainId: "dom-warehouse",
    name: "Warehouse management",
    plainLine: "Knowing where a pallet actually is once it is inside the gate.",
  },
];

export const domainById = (id: string) => atlasDomains.find((d) => d.id === id);
export const subdomainById = (id: string) => atlasSubdomains.find((s) => s.id === id);
export const pastProjectById = (id: string) => pastProjects.find((p) => p.id === id);

export const subdomainsOf = (domainId: string) =>
  atlasSubdomains.filter((s) => s.domainId === domainId);

/** How much of a domain's territory Heizen has already proven.
 *
 * **Two counts, not a share.** It returned `proven / subs.length`, a fraction
 * the ring used to tint a node by. Nothing tints by fraction any more — a node
 * says "4 of 4 proven" and draws a segment per sub-process filled to the count
 * (see `CoverageBar`) — so both callers wanted the two numbers back and were
 * recomputing them beside the division nobody was ever going to quote. */
export const provenCountOf = (domainId: string) => {
  const subs = subdomainsOf(domainId);
  return { proven: subs.filter((s) => s.pastProjectId).length, total: subs.length };
};

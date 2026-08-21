import { company } from "./suvarna";
import { lanes } from "./compare";

/**
 * The projects the switcher offers.
 *
 * Meridian is project-first: you create the project, then ingest sources into
 * it (see CLAUDE.md §5). So the header's project name is a switcher, not a
 * label — moving between clients is the most common thing a consultant does
 * that is not inside one.
 *
 * Only Suvarna carries data. Kesarwani and Deccan are real entries — they are
 * the delivered and in-flight Heizen projects the Compare lanes are built from,
 * with their own sectors and status — but this prototype holds one research
 * set. They are listed with `researched: false` and the menu says so on the
 * row rather than letting someone click into an empty product and wonder what
 * broke. Same rule as the data-source connectors: designed as real, labelled
 * honestly.
 */
export type Priority = "high" | "medium" | "low";

export interface Project {
  id: string;
  name: string;
  sector: string;
  /** What state the engagement is in — shown on the row. */
  status: string;
  researched: boolean;
  /** A real logo when there is one. Until then the switcher draws a monogram
      from the name — same rule as the connectors: designed as real, labelled
      honestly, and one field away from being the real thing. */
  photoUrl?: string;
  /** Out of the working list but not deleted. A delivered engagement and a lead
      that went cold are records worth keeping — Compare reads Kesarwani —
      and a list that only ever grows is unusable by September at several new
      projects a day. Archived projects still open; they just live behind the
      Archived filter. */
  archived?: boolean;
  /** The consultant's own triage, not a pipeline claim. What "sort by priority"
      sorts on; a fresh lead arrives without one and sorts after the triaged,
      which is honest — nobody has looked at it yet. */
  priority?: Priority;

  /* ------------------------------------------------------------------------
     What the create form collects, and what the projects list shows.

     These are the *research inputs* CLAUDE.md §5 records — company, sector,
     known stakeholders, and a free-text prompt that biases the run — plus the
     two facts a list of projects has to carry to be sortable by eye: when it
     was made, and how big the company is. Deliberately not a price: a rupee
     figure with no base is §7.11's whole subject, and revenue is a stated
     input rather than a claim the pipeline made.
     --------------------------------------------------------------------- */

  /** ISO. Read with `formatDay`, so it says `6 Aug 2026` like every other date. */
  createdOn: string;
  /** The company's own site. What the pipeline reads first when there is one. */
  domain?: string;
  /** Annual revenue in ₹ Cr, as told to us. The base every claim is a share of. */
  revenueCr?: number;
  /** Who we already know we are meeting. Free text, because a first call is. */
  stakeholders?: string;
  /** The line that biases the run. "Vedanta Goa copper", not a search query. */
  prompt?: string;
}

/** "Suvarna Agro Foods" -> "SA". Two letters; three is a badge, not a mark. */
export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

const laneById = (id: string) => lanes.find((l) => l.id === id)!;

/* A Compare lane's sector carries its revenue: `Packaged foods · ₹880 Cr`. A
   project row states revenue in its own column, so taking the lane's string
   whole put the same fact on the card twice and, when the two came from
   different places, disagreeing. The head of the string is the sector. */
const sectorOf = (id: string) => laneById(id).sector.split(" · ")[0];

export const projects: Project[] = [
  {
    id: "p-suvarna",
    name: company.name,
    sector: company.sector,
    status: `Researched ${company.researchedOn} · ${company.confidence.toLowerCase()} confidence`,
    researched: true,
    priority: "high",
    createdOn: "2026-07-28",
    domain: "suvarnaagro.in",
    revenueCr: company.revenueCr,
    stakeholders: "Rohan Deshpande, Head of Procurement",
    prompt: "Procure-to-pay and vendor onboarding. Three plants, one ERP.",
  },
  {
    id: "p-kesarwani",
    name: laneById("lane-kesarwani").company,
    sector: sectorOf("lane-kesarwani"),
    status: "Delivered Q4 FY25 · invoice automation and vendor onboarding",
    researched: false,
    /* Delivered means done: the engagement is a record now, not a lead. Compare
       still reads its lane — archiving hides a project from the working list
       and touches nothing else. */
    archived: true,
    createdOn: "2025-11-04",
    domain: "kesarwanifoods.com",
    revenueCr: 880,
    stakeholders: "Finance controller, AP lead",
  },
  {
    id: "p-deccan",
    name: laneById("lane-deccan").company,
    sector: sectorOf("lane-deccan"),
    status: "In flight · further along on planning than procurement",
    researched: false,
    priority: "medium",
    createdOn: "2026-06-15",
    /* Matches the lane's company name. It said `deccanmills.in` while the name
       came from `lane-deccan`, which is Deccan **Beverages** — so the card
       showed one company and linked to another's site. The name is derived and
       the domain was typed, which is the shape this kind of error always
       takes. */
    domain: "deccanbeverages.in",
    revenueCr: 2400,
    stakeholders: "Not known yet",
  },

  /* ------------------------------------------------------------------------
     The rest of the pipeline.

     Six more companies, so the landing page reads as a consultancy's list
     rather than as a demo with one row in it. They are mock and every one of
     them says `researched: false`, which is the same rule the two real Heizen
     projects already carry and the same rule as the connectors: designed as
     real, labelled honestly. A card into an empty product is how somebody
     decides the product is broken.

     What varies is the *status*, because that is what a list of projects is
     actually scanned for. A pipeline has a call booked, a folder half
     ingested, a proposal out and one that went quiet, and nine rows all
     reading "nothing yet" would be a list with no shape to it.

     Some carry no stakeholder and no prompt on purpose. Empty is normal
     (§7.7): a first lead is a company name and a sector, and the form asks for
     nothing else.

     **They are drawn to look like the companies Heizen actually sells to, and
     they are deliberately not real ones.** Two rules, and both are load-bearing
     on a product demoed to investors and prospective clients:

     - **Named like real Indian mid-market industry**, because that is what makes
       a pipeline read as a pipeline. Founder or deity name, or a place, plus
       what the company makes: `Anjani Textile Mills`, `Nandi Precision
       Components`. Sectors are how the industry describes itself rather than
       how a taxonomy would, revenue sits where a company that size really sits,
       the domain matches the name and takes the TLD an Indian company of that
       size really uses, and the statuses are the states a real CRM holds — a
       call booked, a folder half ingested, a proposal out, one gone quiet.
     - **Checked against real companies, and moved when they collided.**
       `Coromandel Cold Chain` and `Meghna Steel Tubes` went, because Coromandel
       International and the Meghna Group are real businesses and every one of
       these rows carries an invented revenue, an invented contact and an
       invented claim about a commercial relationship with Heizen. Attaching
       that to a company somebody can look up is a fabricated record about a
       real third party, on a screen shown to outsiders. **If these are ever
       swapped for the real pipeline, the names have to come from Heizen and the
       findings have to come from the pipeline** — not one of each.
     --------------------------------------------------------------------- */
  {
    id: "p-anjani",
    name: "Anjani Textile Mills",
    sector: "Cotton spinning and knitwear",
    status: "Call booked 18 Aug · nothing ingested yet",
    researched: false,
    priority: "high",
    createdOn: "2026-08-04",
    domain: "anjanitextiles.co.in",
    revenueCr: 1182,
    stakeholders: "Priya Nair, COO",
    prompt: "Cotton sourcing and dyeing at Tiruppur. Two units, heavy job work.",
  },
  {
    id: "p-nandi",
    name: "Nandi Precision Components",
    sector: "Auto components, Tier 1",
    status: "Sources arriving · three files in, transcripts to come",
    researched: false,
    priority: "medium",
    createdOn: "2026-07-30",
    domain: "nandiprecision.in",
    revenueCr: 2240,
    stakeholders: "Arun Kulkarni, Head of Supply Chain",
    prompt: "Tier 1 into Chakan. Schedule adherence and inbound freight.",
  },
  {
    id: "p-sagar",
    name: "Sagar Cold Chain",
    sector: "Cold chain and warehousing",
    status: "First call done · waiting on the ERP export",
    researched: false,
    priority: "medium",
    createdOn: "2026-07-12",
    domain: "sagarcoldchain.com",
    revenueCr: 613,
    stakeholders: "Vikram Rao, CFO",
  },
  {
    id: "p-girija",
    name: "Girija Pharmaceuticals",
    sector: "Pharmaceutical formulations",
    status: "Proposal out · decision expected in September",
    researched: false,
    priority: "high",
    createdOn: "2026-05-22",
    domain: "girijapharma.in",
    revenueCr: 1645,
    stakeholders: "Meera Iyer, Head of Quality",
    prompt: "Batch release and supplier qualification at Baddi. Regulated, so evidence matters.",
  },
  {
    id: "p-jaidev",
    name: "Jaidev Steel Tubes",
    sector: "Steel tubes and fabrication",
    status: "Lead only · sector and name, nothing else yet",
    researched: false,
    createdOn: "2026-08-08",
    revenueCr: 4120,
  },
  {
    id: "p-anantha",
    name: "Anantha Speciality Chemicals",
    sector: "Speciality chemicals",
    status: "Gone quiet since April · worth one more call",
    researched: false,
    priority: "low",
    createdOn: "2026-02-19",
    domain: "ananthachem.in",
    revenueCr: 1930,
    stakeholders: "Procurement head, since moved on",
  },

  /* Two leads from this week and one lost deal, because the filters have to be
     demoable: Recent needs rows created days ago, Archived needs more than the
     one delivered engagement, and a pipeline taking several new projects a day
     should look like one. Jaidev and these two carry no priority on purpose —
     untriaged is a real state and it sorts last, where it belongs. */
  {
    id: "p-keshav",
    name: "Keshav Industrial Fasteners",
    sector: "Fasteners and forgings",
    status: "Created yesterday · intro call being scheduled",
    researched: false,
    createdOn: "2026-08-10",
    domain: "keshavfasteners.in",
    revenueCr: 740,
    stakeholders: "Sandeep Joshi, Plant Head",
  },
  {
    id: "p-malhar",
    name: "Malhar Agro Equipment",
    sector: "Farm equipment and implements",
    status: "Lead only · came in through the Pune reference",
    researched: false,
    createdOn: "2026-08-09",
    revenueCr: 1510,
  },
  {
    id: "p-rukmini",
    name: "Rukmini Packaging Films",
    sector: "Flexible packaging",
    status: "Went with a competitor in March · kept for the record",
    researched: false,
    archived: true,
    priority: "low",
    createdOn: "2025-12-18",
    domain: "rukminifilms.com",
    revenueCr: 960,
    stakeholders: "CFO, led the evaluation",
  },
];

export const currentProject = projects[0];

/**
 * Who is signed in, shown at the foot of the project menu.
 *
 * The email is the identity and the name is not invented from it — an address
 * is not a display name, and a prototype that guesses one is showing a person
 * something untrue about themselves. `photoUrl` renders a real picture the
 * moment there is one; until then the monogram stands in.
 */
export interface Account {
  email: string;
  role: string;
  photoUrl?: string;
}

export const account: Account = {
  email: "sai@heizen.work",
  role: "Design",
};

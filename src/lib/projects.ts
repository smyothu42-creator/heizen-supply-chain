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
    createdOn: "2026-06-15",
    domain: "deccanmills.in",
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
     --------------------------------------------------------------------- */
  {
    id: "p-rajdhani",
    name: "Rajdhani Textiles",
    sector: "Textiles and apparel",
    status: "Call booked 18 Aug · nothing ingested yet",
    researched: false,
    createdOn: "2026-08-04",
    domain: "rajdhanitextiles.com",
    revenueCr: 1450,
    stakeholders: "Priya Nair, COO",
    prompt: "Cotton sourcing and dyeing. Two units, heavy job work.",
  },
  {
    id: "p-nandi",
    name: "Nandi Auto Components",
    sector: "Auto components",
    status: "Sources arriving · three files in, transcripts to come",
    researched: false,
    createdOn: "2026-07-30",
    domain: "nandiauto.in",
    revenueCr: 3100,
    stakeholders: "Head of Supply Chain, plant finance",
    prompt: "Tier 1 supplier. Schedule adherence and inbound freight.",
  },
  {
    id: "p-coromandel",
    name: "Coromandel Cold Chain",
    sector: "Cold chain logistics",
    status: "First call done · waiting on the ERP export",
    researched: false,
    createdOn: "2026-07-12",
    domain: "coromandelcoldchain.com",
    revenueCr: 640,
    stakeholders: "Vikram Rao, CFO",
  },
  {
    id: "p-girija",
    name: "Girija Pharma",
    sector: "Pharmaceutical manufacturing",
    status: "Proposal out · decision expected in September",
    researched: false,
    createdOn: "2026-05-22",
    domain: "girijapharma.in",
    revenueCr: 1980,
    stakeholders: "Head of Quality, procurement lead",
    prompt: "Batch release and supplier qualification. Regulated, so evidence matters.",
  },
  {
    id: "p-meghna",
    name: "Meghna Steel Tubes",
    sector: "Steel and metal fabrication",
    status: "Lead only · sector and name, nothing else yet",
    researched: false,
    createdOn: "2026-08-08",
    revenueCr: 5200,
  },
  {
    id: "p-anantha",
    name: "Anantha Speciality Chemicals",
    sector: "Speciality chemicals",
    status: "Gone quiet since April · worth one more call",
    researched: false,
    createdOn: "2026-02-19",
    domain: "anantha-chem.in",
    revenueCr: 2750,
    stakeholders: "Procurement head, since moved on",
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

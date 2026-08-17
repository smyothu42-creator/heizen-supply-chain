/**
 * The seven readings of one research set, and the tab row that carries them.
 *
 * **This list was renamed and re-cut on request**, from nine directions named
 * after the *axis* they sorted by — All, About, Leaks, Idea Build, Tech stack,
 * Solved before, Financial, Risk, Stakeholder — to seven named after the
 * *subject* a consultant is looking for. The difference matters more than it
 * sounds: "Financial" tells you how the page is organised, "Likely spend areas"
 * tells you what you will find on it, and only the second is a thing anybody
 * arrives wanting.
 *
 * The order is the order of a first conversation: who they are, what the
 * business looks like, what they are already doing about it, what it runs on,
 * what we would build, who decides, and who else is in the room.
 *
 * **Four came back**, on request, after a pass that cut the row to seven:
 * Operation leaks, Financial, Idea build and Already insight. Financial is the
 * one that had to: it is the only screen with room to show a price with its
 * base, its rate and its range (§7.11), and Gaps carries no money *because*
 * that screen exists.
 *
 * **Likely spend areas gained a screen of its own in the same pass.** It had
 * been pointing at Idea build, which was fine while that direction was off the
 * row and wrong the moment it came back: two tabs cannot share one component
 * without one of them being a lie. They are genuinely different questions and
 * now have different answers — Idea build is *what would get built*, Likely
 * spend areas is *where the money is and how much of it is inside software they
 * have already paid for*.
 *
 * **Two are still off the row and still in the tree.** `Risk.tsx` carried the
 * counter rule, and Prep's second-call stage shows the incumbent risk with its
 * counter; `All.tsx` was the everything-at-once landing, which Prep now does
 * better and with a time budget on it. Restoring either is one entry here and
 * one line in the route's view map.
 */

export type DirectionSlug =
  | "company"
  | "context"
  | "initiatives"
  | "leaks"
  | "tech"
  | "vendors"
  | "money"
  | "spend"
  | "build"
  | "solved"
  | "stakeholder";
export type ViewMode = "brief" | "full";

/**
 * The four groups the eleven directions come in, and the reason they exist.
 *
 * Eleven tabs is 1447px of row against the 1203 a 1440 window leaves, so the
 * last two sat behind a horizontal swipe on a desktop — which is the hiding
 * place a tab row is supposed to avoid. Grouping them into four dropdowns takes
 * the row to about 700px and, more usefully, says something true: these are not
 * eleven equal choices, they are four subjects with two or three readings each.
 *
 * The order inside a group is the order you would read them.
 */
import { Building2, IndianRupee, Megaphone, Network, type LucideIcon } from "lucide-react";

export type DirectionGroup = "company" | "operation" | "money" | "pitch";

export const GROUP_LABEL: Record<DirectionGroup, string> = {
  company: "The company",
  operation: "The operation",
  money: "The money",
  pitch: "The pitch",
};

/**
 * A mark per category in the navigator, the same job the surface tabs' icons do
 * in the masthead: at a glance you are aiming at a shape rather than reading
 * four labels that all begin with the same word.
 *
 * **`Network` is deliberately the masthead's Operations glyph.** The navigator's
 * operation category and the Operations surface are the same subject, and two
 * different marks for one idea is worse than one mark used twice.
 *
 * The icon is decoration in the accessibility sense and carries `aria-hidden`:
 * the label beside it is the name, and a category is not pressable.
 */
export const GROUP_ICON: Record<DirectionGroup, LucideIcon> = {
  pitch: Megaphone,
  company: Building2,
  operation: Network,
  money: IndianRupee,
};

/**
 * **The pitch leads.** The other three groups are what the company *is* — who
 * they are, how they run, what it costs them — and they were ordered as a
 * researcher assembles them rather than as a consultant reads them. What a
 * consultant opens Research to find is what to say, and the three readings that
 * answer that were at the bottom of a list long enough to scroll.
 *
 * The rest keep their order, which is still the order you would build the
 * argument in if you were building it rather than delivering it.
 */
export const GROUP_ORDER: DirectionGroup[] = ["pitch", "company", "operation", "money"];

export interface Direction {
  slug: DirectionSlug;
  /** Which dropdown it lives under. */
  group: DirectionGroup;
  /** What the chip says. Short enough for a row of seven on one line. */
  name: string;
  strap: string;
  axis: string;
  principle: string;
  optimisesFor: string;
  sacrifices: string;
}

export const directions: Direction[] = [
  {
    slug: "company",
    group: "company",
    name: "Company",
    strap: "Who they are, and what we have looked at",
    axis: "The company",
    principle:
      "Who this business is in one screen, and an honest account of how much of it has been researched. It makes no argument: nothing here is a finding, which is why it opens the row rather than closing it.",
    optimisesFor:
      "The reader arriving cold, and the coverage question §7.14 exists for: a total is only a total of what was looked at, and this is the one screen where that is the subject rather than a footnote.",
    sacrifices:
      "Everything quantitative. The numbers about the business are one tab across, on purpose: this screen answers who, and that one answers how big.",
  },
  {
    slug: "context",
    group: "company",
    name: "Business context",
    strap: "What they earn, sell, buy and run",
    axis: "The numbers about the business",
    principle:
      "Seventeen facts in four groups: size and profit, who they sell to, who they buy from, and how much operation there is. Every one carries what it should be measured against and whose number it is, because a figure off a filing and one we modelled from sector structure look identical on a slide.",
    optimisesFor:
      "The first minute of a call, and the sentence a consultant has to be able to say about a company he met yesterday.",
    sacrifices:
      "It is reference rather than argument. Nothing on it is a finding either, and read alone it is a fact sheet.",
  },
  {
    slug: "initiatives",
    group: "company",
    name: "AI initiatives",
    strap: "What they have already started, and when",
    axis: "Signals off the company",
    principle:
      "Six signals read off the company rather than off the findings: who joined recently, what they have committed to in public, what they are hiring for, what the systems estate has to do before 2027, when the budget closes, and what else is competing for the same money. Each one is scored on whether it pushes a decision towards now or away from it.",
    optimisesFor:
      "The two questions no other direction answers, and the ones asked on every call: why now, and what are they already doing about it. It is also the only direction that survives a first call where nothing has been shared, because it is built from public signal.",
    sacrifices:
      "It carries no rupee figure and never will. The money belongs where it can show its base, and a total here would be a fourth place the same number appears.",
  },
  {
    slug: "leaks",
    group: "operation",
    name: "Operation leaks",
    strap: "Where the operation loses time and control",
    axis: "The process",
    principle:
      "The findings as failures of process rather than as prices: where a hand-off drops, where a control does not exist, and where somebody is paid to hold open the gap between the physical world and the record of it. It is the same twelve findings the money screen decomposes, read as an operator would read them.",
    optimisesFor:
      "The conversation with whoever runs the function, who recognises a broken hand-off long before they accept a modelled number.",
    sacrifices:
      "The commercial case. Nothing here is priced, which is the point and also the reason it cannot be the only screen anybody sees.",
  },
  {
    slug: "tech",
    group: "operation",
    name: "Tech stack",
    strap: "What they run, and what it does not do",
    axis: "The systems",
    principle:
      "The axis is the machine underneath. Nine systems, in three groups: what is live, what is being worked around, and what was never bought. Every finding is filed under the one system where the work actually lands on a person, so the subtotals add and the shape of the estate is itself the finding.",
    optimisesFor:
      "The scoping question, which no other direction answers: what would we be building on. It is the first thing an engineer asks and the first thing a client asks back.",
    sacrifices:
      "It is the least emotive screen in the set. Nobody was ever moved by a module list, and read badly it is an IT audit rather than a commercial case.",
  },
  {
    slug: "vendors",
    group: "operation",
    name: "Relevant vendors",
    strap: "Who supplies what, and who else has a say",
    axis: "The suppliers of the estate",
    principle:
      "Who is behind each system today, who runs it for them, and where nobody is behind it at all. The incumbent is named with the sentence that answers it, because a partner who reads this as encroachment gets to say so first and usually does.",
    optimisesFor:
      "The question that follows 'what do you run on' within a sentence, and decides who else has a veto on this deal.",
    sacrifices:
      "It is short, and it is about our position rather than their operation. Nothing on it is a finding about the client.",
  },
  {
    slug: "money",
    group: "money",
    name: "Financial",
    strap: "Where the ₹9.1 Cr goes",
    axis: "The money",
    principle:
      "The dossier as a decomposition of one number. Everything on screen exists because it explains a slice of the leakage figure, and the reconciliation sits above the slices because they add to more than the headline: two findings share a root cause and cannot both bank the full saving.",
    optimisesFor:
      "The only screen in the product with room to show a price with its base, its rate and its range. Gaps carries no money because this one does.",
    sacrifices:
      "It leads with a number nobody has verified yet. Read without the confidence line it is a claim rather than a model, which is why that line is on the first screen and not the third.",
  },
  {
    slug: "spend",
    group: "money",
    name: "Likely spend areas",
    strap: "What we would build, one per problem",
    axis: "The work",
    principle:
      "Four workflows, one per part of the operation, covering the findings between them. Everything sits on top of the ERP they already own: no new system to license, no plant downtime, which is the shape of the first phase rather than a wish list.",
    optimisesFor:
      "The question a client asks straight after agreeing there is a problem, which is what would actually get built and where the money would go.",
    sacrifices:
      "Honesty about sequencing, unless it is read next to the plan on Gaps. Four workflows listed side by side imply four projects that could start on Monday, and three of them depend on something else landing first.",
  },
  {
    slug: "build",
    group: "pitch",
    name: "Idea build",
    strap: "The workflows, one per problem",
    axis: "The work",
    principle:
      "Four workflows, one per part of the operation, covering the findings between them. Everything sits on top of the ERP they already own: no new system to license, no module to buy, no plant downtime.",
    optimisesFor:
      "The question a client asks straight after agreeing there is a problem, which is what would actually get built.",
    sacrifices:
      "Honesty about sequencing, unless it is read next to the plan on Gaps. Four workflows side by side imply four projects that could start on Monday, and three of them depend on something else landing first.",
  },
  {
    slug: "solved",
    group: "pitch",
    name: "Already insight",
    strap: "The same problem, at two other companies",
    axis: "Proof",
    principle:
      "The comparable engagements with their numbers beside this client's. Kesarwani Foods is delivered and Deccan Beverages is in flight, both in food and beverage at comparable turnover, and both were bought for the reasons this one would be.",
    optimisesFor:
      "The credibility question, which arrives on every first call. It is also the only direction built from Heizen's own record rather than the client's, so it needs no research to be true.",
    sacrifices:
      "It says nothing about this company. Used early it reads as a pitch deck; its place is after a problem has been agreed. Compare's *Built before* now quantifies the same two projects finding by finding, so this is the narrative version of a reading that exists in numbers elsewhere.",
  },
  {
    slug: "stakeholder",
    group: "pitch",
    name: "Stakeholders",
    strap: "Who is in the room",
    axis: "The person",
    principle:
      "The same findings under every name. What changes is the order, the wording and what to avoid: the Head of Procurement and the CFO are shown the same twelve things in two different sequences, because the thing that persuades one is the thing that irritates the other.",
    optimisesFor:
      "The minutes before a specific meeting, which is the moment this product exists for.",
    sacrifices:
      "It is the direction that degrades worst when the meeting is with somebody we have not met, which is most first calls.",
  },

];

/** The directions in one group, in the order they are written. */
export const directionsInGroup = (group: DirectionGroup) =>
  directions.filter((d) => d.group === group);

export const directionBySlug = (slug: string) =>
  directions.find((d) => d.slug === slug);

export const isDirectionSlug = (v: string): v is DirectionSlug =>
  directions.some((d) => d.slug === v);
export const isViewMode = (v: string): v is ViewMode => v === "brief" || v === "full";

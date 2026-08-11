/**
 * The six organising principles. Each one is a different axis the whole
 * Research tab is sorted by — money, the call, urgency, exposure, certainty or
 * person. They are not six layouts of the same thing; picking one changes what
 * is on the first screen. See CLAUDE.md section 6: breadth before depth.
 *
 * **Timing and Risk answer the two questions the other four cannot.** Money,
 * Call, Certainty and Stakeholder are all sorted views of the same finding set:
 * what is wrong, what it is worth, how sure we are, whose problem it is. None
 * of them answers *why now*, and none of them answers *what could kill this* —
 * which are the two things a consultant is asked on every call and has been
 * answering from memory.
 *
 * Order matters and is not alphabetical: Money and Call are what you open
 * before a call, Timing and Risk are what you need in it, Certainty and
 * Stakeholder are what you check afterwards.
 */

export type DirectionSlug =
  | "all"
  | "about"
  | "leaks"
  | "build"
  | "tech"
  | "solved"
  | "money"
  | "risk"
  | "stakeholder";
export type ViewMode = "brief" | "full";

export interface Direction {
  slug: DirectionSlug;
  /**
   * What the chip says. One word, no hyphen.
   *
   * These were "Money-first", "Call-first", "Certainty-first" and
   * "Stakeholder-first" — 419px of track, which scrolled at 375px and cut
   * Stakeholder off. The "-first" was doing no work the context did not
   * already do: the nav is labelled "Research directions" and the band above
   * it says "Research", so four nouns are unambiguous and fit one line on a
   * phone. **They are still Money-first and so on in comments and in
   * CLAUDE.md** — the long form is the internal name, the way Meridian is the
   * internal name for the Heizen Discovery Tool.
   */
  name: string;
  strap: string;
  axis: string;
  principle: string;
  optimisesFor: string;
  sacrifices: string;
}

export const directions: Direction[] = [
  {
    slug: "all",
    name: "All",
    strap: "Everything, on one page",
    axis: "Nothing",
    principle:
      "The default, and the only direction with no axis at all: every topic at once, in the order a consultant meets them. It exists because picking an axis is itself a decision, and arriving at Research with no particular errand should not require making one before you can read anything.",
    optimisesFor:
      "The first thirty seconds, and the reader who does not yet know which of the other views they want. Its Brief is the one-page summary that leaves the tool.",
    sacrifices:
      "Depth on every axis. Each topic gets its headline and a way in, which is the right trade for a landing page and the wrong one for the work itself.",
  },
  {
    slug: "about",
    name: "About",
    strap: "Who they are, and what we have looked at",
    axis: "The company",
    principle:
      "The facts about the business, and an honest account of how much of it has been researched. Revenue, plants, systems, headcount, volume — and against them the five stages of the value chain with what was covered in each.",
    optimisesFor:
      "The reader arriving cold, and the coverage question §7.14 exists for: a total is only a total of what was looked at, and this is the one screen where that is the subject rather than a footnote.",
    sacrifices:
      "It makes no argument. Nothing here is a finding, which is why it sits last.",
  },
  {
    slug: "leaks",
    name: "Leaks",
    strap: "Where the operation loses time and control",
    axis: "The operation",
    principle:
      "The same findings as Financial, read as failures of the operation rather than as slices of a number. Grouped by the stage of the value chain they happen in, with no rupee figure anywhere: what is going wrong, where, and how sure we are it is real.",
    optimisesFor:
      "The operator in the room rather than the buyer. A plant head or a VP of supply chain does not think in leakage; they think in the step that keeps breaking, and this is the only view that puts the stage first.",
    sacrifices:
      "The commercial argument. Without the money it is a list of complaints, which is why it sits next to Financial rather than instead of it.",
  },
  {
    slug: "build",
    name: "Idea Build",
    strap: "The workflows, one per problem",
    axis: "The proposal",
    principle:
      "Every finding paired with the thing Heizen would actually deploy against it, in the voice the one-pager uses: we monitor, we connect, we give. One workflow per area of the operation, each naming the findings it covers and what it changes.",
    optimisesFor:
      "The question that follows every good discovery call, which no other direction answers: so what would you build. It is also the only screen a consultant can send after the call without editing.",
    sacrifices:
      "Honesty about sequencing, unless it is read next to the plan on Gaps. Four workflows listed side by side imply four projects that could start on Monday, and three of them depend on something else landing first.",
  },
  {
    slug: "tech",
    name: "Tech stack",
    strap: "What they run, and what it does not do",
    axis: "The systems",
    principle:
      "The axis is the machine underneath. Nine systems, in three groups: what is live, what is being worked around, and what was never bought. Every finding is filed under the one system where the work actually lands on a person, so the subtotals add and the shape of the estate is itself the finding — six of the twelve gaps sit inside software they already own, and the other six, in the space between, are worth nearly twice as much.",
    optimisesFor:
      "The scoping question, which no other direction answers: what would we be building on. It is the first thing an engineer asks and the first thing a client asks back, and until now it was answered from memory. It is also the most concrete argument in the product for buying automation rather than more people, because it names the process that has no system at all and the person absorbing it.",
    sacrifices:
      "It is the least emotive screen in the set. Nobody was ever moved by a module list, and read badly it is an IT audit rather than a commercial case, which is the opposite of what §1 says this product is for. It is also the direction that ages fastest: one module bought and the shape of it changes, where a gap or a stakeholder view survives a year.",
  },
  {
    slug: "solved",
    name: "Solved before",
    strap: "The same problem, at two other companies",
    axis: "Proof",
    principle:
      "The comparable engagements, with their numbers beside this client's. Kesarwani Foods is delivered and Deccan Beverages is in flight, both in food and beverage at comparable turnover, and both were bought for the same reasons this one would be.",
    optimisesFor:
      "The credibility question, which arrives on every first call and is currently answered from memory. It is also the only direction built from Heizen's own record rather than from the client's, so it needs no research to be true.",
    sacrifices:
      "It says nothing about this company. Used early it reads as a pitch deck; its place is after a problem has been agreed, not before.",
  },
  {
    slug: "money",
    name: "Financial",
    strap: "Where the ₹9.1 Cr goes",
    axis: "Rupees",
    principle:
      "The dossier is not a document about a company; it is a decomposition of one number. ₹9.1 Cr sits at the top and everything below it exists because it explains a slice of that number. Revenue, ERP, plants, supplier count — none get a section of their own. They appear underneath the leakage item they explain.",
    optimisesFor:
      "The commercial job. Aryan opens it and the first thing on screen is a number he can say out loud, already broken into where it leaks from. It also makes “every number carries its benchmark” structural rather than decorative — a slice of leakage is defined by the gap between actual and best-in-class, so the comparator cannot be dropped.",
    sacrifices:
      "Anything that does not convert to rupees becomes homeless — a new CPO, a plant expansion, a competitor win. Those are useful on a call and this structure has nowhere to put them. It also risks sounding presumptuous: leading with “you are losing ₹9.1 Cr” can land badly with a defensive stakeholder. It also has to carry a total that is smaller than the sum of its own sections, because savings that share a root cause do not add — that reconciliation costs a block of first-screen space no other direction spends.",
  },
  {
    slug: "risk",
    name: "Risk",
    strap: "What could kill this, and what to say",
    axis: "Exposure",
    principle:
      "The axis is what goes wrong. Six things that could stop the deal, ordered by severity, each one paired with the line to say when it is raised. The pairing is the structure and not a nicety: a risk and its counter are one object here, and the screen cannot render half of it.",
    optimisesFor:
      "The moment the call turns. Every other direction prepares Aryan for a conversation that goes well; this is the only one that prepares him for the incumbent vendor, the dead 2019 project and the CFO who says they will build it in-house. It is also the direction that most obviously could not have been written by the client, which is what makes it feel like research rather than a brochure.",
    sacrifices:
      "It is the easiest to get wrong tonally, and the only direction that is actively harmful when it is incomplete: a risk with no counter leaves a consultant more frightened than before he read it, which is worse than not having the screen. It is also the least reusable across accounts, because a counter is specific to a company's own history.",
  },
  {
    slug: "stakeholder",
    name: "Stakeholder",
    strap: "Who is in the room",
    axis: "Person",
    principle:
      "The axis is the person being met. Pick Rohan Deshpande and the entire dossier re-sorts to what he owns, what he is measured on, the gaps that hit his number, the questions to ask him, and what lands badly with him specifically. The same twelve gaps are present throughout; only their order and framing change.",
    optimisesFor:
      "The actual first meeting, which is with one person and not with a company. It is the only direction that answers “what does this individual care about” rather than “what is true about this business”, and the only one where the same finding is deliberately worded differently depending on who hears it.",
    sacrifices:
      "It collapses when Aryan does not know who he is meeting, which is common — there is a fallback state here, but it is a weaker screen than the other three. It also risks over-fitting: four stakeholder views of twelve gaps is a lot of surface for Jeet to build and for the pipeline to generate well.",
  },
];

export const directionBySlug = (slug: string) =>
  directions.find((d) => d.slug === slug);

export const isDirectionSlug = (v: string): v is DirectionSlug =>
  directions.some((d) => d.slug === v);
export const isViewMode = (v: string): v is ViewMode => v === "brief" || v === "full";

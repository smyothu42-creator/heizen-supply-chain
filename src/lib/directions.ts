/**
 * The four organising principles. Each one is a different axis the whole
 * Research tab is sorted by — money, time, certainty, or person. They are not
 * four layouts of the same thing; picking one changes what is on the first
 * screen. See CLAUDE.md section 6: breadth before depth.
 */

export type DirectionSlug = "money" | "call" | "certainty" | "stakeholder";
export type ViewMode = "brief" | "full";

export interface Direction {
  slug: DirectionSlug;
  name: string;
  strap: string;
  axis: string;
  principle: string;
  optimisesFor: string;
  sacrifices: string;
}

export const directions: Direction[] = [
  {
    slug: "money",
    name: "Money-first",
    strap: "Where the ₹14.7 Cr goes",
    axis: "Rupees",
    principle:
      "The dossier is not a document about a company; it is a decomposition of one number. ₹14.7 Cr sits at the top and everything below it exists because it explains a slice of that number. Revenue, ERP, plants, supplier count — none get a section of their own. They appear underneath the leakage item they explain.",
    optimisesFor:
      "The commercial job. Aryan opens it and the first thing on screen is a number he can say out loud, already broken into where it leaks from. It also makes “every number carries its benchmark” structural rather than decorative — a slice of leakage is defined by the gap between actual and best-in-class, so the comparator cannot be dropped.",
    sacrifices:
      "Anything that does not convert to rupees becomes homeless — a new CPO, a plant expansion, a competitor win. Those are useful on a call and this structure has nowhere to put them. It also risks sounding presumptuous: leading with “you are losing ₹14.7 Cr” can land badly with a defensive stakeholder.",
  },
  {
    slug: "call",
    name: "Call-first",
    strap: "The next 30 minutes",
    axis: "Time",
    principle:
      "The axis is the conversation itself, in order. Research is laid out as the shape a discovery call actually takes: how to open, what establishes that you know their world, what to probe, what a bad answer tells you, and where it goes next. The dossier facts still exist, but they sit inside the moment of the call where you would use them.",
    optimisesFor:
      "Recall under pressure. It is the only direction where the structure of the screen matches the structure of the task, so Aryan does not translate between them mid-call. It is also the most forgiving of a non-expert — jargon is glossed at the exact point he would have to say the word out loud.",
    sacrifices:
      "It is a poor reference document. Send a colleague a link and ask for “their revenue” and there is no obvious place to look. It bakes in one opinionated call shape that a consultant with their own method will fight. And it is the weakest for the investor demo, because it reads as a script rather than as evidence of a research engine.",
  },
  {
    slug: "certainty",
    name: "Certainty-first",
    strap: "What you can say, and what to check",
    axis: "Confidence",
    principle:
      "The axis is confidence. Everything Meridian believes is sorted into three tiers: confirmed, traced to a filing or a transcript line; inferred, reasoned from sector patterns rather than their data; and unverified, a plausible guess that needs asking about. Evidence sits inline rather than hidden, because the tier is only meaningful with the basis attached.",
    optimisesFor:
      "Credibility — the thing that destroys the product when it fails. Aryan can see which sentences are safe to assert and which need “am I right that…?” in front of them. It makes the four sources and the medium-high rating do real work instead of sitting in a badge, and it turns unverified items into the questions to ask.",
    sacrifices:
      "It sorts by certainty, not importance, so a low-confidence ₹2.1 Cr finding sits below a high-confidence ₹50 L one — backwards, commercially. It asks more of the reader: three tiers is a concept to learn before the screen is useful. And an investor seeing a large unverified column may read it as the product being unsure of itself rather than being honest.",
  },
  {
    slug: "stakeholder",
    name: "Stakeholder-first",
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

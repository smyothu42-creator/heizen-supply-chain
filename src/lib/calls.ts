import { money, pluralise } from "./format";
import {
  company,
  coverage,
  gaps,
  questionsWhen,
  sources,
  spendBase,
  stakeholderById,
  stakeholders,
  systemsByState,
  timingSignalById,
  urgency,
  dealRisks,
} from "./suvarna";
import { reusedGaps, reusedValueCr } from "./compare";
import { buildOrder } from "./recommend";

/* --------------------------------------------------------------------------
   The two calls, and what to lead with on each.

   **These are agendas, not a thirteenth and fourteenth reading.** Every line
   below is read off the same data the direction it points at renders, and the
   only thing authored here is the *order* and the sentence saying why an area
   earns a minute on that particular call. Writing the material out again would
   be a third copy of the dossier, and the first one to go stale.

   **Why two, and why they are different lists rather than one list twice.**
   An intro call and a discovery call are different jobs. The first is
   twenty minutes with somebody who has not decided whether we are worth a
   second meeting: it is about them, it makes no claim we cannot back, and its
   success condition is another call. The second is with somebody who has
   already given us that call: it is about what is wrong, what it is worth and
   what we would have to see to be sure, and its success condition is a scope.
   Leading a discovery call with a company overview wastes the half hour;
   leading an intro call with a modelled rupee figure loses the room.
   ----------------------------------------------------------------------- */

export interface CallItem {
  /** Reading order, and it is the argument. */
  n: number;
  title: string;
  /** Why this earns a minute on *this* call. Authored. */
  why: string;
  /** What to actually say, read off the data. Never authored twice. */
  say: string;
  /** Where the material lives. */
  href: string;
  hrefLabel: string;
}

const PERSON = stakeholderById("sh-rohan");
const NOT_MET = stakeholders.filter((s) => !s.met);
const NOT_RESEARCHED = coverage.filter((c) => c.state === "not-researched").map((c) => c.stage);
const LIVE = systemsByState("live");
const OUTSIDE = [...systemsByState("workaround"), ...systemsByState("missing")];
const FIRST_BUILD = buildOrder()[0];
const THIS_CALL = questionsWhen("this-call");
const DATA_REQUESTS = questionsWhen("data-request");
const OPEN_RISKS = [...dealRisks].sort((a, b) =>
  a.severity === b.severity ? 0 : a.severity === "high" ? -1 : 1,
);

/**
 * The intro call: nine areas, in the order they are reached for.
 *
 * The list of nine was given rather than derived, and the order is the given
 * one. What it happens to be — and this is the argument for the tab existing
 * at all — is nine of the eleven Research directions, sequenced. The two it
 * leaves out are the two an intro call must not open with: the money, which is
 * modelled, and what we would build, which is a proposal to somebody who has
 * not agreed there is a problem.
 */
export const introCall: CallItem[] = [
  {
    n: 1,
    title: "Company overview",
    why: "Open on them, not on us. Thirty seconds proving the homework was done buys the other nineteen minutes.",
    say: `${company.name}, ${company.sector.toLowerCase()}, ${money(company.revenueCr)} of revenue. Researched ${company.researchedOn} from public filings and the calls so far.`,
    href: "/research/company/brief",
    hrefLabel: "Company",
  },
  {
    n: 2,
    title: "Business context",
    why: "The one or two numbers that show you understand the shape of the business rather than its logo.",
    say: `${money(spendBase.directCr)} of direct material, ${money(spendBase.indirectCr)} of indirect and ${money(spendBase.freightCr)} of freight. Revenue is theirs; the split is our estimate from sector structure, and saying so is the point.`,
    href: "/research/context/brief",
    hrefLabel: "Business context",
  },
  {
    n: 3,
    title: "Stakeholder role",
    why: "What this person is measured on decides which of the nine areas is worth spending the call on.",
    /* `owns` as authored, not lowercased into the sentence. The list starts
       "Sourcing and RFQ", and the tidier clause spelled it "rfq" — the third
       time this exact fix has been needed in this product, after "sap" and
       "₹53 cr". Domain terms and units do not survive being case-folded to fit
       a sentence, so nothing in this file folds one. */
    say: `${PERSON.name}, ${PERSON.role}, owns ${PERSON.owns.slice(0, 3).join(", ")}. ${PERSON.avoid}`,
    href: "/research/stakeholder/brief",
    hrefLabel: "Stakeholder",
  },
  {
    n: 4,
    title: "AI and tech interest",
    why: "What they have already started. It is the difference between a cold pitch and joining something in motion.",
    say: `${timingSignalById("t-hiring").items[0].text} ${urgency.because}`,
    href: "/research/initiatives/brief",
    hrefLabel: "AI initiatives",
  },
  {
    n: 5,
    title: "Spend areas",
    why: "Where the money moves, without pricing anything. A category is a safe subject; a modelled saving is not.",
    say: `Indirect at ${money(spendBase.indirectCr)} and freight at ${money(spendBase.freightCr)} are where process rather than price decides the number. No figure of ours is worth saying out loud on a first call.`,
    href: "/research/spend/brief",
    hrefLabel: "Likely spend areas",
  },
  {
    n: 6,
    title: "Current systems",
    why: "The scoping question, asked early and cheaply: what would anything we do have to live on.",
    say: `${company.erp}, with ${pluralise(LIVE.length, "system", "systems")} live. Anything we build goes on top of it, so there is no new ERP in this conversation.`,
    href: "/research/tech/brief",
    hrefLabel: "Tech stack",
  },
  {
    n: 7,
    title: "Relevant vendors",
    why: "Somebody already holds this estate. Say it before they do, or the call ends as a threat to a partner.",
    say: `One partner runs the estate. Nothing we do replaces them: it lands as configuration and process inside what they already hold. ${pluralise(OUTSIDE.length, "part", "parts")} of the operation has nobody selling to it at all.`,
    href: "/research/vendors/brief",
    hrefLabel: "Relevant vendors",
  },
  {
    n: 8,
    title: "Similar past work",
    why: "The only claim on an intro call that costs nothing to make, because it is about us and it is finished.",
    say: `We have built something close to ${reusedGaps().length} of the ${gaps.length} findings at another food or beverage client, worth ${money(reusedValueCr())} where we did it.`,
    href: "/compare",
    hrefLabel: "Compare",
  },
  {
    n: 9,
    title: "Likely pain points",
    why: "Close on the hypothesis, phrased as a question. It is what earns the discovery call.",
    say: `${FIRST_BUILD.gap.plainLine} Say it as "is that roughly true for you", not as a finding.`,
    href: "/gaps",
    hrefLabel: "Gaps",
  },
];

/**
 * The discovery call: what a second conversation is actually for.
 *
 * The intro call earned this meeting by being about them. This one has a
 * different job and therefore a different list: confirm the findings, get the
 * numbers on a footing that survives a CFO, find out what we cannot know from
 * outside, and leave with a scope and a data request rather than goodwill.
 *
 * It is deliberately not the same nine areas at more depth. Six of the nine
 * were only ever there to establish that we had done the homework, and once
 * that is established they are worth no more of anybody's half hour.
 */
export const discoveryCall: CallItem[] = [
  {
    n: 1,
    title: "Confirm the finding, not the price",
    why: "A finding they agree with is worth more than a number they have not checked. Get the first before offering the second.",
    say: `${FIRST_BUILD.gap.plainLine} ${FIRST_BUILD.gap.confidenceReason}`,
    href: "/gaps",
    hrefLabel: "Gaps",
  },
  {
    n: 2,
    title: "The questions, in order",
    why: "The ask sequence is the call. It is built so an early answer changes which question comes next.",
    say: `${pluralise(THIS_CALL.length, "question", "questions")} for this call, in ask order. The first is: ${THIS_CALL[0]?.text ?? "not set"}`,
    href: "/questions",
    hrefLabel: "Questions",
  },
  {
    n: 3,
    title: "What we cannot know from outside",
    why: "Saying what we have not established is what makes the rest credible. It also scopes the work.",
    say: `${NOT_RESEARCHED.join(" and ")} have not been researched at all, and no ERP data has been shared, so every figure we hold is modelled rather than measured.`,
    href: "/research/company/full",
    hrefLabel: "Coverage",
  },
  {
    n: 4,
    title: "The numbers, with their base",
    why: "This is the call where a rupee figure is allowed, and only with the base, the rate and the range attached.",
    say: `${money(FIRST_BUILD.gap.amountCr ?? 0)} a year on ${FIRST_BUILD.gap.valuation?.baseLabel ?? "a stated base"}, ${FIRST_BUILD.gap.valuation?.rateLabel ?? ""}. ${FIRST_BUILD.gap.valuation?.whoseNumbers ?? ""}`,
    href: "/research/money/full",
    hrefLabel: "Financial",
  },
  {
    n: 5,
    title: "What we would build first",
    why: "Leave with a shape, not an enthusiasm. One build, its effort and whether it has been done before.",
    say: `${FIRST_BUILD.gap.title}. ${FIRST_BUILD.gap.effort} effort, about ${FIRST_BUILD.gap.weeks} weeks, and ${FIRST_BUILD.precedent ? `we have built it at ${FIRST_BUILD.precedent.name}` : "nobody has built it before, which is worth saying"}.`,
    href: "/build",
    hrefLabel: "What to build",
  },
  {
    n: 6,
    title: "Who else has to be in the room",
    why: "The person on this call rarely owns all of it. Naming the gap is how the third meeting gets booked.",
    say: NOT_MET.length
      ? `${NOT_MET.map((s) => s.role).join(" and ")} ${NOT_MET.length === 1 ? "has" : "have"} not been spoken to, and between them they own most of what is priced.`
      : "Everybody who owns a piece of this has been met.",
    href: "/research/stakeholder/full",
    hrefLabel: "Stakeholder",
  },
  {
    n: 7,
    title: "What could kill it, and the answer",
    why: "Every objection on this list has a counter. Raising it first is cheaper than being caught by it.",
    say: `${OPEN_RISKS[0] ? `${OPEN_RISKS[0].label}: ${OPEN_RISKS[0].risk}` : "No risk recorded"} ${OPEN_RISKS[0]?.counter ?? ""}`,
    href: "/research/company/full",
    hrefLabel: "Research",
  },
  {
    n: 8,
    title: "The data request",
    why: "The call is only worth the extract it produces. Ask before the goodbyes, not in the follow-up email.",
    say: DATA_REQUESTS.length
      ? `${pluralise(DATA_REQUESTS.length, "request", "requests")}, and the first is: ${DATA_REQUESTS[0].text}`
      : "Nothing to request yet.",
    href: "/questions",
    hrefLabel: "Questions",
  },
];

/** Rough minutes, stated because a consultant's first question about an agenda
 *  is whether it fits the meeting. Both are sized for the call they name. */
export const INTRO_MINUTES = 20;
export const DISCOVERY_MINUTES = 45;

/**
 * Which call is next, and therefore which agenda the overview's primary
 * control opens.
 *
 * **Derived from whether anybody has actually been spoken to.** A project with
 * no call transcript behind it has not had its intro call yet, whatever else
 * has been ingested; one with a transcript has, and the next conversation is
 * the one that confirms the findings. That is a fact already in `sources` and
 * is the only honest signal available — a flag on the project would be a
 * second place for the same truth to live and the one that goes stale.
 *
 * The reason travels with the choice, because a control that picks a
 * destination on the reader's behalf has to say why it picked it. A consultant
 * who disagrees has the other agenda one tab away.
 */
export function nextCall(): { name: string; href: string; steps: number; minutes: number; why: string } {
  const transcripts = sources.filter((s) => s.kind === "transcript").length;

  if (transcripts === 0) {
    return {
      name: "intro call",
      href: "/research/intro",
      steps: introCall.length,
      minutes: INTRO_MINUTES,
      why: "Nobody here has been spoken to yet.",
    };
  }
  return {
    name: "discovery call",
    href: "/research/discovery",
    steps: discoveryCall.length,
    minutes: DISCOVERY_MINUTES,
    why: `${pluralise(transcripts, "call", "calls")} on file, so the intro is done.`,
  };
}

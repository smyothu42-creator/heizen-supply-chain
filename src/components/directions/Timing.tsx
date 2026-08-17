"use client";

import {
  company,
  signalCounts,
  sources,
  timingSignals,
  urgency,
} from "@/lib/suvarna";
import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section , type SectionRef } from "./Frames";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Direction 3 — Timing                                                        */
/* The axis is the calendar. Six signals read off the company rather than off   */
/* the finding set, each scored on whether it pushes the decision towards now   */
/* or away from it, ending in a verdict that shows its working.                 */
/*                                                                             */
/* This is the one direction with no rupee figure anywhere, and that is not an  */
/* omission. The money is in Money; a total here would be the fourth place the  */
/* same ₹9.1 Cr appears on one surface. What this screen owns is a question no  */
/* other direction answers: why are you here this quarter.                      */
/* -------------------------------------------------------------------------- */

const BRIEF_STANDFIRST = `${signalCounts.accelerates} of ${timingSignals.length} signals push towards now. The two that push back are the same thing: their year ends in March.`;

export function TimingBrief() {
  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      hero={<SurfaceHero title="Research" />}
      lead={
        <DocumentLead
          title="Why now"
          standfirst={BRIEF_STANDFIRST}
        />
      }
    >
      <Section id="t-brief" title="What the signals say, and what argues back" summary={`${urgency.verdict}, and the window is ${urgency.window}. ${urgency.because} What argues the other way is real and worth raising yourself: ${urgency.against} None of this is read off the findings. It comes from public signal about the company, which makes it the one reading that survives a first call where nothing has been shared, and the one that decides whether the money gets discussed this year at all.`} />
      <BriefFooter
        href="/research/initiatives/full"
      >
        All six signals
      </BriefFooter>
    </BriefFrame>
  );
}
/* -------------------------------------------------------------------------- */

const WORDS = ["No","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve"];
const Spell = (n: number) => WORDS[n] ?? String(n);
const nameList = (l: { label: string }[]) =>
  l.length < 2
    ? (l[0]?.label.toLowerCase() ?? "")
    : `${l.slice(0, -1).map((x) => x.label.toLowerCase()).join(", ")} and ${l[l.length - 1].label.toLowerCase()}`;

const ACCELERANTS = timingSignals.filter((s) => s.push === "accelerates");
const BRAKES = timingSignals.filter((s) => s.push === "delays");

/* The headings this view renders, for the navigator beside it. Built from the
   same ids the sections carry, so a heading cannot be missing from the list. */
const TIMING_SECTIONS: SectionRef[] = [
  { id: "verdict", label: "The verdict" },
  { id: "accelerants", label: "What pushes towards now" },
  { id: "brakes", label: "What pushes it back" },
  { id: "signal-sources", label: "Where these came from" },
];

export function TimingFull() {
  return (
    <FullFrame
      sections={TIMING_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="Why now"
        standfirst={`Six signals read off ${company.name} rather than off the findings. None of them carries a number, because the money is a different screen. What these decide is whether the money gets discussed this year.`}
      />

      <Section
        id="verdict"
        title="The verdict"
        summary={`${urgency.verdict}, and the window is ${urgency.window}. ${urgency.because} What argues the other way: ${urgency.against} A one-word answer with nothing behind it is the thing this product is not allowed to give, so the reasoning and the thing that would change it both sit here rather than in a footnote. None of this comes from the client. It is read off public signal, which is what makes it the one direction that survives a first call where nothing has been shared.`}
        right={<span className="text-base font-medium">{urgency.verdict}</span>}
      />

      <Section
        id="accelerants"
        title="What pushes towards now"
        summary={`${Spell(ACCELERANTS.length)} of the ${timingSignals.length} signals push towards now: ${nameList(ACCELERANTS)}. The two that matter are structural rather than moods. A budget holder nine months into the job is still inside the window where naming an inherited process is credit rather than blame, and an ERP decision that has to be made before 2027 is a date somebody else set. Hiring signals and system events corroborate rather than carry: they say the volume is growing while the machine is not, which is the thesis in a different form. Each one is counted from readings that are listed rather than asserted, because a count with no base under it is the number a client challenges first.`}
        right={
          <span className="tabular text-small text-muted-foreground">
            {ACCELERANTS.length} of {timingSignals.length}
          </span>
        }
      />

      <Section
        id="brakes"
        title="What pushes it back"
        summary={`${Spell(BRAKES.length)} of the ${timingSignals.length} push it back: ${nameList(BRAKES)}. Neither is a reason to wait and both are what you will be argued against. The budget cycle is the hard one: a March year end means nothing raised in April survives, which is exactly what makes the window a window rather than a preference. Competing priorities is the softer one, and it has an answer, because the new plant is the reason the invoice volume grows while the team does not. Raise both yourself. A brake the consultant names first is an objection handled; the same brake raised by the room is a meeting that ends early.`}
        right={
          <span className="tabular text-small text-muted-foreground">
            {BRAKES.length} of {timingSignals.length}
          </span>
        }
      />

      <Section
        id="signal-sources"
        title="Where these came from"
        summary={`Timing rests on things a client never volunteers and a filing does not record: who joined when, what they said publicly, what they are hiring for. So this is the one direction that leans on the public web alongside the ${sources.length - 1} documents behind every other screen. That is a weaker kind of evidence and it is labelled as such rather than blended in. Nothing here is measured from the client's systems, and no signal is stated without the individual readings it was counted from, so a reader who disagrees with the verdict can see exactly which reading to argue with.`}
        right={
          <span className="tabular text-small text-muted-foreground">{sources.length} sources</span>
        }
      />
    </FullFrame>
  );
}

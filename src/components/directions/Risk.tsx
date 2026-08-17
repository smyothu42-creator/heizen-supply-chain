"use client";

import {
  company,
  dealRisks,
  riskCounts } from "@/lib/suvarna";
import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section , type SectionRef } from "./Frames";
import { Eyebrow } from "@/components/meridian/Primitives";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Direction 4 — Risk                                                          */
/*                                                                             */
/* ONE RULE, AND IT IS THE WHOLE DIRECTION: every risk carries a counter.      */
/* `DealRisk.counter` is not optional in the type and `check:data` fails the    */
/* build on an empty one, so this cannot rot quietly.                           */
/*                                                                             */
/* The reason is Aryan. He is minutes from a call and not a domain expert. Six  */
/* things that could go wrong, with no line to say when any of them is raised,  */
/* does not prepare him — it frightens him, and a frightened consultant avoids  */
/* the subject. Which is exactly how an incumbent vendor or a dead 2019 project */
/* ends up deciding the deal off-screen. A risk with a counter is ammunition. A */
/* risk without one is a reason to stay quiet.                                  */
/*                                                                             */
/* It follows that the counter cannot be progressive disclosure. It is not the  */
/* detail behind the risk; it is the other half of the same object, and the     */
/* screen never renders one without the other.                                  */
/* -------------------------------------------------------------------------- */

const HIGH = dealRisks.filter((r) => r.severity === "high");
const REST = dealRisks.filter((r) => r.severity !== "high");

const BRIEF_STANDFIRST = `Six things that could stop this, and the line to say for each. ${riskCounts.high} of them decide the deal rather than delay it.`;

export function RiskBrief() {
  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      hero={
        <SurfaceHero
          tight
          collapseAtRoomy
          title="Research"
          titleNode={
            <div className="roomy:hidden">
              <p className="font-display text-h2 leading-[1.15]">
                {dealRisks.length} things could kill this. All {dealRisks.length} have an answer.
              </p>
              <p className="reading measure mt-1 text-small text-muted-foreground">
                {BRIEF_STANDFIRST}
              </p>
            </div>
          }
        />
      }
      lead={
        <DocumentLead
          bordered={false}
          titleNode={
            <p className="font-display text-h2 leading-[1.15]">
              {dealRisks.length} things could kill this. All {dealRisks.length} have an answer.
            </p>
          }
          standfirst={BRIEF_STANDFIRST}
        />
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <Eyebrow>The three that decide it</Eyebrow>
        <ul className="mt-1.5 space-y-2">
          {HIGH.map((r) => (
            <li key={r.id}>
              <p className="text-base leading-snug">
                <span className="font-medium">{r.label}.</span> {r.value}
              </p>
              {/* The counter, on the phone screen, under every one of them.
                  Cutting it here to save four lines would leave exactly the
                  screen this direction exists not to be. */}
              <p className="reading mt-0.5 text-small text-muted-foreground">
                <span className="text-evidence" aria-hidden>
                  →{" "}
                </span>
                <span className="sr-only">Say: </span>
                {r.counter}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <BriefFooter
        href="/research/risk/full"
      >
        All {dealRisks.length}
      </BriefFooter>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

/* The headings this view renders, for the navigator beside it. Built from the
   same ids the sections carry, so a heading cannot be missing from the list. */
const RISK_SECTIONS: SectionRef[] = [
  { id: "decides", label: "What decides it" },
  { id: "slows", label: "What slows it down" },
  { id: "rule", label: "Why every one has a counter" },
];

const WORDS=["No","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve"];
const Spell=(n:number)=>WORDS[n]??String(n);
const nameList=(l:{label:string}[])=>
  l.length<2?(l[0]?.label.toLowerCase()??""):
  `${l.slice(0,-1).map((x)=>x.label.toLowerCase()).join(", ")} and ${l[l.length-1].label.toLowerCase()}`;

export function RiskFull() {
  return (
    <FullFrame
      sections={RISK_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="What could kill this"
        standfirst={`Six things that could stop the work at ${company.name}, ordered by whether they decide the deal or merely delay it. Each one is paired with the line to say when it is raised, and the pair is one object: this screen never shows half of it.`}
      />


      <Section
        id="decides"
        title="What decides it"
        summary={`${Spell(HIGH.length)} of the ${dealRisks.length} risks decide the deal rather than delay it: ${nameList(HIGH)}. All three are things the room already knows and none of them is going to be said first, which is why the instruction is to raise them yourself. The incumbent vendors and the 2019 project that stopped are both answered the same way: nothing here replaces SAP, and the first phase needs no new module and no plant downtime. The political one is the delicate one. The process is not Rohan's, he inherited it, and naming it inside his first year reads as credit rather than as an admission. Every risk below carries the line to say when it is raised, because a risk with no counter is not preparation, it is a reason to avoid the subject.`}
        right={
          <span className="tabular text-small text-muted-foreground">
            {HIGH.length} of {dealRisks.length}
          </span>
        }
      />

      <Section
        id="slows"
        title="What slows it down"
        summary={`${Spell(REST.length)} more: ${nameList(REST)}. None of these stops the work and all three change when it starts, which against a March year end is nearly the same thing. Budget timing has the cleanest answer: the first phase sits inside the authority Rohan already holds, so it does not need a new budget line at all. In-house capability sounds like a blocker and is not, because the twelve people who could do it already own the S/4 move and this is the work that would sit in the queue behind it. Competing priorities answers itself once the framing is right: this is operating spend against a cash release, not capital against capital.`}
        right={
          <span className="tabular text-small text-muted-foreground">
            {REST.length} of {dealRisks.length}
          </span>
        }
      />

      <Section
        id="rule"
        title="Why every one has a counter"
        summary={`Every risk on this page carries a counter, and the data will not build without one. The reason is the reader rather than the rule: a consultant minutes from a call, given six things that could go wrong and no line to say when any of them comes up, is not prepared, he is frightened. A frightened consultant avoids the subject, and avoiding it is exactly how an incumbent vendor or a dead 2019 project ends up deciding the deal off-screen. So the counters are written as speech, in the second person, because they are read seconds before being said out loud and a phrase that has to be translated under pressure is a phrase that will not be. Severity is weight here and never a colour: red on this surface would collide with the health hues on Operations, where it means the client's process is failing rather than the pitch is exposed.`}
      />
    </FullFrame>
  );
}


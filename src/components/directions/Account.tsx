"use client";

import { lanes } from "@/lib/compare";
import { company, dealRisks, stakeholders, systemsByState } from "@/lib/suvarna";
import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section , type SectionRef } from "./Frames";
import { Eyebrow } from "@/components/meridian/Primitives";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Already inside · Solved before                                              */
/*                                                                             */
/* Two directions about the account rather than about the operation, kept in    */
/* one file because they are the same question asked twice: what is already     */
/* true here, and what is already true elsewhere.                              */
/*                                                                             */
/* **Already inside** is what exists before Heizen arrives — live modules, the  */
/* vendor already holding the support contract, the project tried in 2019, the  */
/* people already met. The most expensive thing a consultant can do on a first  */
/* call is propose replacing something the room has already paid for.           */
/*                                                                             */
/* **Solved before** is the only direction built from Heizen's own record       */
/* rather than the client's, so it needs no research to be true.                */
/* -------------------------------------------------------------------------- */

const LIVE = systemsByState("live");
const MET = stakeholders.filter((s) => s.met);
const INCUMBENT = dealRisks.find((r) => r.id === "r-incumbent");
export function InsideBrief() {
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
                What is already in this account
              </p>
              <p className="reading measure mt-1 text-small text-muted-foreground">
                Everything proposed lands on top of these, not instead of them.
              </p>
            </div>
          }
        />
      }
      lead={
        <DocumentLead
          bordered={false}
          titleNode={
            <p className="font-display text-h2 leading-[1.15]">What is already in this account</p>
          }
          standfirst="The modules that are live, the vendor already holding the contract, and the project that stopped in 2019."
        />
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <Eyebrow>Live and configured</Eyebrow>
        <p className="mt-1 text-base">
          {LIVE.map((s) => s.name).join(", ")} on {company.erp}
        </p>

        {INCUMBENT && (
          <>
            <Eyebrow className="mt-3">Already holding the contract</Eyebrow>
            <p className="mt-1 text-base">{INCUMBENT.value}</p>
            <p className="reading mt-0.5 text-small text-muted-foreground">
              <span className="text-evidence" aria-hidden>
                →{" "}
              </span>
              {INCUMBENT.counter}
            </p>
          </>
        )}
      </div>

      <div className="shrink-0 rounded-md border border-dashed border-border-strong px-4 py-3">
        <Eyebrow>Already met</Eyebrow>
        <p className="mt-1 text-small measure">
          {MET.map((s) => s.name).join(", ")}. The other{" "}
          {stakeholders.length - MET.length} have not been spoken to.
        </p>
      </div>

      <BriefFooter
        href="/research/inside/full"
      >
        Everything already here
      </BriefFooter>
    </BriefFrame>
  );
}

/* The headings this view renders, for the navigator beside it. Built from the
   same ids the sections carry, so a heading cannot be missing from the list. */
const INSIDE_SECTIONS: SectionRef[] = [
  { id: "i-systems", label: "Live and configured" },
  { id: "i-vendors", label: "Who is already here" },
  { id: "i-people", label: "Who has been met" },
];

export function InsideFull() {
  return (
    <FullFrame
      sections={INSIDE_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="What is already in this account"
        standfirst="Software that is live, a vendor already holding the support contract, a project that was tried and stopped, and the two people who have been spoken to. Everything on What should build lands on top of this list."
      />

      <Section
        id="i-systems"
        title="Live and configured"
        summary={`Three SAP modules, live and configured, on SAP ECC 6.0. None of them is a problem in itself and none of them is being replaced: they are the ground anything new would stand on, and saying so early is what answers the fear the room actually brings to the meeting. What matters for scoping is the boundary. Anything built here reads from and writes back to those modules, which puts SAP and whoever manages the estate in the conversation whether or not they are in the room.`}
      />

      <Section
        id="i-vendors"
        title="Who is already here"
        summary={`Both of these decide the deal rather than delay it, and neither is going to be raised by the room first. There is an incumbent managing the SAP estate, and there is a project that was tried in 2019 and stopped. Left unsaid, each one gets decided off-screen after the call by somebody who was not in it. The counter to both is the same sentence and it is worth having ready: nothing here replaces anything, the first phase needs no new module and no plant downtime, and it lands as configuration inside the estate that is already there. Ask what was tried in 2019 and why it stopped, before anybody else brings it up.`}
      />

      <Section
        id="i-people"
        title="Who has been met"
        summary={`Two of the four people who matter have been met, on two calls: the Head of Procurement and the Accounts Payable Lead. The Chief Financial Officer and the VP Supply Chain have not, and everything on this page about either of them is inference from filings and public signal rather than anything they said. That is the single largest weakness in the research, because between them those two own most of the money. Getting a meeting with one of them is a better outcome from the next call than any answer the people already met can give.`}
      />
    </FullFrame>
  );
}

/* -------------------------------------------------------------------------- */
/* Solved before                                                               */
/* -------------------------------------------------------------------------- */

const PRIOR = lanes.filter((l) => !l.isCurrent && !l.isBenchmark);
const BIC = lanes.find((l) => l.isBenchmark)!;

export function SolvedBrief() {
  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      hero={<SurfaceHero title="Research" />}
      lead={
        <DocumentLead
          title="Solved before"
          standfirst="Two comparable engagements in food and beverage, both bought for the reasons this one would be."
        />
      }
    >
      <Section id="a-brief" title="Which engagement to lead with" summary={`Two comparable engagements, and this is the only reading built from Heizen\u2019s own record rather than from the client\u2019s, so nothing here depends on data being shared. Kesarwani Foods is the one to lead with: smaller, the same business, delivered last year, and bought for the two reasons this one would be. Deccan Beverages is more than twice Suvarna\u2019s size and still in flight, which makes it the answer to whether anybody bigger has done this rather than the flattering comparison. What transfers is the sequence and the timescale rather than the numbers, and it is worth saying which is which before somebody in the room does it for you.`} />
      <BriefFooter
        href="/research/solved/full"
      >
        Both engagements
      </BriefFooter>
    </BriefFrame>
  );
}

/* The headings this view renders, for the navigator beside it. Built from the
   same ids the sections carry, so a heading cannot be missing from the list. */
const SOLVED_SECTIONS: SectionRef[] = [
  ...PRIOR.map((l) => ({ id: `s-${l.id}`, label: l.company })),
  { id: "s-stages", label: "Stage by stage" },
];

/* Why each prior engagement is on the list, which is the half a client
   actually wants: two Heizen projects with the same note under them is a
   reference list, not a reference. */
const PRIOR_NOTE: Record<string, string> = {
  "lane-kesarwani":
    "The closest match on the list and the one to lead with. Smaller than Suvarna but the same business, and it was bought for the two reasons this one would be: invoices arriving faster than people could key them, and onboarding slow enough that plants noticed. It is delivered, so it is the one that can be talked about in the past tense, which is worth more on a first call than a bigger name in flight.",
  "lane-deccan":
    "More than twice Suvarna's size and further along on planning than on procurement, which makes it the useful counter-example rather than the flattering comparison. It is in flight, so what it proves is that the sequence holds at scale rather than that the outcome landed. Raise it if the room asks whether anybody bigger has done this.",
};

export function SolvedFull() {
  return (
    <FullFrame
      sections={SOLVED_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="Solved before"
        standfirst={`Two comparable engagements in food and beverage, both bought for the reasons this one would be. This is the only direction built from Heizen's own record rather than from ${company.name}'s, so nothing here depends on data being shared.`}
      />

      {PRIOR.map((l) => (
        <Section key={l.id} id={`s-${l.id}`} title={l.company} summary={`${l.note} ${l.sector}. ${PRIOR_NOTE[l.id] ?? "On the list because the shape matches rather than the sector."} What transfers is the sequence and the timescale rather than the numbers, and it is worth saying which is which out loud before somebody in the room does it for you.`}
      />
      ))}

      <Section
        id="s-stages"
        title="Stage by stage"
        summary={`This client against ${BIC.company.toLowerCase()}, on the same six steps, so every number has something to be read against. A duration on its own means nothing; the same duration next to best in class is the whole argument. Read the gaps rather than the totals: the places where the two lanes diverge most are where a first phase pays back fastest, and a step the benchmark does not run at all is worth more attention than a step it simply runs faster.`}
      />
    </FullFrame>
  );
}

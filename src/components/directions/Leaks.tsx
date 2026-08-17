"use client";

import {
  buckets,
  gapById,
  gaps } from "@/lib/suvarna";

import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section , type SectionRef } from "./Frames";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Operation leaks — the same findings, read as failures of the operation      */
/*                                                                             */
/* Financial reads them as slices of ₹9.1 Cr. This reads them as things that   */
/* keep going wrong, grouped by the stage they happen in, with no rupee figure  */
/* anywhere. The operator in the room does not think in leakage; they think in  */
/* the step that breaks, and this is the only view that puts the step first.    */
/* -------------------------------------------------------------------------- */


/** The three that go wrong most visibly, not the three worth most. */

export function LeaksBrief() {
  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      hero={<SurfaceHero title="Research" />}
      lead={
        <DocumentLead
          title="Where the operation loses time and control"
          standfirst="The same findings as Financial, with the money taken off. What breaks, where it breaks, and how sure we are."
        />
      }
    >
      <Section id="l-brief" title="What breaks, and where nobody has looked" summary={`${gaps.length} places the operation loses time, with no rupee figure on any of them. Nine sit in buying, which is where the work has been done rather than where the problems necessarily are. Nobody has looked at the plants. The three that break most visibly are goods receipts posted late because there is no warehouse module, a three-way match that fails on 42% of invoices, and approvals happening on email and WhatsApp with no audit trail. An operator does not think in leakage, they think in the step that breaks, and this is the only reading that puts the step first.`} />
      <BriefFooter
        href="/research/leaks/full"
      >
        All twelve
      </BriefFooter>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

/* Built from the same buckets the sections are. */
const SECTIONS: SectionRef[] = buckets.map((b) => ({
  id: `l-${b.id}`,
  label: b.name,
}));

const WORDS=["No","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve"];
const Spell=(n:number)=>WORDS[n]??String(n);

/* What an operator should take from each group. No rupee figures anywhere in
   this direction: the money is Financial's, and the person who reads this one
   thinks in the step that breaks rather than in leakage. */
const LEAK_NOTE: Record<string,string> = {
  "b-pay": "All four are confirmed, and all four are the same invoice moving through the same process, so they break together and they would be fixed together.",
  "b-buy": "The three-week onboarding is the one a plant feels, because it is the one that decides whether a line waits.",
  "b-move": "The weakest evidence in the direction. Both of the larger ones are inferred from the FY25 report, because nobody in logistics or planning has been spoken to yet.",
  "b-recover": "One failure, and the only one here that is about money owed to Suvarna rather than money leaving it.",
};

export function LeaksFull() {
  return (
    <FullFrame
      sections={SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="Where the operation loses time and control"
        standfirst={`The same ${gaps.length} findings Financial prices, read as failures of the operation instead. Grouped by the part of the business they happen in, with no rupee figure on any of them: what breaks, and how sure we are it is real.`}
      />

      {buckets.map((b) => (
        <Section key={b.id} id={`l-${b.id}`} title={b.name} summary={`${b.plainLine} ${Spell(b.gapIds.length)} things go wrong here. ${b.gapIds.map(gapById).map((g) => g.title).join(". ")}. ${LEAK_NOTE[b.id] ?? ""}`}
      />
      ))}
    </FullFrame>
  );
}


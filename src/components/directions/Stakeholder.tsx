"use client";

import { money } from "@/lib/format";
import {
  company,
  gapsForStakeholder,
  stakeholders,
  valueForStakeholder } from "@/lib/suvarna";
import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section , type SectionRef } from "./Frames";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Direction 4 — Stakeholder-first                                             */
/* The axis is the person in the room. The same twelve gaps are present         */
/* throughout; only their order and their wording change.                       */
/* -------------------------------------------------------------------------- */

export function StakeholderBrief() {
  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      hero={<SurfaceHero title="Research" />}
      lead={
        <DocumentLead
          title="Who is in the room"
          standfirst="The same twelve findings under every name. Order, wording and what to avoid change with the person."
        />
      }
    >
      <Section
        id="p-brief"
        title="Who has been met, and who owns the money"
        summary={`Four people matter and two have been met: the Head of Procurement and the Accounts Payable Lead, on both calls. The CFO and the VP Supply Chain have not been spoken to at all, and between them they own most of the money, so getting a meeting with one of them is a better outcome from the next call than any answer the other two can give. Open with Rohan on supplier onboarding rather than on invoices, because invoices sit with Finance and leading there tells him the research was not about his function. Subtotals add to ${money(company.grossLeakageCr)}, of which ${money(company.overlapCr)} is one saving counted twice across two people, so the four columns cannot simply be added.`}
      />
      <BriefFooter
        href="/research/stakeholder/full"
      >
        All four people
      </BriefFooter>
    </BriefFrame>
  );
}

/* `UnknownBrief` lived here: the degraded screen for "I don't know who I'm
   meeting", reachable only from the dashed chip on the picker. It went with the
   picker rather than being left unrendered. Full still carries the same
   fallback as its last section. */

/* -------------------------------------------------------------------------- */

/* The headings this view renders, for the navigator beside it. Built from the
   same ids the sections carry, so a heading cannot be missing from the list. */
const STAKEHOLDER_SECTIONS: SectionRef[] = [
  /* From the same array the sections are rendered from, in the same order. */
  ...stakeholders.map((p) => ({
    id: p.id,
    label: p.name,
  })),
  { id: "unknown", label: "If you don't know who you're meeting" },
];

const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

export function StakeholderFull() {
  return (
    <FullFrame
      sections={STAKEHOLDER_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="Who is in the room"
        standfirst={`The same twelve gaps under every name. Order, wording and what to avoid change. Subtotals add to ${money(company.grossLeakageCr)}; ${money(company.overlapCr)} of that is one saving counted twice across two people.`}
      />


      <header id="room" className="scroll-mt-6">
        <div className="scroll-slim overflow-x-auto">
          <table className="w-full min-w-[380px] text-small">
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="py-1.5 pr-3 font-medium">
                  Person
                </th>
                <th scope="col" className="py-1.5 pr-3 text-right font-medium">
                  Gaps
                </th>
                <th scope="col" className="py-1.5 text-right font-medium">
                  Worth
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stakeholders.map((p) => (
                <tr key={p.id}>
                  <td className="py-1.5 pr-3 align-top">
                    <a
                      href={`#${p.id}`}
                      className="font-medium transition-colors hover:text-muted-foreground"
                    >
                      {p.name}
                    </a>
                    <span className="block text-micro text-muted-foreground">
                      {p.role}
                      {!p.met && " · not met"}
                    </span>
                  </td>
                  <td className="tabular py-1.5 pr-3 text-right align-top">
                    {gapsForStakeholder(p.id).length}
                  </td>
                  <td className="tabular py-1.5 text-right align-top font-medium">
                    {money(valueForStakeholder(p.id))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </header>

      {stakeholders.map((person) => {
        return (
          <Section
            key={person.id}
            id={person.id}
            title={person.name}
            summary={`${person.role}, and ${person.met ? "met on both calls" : "not met yet, so everything here is inference"}. ${gapsForStakeholder(person.id).length} of the twelve findings land on their number, worth ${money(valueForStakeholder(person.id))} a year. Open with this: ${person.openingLine} What to avoid: ${lowerFirst(person.avoid.replace(/^Do not /, "do not "))}`}
            right={
              <span className="tabular text-base font-medium text-foreground">
                {money(valueForStakeholder(person.id))}
              </span>
            }
      />
        );
      })}

      <Section
        id="unknown"
        title="If you don't know who you're meeting"
        summary={`The common case, and this direction's weak point. If you do not know who is in the room, open by asking: whose numbers do these land on, yours or Finance's? The answer picks the person above and the rest of this page becomes usable. Until it does, fall back to the findings that cross every function rather than to one owner's subtotal, because naming the wrong owner is worse than naming none. The subtotals here add to ${money(company.grossLeakageCr)}, of which ${money(company.overlapCr)} is one saving counted twice across two people, so the four columns cannot simply be added.`}
      />
    </FullFrame>
  );
}

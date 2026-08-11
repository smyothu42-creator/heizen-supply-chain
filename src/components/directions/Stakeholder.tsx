"use client";

import Link from "next/link";
import { money } from "@/lib/format";
import {
  company,
  gapById,
  gapsForStakeholder,
  questionsForStakeholder,
  stakeholderById,
  stakeholders,
  valueForStakeholder,
} from "@/lib/suvarna";
import { BriefFrame, DocumentLead, FullFrame, Section, type SectionRef } from "./Frames";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";
import { ConfidenceBadge } from "@/components/meridian/Confidence";
import { Eyebrow } from "@/components/meridian/Primitives";
import { GapRow } from "@/components/meridian/GapRow";
import { QuestionRow } from "@/components/meridian/QuestionRow";
import { ArrowIcon } from "@/components/meridian/Icons";
import { usePanel } from "@/components/meridian/EvidencePanel";

/* -------------------------------------------------------------------------- */
/* Direction 4 — Stakeholder-first                                             */
/* The axis is the person in the room. The same twelve gaps are present         */
/* throughout; only their order and their wording change.                       */
/* -------------------------------------------------------------------------- */

export function StakeholderBrief() {
  const { open } = usePanel();

  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      /* **The person picker is gone**, on request, and this header now draws
         nothing but its `sr-only` heading like every other surface.

         It was five chips above the direction switch, and the row it sat in was
         the last thing in the product putting a control between the masthead
         and the tabs that change what the page says. What it cost is worth
         recording rather than rediscovering: Brief opens on the Head of
         Procurement, which is who a first discovery call is with, and the other
         three people plus the "don't know who I'm meeting" fallback are one
         click away on Full. `verify-stakeholder.mjs` had five selections to
         check and now has one.

         Restoring it is putting `titleNode` back on this hero. */
      hero={<SurfaceHero tight title="Research" />}
      lead={
        <DocumentLead
          bordered={false}
          title="Who is in the room"
          standfirst="The same twelve gaps under every name. Order, wording and what to avoid change with the person."
        />
      }
    >
      <KnownBrief id="sh-rohan" onOpen={(id) => open({ kind: "gap", id })} />

      <div className="shrink-0 pt-1">
        <div className="flex items-end justify-between gap-4">
          <ConfidenceBadge level={company.confidence} showReason={false} />
          <Link
            href="/research/stakeholder/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small transition-colors hover:text-muted-foreground"
          >
            All four people
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </BriefFrame>
  );
}

function KnownBrief({ id, onOpen }: { id: string; onOpen: (gapId: string) => void }) {
  const person = stakeholderById(id);
  const theirGaps = gapsForStakeholder(id)
    .filter((g) => g.amountCr != null)
    .sort((a, b) => (b.amountCr ?? 0) - (a.amountCr ?? 0))
    .slice(0, 3);

  return (
    <>
      <div className="shrink-0">
        {/* Leading is 1.2, not snug. Inter's x-height makes 1.375 read loose on
            a statement this size, and Meera's opening line is the longest of
            the four — at snug it pushed her gaps 15px past the screen. */}
        <p className="font-display text-lead leading-[1.2] measure sm:text-h3">
          {person.openingLine}
        </p>
        <p className="mt-1 text-small text-muted-foreground">
          {person.name} · {person.role}
          {!person.met && " · you have not met them"}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <Eyebrow>
          Hits their number: {money(valueForStakeholder(id))} of {money(company.grossLeakageCr)}
        </Eyebrow>
        <ul className="mt-1.5 space-y-1.5">
          {theirGaps.map((gap) => (
            // The third line used to be `hidden sm:block`: Rohan owns the three
            // longest plain-language lines of anyone here and at 375 the third
            // did not fit under his opening line. The picker's row is what it
            // was competing with, and re-measured without it all three clear
            // 375×667 with room to spare.
            <li key={gap.id}>
              <button
                type="button"
                onClick={() => onOpen(gap.id)}
                className="group flex w-full items-baseline justify-between gap-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-base leading-snug transition-colors group-hover:text-muted-foreground">
                    {gap.plainLine}
                  </span>
                </span>
                <span className="tabular shrink-0 text-base font-medium">
                  {money(gap.amountCr)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 rounded-md border border-dashed border-border-strong px-3.5 py-1 sm:py-1.5">
        <div className="text-micro font-medium text-health-watch">
          Do not
        </div>
        <p className="mt-0.5 text-small measure">{person.avoid}</p>
      </div>
    </>
  );
}

/* `UnknownBrief` lived here: the degraded screen for "I don't know who I'm
   meeting", reachable only from the dashed chip on the picker. It went with the
   picker rather than being left unrendered. Full still carries the same
   fallback as its last section. */

/* -------------------------------------------------------------------------- */

const SECTIONS: SectionRef[] = [
  { id: "room", label: "The room", meta: "4 people" },
  ...stakeholders.map((s) => ({
    id: s.id,
    label: s.name,
    meta: `${gapsForStakeholder(s.id).length} gaps`,
  })),
  { id: "unknown", label: "If you don't know", defaultCollapsed: true },
];

export function StakeholderFull() {
  return (
    <FullFrame
      sections={SECTIONS}
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
        const theirGaps = gapsForStakeholder(person.id).sort(
          (a, b) => (b.amountCr ?? 0) - (a.amountCr ?? 0),
        );
        const theirQuestions = questionsForStakeholder(person.id);
        return (
          <Section
            key={person.id}
            id={person.id}
            title={person.name}
            summary={`${person.role}${person.met ? " · met on both calls" : " · not met yet"}`}
            right={
              <span className="tabular text-base font-medium text-foreground">
                {money(valueForStakeholder(person.id))}
              </span>
            }
          >
            <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-card">
              <div className="text-micro font-medium text-muted-foreground">
                Open with
              </div>
              <p className="mt-1.5 text-lead leading-snug measure-lead">{person.openingLine}</p>
            </div>

            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <Eyebrow>Measured on</Eyebrow>
                <ul className="reading mt-1.5 space-y-1 text-small measure">
                  {person.measuredOn.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </div>
              <div>
                <Eyebrow>Owns</Eyebrow>
                <p className="reading mt-1.5 text-small measure">{person.owns.join(", ")}</p>
              </div>
            </div>

            <p className="reading mt-4 text-small measure">
              <span className="font-medium text-health-watch">Do not: </span>
              <span className="text-muted-foreground">{person.avoid}</span>
            </p>

            <ul className="mt-4 divide-y divide-border border-t border-border">
              {theirGaps.map((gap) => (
                <GapRow key={gap.id} gap={gap} />
              ))}
            </ul>

            {theirQuestions.length > 0 && (
              <ol className="mt-4 border-t border-border pt-3">
                {theirQuestions.map((q, i) => (
                  <QuestionRow
                    key={q.id}
                    question={q}
                    last={i === theirQuestions.length - 1}
                    showTarget={false}
                  />
                ))}
              </ol>
            )}
          </Section>
        );
      })}

      <Section
        id="unknown"
        title="If you don't know who you're meeting"
        summary="The common case, and this direction's weak point. It falls back to the gaps that cross every function."
      >
        <div className="rounded-lg border border-border bg-card px-4 py-3 shadow-card">
          <div className="text-micro font-medium text-muted-foreground">
            First question on the call
          </div>
          <p className="mt-1.5 text-lead leading-snug measure-lead">
            &ldquo;Before I start, whose numbers do these land on, yours or Finance&apos;s?&rdquo;
          </p>
        </div>
        <ul className="mt-4 divide-y divide-border border-t border-border">
          {["g3", "g6", "g2"].map((id) => (
            <GapRow key={id} gap={gapById(id)} />
          ))}
        </ul>
      </Section>
    </FullFrame>
  );
}

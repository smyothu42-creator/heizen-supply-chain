"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
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
import { BriefFrame, FullFrame, SummaryStrip, type SectionRef } from "./Frames";
import { ConfidenceBadge } from "@/components/meridian/Confidence";
import { Eyebrow, SectionHeading } from "@/components/meridian/Primitives";
import { GapRow } from "@/components/meridian/GapRow";
import { QuestionRow } from "@/components/meridian/QuestionRow";
import { ArrowIcon } from "@/components/meridian/Icons";
import { usePanel } from "@/components/meridian/EvidencePanel";

/* -------------------------------------------------------------------------- */
/* Direction 4 — Stakeholder-first                                             */
/* The axis is the person in the room. The same twelve gaps are present         */
/* throughout; only their order and their wording change.                       */
/* -------------------------------------------------------------------------- */

type Selection = string | "unknown";

export function StakeholderBrief() {
  const [selected, setSelected] = useState<Selection>("sh-rohan");
  const { open } = usePanel();

  return (
    <BriefFrame>
      {/* Who's in the room. "I don't know yet" is a first-class option, because
          it is what Aryan often has. */}
      <div className="shrink-0">
        <Eyebrow>Who are you meeting?</Eyebrow>
        <div
          className="mt-1.5 flex flex-wrap gap-1.5"
          role="group"
          aria-label="Select who you are meeting"
        >
          {stakeholders.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-pressed={selected === s.id}
              onClick={() => setSelected(s.id)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-small transition-colors",
                selected === s.id
                  ? "border-foreground bg-foreground text-background font-medium"
                  : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
            >
              {s.name.split(" ")[0]}
              {/* The met/not-met marker costs a whole row of chips at 375px,
                  and the same fact is stated under the name once selected. */}
              {!s.met && <span className="hidden opacity-70 sm:inline"> · not met</span>}
            </button>
          ))}
          <button
            type="button"
            aria-pressed={selected === "unknown"}
            onClick={() => setSelected("unknown")}
            className={cn(
              "rounded-full border px-2.5 py-1 text-small transition-colors",
              selected === "unknown"
                ? "border-foreground bg-foreground text-background font-medium"
                : "border-dashed border-border-strong text-muted-foreground hover:text-foreground",
            )}
          >
            Don&apos;t know yet
          </button>
        </div>
      </div>

      {selected === "unknown" ? (
        <UnknownBrief />
      ) : (
        <KnownBrief id={selected} onOpen={(id) => open({ kind: "gap", id })} />
      )}

      <div className="shrink-0 border-t border-border pt-2.5">
        <div className="flex items-end justify-between gap-4">
          <ConfidenceBadge level={company.confidence} showReason={false} />
          <Link
            href="/research/stakeholder/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small underline-offset-4 hover:underline"
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
        <p className="font-display text-lead leading-snug measure sm:text-h3">
          {person.openingLine}
        </p>
        <p className="mt-1 text-small text-muted-foreground">
          {person.name} · {person.role}
          {!person.met && " · you have not met them"}
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <Eyebrow>
          Hits their number — {money(valueForStakeholder(id))} of the ₹14.7 Cr
        </Eyebrow>
        <ul className="mt-1.5 space-y-1.5">
          {theirGaps.map((gap, i) => (
            // Rohan owns the three longest plain-language lines of anyone here,
            // and at 375px the third one does not fit under his opening line.
            // Two gaps that fit beat three that get cut off.
            <li key={gap.id} className={cn(i === 2 && "hidden sm:block")}>
              <button
                type="button"
                onClick={() => onOpen(gap.id)}
                className="group flex w-full items-baseline justify-between gap-3 text-left"
              >
                <span className="min-w-0 flex-1">
                  <span className="block text-base leading-snug group-hover:underline underline-offset-4">
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

      <div className="shrink-0 rounded-md border border-dashed border-border-strong px-3 py-1.5">
        <div className="text-micro font-medium uppercase tracking-[0.08em] text-health-watch">
          Do not
        </div>
        <p className="mt-0.5 text-small measure">{person.avoid}</p>
      </div>
    </>
  );
}

/** The degraded state. It is a weaker screen than the other three, and it is
 *  designed rather than left to fall out of the code. */
function UnknownBrief() {
  const top = ["g1", "g2", "g6"].map(gapById);

  return (
    <>
      <div className="shrink-0">
        <p className="font-display text-lead leading-snug measure sm:text-h3">
          Then lead with the two that belong to whoever turns up.
        </p>
        <p className="mt-1.5 text-small text-muted-foreground measure">
          Invoice processing and supplier onboarding cross every function here. They are safe
          openers for procurement, finance or operations.
        </p>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <Eyebrow>Works for anyone in the room</Eyebrow>
        <ul className="mt-1.5 space-y-2">
          {top.map((gap) => (
            <li key={gap.id} className="flex items-baseline justify-between gap-3">
              <span className="text-base leading-snug">{gap.plainLine}</span>
              <span className="tabular shrink-0 text-base font-medium">{money(gap.amountCr)}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 rounded-md border border-dashed border-border-strong px-3 py-2">
        <div className="text-micro font-medium uppercase tracking-[0.08em] text-muted-foreground">
          First question on the call
        </div>
        <p className="mt-0.5 text-small measure">
          &ldquo;Before I start — whose numbers do these land on, yours or Finance&apos;s?&rdquo;
          The answer picks the version above.
        </p>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

const SECTIONS: SectionRef[] = [
  { id: "room", label: "The room", meta: "4 people" },
  ...stakeholders.map((s) => ({
    id: s.id,
    label: s.name,
    meta: money(valueForStakeholder(s.id)),
  })),
  { id: "unknown", label: "If you don't know", meta: "fallback" },
];

export function StakeholderFull() {
  return (
    <FullFrame sections={SECTIONS}>
      <section>
        <Eyebrow>{company.name} · by who you are meeting</Eyebrow>
        <h1 id="room" className="mt-1.5 scroll-mt-6 font-display text-h1 leading-tight measure">
          Who is in the room
        </h1>
        <p className="mt-2 text-base text-muted-foreground measure">
          The same twelve gaps appear under every person below. What changes is the order, the
          wording, and what to leave alone — because the first meeting is with an individual, not
          with a company.
        </p>

        <div className="mt-4">
          <SummaryStrip
            items={[
              { label: "People", value: "4" },
              { label: "Met", value: "2 of 4" },
              { label: "Gaps", value: "12" },
              { label: "Total", value: "₹14.7 Cr" },
              { label: "Confidence", value: company.confidence },
            ]}
          />
        </div>

        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[560px] text-small">
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Person
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Owns
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Gaps
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Worth to them
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stakeholders.map((s) => (
                <tr key={s.id}>
                  <td className="py-2 pr-3 align-top">
                    <a href={`#${s.id}`} className="font-medium underline-offset-4 hover:underline">
                      {s.name}
                    </a>
                    <span className="block text-micro text-muted-foreground">
                      {s.role}
                      {!s.met && " · not met"}
                    </span>
                  </td>
                  <td className="py-2 pr-3 align-top text-muted-foreground">
                    {s.owns.slice(0, 2).join(", ")}
                  </td>
                  <td className="tabular py-2 pr-3 text-right align-top">
                    {gapsForStakeholder(s.id).length}
                  </td>
                  <td className="tabular py-2 text-right align-top font-medium">
                    {money(valueForStakeholder(s.id))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {stakeholders.map((person) => {
        const theirGaps = gapsForStakeholder(person.id).sort(
          (a, b) => (b.amountCr ?? 0) - (a.amountCr ?? 0),
        );
        const theirQuestions = questionsForStakeholder(person.id);
        return (
          <section key={person.id}>
            <SectionHeading
              id={person.id}
              title={person.name}
              summary={`${person.role}${person.met ? " · met on both discovery calls" : " · not met yet"}`}
              right={
                <span className="tabular text-base font-medium text-foreground">
                  {money(valueForStakeholder(person.id))}
                </span>
              }
            />

            <div className="mt-3 rounded-lg border border-border bg-card px-3.5 py-3">
              <div className="text-micro font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Open with
              </div>
              <p className="mt-1 text-lead leading-snug measure">{person.openingLine}</p>
            </div>

            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <Eyebrow>Measured on</Eyebrow>
                <ul className="mt-1.5 space-y-1 text-small measure">
                  {person.measuredOn.map((m) => (
                    <li key={m} className="flex gap-2">
                      <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-border-strong" aria-hidden />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <Eyebrow>Owns</Eyebrow>
                <ul className="mt-1.5 space-y-1 text-small measure">
                  {person.owns.map((m) => (
                    <li key={m} className="flex gap-2">
                      <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-border-strong" aria-hidden />
                      {m}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-4 rounded-lg border border-dashed border-border-strong px-3.5 py-3">
              <div className="text-micro font-medium uppercase tracking-[0.08em] text-health-watch">
                Do not
              </div>
              <p className="mt-1 text-small measure">{person.avoid}</p>
            </div>

            <h3 className="mt-6 text-base font-medium">
              Gaps that land on them
              <span className="ml-2 tabular text-small font-normal text-muted-foreground">
                {theirGaps.length} · {money(valueForStakeholder(person.id))}
              </span>
            </h3>
            <ul className="mt-1 divide-y divide-border border-t border-border">
              {theirGaps.map((gap) => (
                <GapRow key={gap.id} gap={gap} />
              ))}
            </ul>

            {theirQuestions.length > 0 && (
              <>
                <h3 className="mt-6 text-base font-medium">
                  Ask them
                  <span className="ml-2 tabular text-small font-normal text-muted-foreground">
                    {theirQuestions.length}
                  </span>
                </h3>
                <ol className="mt-3">
                  {theirQuestions.map((q, i) => (
                    <QuestionRow
                      key={q.id}
                      question={q}
                      last={i === theirQuestions.length - 1}
                    />
                  ))}
                </ol>
              </>
            )}
          </section>
        );
      })}

      <section>
        <SectionHeading
          id="unknown"
          title="If you don't know who you're meeting"
          summary="The common case, and this direction's weak point. Rather than falling back to an unsorted dossier, it falls back to the gaps that cross every function."
        />
        <div className="mt-3 rounded-lg border border-border bg-card px-3.5 py-3">
          <div className="text-micro font-medium uppercase tracking-[0.08em] text-muted-foreground">
            First question on the call
          </div>
          <p className="mt-1 text-lead leading-snug measure">
            &ldquo;Before I start — whose numbers do these land on, yours or Finance&apos;s?&rdquo;
          </p>
          <p className="mt-1.5 text-small text-muted-foreground measure">
            One question re-sorts the whole screen. Until it is answered, the three below are safe
            with procurement, finance and operations alike.
          </p>
        </div>
        <ul className="mt-3 divide-y divide-border border-t border-border">
          {["g1", "g2", "g6"].map((id) => (
            <GapRow key={id} gap={gapById(id)} />
          ))}
        </ul>
      </section>
    </FullFrame>
  );
}

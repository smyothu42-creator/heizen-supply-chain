"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import {
  callBeats,
  company,
  gapById,
  questions,
  sources,
  stakeholders,
} from "@/lib/suvarna";
import { BriefFrame, FullFrame, SummaryStrip, type SectionRef } from "./Frames";
import { ConfidenceBadge } from "@/components/meridian/Confidence";
import { Eyebrow, SectionHeading, Card } from "@/components/meridian/Primitives";
import { QuestionRow } from "@/components/meridian/QuestionRow";
import { GapRow } from "@/components/meridian/GapRow";
import { SourceChip } from "@/components/meridian/Evidence";
import { ArrowIcon } from "@/components/meridian/Icons";
import { usePanel } from "@/components/meridian/EvidencePanel";

/* -------------------------------------------------------------------------- */
/* Direction 2 — Call-first                                                    */
/* The axis is the conversation, in order. Facts sit inside the moment of the   */
/* call where you would use them, not in sections of their own.                 */
/* -------------------------------------------------------------------------- */

/** The three things worth saying out loud, in the order you would say them. */
const RAISE = [
  {
    gapId: "g6",
    say: "Three weeks to onboard a supplier — what does the plant do while it waits?",
    who: "sh-rohan",
  },
  {
    gapId: "g2",
    say: "Fifty-eight percent first-time match. Who picks up the other forty-two?",
    who: "sh-anand",
  },
  {
    gapId: "g4",
    say: "You have early-payment terms you almost never hit. That is cash, not process.",
    who: "sh-meera",
  },
] as const;

export function CallBrief() {
  const { open } = usePanel();
  const met = stakeholders.filter((s) => s.met);
  const notMet = stakeholders.filter((s) => !s.met);

  return (
    <BriefFrame>
      <div className="shrink-0">
        <Eyebrow>Discovery call · {company.name} · today</Eyebrow>
        <p className="mt-2 font-display text-h2 leading-[1.15] measure">
          They have grown 18% to ₹1,150 Cr on a procurement process that has not changed since
          2019.
        </p>
        <p className="mt-1.5 text-small text-muted-foreground">
          Open with that. It is their own sentence, from Rohan&apos;s April email.
        </p>
      </div>

      <div className="flex shrink-0 items-center justify-between gap-4 rounded-md bg-muted px-3 py-2">
        <div>
          <div className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
            Worth, if you are right
          </div>
          <div className="tabular text-lead font-medium">₹14.7 Cr a year</div>
        </div>
        <ConfidenceBadge level={company.confidence} showReason={false} />
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <Eyebrow>Raise these three, in this order</Eyebrow>
        <ol className="mt-1.5 space-y-2">
          {RAISE.map((item, i) => {
            const gap = gapById(item.gapId);
            const who = stakeholders.find((s) => s.id === item.who)!;
            return (
              <li key={item.gapId}>
                <button
                  type="button"
                  onClick={() => open({ kind: "gap", id: gap.id })}
                  className="group flex w-full items-start gap-2.5 text-left"
                >
                  <span className="tabular mt-[3px] text-small font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base leading-snug group-hover:underline underline-offset-4">
                      {item.say}
                    </span>
                    <span className="mt-0.5 flex items-baseline justify-between gap-3">
                      <span className="truncate text-small text-muted-foreground">
                        {who.name} · {who.role}
                        {!who.met && " · not met"}
                      </span>
                      <span className="tabular shrink-0 text-small text-muted-foreground">
                        {money(gap.amountCr)}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      <div className="shrink-0 border-t border-border pt-2.5">
        <div className="flex items-end justify-between gap-4">
          <p className="text-small text-muted-foreground">
            <span className="text-foreground">Met:</span> {met.map((s) => s.name).join(", ")}.{" "}
            <span className="text-foreground">Not met:</span>{" "}
            {notMet.map((s) => s.name).join(", ")}.
          </p>
          <Link
            href="/research/call/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small underline-offset-4 hover:underline"
          >
            Full call plan
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

const SECTIONS: SectionRef[] = [
  ...callBeats.map((b) => ({ id: b.id, label: b.phase, meta: b.minutes })),
  { id: "if-asked", label: "If they ask", meta: "reference" },
];

export function CallFull() {
  return (
    <FullFrame sections={SECTIONS}>
      <div>
        <Eyebrow>{company.name} · discovery call plan</Eyebrow>
        <h1 className="mt-1.5 font-display text-h1 leading-tight measure">The next 30 minutes</h1>
        <p className="mt-2 text-base text-muted-foreground measure">
          Read top to bottom before you dial. Everything Meridian found is in here — it is arranged
          by when you would use it rather than by what kind of thing it is.
        </p>
        <div className="mt-4">
          <SummaryStrip
            items={[
              { label: "On the call", value: "Rohan Deshpande" },
              { label: "Questions", value: "8" },
              { label: "Gaps to name", value: "2 of 12" },
              { label: "Worth", value: "₹14.7 Cr" },
              { label: "Confidence", value: "Medium-high" },
            ]}
          />
        </div>
      </div>

      {callBeats.map((beat) => (
        <section key={beat.id}>
          <SectionHeading
            id={beat.id}
            title={beat.phase}
            summary={beat.intent}
            right={<span className="tabular">{beat.minutes}</span>}
          />

          {beat.lines.length > 0 && (
            <div className="mt-3 space-y-3">
              {beat.lines.map((line, i) => {
                const isWarning = line.label.startsWith("Do not") || line.label === "Hold back";
                return (
                  <Card
                    key={i}
                    className={cn(
                      "px-3.5 py-3",
                      isWarning && "border-dashed bg-transparent",
                    )}
                  >
                    <div
                      className={cn(
                        "text-micro font-medium uppercase tracking-[0.08em]",
                        isWarning ? "text-health-watch" : "text-muted-foreground",
                      )}
                    >
                      {line.label}
                    </div>
                    <p
                      className={cn(
                        "mt-1 measure",
                        isWarning ? "text-base" : "text-lead leading-snug",
                      )}
                    >
                      {line.body}
                    </p>
                    {line.detail && (
                      <p className="mt-1.5 text-small text-muted-foreground measure">
                        {line.detail}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {/* The probe beat is the question set itself. */}
          {beat.id === "beat-probe" && (
            <ol className="mt-4">
              {questions.map((q, i) => (
                <QuestionRow key={q.id} question={q} last={i === questions.length - 1} />
              ))}
            </ol>
          )}

          {/* The land beat carries the two gaps, in full, priced. */}
          {beat.id === "beat-land" && (
            <ul className="mt-4 divide-y divide-border border-t border-border pt-3">
              {["g1", "g2", "g6"].map((id) => (
                <GapRow key={id} gap={gapById(id)} showRank={false} />
              ))}
            </ul>
          )}
        </section>
      ))}

      {/* ---------------------------------------------------------------- */}
      <section>
        <SectionHeading
          id="if-asked"
          title="If they ask"
          summary="The direction's weak point, handled explicitly: facts that belong to no moment in the call, kept together so they are findable when someone asks a question out of order."
        />
        <div className="mt-3 grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3">
          {company.facts.map((f) => (
            <div key={f.label}>
              <div className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
                {f.label}
              </div>
              <div className="tabular text-base font-medium">{f.value}</div>
              <div className="text-small text-muted-foreground measure">{f.detail}</div>
            </div>
          ))}
        </div>

        <h3 className="mt-6 text-base font-medium">The other nine gaps</h3>
        <p className="mt-1 text-small text-muted-foreground measure">
          Deliberately not on the call plan. If the conversation opens up, they are here.
        </p>
        <ul className="mt-2 divide-y divide-border border-t border-border">
          {["g3", "g4", "g5", "g7", "g8", "g9", "g10", "g11", "g12"].map((id) => (
            <GapRow key={id} gap={gapById(id)} />
          ))}
        </ul>

        <h3 className="mt-6 text-base font-medium">Where all of this came from</h3>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {sources.map((s) => (
            <SourceChip key={s.id} sourceId={s.id} />
          ))}
        </div>
      </section>
    </FullFrame>
  );
}

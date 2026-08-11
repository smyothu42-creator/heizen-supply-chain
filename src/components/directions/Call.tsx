"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import {
  callBeats,
  company,
  gapById,
  gaps,
  questions,
  questionsWhen,
  sources,
  stakeholderById,
  stakeholders,
} from "@/lib/suvarna";
import { BriefFrame, DocumentLead, FullFrame, Section, type SectionRef } from "./Frames";
import { ConfidenceBadge } from "@/components/meridian/Confidence";
import { Eyebrow, Card } from "@/components/meridian/Primitives";
import { QuestionRow } from "@/components/meridian/QuestionRow";
import { GapRow } from "@/components/meridian/GapRow";
import { SourceChip } from "@/components/meridian/Evidence";
import { ArrowIcon } from "@/components/meridian/Icons";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";
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
    say: "Three weeks to onboard a supplier. What does the plant do while it waits?",
    who: "sh-rohan",
  },
  {
    gapId: "g2",
    say: "Fifty-eight percent first-time match. Who picks up the other forty-two?",
    who: "sh-anand",
  },
  {
    gapId: "g4",
    // "That is cash, not process" was exactly backwards — capturing the discount
    // gains margin and SPENDS cash. Said to a CFO it ends the meeting.
    say: "You have early-payment terms you almost never hit. Margin, but it costs cash to take.",
    who: "sh-meera",
  },
] as const;

const BRIEF_HEADLINE = (
  <p className="font-display text-h2 leading-[1.15]">
    They have grown 18% to ₹1,150 Cr on a procurement process that has not changed since 2019.
  </p>
);
const BRIEF_STANDFIRST = "Open with that. It is their own sentence, from Rohan's April email.";

export function CallBrief() {
  const { open } = usePanel();
  const met = stakeholders.filter((s) => s.met);
  const notMet = stakeholders.filter((s) => !s.met);

  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      hero={
        <SurfaceHero
          tight
          title="Research"
          titleNode={
            /* Phone: this direction's own opening is the band. From `roomy`
                  the band says "Research" like every other surface and the
                  opening moves into the sheet, where Full puts it. */
            <div className="roomy:hidden">
              {BRIEF_HEADLINE}
              <p className="reading measure mt-1 text-small text-muted-foreground">
                {BRIEF_STANDFIRST}
              </p>
            </div>
          }
        />
      }
      lead={
        <DocumentLead bordered={false} titleNode={BRIEF_HEADLINE} standfirst={BRIEF_STANDFIRST} />
      }
    >
      <div className="flex shrink-0 items-center justify-between gap-4 rounded-md bg-muted px-3 py-1.5">
        <div>
          <div className="text-micro text-muted-foreground">
            Worth, if you are right
          </div>
          {/* Net, not the sum of the rows — and no one-off figure here. The
              beat below says explicitly that nothing with a rupee sign on it is
              said before minute 20; this chip is orientation, not a script. */}
          <div className="tabular text-lead font-medium">{money(company.netLeakageCr)} a year</div>
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
                    <span className="block text-base leading-snug transition-colors group-hover:text-muted-foreground">
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

      <div className="shrink-0 pt-1">
        <div className="flex items-end justify-between gap-4">
          <p className="text-small text-muted-foreground">
            <span className="text-foreground">Met:</span> {met.map((s) => s.name).join(", ")}.{" "}
            <span className="text-foreground">Not met:</span> {notMet.map((s) => s.name).join(", ")}
            .
          </p>
          <Link
            href="/research/call/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small transition-colors hover:text-muted-foreground"
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
  { id: "if-asked", label: "If they ask", defaultCollapsed: true },
];

/* Only the questions Rohan can actually answer. The other seven need Anand,
   Meera or Vikram, none of whom are in this room — printing all eleven as one
   ordered list implied a call that cannot happen. See AUDIT.md D. */
const FOR_THIS_CALL = [...questionsWhen("this-call"), ...questionsWhen("data-request")];
const LATER = questions.filter((q) => !FOR_THIS_CALL.includes(q));

const NAMED_ON_CALL = ["g6", "g2", "g11"];
const gapCount = gaps.length;

export function CallFull() {
  return (
    <FullFrame
      sections={SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="The next 30 minutes"
        standfirst="Arranged by when you would use it, not by what kind of thing it is."
      />


      {callBeats.map((beat) => (
        <Section
          key={beat.id}
          id={beat.id}
          title={beat.phase}
          summary={beat.intent}
          right={<span className="tabular">{beat.minutes}</span>}
        >
          {beat.lines.length > 0 && (
            <div className="space-y-3">
              {beat.lines.map((line, i) => {
                const isWarning = line.label.startsWith("Do not") || line.label === "Hold back";
                return (
                  <Card
                    key={i}
                    className={cn("px-4 py-3", isWarning && "border-dashed bg-transparent")}
                  >
                    <div
                      className={cn(
                        "text-micro font-medium ",
                        isWarning ? "text-health-watch" : "text-muted-foreground",
                      )}
                    >
                      {line.label}
                    </div>
                    {/* The spoken line is the one thing on this card, so it is
                        the only thing at lead size and it gets the tighter
                        measure — a sentence you read out loud wants to sit in
                        two or three short lines, not one long one. */}
                    <p
                      className={cn(
                        "mt-1.5",
                        isWarning
                          ? "reading text-small measure"
                          : "text-lead leading-snug measure-lead",
                      )}
                    >
                      {line.body}
                    </p>
                    {line.detail && (
                      <p className="reading mt-2 text-small text-muted-foreground measure">
                        {line.detail}
                      </p>
                    )}
                  </Card>
                );
              })}
            </div>
          )}

          {beat.id === "beat-probe" && (
            <>
              <ol className="mt-1">
                {FOR_THIS_CALL.map((q, i) => (
                  <QuestionRow key={q.id} question={q} last={i === FOR_THIS_CALL.length - 1} />
                ))}
              </ol>
              <div className="mt-4 rounded-md border border-dashed border-border-strong px-4 py-3">
                <p className="text-small font-medium">
                  {LATER.length} more questions, none of them for this room
                </p>
                <p className="reading mt-1 text-small text-muted-foreground measure">
                  They belong to{" "}
                  {[...new Set(LATER.map((q) => stakeholderById(q.targetId).name))].join(", ")} ,
                  and getting a meeting with one of them is a better outcome from today than any
                  answer Rohan can give you.
                </p>
              </div>
            </>
          )}

          {beat.id === "beat-land" && (
            <ul className="mt-3 divide-y divide-border border-t border-border">
              {NAMED_ON_CALL.map((id) => (
                <GapRow key={id} gap={gapById(id)} showRank={false} />
              ))}
            </ul>
          )}
        </Section>
      ))}

      <Section
        id="if-asked"
        title="If they ask"
        summary="Facts that belong to no moment in the call, kept findable for when someone asks out of order."
      >
        <div className="grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {company.facts.map((f) => (
            <div key={f.label}>
              <div className="flex items-baseline gap-2">
                <span className="tabular text-base font-medium">{f.value}</span>
                <span className="text-micro text-muted-foreground">
                  {f.label}
                </span>
              </div>
              <div className="text-small text-muted-foreground">{f.detail}</div>
            </div>
          ))}
        </div>

        <h3 className="mt-5 text-base font-medium">
          The other {gapCount - NAMED_ON_CALL.length} gaps
        </h3>
        <p className="mt-0.5 text-small text-muted-foreground">Not on the call plan.</p>
        <ul className="mt-2 divide-y divide-border border-t border-border">
          {gaps
            .filter((g) => !NAMED_ON_CALL.includes(g.id))
            .map((g) => (
              <GapRow key={g.id} gap={g} />
            ))}
        </ul>

        <div className="mt-5 flex flex-wrap gap-1.5">
          {sources.map((s) => (
            <SourceChip key={s.id} sourceId={s.id} />
          ))}
        </div>
      </Section>
    </FullFrame>
  );
}

"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  company,
  signalCounts,
  sources,
  timingSignals,
  urgency,
  type SignalPush,
  type TimingSignal,
} from "@/lib/suvarna";
import { BriefFrame, DocumentLead, FullFrame, Section, type SectionRef } from "./Frames";
import { ConfidenceBadge } from "@/components/meridian/Confidence";
import { Eyebrow } from "@/components/meridian/Primitives";
import { SourceChip } from "@/components/meridian/Evidence";
import { ArrowIcon } from "@/components/meridian/Icons";
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

/**
 * Which way a signal pushes, as a mark.
 *
 * Not a colour. Health hues on this surface would read as "this company is in
 * trouble", which is a different axis and one Operations already owns — and
 * `delays` is not bad news about the client, it is a constraint on the
 * consultant. Direction is a shape: up, down, level.
 */
const PUSH_MARK: Record<SignalPush, string> = {
  accelerates: "↑",
  delays: "↓",
  neutral: "→",
};

const PUSH_LABEL: Record<SignalPush, string> = {
  accelerates: "pushes towards now",
  delays: "pushes it back",
  neutral: "neither way",
};

function PushMark({ push }: { push: SignalPush }) {
  return (
    <span
      className={cn(
        "inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border text-micro leading-none",
        push === "accelerates"
          ? "border-evidence text-evidence"
          : "border-border-strong text-muted-foreground",
      )}
    >
      <span aria-hidden>{PUSH_MARK[push]}</span>
      <span className="sr-only">{PUSH_LABEL[push]}</span>
    </span>
  );
}

export function TimingBrief() {
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
                  opening moves into the column beside the content. */
            <div className="roomy:hidden">
              <p className="font-display text-h2 leading-[1.15]">
                {urgency.verdict}. The window shuts in February.
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
              {urgency.verdict}. The window shuts in February.
            </p>
          }
          standfirst={BRIEF_STANDFIRST}
        />
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <Eyebrow>Six signals, and which way each one points</Eyebrow>
        <ul className="mt-1.5 divide-y divide-border">
          {timingSignals.map((s) => (
            <li key={s.id} className="flex items-baseline gap-2.5 py-1.5 sm:py-2">
              <PushMark push={s.push} />
              <span className="min-w-0 flex-1 text-base leading-snug">{s.label}</span>
              <span className="shrink-0 text-small text-muted-foreground">{s.value}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 pt-1">
        <div className="flex items-end justify-between gap-4">
          <ConfidenceBadge level={company.confidence} showReason={false} />
          <Link
            href="/research/timing/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small transition-colors hover:text-muted-foreground"
          >
            The whole case
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

const ACCELERANTS = timingSignals.filter((s) => s.push === "accelerates");
const BRAKES = timingSignals.filter((s) => s.push !== "accelerates");

const SECTIONS: SectionRef[] = [
  { id: "verdict", label: "The verdict", meta: urgency.verdict },
  {
    id: "accelerants",
    label: "What pushes towards now",
    meta: `${ACCELERANTS.length} signals`,
  },
  {
    id: "brakes",
    label: "What pushes it back",
    meta: `${BRAKES.length} signals`,
  },
  {
    id: "signal-sources",
    label: "Where these came from",
    meta: String(sources.length),
    defaultCollapsed: true,
  },
];

export function TimingFull() {
  return (
    <FullFrame
      sections={SECTIONS}
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
        summary="A one-word answer with nothing behind it is the thing this product is not allowed to do, so the reasoning and the thing that would change it both sit here."
        right={<span className="text-base font-medium">{urgency.verdict}</span>}
      >
        <dl className="space-y-3">
          <VerdictRow label="Why it is strong">{urgency.because}</VerdictRow>
          <VerdictRow label="What argues against it">{urgency.against}</VerdictRow>
          <VerdictRow label="The window">{urgency.window}</VerdictRow>
        </dl>
      </Section>

      <Section
        id="accelerants"
        title="What pushes towards now"
        summary="Four signals, each with the individual readings behind the count. A count with no base under it is the number a client challenges first."
        right={
          <span className="tabular text-small text-muted-foreground">
            {ACCELERANTS.length} of {timingSignals.length}
          </span>
        }
      >
        <div className="divide-y divide-border">
          {ACCELERANTS.map((s) => (
            <SignalBlock key={s.id} signal={s} />
          ))}
        </div>
      </Section>

      <Section
        id="brakes"
        title="What pushes it back"
        summary="Neither of these is a reason to wait. Both are what you will be argued against, and the first one is a hard date."
        right={
          <span className="tabular text-small text-muted-foreground">
            {BRAKES.length} of {timingSignals.length}
          </span>
        }
      >
        <div className="divide-y divide-border">
          {BRAKES.map((s) => (
            <SignalBlock key={s.id} signal={s} />
          ))}
        </div>
      </Section>

      <Section
        id="signal-sources"
        title="Where these came from"
        summary="Timing rests on things a client never volunteers and a filing does not record, so this is the one direction that leans on the public web."
        right={
          <span className="tabular text-small text-muted-foreground">{sources.length} sources</span>
        }
      >
        <ul className="space-y-2">
          {sources.map((s) => {
            const used = timingSignals.filter((t) =>
              t.items.some((i) => i.sourceId === s.id),
            ).length;
            return (
              <li
                key={s.id}
                className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1"
              >
                <span className="flex min-w-0 items-baseline gap-2">
                  <SourceChip sourceId={s.id} />
                  <span className="text-small text-muted-foreground">{s.detail}</span>
                </span>
                <span className="tabular shrink-0 text-small text-muted-foreground">
                  {used === 0 ? "no signals" : `${used} signal${used === 1 ? "" : "s"}`}
                </span>
              </li>
            );
          })}
        </ul>
      </Section>
    </FullFrame>
  );
}

function VerdictRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 border-b border-border pb-3 last:border-0 last:pb-0 sm:flex-row sm:gap-6">
      <dt className="shrink-0 text-micro font-medium text-muted-foreground sm:w-48 sm:pt-0.5">
        {label}
      </dt>
      <dd className="reading min-w-0 flex-1 text-small measure">{children}</dd>
    </div>
  );
}

/**
 * One signal, with the readings behind its count.
 *
 * The count is on the row and the items are under it, not the other way round:
 * "2 signals" is what you scan for and the two individual readings are what
 * you say out loud when someone asks which two. Each item names its own source,
 * because a signal read off the public web is exactly the kind of claim that
 * gets challenged.
 */
function SignalBlock({ signal }: { signal: TimingSignal }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="flex items-baseline gap-2">
          <PushMark push={signal.push} />
          <span className="text-base font-medium">{signal.label}</span>
        </span>
        <span className="shrink-0 text-small text-muted-foreground">{signal.value}</span>
      </div>

      <p className="reading mt-1.5 text-small measure">{signal.soWhat}</p>

      <ul className="mt-2.5 space-y-1.5">
        {signal.items.map((item) => (
          <li
            key={item.text}
            className="reading flex flex-wrap items-baseline gap-x-2 gap-y-1 text-small text-muted-foreground"
          >
            <span className="min-w-0 flex-1 measure">{item.text}</span>
            <SourceChip sourceId={item.sourceId} />
          </li>
        ))}
      </ul>
    </div>
  );
}

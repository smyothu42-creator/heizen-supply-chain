"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import {
  buckets,
  bucketTotal,
  company,
  dealRisks,
  gaps,
  questions,
  sources,
  stakeholders,
  systemSplit,
  systemsByState,
  type Gap,
} from "@/lib/suvarna";
import { BriefFrame, DocumentLead, FullFrame, Section, type SectionRef } from "./Frames";
import { ConfidenceBadge } from "@/components/meridian/Confidence";
import { ArrowIcon } from "@/components/meridian/Icons";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Direction 1 — All                                                           */
/*                                                                             */
/* The default, and the only direction with no axis. Picking an axis is itself  */
/* a decision, and arriving at Research from the masthead with no particular    */
/* errand should not require making one before you can read anything.           */
/*                                                                             */
/* **Its Brief is the summary that leaves the tool**, in the shape of the       */
/* Heizen one-pager: a thesis, a line naming the tension, then numbered pairs   */
/* — the problem in the client's own terms, and what we would do about it. That */
/* pairing is the whole format. A problem with no answer beside it is the deck  */
/* a consultant cannot send, which is the same argument the counter rule makes  */
/* on Risk.                                                                     */
/* -------------------------------------------------------------------------- */

/** The three the deck would lead on: biggest first, priced. */
const HEADLINE_GAPS = gaps
  .filter((g) => g.amountCr != null)
  .sort((a, b) => (b.amountCr ?? 0) - (a.amountCr ?? 0))
  .slice(0, 3);

const TENSION = "Where scale meets a process that has not changed since 2019";

export function AllBrief() {
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
              <p className="font-display text-h2 leading-[1.15]">{TENSION}</p>
              <p className="reading measure mt-1 text-small text-muted-foreground">
                {HEADLINE_GAPS.length} things to fix, each with what we would do about it.
              </p>
            </div>
          }
        />
      }
      lead={
        <DocumentLead
          bordered={false}
          titleNode={<p className="font-display text-h2 leading-[1.15]">{TENSION}</p>}
          standfirst={`Heizen would put workflows across ${company.name}'s buying, matching and stock, building the visibility ${money(company.netLeakageCr)} a year of leakage needs. No new ERP.`}
        />
      }
    >
      {/* The deck's shape: numbered, problem then answer. Three of them, because
          three is what fits on the screen and what a consultant can hold. */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <ol className="space-y-2">
          {HEADLINE_GAPS.map((gap, i) => (
            /* The third drops at 375. The leading and the size step above are
               worth more on a screen read in a corridor than a third card
               nobody gets to. */
            <FindingCard
              key={gap.id}
              gap={gap}
              n={i + 1}
              className={cn(i === 2 && "hidden sm:block")}
            />
          ))}
        </ol>
      </div>

      <div className="shrink-0 pt-1">
        <div className="flex items-end justify-between gap-4">
          <ConfidenceBadge level={company.confidence} showReason={false} />
          <Link
            href="/research/all/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small transition-colors hover:text-muted-foreground"
          >
            Every topic
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

const SECTIONS: SectionRef[] = [
  { id: "a-money", label: "The money", meta: money(company.netLeakageCr) },
  { id: "a-gaps", label: "What is wrong", meta: `${gaps.length} findings` },
  { id: "a-tech", label: "What they run", meta: `${systemsByState("live").length} live` },
  { id: "a-risk", label: "What could stop it", meta: `${dealRisks.length} risks` },
  { id: "a-people", label: "Who is in the room", meta: `${stakeholders.length} people` },
  { id: "a-ask", label: "What to ask", meta: `${questions.length} questions` },
];

/**
 * Every topic at once.
 *
 * Each section is that direction's headline and a way into it, not a copy of
 * it. A page that reproduced six directions in full would be six directions
 * with a seventh name, and the one thing this view is for — arriving with no
 * errand — is exactly the case where you do not want all of it.
 */
export function AllFull() {
  return (
    <FullFrame
      sections={SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead title={TENSION} standfirst={company.thesis} />

      <Section
        id="a-money"
        title="The money"
        summary="What it is worth a year, split by where it leaks from."
        right={<span className="tabular">{money(company.netLeakageCr)} claimable</span>}
      >
        <dl className="divide-y divide-border">
          {buckets.map((b) => (
            <div key={b.id} className="flex items-baseline justify-between gap-4 py-2">
              <dt className="min-w-0 text-small">{b.name}</dt>
              <dd className="tabular shrink-0 text-small font-medium">
                {money(bucketTotal(b.id))}
              </dd>
            </div>
          ))}
        </dl>
        <More href="/research/money/full">See how the total is built</More>
      </Section>

      <Section
        id="a-gaps"
        title="What is wrong"
        summary="The three worth opening with. Nine more sit behind them."
      >
        <ol className="space-y-3">
          {HEADLINE_GAPS.map((gap, i) => (
            <FindingCard key={gap.id} gap={gap} n={i + 1} showPrice />
          ))}
        </ol>
        <More href="/gaps">All {gaps.length} findings and the plan</More>
      </Section>

      <Section
        id="a-tech"
        title="What they run"
        summary={`${systemSplit.insideGaps} findings sit inside software they own. The other ${systemSplit.outsideGaps} are worth ${money(systemSplit.outsideValue)}.`}
      >
        <dl className="divide-y divide-border">
          {(["live", "workaround", "missing"] as const).map((state) => (
            <div key={state} className="flex items-baseline justify-between gap-4 py-2">
              <dt className="min-w-0 text-small">
                {state === "live"
                  ? "Already live"
                  : state === "workaround"
                    ? "Worked around"
                    : "Never bought"}
                <span className="ml-2 text-muted-foreground">
                  {systemsByState(state)
                    .map((s) => s.name)
                    .join(", ")}
                </span>
              </dt>
            </div>
          ))}
        </dl>
        <More href="/research/tech/full">The whole system estate</More>
      </Section>

      <Section
        id="a-risk"
        title="What could stop it"
        summary="Each one with the line to say when it is raised."
      >
        <ul className="space-y-2.5">
          {dealRisks
            .filter((r) => r.severity === "high")
            .map((r) => (
              <li key={r.id}>
                <p className="text-small">
                  <span className="font-medium">{r.label}.</span> {r.value}
                </p>
                <p className="reading mt-0.5 text-small text-muted-foreground">
                  <span className="text-evidence" aria-hidden>
                    →{" "}
                  </span>
                  {r.counter}
                </p>
              </li>
            ))}
        </ul>
        <More href="/research/risk/full">All {dealRisks.length}, with their counters</More>
      </Section>

      <Section id="a-people" title="Who is in the room" summary="And who has not been met.">
        <ul className="divide-y divide-border">
          {stakeholders.map((s) => (
            <li key={s.id} className="flex items-baseline justify-between gap-4 py-2">
              <span className="min-w-0 text-small">
                {s.name}
                <span className="ml-2 text-muted-foreground">{s.role}</span>
              </span>
              {!s.met && (
                <span className="shrink-0 text-small text-muted-foreground">not met</span>
              )}
            </li>
          ))}
        </ul>
        <More href="/research/stakeholder/full">The dossier, per person</More>
      </Section>

      <Section
        id="a-ask"
        title="What to ask"
        summary="The four that can be asked today. Seven more need another meeting."
      >
        <ol className="space-y-1.5">
          {questions.slice(0, 4).map((q) => (
            <li key={q.id} className="text-small">
              {q.text}
            </li>
          ))}
        </ol>
        <More href="/questions">All {questions.length}, in ask order</More>
      </Section>

      <p className="text-small text-muted-foreground">
        Everything above traces back to {sources.length} sources.
      </p>
    </FullFrame>
  );
}

/** The way out of a section and into the direction it summarises. */
function More({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="mt-3 inline-flex items-center gap-1.5 text-small text-evidence transition-colors hover:text-foreground"
    >
      {children}
      <ArrowIcon />
    </Link>
  );
}

/**
 * One finding as a card, the same shape the gap detail uses: a hairline box, a
 * sentence-case label over a rule that bleeds to both edges, the body inside.
 *
 * Three numbered blocks running down one ground read as a wall of small grey
 * text with headings in it. Three boxes read as three answers, which is what
 * they are — and a consultant scanning them is looking for one, not reading all
 * three. Same argument the Gaps detail makes; one component so the two cannot
 * drift.
 */
function FindingCard({
  gap,
  n,
  showPrice = false,
  className,
}: {
  gap: Gap;
  n: number;
  showPrice?: boolean;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "rounded-lg border border-border bg-card px-3 py-2 shadow-card sm:px-4 sm:py-2.5",
        className,
      )}
    >
      {/* **The title is a size above the body, not the same size in bold.**
          At `text-small` for both, the card had a heavier line and a lighter
          one rather than a heading and a paragraph — the eye had to read to
          find out which was which. `text-base` at 600 is one clear step, and
          the number drops to `text-micro` so it marks the card rather than
          competing with the thing it numbers. */}
      <div className="-mx-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-3 pb-2.5 sm:-mx-4 sm:px-4 sm:pb-3">
        <span className="flex min-w-0 items-baseline gap-2.5">
          <span className="tabular shrink-0 text-micro text-muted-foreground">
            {String(n).padStart(2, "0")}
          </span>
          <span className="text-base font-semibold leading-snug text-foreground">
            {gap.title}
          </span>
        </span>
        {showPrice && gap.amountCr != null && (
          <span className="tabular shrink-0 text-small font-medium">{money(gap.amountCr)}</span>
        )}
      </div>
      {/* The restatement is what goes at 375, not a whole card. The title is
          already the problem in the client's words; this says it a second way,
          which is worth a line on a desk and is the first thing to lose on a
          screen that may not scroll. */}
      {/* 1.75, not `.reading`'s 1.6. These are three or four wrapped lines read
          in a corridor, and the leading is what carries them; Brief pays for it
          by dropping the restatement below `sm`. */}
      <p className="mt-3.5 hidden text-small leading-[1.75] text-muted-foreground sm:block">
        {gap.plainLine}
      </p>
      <p className="mt-3.5 text-small leading-[1.75] sm:mt-2">
        <span className="text-evidence" aria-hidden>
          →{" "}
        </span>
        <span className="sr-only">What we would do: </span>
        {gap.nextSteps[0]}
      </p>
    </li>
  );
}

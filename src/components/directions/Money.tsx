"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { money, moneyParts, share } from "@/lib/format";
import {
  bucketTotal,
  buckets,
  company,
  coverage,
  gapById,
  gaps,
  metrics,
  pricedGaps,
  spendBase,
} from "@/lib/suvarna";
import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section, type SectionRef } from "./Frames";
import { ConfidenceBadge } from "@/components/meridian/Confidence";
import { GapRow } from "@/components/meridian/GapRow";
import { MetricDelta } from "@/components/meridian/MetricDelta";
import { EmptyState } from "@/components/meridian/EmptyState";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Direction 1 — Money-first                                                   */
/* The dossier is a decomposition of one number. Everything on screen exists    */
/* because it explains a slice of the leakage figure — and the reconciliation    */
/* sits above the slices, because they add to more than the headline.           */
/* -------------------------------------------------------------------------- */

const BUCKET_HEADLINE: Record<string, string> = {
  "b-pay": "Invoices typed in by hand, at a 58% match rate",
  "b-buy": "Three weeks to onboard a supplier, half of indirect spend off-contract",
  "b-move": "Freight never tendered, 38 days of finished goods, paper receiving",
  "b-recover": "Distributor claims reconciled in spreadsheets",
};

const BRIEF_STANDFIRST = `Under a paisa in every rupee they sell. Plus ${money(company.workingCapitalReleaseCr)} stuck in stock, released once, not saved each year.`;

/* Neutral weights, not health hues — this bar shows proportion, not severity. */
const SEGMENT_TONE = ["bg-foreground", "bg-foreground/70", "bg-foreground/45", "bg-foreground/25"];

export function MoneyBrief() {
  // Buckets add to gross; the headline is net. Showing net as the hero and the
  // deduction as a line under it is the whole point — a total that is smaller
  // than its own rows has to explain itself on the first screen, not the third.
  const total = company.grossLeakageCr;
  const parts = moneyParts(company.netLeakageCr);
  const ordered = [...buckets].sort((a, b) => bucketTotal(b.id) - bucketTotal(a.id));

  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      hero={
        <SurfaceHero
          tight
          collapseAtRoomy
          title="Research"
          titleNode={
            /* Phone: the direction's own headline is the band, because the
                  screen has no room for a document lead under a generic one.
                  From `roomy` the band says "Research" like every other
                  surface and the headline moves into the sheet below. */
            <div className="roomy:hidden">
              <div className="flex items-end gap-1.5">
                <span className="font-display text-display tabular">{parts.value}</span>
                <span className="font-display text-h2 leading-none pb-0.5">{parts.unit}</span>
                <span className="pb-1 text-small text-muted-foreground">leaking a year</span>
              </div>
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
            <div className="flex items-end gap-1.5">
              <span className="font-display text-display tabular">{parts.value}</span>
              <span className="font-display text-h2 leading-none pb-0.5">{parts.unit}</span>
              <span className="pb-1 text-small text-muted-foreground">leaking a year</span>
            </div>
          }
          standfirst={BRIEF_STANDFIRST}
        />
      }
    >
      {/* Proportion bar. Labels below carry the meaning; the bar shows shape. */}
      <div className="flex h-2 w-full overflow-hidden rounded-full" aria-hidden>
        {ordered.map((b, i) => (
          <div
            key={b.id}
            className={cn(SEGMENT_TONE[i], i > 0 && "border-l border-background")}
            style={{ width: `${(bucketTotal(b.id) / total) * 100}%` }}
          />
        ))}
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-border overflow-hidden">
        {ordered.map((b, i) => {
          const value = bucketTotal(b.id);
          return (
            <li key={b.id}>
              <Link
                href={`/research/money/full#${b.id}`}
                className="group flex items-start gap-3 py-2.5 sm:py-3"
              >
                <span
                  className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", SEGMENT_TONE[i])}
                  aria-hidden
                />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-base font-medium transition-colors group-hover:text-muted-foreground">
                      {b.name}
                    </span>
                    <span className="tabular shrink-0 text-base font-medium">{money(value)}</span>
                  </span>
                  <span className="mt-0.5 flex items-baseline justify-between gap-3">
                    <span className="text-small text-muted-foreground">
                      {BUCKET_HEADLINE[b.id]}
                    </span>
                    <span className="tabular shrink-0 text-small text-muted-foreground">
                      {share(value, total)}
                    </span>
                  </span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      <BriefFooter
        href="/research/money/full"
        confidence={
          <ConfidenceBadge
            level={company.confidence}
            // The full reconciliation is a section on Full. On one phone screen
            // the load-bearing half is that none of it is their arithmetic.
            reason="No price here is measured from their data."
          />
        }
      >
        Full breakdown
      </BriefFooter>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

const SECTIONS: SectionRef[] = [
  { id: "reconcile", label: "How the total is built", meta: "3 lines" },
  ...buckets.map((b) => ({
    id: b.id,
    label: b.name,
    meta: `${b.gapIds.length} gaps`,
  })),
  { id: "coverage", label: "What this covers", meta: "2 of 5" },
  { id: "not-priced", label: "Not priced", meta: "1 gap" },
  { id: "context", label: "Company", meta: "6 facts", defaultCollapsed: true },
  { id: "benchmarks", label: "Benchmarks", meta: "12", defaultCollapsed: true },
];

export function MoneyFull() {
  const total = company.grossLeakageCr;
  const unpriced = gaps.filter((g) => g.amountCr == null);
  const netParts = moneyParts(company.netLeakageCr);

  return (
    <FullFrame
      sections={SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        titleNode={
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="font-display text-display tabular">{netParts.value}</span>
            <span className="font-display text-h1 leading-none pb-1">{netParts.unit}</span>
            <span className="pb-2 text-base text-muted-foreground">a year</span>
            <span className="pb-2 text-base text-muted-foreground">
              + {money(company.workingCapitalReleaseCr)} released once
            </span>
          </div>
        }
        standfirst={company.thesis}
      />


      {/* The reconciliation sits above the buckets, because the buckets below add
          to a bigger number than the headline and a reader who meets that
          without warning stops trusting both. */}
      <Section
        id="reconcile"
        title="How the total is built"
        summary="The sections below add to more than the headline. Here is why, before you find it yourself."
        right={<span className="tabular text-base font-medium">{money(company.netLeakageCr)}</span>}
      >
        {/* Full width, like every other row block in Research. It was
            `max-w-xl`, which stopped the reconciliation at ~576px inside a
            ~970px sheet and left the value column floating in the middle of an
            empty half. These are two-edge rows — label at one edge, figure at
            the other — and those use whatever width they are given. */}
        <dl className="space-y-3">
          <ReconcileRow label="Every gap, added up" detail="" value={money(total)} />
          <ReconcileRow
            label="Less the same saving counted twice"
            detail="Capture, matching, receiving and discount capture all move one invoice through one process."
            value={`−${money(company.overlapCr)}`}
          />
          <ReconcileRow
            label="Claimable a year"
            detail=""
            value={money(company.netLeakageCr)}
            emphasis
          />
          <ReconcileRow
            label="Cash released once"
            detail="Eight days of finished-goods cover. A one-off. Never add it to the line above."
            value={money(company.workingCapitalReleaseCr)}
          />
        </dl>

        <p className="reading mt-5 text-small text-muted-foreground measure">
          <span className="text-foreground">{spendBase.note}</span> None of the {pricedGaps.length}{" "}
          priced gaps is measured from their data.
        </p>
      </Section>

      {buckets.map((bucket) => {
        const bucketGaps = bucket.gapIds
          .map(gapById)
          .filter((g) => g.amountCr != null)
          .sort((a, b) => (b.amountCr ?? 0) - (a.amountCr ?? 0));
        const value = bucketTotal(bucket.id);
        return (
          <Section
            key={bucket.id}
            id={bucket.id}
            title={bucket.name}
            summary={bucket.plainLine}
            right={
              <span className="tabular text-base font-medium text-foreground">
                {money(value)}{" "}
                <span className="text-small font-normal text-muted-foreground">
                  {share(value, total)}
                </span>
              </span>
            }
          >
            <ul className="divide-y divide-border">
              {bucketGaps.map((gap) => (
                <GapRow key={gap.id} gap={gap} />
              ))}
            </ul>
          </Section>
        );
      })}

      {/* Eleven of twelve gaps sit in Source. Nobody has asked a question about
          Make, at a company with three plants. Stating that is worth more than
          the total is. See AUDIT.md C. */}
      <Section
        id="coverage"
        title="What this covers"
        summary="Which parts of the operation the number above is a number for."
        right={<span className="tabular text-small text-muted-foreground">2 of 5 stages</span>}
      >
        <ul className="divide-y divide-border">
          {coverage.map((c) => {
            const stageGaps = gaps.filter((g) => g.scor === c.stage);
            const value = stageGaps.reduce((s, g) => s + (g.amountCr ?? 0), 0);
            return (
              <li key={c.stage} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="flex items-baseline gap-2">
                    <span className="text-base font-medium">{c.stage}</span>
                    <span
                      className={cn(
                        "text-micro ",
                        c.state === "not-researched"
                          ? "text-health-watch"
                          : "text-muted-foreground",
                      )}
                    >
                      {c.state === "researched"
                        ? "researched"
                        : c.state === "thin"
                          ? "thin"
                          : "not looked at"}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-small">
                    {stageGaps.length === 0 ? (
                      <span className="text-muted-foreground">no gaps found</span>
                    ) : (
                      <>
                        <span className="font-medium">{money(value)}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {stageGaps.length} gap
                          {stageGaps.length === 1 ? "" : "s"}
                        </span>
                      </>
                    )}
                  </span>
                </div>
                <p className="reading mt-1 text-small text-muted-foreground measure">{c.line}</p>
                {c.unclaimedRange && (
                  <p className="reading mt-1.5 text-small measure">
                    <span className="font-medium">Not in the total: </span>
                    <span className="text-muted-foreground">{c.unclaimedRange}</span>
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      </Section>

      <Section
        id="not-priced"
        title="Not priced"
        summary="Found, with nothing behind it worth putting a number on."
      >
        <ul className="divide-y divide-border">
          {unpriced.map((gap) => (
            <GapRow key={gap.id} gap={gap} />
          ))}
        </ul>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <EmptyState kind="not-researched" scope="Returns and reverse logistics" compact />
          <EmptyState kind="confirmed-none" scope="Export documentation" compact />
        </div>
      </Section>

      <Section
        id="context"
        title="Company"
        summary="Last on purpose. A fact earns space here only by explaining a slice above."
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
      </Section>

      <Section
        id="benchmarks"
        title="Benchmarks"
        summary="Every number the gaps above are built on, against best-in-class."
      >
        <div className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
          {metrics.map((m) => (
            <MetricDelta key={m.id} metric={m} />
          ))}
        </div>
      </Section>
    </FullFrame>
  );
}

function ReconcileRow({
  label,
  detail,
  value,
  emphasis = false,
}: {
  label: string;
  detail: string;
  value: string;
  emphasis?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex items-baseline justify-between gap-4",
        emphasis && "border-y border-border py-2",
      )}
    >
      <div className="min-w-0">
        <dt className={cn("text-small", emphasis && "font-medium")}>{label}</dt>
        <dd className="reading text-micro text-muted-foreground measure">{detail}</dd>
      </div>
      <dd
        className={cn(
          "tabular shrink-0 text-base",
          emphasis ? "font-medium" : "text-muted-foreground",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

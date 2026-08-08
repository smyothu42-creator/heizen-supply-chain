"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { money, moneyParts, share } from "@/lib/format";
import { bucketTotal, buckets, company, gapById, gaps, metrics, sources } from "@/lib/suvarna";
import { BriefFrame, FullFrame, Section, SummaryStrip, type SectionRef } from "./Frames";
import { ConfidenceBadge } from "@/components/meridian/Confidence";
import { Eyebrow } from "@/components/meridian/Primitives";
import { GapRow } from "@/components/meridian/GapRow";
import { MetricDelta } from "@/components/meridian/MetricDelta";
import { EmptyState } from "@/components/meridian/EmptyState";
import { SourceChip } from "@/components/meridian/Evidence";
import { AboutView } from "@/components/meridian/PageHeader";
import { ArrowIcon } from "@/components/meridian/Icons";

/* -------------------------------------------------------------------------- */
/* Direction 1 — Money-first                                                   */
/* The dossier is a decomposition of one number. Everything on screen exists    */
/* because it explains a slice of ₹14.7 Cr.                                     */
/* -------------------------------------------------------------------------- */

const BUCKET_HEADLINE: Record<string, string> = {
  "b-pay": "Invoices typed in by hand, at a 58% match rate",
  "b-buy": "Three weeks to onboard a supplier, half of indirect spend off-contract",
  "b-move": "Paper warehousing and 38 days of finished goods",
  "b-recover": "Distributor claims reconciled in spreadsheets",
};

/* Neutral weights, not health hues — this bar shows proportion, not severity. */
const SEGMENT_TONE = ["bg-foreground", "bg-foreground/70", "bg-foreground/45", "bg-foreground/25"];

export function MoneyBrief() {
  const total = company.leakageCr;
  const parts = moneyParts(total);
  const ordered = [...buckets].sort((a, b) => bucketTotal(b.id) - bucketTotal(a.id));

  return (
    <BriefFrame>
      <div>
        <Eyebrow>
          {company.sector} · researched {company.researchedOn}
        </Eyebrow>
        <div className="mt-1.5 flex items-end gap-1.5">
          <span className="font-display text-[3rem] leading-[0.85] tabular sm:text-display">
            {parts.value}
          </span>
          <span className="font-display text-h2 leading-none pb-0.5">{parts.unit}</span>
          <span className="pb-1 text-small text-muted-foreground">leaking a year</span>
        </div>
        <p className="mt-2 text-small text-muted-foreground measure">
          1.3 paise in every rupee they sell — lost to how procurement runs, not to what they buy.
        </p>
      </div>

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
                <span className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", SEGMENT_TONE[i])} aria-hidden />
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className="text-base font-medium group-hover:underline underline-offset-4">
                      {b.name}
                    </span>
                    <span className="tabular shrink-0 text-base font-medium">{money(value)}</span>
                  </span>
                  <span className="mt-0.5 flex items-baseline justify-between gap-3">
                    <span className="text-small text-muted-foreground">{BUCKET_HEADLINE[b.id]}</span>
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

      <div className="shrink-0 border-t border-border pt-2.5">
        <div className="flex items-end justify-between gap-4">
          <ConfidenceBadge
            level={company.confidence}
            reason="FY25 report, 2 calls, 1 email thread. No ERP data yet."
          />
          <Link
            href="/research/money/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small underline-offset-4 hover:underline"
          >
            Full breakdown
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

const SECTIONS: SectionRef[] = [
  ...buckets.map((b) => ({ id: b.id, label: b.name, meta: money(bucketTotal(b.id)) })),
  { id: "not-priced", label: "Not priced", meta: "1 gap" },
  { id: "context", label: "Company", meta: "6 facts" },
  { id: "benchmarks", label: "Benchmarks", meta: "12" },
];

export function MoneyFull() {
  const total = company.leakageCr;
  const unpriced = gaps.filter((g) => g.amountCr == null);

  return (
    <FullFrame sections={SECTIONS}>
      <header>
        <Eyebrow>{company.name} · annual leakage</Eyebrow>
        <div className="mt-1.5 flex flex-wrap items-end gap-x-3 gap-y-1">
          <span className="font-display text-display leading-[0.85] tabular">₹14.7</span>
          <span className="font-display text-h1 leading-none pb-1">Cr</span>
          <span className="pb-2 text-base text-muted-foreground">a year</span>
        </div>
        <p className="mt-3 text-lead measure">{company.thesis}</p>

        <div className="mt-4">
          <SummaryStrip
            items={[
              { label: "revenue", value: "₹1,150 Cr" },
              { label: "of revenue", value: "1.3%" },
              { label: "gaps priced", value: "11 of 12" },
              { label: "sources", value: "4" },
            ]}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <ConfidenceBadge level={company.confidence} showReason={false} />
          <div className="flex flex-wrap gap-1.5">
            {sources.map((s) => (
              <SourceChip key={s.id} sourceId={s.id} />
            ))}
          </div>
          <AboutView>
            <p>{company.confidenceReason}</p>
            <p>
              Not in this number: quality rejections at goods receipt (no volumes shared), anything
              downstream of the Sangli expansion, and returns — not researched.
            </p>
          </AboutView>
        </div>
      </header>

      {buckets.map((bucket) => {
        const bucketGaps = bucket.gapIds
          .map(gapById)
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
            stats={[
              { label: "gaps", value: String(bucketGaps.length) },
              { label: "largest", value: money(bucketGaps[0]?.amountCr ?? null) },
              { label: "quickest", value: `${Math.min(...bucketGaps.map((g) => g.weeks))}w` },
            ]}
          >
            <ul className="divide-y divide-border">
              {bucketGaps.map((gap) => (
                <GapRow key={gap.id} gap={gap} />
              ))}
            </ul>
          </Section>
        );
      })}

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
                <span className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
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
        defaultCollapsed
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

"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { money, moneyParts, share } from "@/lib/format";
import {
  bucketTotal,
  buckets,
  company,
  gapById,
  gaps,
  metrics,
  sources,
} from "@/lib/suvarna";
import { BriefFrame, FullFrame, SummaryStrip, type SectionRef } from "./Frames";
import { ConfidenceBadge } from "@/components/meridian/Confidence";
import { Eyebrow, SectionHeading } from "@/components/meridian/Primitives";
import { GapRow } from "@/components/meridian/GapRow";
import { MetricDelta } from "@/components/meridian/MetricDelta";
import { EmptyState } from "@/components/meridian/EmptyState";
import { SourceChip } from "@/components/meridian/Evidence";
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
          Against ₹1,150 Cr of revenue — about 1.3 paise in every rupee they sell, lost to how
          procurement is run rather than to what they buy.
        </p>
      </div>

      {/* Proportion bar. Labels below carry the meaning; the bar only shows shape. */}
      <div>
        <div className="flex h-2 w-full overflow-hidden rounded-full" aria-hidden>
          {ordered.map((b, i) => (
            <div
              key={b.id}
              className={cn(SEGMENT_TONE[i], i > 0 && "border-l border-background")}
              style={{ width: `${(bucketTotal(b.id) / total) * 100}%` }}
            />
          ))}
        </div>
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
                    {/* Never truncated — an ellipsis here removes the only
                        plain-language line the bucket has. */}
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

      <div className="shrink-0 border-t border-border pt-2.5">
        <div className="flex items-end justify-between gap-4">
          <ConfidenceBadge
            level={company.confidence}
            reason="From the FY25 report, 2 calls and 1 email thread. No ERP data yet."
          />
          <Link
            href="/research/money/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small text-foreground underline-offset-4 hover:underline"
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
  { id: "the-number", label: "The number", meta: "₹14.7 Cr" },
  ...buckets.map((b) => ({ id: b.id, label: b.name, meta: money(bucketTotal(b.id)) })),
  { id: "not-priced", label: "Not priced yet", meta: "1 gap" },
  { id: "context", label: "Company context", meta: "supporting" },
];

export function MoneyFull() {
  const total = company.leakageCr;
  const unpriced = gaps.filter((g) => g.amountCr == null);

  return (
    <FullFrame sections={SECTIONS}>
      {/* ---------------------------------------------------------------- */}
      <section>
        <h1 id="the-number" className="scroll-mt-6 sr-only">
          The number
        </h1>
        <Eyebrow>{company.name} · annual leakage</Eyebrow>
        <div className="mt-2 flex flex-wrap items-end gap-x-4 gap-y-2">
          <span className="font-display text-display leading-[0.85] tabular">₹14.7</span>
          <span className="font-display text-h1 leading-none pb-1">Cr</span>
          <span className="pb-2 text-base text-muted-foreground">a year</span>
        </div>

        <p className="mt-4 text-lead measure">{company.thesis}</p>

        <div className="mt-5">
          <SummaryStrip
            items={[
              { label: "Revenue", value: "₹1,150 Cr" },
              { label: "Leakage", value: "₹14.7 Cr" },
              { label: "Share of revenue", value: "1.3%" },
              { label: "Gaps found", value: "12" },
              { label: "Priced", value: "11 of 12" },
              { label: "Sources", value: "4" },
            ]}
          />
        </div>

        <div className="mt-5 grid gap-5 sm:grid-cols-2">
          <div>
            <Eyebrow>How sure we are</Eyebrow>
            <div className="mt-1.5">
              <ConfidenceBadge level={company.confidence} reason={company.confidenceReason} />
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {sources.map((s) => (
                <SourceChip key={s.id} sourceId={s.id} />
              ))}
            </div>
          </div>
          <div>
            <Eyebrow>What is not in this number</Eyebrow>
            <ul className="mt-1.5 space-y-1 text-small text-muted-foreground measure">
              <li>
                Quality rejections at goods receipt — no volumes shared, so it is listed and left
                unpriced rather than guessed at.
              </li>
              <li>
                Anything downstream of the Sangli expansion, which has not been sized.
              </li>
              <li>
                Returns and reverse logistics — not researched. Nothing here says it is clean.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      {buckets.map((bucket) => {
        const value = bucketTotal(bucket.id);
        const bucketGaps = bucket.gapIds.map(gapById).sort((a, b) => (b.amountCr ?? 0) - (a.amountCr ?? 0));
        const priced = bucketGaps.filter((g) => g.amountCr != null);
        return (
          <section key={bucket.id}>
            <SectionHeading
              id={bucket.id}
              title={bucket.name}
              summary={bucket.plainLine}
              right={
                <span className="tabular text-base font-medium text-foreground">
                  {money(value)}{" "}
                  <span className="text-small font-normal text-muted-foreground">
                    · {share(value, total)} of the total
                  </span>
                </span>
              }
            />
            <div className="mt-3">
              <SummaryStrip
                items={[
                  { label: "Gaps", value: String(bucketGaps.length) },
                  { label: "Priced", value: `${priced.length} of ${bucketGaps.length}` },
                  { label: "Largest", value: money(priced[0]?.amountCr ?? null) },
                  {
                    label: "Quickest",
                    value: `${Math.min(...bucketGaps.map((g) => g.weeks))} weeks`,
                  },
                ]}
              />
            </div>
            <ul className="mt-2 divide-y divide-border">
              {bucketGaps.map((gap) => (
                <GapRow key={gap.id} gap={gap} />
              ))}
            </ul>
          </section>
        );
      })}

      {/* ---------------------------------------------------------------- */}
      <section>
        <SectionHeading
          id="not-priced"
          title="Not priced yet"
          summary="Found, but with nothing behind it worth putting a number on. Listed here rather than hidden, because an empty slot and a confirmed nothing are different answers."
          right={<span className="tabular">—</span>}
        />
        <ul className="mt-2 divide-y divide-border">
          {unpriced.map((gap) => (
            <GapRow key={gap.id} gap={gap} />
          ))}
        </ul>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <EmptyState kind="not-researched" scope="Returns and reverse logistics" compact />
          <EmptyState kind="confirmed-none" scope="Export documentation" compact />
        </div>
      </section>

      {/* ---------------------------------------------------------------- */}
      <section>
        <SectionHeading
          id="context"
          title="Company context"
          summary="Deliberately last. In this direction a company fact only earns space when it explains a slice of the number above."
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

        <h3 className="mt-8 text-base font-medium">Every benchmark on file</h3>
        <p className="mt-1 text-small text-muted-foreground measure">
          Each number that any gap above is built on, with what best-in-class looks like.
        </p>
        <div className="mt-3 grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {metrics.map((m) => (
            <MetricDelta key={m.id} metric={m} />
          ))}
        </div>
      </section>
    </FullFrame>
  );
}

"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { metricById, stakeholderById, type Gap } from "@/lib/suvarna";
import { EvidenceChain } from "./Evidence";
import { TIER_LABEL } from "./Confidence";
import { MetricLine } from "./MetricDelta";
import { TierMark } from "./Icons";
import { usePanel } from "./EvidencePanel";

/**
 * A gap is a finding: past-tense, evidenced, priced.
 *
 * Collapsed, it is one line — rank, what it is, what it costs. Twelve gaps
 * should read as twelve lines, not seventy. Everything else (why we believe it,
 * expected impact, the numbers, the evidence) lives behind a single expander,
 * because four controls per row across a twelve-row list is forty-eight things
 * to ignore before you have read anything.
 *
 * Expands in place: a consultant scanning ten gaps must not lose their place
 * to check one. See data-display-patterns.
 */
export function GapRow({
  gap,
  showRank = true,
  className,
  as: As = "li",
}: {
  gap: Gap;
  showRank?: boolean;
  className?: string;
  /** "div" when the caller already provides the list item, e.g. a plan tick-box. */
  as?: "li" | "div";
}) {
  const [open, setOpen] = useState(false);
  const { open: openPanel } = usePanel();
  const id = useId();

  return (
    <As className={cn("min-w-0", className)}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="group flex w-full items-baseline gap-3 py-2 text-left"
      >
        {showRank && (
          <span className="tabular w-5 shrink-0 text-small text-muted-foreground">{gap.rank}</span>
        )}

        <span className="min-w-0 flex-1 text-base group-hover:underline underline-offset-4">
          {gap.title}
        </span>

        {/* Confidence tier as a shape, effort as two characters. Both are
            qualifiers on the number, so they sit next to it and stay quiet. */}
        <span className="hidden shrink-0 items-center gap-1.5 text-micro text-muted-foreground sm:flex">
          <TierMark tier={gap.tier} />
          <span className="sr-only">{TIER_LABEL[gap.tier]}.</span>
          <span className="tabular">
            {gap.effort} · {gap.weeks}w
          </span>
        </span>

        <span
          className={cn(
            "tabular shrink-0 text-base font-medium tracking-tight",
            gap.amountCr == null && "text-muted-foreground",
          )}
        >
          {money(gap.amountCr)}
          {gap.amountCr == null && <span className="sr-only">not priced</span>}
        </span>

        <span
          aria-hidden
          className={cn(
            "shrink-0 text-muted-foreground transition-transform",
            open && "rotate-90",
          )}
        >
          ›
        </span>
      </button>

      {open && (
        <div id={id} className="pb-4 pl-0 sm:pl-8">
          <p className="text-small measure">{gap.plainLine}</p>

          <dl className="mt-3 space-y-2.5">
            <Field label="Why we believe it">
              {gap.why}
              <span className="mt-1 block text-muted-foreground">
                {gap.confidence} confidence — {gap.confidenceReason}
              </span>
            </Field>
            <Field label="Expected impact">{gap.impact}</Field>
            {gap.unpricedReason && <Field label="Why it has no number">{gap.unpricedReason}</Field>}
          </dl>

          {gap.metricIds.length > 0 && (
            <div className="mt-3 divide-y divide-border border-y border-border">
              {gap.metricIds.map((mid) => (
                <MetricLine key={mid} metric={metricById(mid)} />
              ))}
            </div>
          )}

          <div className="mt-3">
            <p className="text-micro font-medium uppercase tracking-[0.08em] text-muted-foreground">
              Evidence · {gap.evidence.length}
            </p>
            <div className="mt-1.5">
              <EvidenceChain evidence={gap.evidence} />
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-muted-foreground">
            <span>
              Sits with {stakeholderById(gap.ownerId).name} · {gap.level2}
            </span>
            <button
              type="button"
              onClick={() => openPanel({ kind: "gap", id: gap.id })}
              className="underline-offset-4 hover:text-foreground hover:underline"
            >
              Open in panel
            </button>
          </div>
        </div>
      )}
    </As>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-micro font-medium uppercase tracking-[0.08em] text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 text-small measure">{children}</dd>
    </div>
  );
}

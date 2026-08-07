"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { money, moneyParts } from "@/lib/format";
import { buckets, company, gaps, type Gap } from "@/lib/suvarna";
import { Eyebrow } from "@/components/meridian/Primitives";
import { GapRow } from "@/components/meridian/GapRow";
import { SummaryStrip } from "@/components/directions/Frames";

const confirmedValue = gaps
  .filter((g) => g.tier === "confirmed")
  .reduce((s, g) => s + (g.amountCr ?? 0), 0);
const quickWins = gaps.filter((g) => g.weeks < 10);

/**
 * Gaps — findings. Past-tense, evidenced, priced.
 *
 * Shares FindingCard's structure with Questions and none of its visual voice:
 * money is present in every row, order is by value, and nothing here is
 * phrased as something to ask. See data-display-patterns.
 */

type Sort = "value" | "effort" | "confidence";

const EFFORT_RANK = { Low: 0, Medium: 1, High: 2 } as const;
const TIER_RANK = { confirmed: 0, inferred: 1, unverified: 2 } as const;

export function GapsView() {
  const [sort, setSort] = useState<Sort>("value");
  const [bucketFilter, setBucketFilter] = useState<string | null>(null);
  const [plan, setPlan] = useState<Set<string>>(new Set(["g1", "g2", "g4"]));

  const visible = useMemo(() => {
    const list = bucketFilter ? gaps.filter((g) => g.bucketId === bucketFilter) : [...gaps];
    return list.sort((a, b) => {
      if (sort === "value") return (b.amountCr ?? -1) - (a.amountCr ?? -1);
      if (sort === "effort")
        return EFFORT_RANK[a.effort] - EFFORT_RANK[b.effort] || (b.amountCr ?? 0) - (a.amountCr ?? 0);
      return TIER_RANK[a.tier] - TIER_RANK[b.tier] || (b.amountCr ?? 0) - (a.amountCr ?? 0);
    });
  }, [sort, bucketFilter]);

  const selected = gaps.filter((g) => plan.has(g.id));
  const planValue = selected.reduce((s, g) => s + (g.amountCr ?? 0), 0);
  const planWeeks = selected.length ? Math.max(...selected.map((g) => g.weeks)) : 0;
  const planParts = moneyParts(planValue);

  const toggle = (id: string) =>
    setPlan((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-4">
      <Eyebrow>{company.name} · what we can sell them</Eyebrow>
      <h1 className="mt-1.5 font-display text-h1 leading-tight">Twelve gaps, eleven priced</h1>
      <p className="mt-2 text-base text-muted-foreground measure">
        Problems Heizen can fix, each with what it costs Suvarna a year and what we believe it on.
        The twelfth has no number because they have not shared the data — it is listed rather than
        guessed at.
      </p>

      <div className="mt-4">
        <SummaryStrip
          items={[
            { label: "Total found", value: money(company.leakageCr) },
            { label: "Gaps", value: String(gaps.length) },
            {
              label: "Priced",
              value: `${gaps.filter((g) => g.amountCr != null).length} of ${gaps.length}`,
            },
            { label: "Resting on confirmed", value: money(confirmedValue) },
            { label: "Under 10 weeks", value: String(quickWins.length) },
          ]}
        />
      </div>

      {/* ------------------------------------------------- controls */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <div className="flex items-center gap-2">
          <span className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
            Order by
          </span>
          <div className="flex rounded-md border border-border p-0.5" role="group" aria-label="Order by">
            {(
              [
                ["value", "Value"],
                ["effort", "Effort"],
                ["confidence", "How sure"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                aria-pressed={sort === key}
                onClick={() => setSort(key)}
                className={cn(
                  "rounded-[5px] px-2.5 py-0.5 text-small",
                  sort === key ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-micro uppercase tracking-[0.08em] text-muted-foreground">Area</span>
          <button
            type="button"
            aria-pressed={bucketFilter === null}
            onClick={() => setBucketFilter(null)}
            className={cn(
              "rounded-full border px-2.5 py-0.5 text-small",
              bucketFilter === null
                ? "border-foreground bg-foreground text-background font-medium"
                : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
            )}
          >
            All
          </button>
          {buckets.map((b) => (
            <button
              key={b.id}
              type="button"
              aria-pressed={bucketFilter === b.id}
              onClick={() => setBucketFilter(b.id)}
              className={cn(
                "rounded-full border px-2.5 py-0.5 text-small",
                bucketFilter === b.id
                  ? "border-foreground bg-foreground text-background font-medium"
                  : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
              )}
            >
              {b.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid gap-8 lg:grid-cols-[minmax(0,1fr)_260px]">
        {/* ----------------------------------------------- the list */}
        <div className="min-w-0">
          <ul className="divide-y divide-border border-t border-border">
            {visible.map((gap) => (
              <SelectableGapRow
                key={gap.id}
                gap={gap}
                checked={plan.has(gap.id)}
                onToggle={() => toggle(gap.id)}
              />
            ))}
          </ul>
          {visible.length === 0 && (
            <p className="py-6 text-small text-muted-foreground">Nothing in this area.</p>
          )}
        </div>

        {/* ----------------------------------------------- the plan */}
        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-lg border border-border bg-card p-4">
            <h2 className="text-micro font-medium uppercase tracking-[0.09em] text-muted-foreground">
              Proposed plan
            </h2>
            <div className="mt-2 flex items-end gap-1.5">
              <span className="font-display text-h1 leading-none tabular">{planParts.value}</span>
              <span className="font-display text-h3 leading-none pb-0.5">{planParts.unit}</span>
            </div>
            <p className="mt-1 text-small text-muted-foreground">
              a year, across {selected.length} of 12 gaps
            </p>

            <dl className="mt-3 space-y-1.5 border-t border-border pt-3 text-small">
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Share of everything found</dt>
                <dd className="tabular font-medium">
                  {Math.round((planValue / company.leakageCr) * 100)}%
                </dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Longest item</dt>
                <dd className="tabular font-medium">{planWeeks} weeks</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-muted-foreground">Resting on inference</dt>
                <dd className="tabular font-medium">
                  {money(
                    selected
                      .filter((g) => g.tier !== "confirmed")
                      .reduce((s, g) => s + (g.amountCr ?? 0), 0),
                  )}
                </dd>
              </div>
            </dl>

            {selected.length > 0 ? (
              <ul className="mt-3 space-y-1.5 border-t border-border pt-3">
                {selected.map((g) => (
                  <li key={g.id} className="flex items-baseline justify-between gap-2 text-small">
                    <span className="truncate text-muted-foreground">{g.title}</span>
                    <span className="tabular shrink-0">{money(g.amountCr)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 border-t border-border pt-3 text-small text-muted-foreground measure">
                Nothing selected. Tick gaps in the list to build a plan and see what it is worth.
              </p>
            )}

            <p className="mt-3 text-micro text-muted-foreground measure">
              Totals are the annual figures from each gap. Where two gaps fix the same root cause,
              doing both does not double the saving — check before this goes in a proposal.
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}

/** GapRow plus a plan tick-box. The card itself is unchanged and shared. */
function SelectableGapRow({
  gap,
  checked,
  onToggle,
}: {
  gap: Gap;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="flex gap-3 py-3.5">
      <label className="mt-1 shrink-0 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-4 w-4 accent-foreground"
        />
        <span className="sr-only">Add “{gap.title}” to the plan</span>
      </label>
      <GapRow gap={gap} as="div" className="min-w-0 flex-1" />
    </li>
  );
}

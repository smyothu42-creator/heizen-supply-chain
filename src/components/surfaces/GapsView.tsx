"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { money, moneyParts } from "@/lib/format";
import { buckets, company, gaps, type Gap } from "@/lib/suvarna";
import { GapRow } from "@/components/meridian/GapRow";
import { PageHeader } from "@/components/meridian/PageHeader";

/**
 * Gaps — findings. Past-tense, evidenced, priced.
 *
 * Twelve rows, twelve lines. Sorting, filtering and the plan total are the
 * only things competing with the list, and each is one control.
 */

type Sort = "value" | "effort" | "confidence";

const EFFORT_RANK = { Low: 0, Medium: 1, High: 2 } as const;
const TIER_RANK = { confirmed: 0, inferred: 1, unverified: 2 } as const;

const confirmedValue = gaps
  .filter((g) => g.tier === "confirmed")
  .reduce((s, g) => s + (g.amountCr ?? 0), 0);

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
  const planParts = moneyParts(planValue);
  const planWeeks = selected.length ? Math.max(...selected.map((g) => g.weeks)) : 0;
  const planRisk = selected
    .filter((g) => g.tier !== "confirmed")
    .reduce((s, g) => s + (g.amountCr ?? 0), 0);

  const toggle = (id: string) =>
    setPlan((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-4">
      <PageHeader
        eyebrow={company.name}
        title="Gaps"
        line="Problems Heizen can fix, with what each costs them a year."
        stats={[
          { label: "found", value: money(company.leakageCr) },
          { label: "gaps", value: String(gaps.length) },
          { label: "on confirmed evidence", value: money(confirmedValue) },
        ]}
        about={
          <>
            <p>
              Eleven of twelve carry a number. The twelfth has no rejection data behind it, so it is
              listed unpriced rather than guessed at.
            </p>
            <p>
              Tick rows to build a plan. Where two gaps fix the same root cause, doing both does not
              double the saving — check before this goes in a proposal.
            </p>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border py-2">
        <Segmented
          label="Order"
          value={sort}
          onChange={(v) => setSort(v as Sort)}
          options={[
            ["value", "Value"],
            ["effort", "Effort"],
            ["confidence", "How sure"],
          ]}
        />
        <Segmented
          label="Area"
          value={bucketFilter ?? "all"}
          onChange={(v) => setBucketFilter(v === "all" ? null : v)}
          options={[["all", "All"], ...buckets.map((b) => [b.id, b.name] as [string, string])]}
        />
      </div>

      <div className="mt-4 grid gap-8 lg:grid-cols-[minmax(0,1fr)_230px]">
        <div className="min-w-0">
          <ul className="divide-y divide-border">
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

        <aside className="lg:sticky lg:top-4 lg:self-start">
          <div className="rounded-lg border border-border bg-card p-3.5">
            <p className="text-micro font-medium uppercase tracking-[0.09em] text-muted-foreground">
              Plan · {selected.length} of {gaps.length}
            </p>
            <p className="mt-1.5 flex items-end gap-1">
              <span className="font-display text-h1 leading-none tabular">{planParts.value}</span>
              <span className="font-display text-h3 leading-none pb-0.5">{planParts.unit}</span>
              <span className="pb-1 text-small text-muted-foreground">a year</span>
            </p>

            <dl className="mt-3 space-y-1 border-t border-border pt-2.5 text-small">
              <Stat label="of everything found">
                {Math.round((planValue / company.leakageCr) * 100)}%
              </Stat>
              <Stat label="longest item">{planWeeks}w</Stat>
              {/* Zero here is a real answer, not an absence — say it as a word
                  rather than as ₹0 L, which reads like a formatting failure. */}
              <Stat label="rests on inference">{planRisk === 0 ? "none" : money(planRisk)}</Stat>
            </dl>

            {selected.length === 0 && (
              <p className="mt-2.5 border-t border-border pt-2.5 text-micro text-muted-foreground">
                Tick rows to build a plan.
              </p>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="tabular font-medium">{children}</dd>
    </div>
  );
}

function Segmented({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-micro uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-0.5" role="group" aria-label={label}>
        {options.map(([key, text]) => (
          <button
            key={key}
            type="button"
            aria-pressed={value === key}
            onClick={() => onChange(key)}
            className={cn(
              "rounded-md px-2 py-0.5 text-small transition-colors",
              value === key
                ? "bg-foreground font-medium text-background"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {text}
          </button>
        ))}
      </div>
    </div>
  );
}

/** GapRow plus a plan tick-box. The row itself is unchanged and shared. */
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
    <li className="flex items-start gap-3">
      <label className="mt-3 shrink-0 cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={onToggle}
          className="h-4 w-4 accent-foreground"
        />
        <span className="sr-only">Add “{gap.title}” to the plan</span>
      </label>
      <GapRow gap={gap} as="div" className="flex-1" />
    </li>
  );
}

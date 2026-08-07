"use client";

import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { metricById, type Gap } from "@/lib/suvarna";
import { Disclosure } from "./Primitives";
import { EvidenceChain } from "./Evidence";
import { TierBadge } from "./Confidence";
import { MetricLine } from "./MetricDelta";
import { usePanel } from "./EvidencePanel";

/**
 * A gap is a finding: past-tense, evidenced, priced. Detail expands in place —
 * a consultant scanning ten gaps must not lose their place to check one.
 * See .claude/skills/data-display-patterns.
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
  const { open } = usePanel();

  return (
    <As className={cn(As === "li" && "py-3.5 first:pt-0", className)}>
      <div className="flex items-start gap-3">
        {showRank && (
          <span className="tabular mt-[3px] w-5 shrink-0 text-small text-muted-foreground">
            {gap.rank}
          </span>
        )}

        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <h3 className="text-base font-medium measure">{gap.title}</h3>
            <span
              className={cn(
                "tabular shrink-0 text-base font-medium",
                gap.amountCr == null && "text-muted-foreground",
              )}
            >
              {money(gap.amountCr)}
              {gap.amountCr != null && (
                <span className="text-small font-normal text-muted-foreground"> / yr</span>
              )}
            </span>
          </div>

          <p className="mt-0.5 text-small text-muted-foreground measure">{gap.plainLine}</p>

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-micro text-muted-foreground">
            <TierBadge tier={gap.tier} />
            <span aria-hidden>·</span>
            <span>{gap.effort} effort</span>
            <span aria-hidden>·</span>
            <span className="tabular">{gap.weeks} weeks</span>
            <span aria-hidden>·</span>
            <span className="truncate">{gap.level2}</span>
          </div>

          {gap.unpricedReason && (
            <p className="mt-2 rounded-md border border-dashed border-border-strong bg-muted px-2.5 py-1.5 text-small measure">
              <span className="font-medium">Not priced. </span>
              {gap.unpricedReason}
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-0">
            <Disclosure label="Why we believe it">
              <p className="text-small measure">{gap.why}</p>
              <p className="mt-2 text-small">
                <span className="font-medium">{gap.confidence}</span>{" "}
                <span className="text-muted-foreground">— {gap.confidenceReason}</span>
              </p>
            </Disclosure>

            <Disclosure label="Expected impact">
              <p className="text-small measure">{gap.impact}</p>
              {gap.metricIds.length > 0 && (
                <div className="mt-2 divide-y divide-border border-t border-border">
                  {gap.metricIds.map((id) => (
                    <MetricLine key={id} metric={metricById(id)} />
                  ))}
                </div>
              )}
            </Disclosure>

            <Disclosure label="Sources" count={gap.evidence.length} tone="evidence">
              <EvidenceChain evidence={gap.evidence} />
            </Disclosure>

            <button
              type="button"
              onClick={() => open({ kind: "gap", id: gap.id })}
              className="py-1 text-small text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Open detail
            </button>
          </div>
        </div>
      </div>
    </As>
  );
}

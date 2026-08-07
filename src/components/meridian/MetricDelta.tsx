import { cn } from "@/lib/cn";
import type { Metric } from "@/lib/suvarna";

/**
 * Never show a bare number. Actual, best-in-class, and the difference — with
 * the difference carrying the most visual weight, because the delta is the
 * entire pitch. See .claude/skills/data-display-patterns.
 */

function deltaText(m: Metric): { text: string; behind: boolean } | null {
  if (m.actual == null) return null;
  const behind =
    m.betterWhen === "lower" ? m.actual > m.bestInClass : m.actual < m.bestInClass;
  const raw = Math.abs(m.actual - m.bestInClass);
  const n = Math.round(raw * 10) / 10;

  if (m.unit === "%") return { text: `${n} pts ${behind ? "behind" : "ahead"}`, behind };
  if (m.unit === " days") return { text: `${n} days ${behind ? "slower" : "faster"}`, behind };
  const ratio = Math.round((m.actual / m.bestInClass) * 10) / 10;
  return { text: `${ratio}× best-in-class`, behind };
}

const fmt = (v: number, unit: string) => `${v}${unit}`;

export function MetricDelta({
  metric,
  size = "row",
  showGloss = true,
  className,
}: {
  metric: Metric;
  size?: "row" | "block";
  showGloss?: boolean;
  className?: string;
}) {
  const d = deltaText(metric);
  const block = size === "block";

  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("font-medium", block ? "text-base" : "text-small")}>
          {metric.label}
        </span>
        {d && (
          <span
            className={cn(
              "tabular shrink-0 font-medium",
              block ? "text-base" : "text-small",
              d.behind ? "text-metric-delta" : "text-metric-delta-good",
            )}
          >
            {d.text}
          </span>
        )}
      </div>

      {showGloss && (
        <p className={cn("mt-0.5 text-micro text-muted-foreground measure")}>{metric.gloss}</p>
      )}

      <div className="mt-1.5 flex items-baseline gap-x-4 gap-y-1 flex-wrap">
        {metric.actual == null ? (
          <span className="text-small text-muted-foreground italic">Not measured yet</span>
        ) : (
          <span
            className={cn(
              "tabular font-medium text-metric-actual",
              block ? "text-h3" : "text-base",
            )}
          >
            {fmt(metric.actual, metric.unit)}
          </span>
        )}
        <span className="tabular text-small text-metric-best-in-class">
          best-in-class {fmt(metric.bestInClass, metric.unit)}
        </span>
      </div>

      {/* A proportional bar makes the gap legible before the numbers are read.
          Purely supplementary — the text above already says everything. */}
      <MetricBar metric={metric} />
    </div>
  );
}

function MetricBar({ metric }: { metric: Metric }) {
  if (metric.actual == null) return null;
  const max = Math.max(metric.actual, metric.bestInClass);
  const actualPct = (metric.actual / max) * 100;
  const bestPct = (metric.bestInClass / max) * 100;
  const behind =
    metric.betterWhen === "lower" ? metric.actual > metric.bestInClass : metric.actual < metric.bestInClass;

  return (
    <div className="mt-2 h-1.5 w-full rounded-full bg-muted relative overflow-hidden" aria-hidden>
      <div
        className={cn("absolute inset-y-0 left-0 rounded-full", behind ? "bg-metric-delta" : "bg-metric-delta-good")}
        style={{ width: `${actualPct}%`, opacity: 0.35 }}
      />
      <div
        className="absolute inset-y-0 w-0.5 bg-metric-best-in-class"
        style={{ left: `calc(${bestPct}% - 1px)` }}
      />
    </div>
  );
}

/** One-line form for dense columns and Brief. */
export function MetricLine({ metric }: { metric: Metric }) {
  const d = deltaText(metric);
  return (
    <div className="flex items-baseline justify-between gap-3 py-1.5">
      <span className="text-small truncate">{metric.label}</span>
      <span className="shrink-0 tabular text-small">
        <span className="font-medium text-metric-actual">
          {metric.actual == null ? "—" : fmt(metric.actual, metric.unit)}
        </span>
        <span className="text-metric-best-in-class"> vs {fmt(metric.bestInClass, metric.unit)}</span>
        {d && (
          <span className={cn("ml-2 font-medium", d.behind ? "text-metric-delta" : "text-metric-delta-good")}>
            {d.text}
          </span>
        )}
      </span>
    </div>
  );
}

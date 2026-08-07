"use client";

import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { gapById } from "@/lib/suvarna";
import {
  COMPLETENESS_LABEL,
  COMPLETENESS_MEANING,
  HEALTH_LABEL,
  HEALTH_MEANING,
  canDrill,
  type CanvasNode,
  type Completeness,
  type Health,
} from "@/lib/canvas";

/**
 * The two-axis node.
 *
 *   health       → HUE          critical / watch / healthy
 *   completeness → FILL+STROKE  none = dashed, no fill
 *                               partial = solid stroke, hatched fill
 *                               full = solid stroke, solid fill
 *
 * Neither axis is ever encoded by the other. Both carry a non-colour marker as
 * well — a shape for health, a three-segment bar for evidence — so the pair
 * survives greyscale, a colour vision deficiency, and an unknown projector.
 */

const HEALTH_TEXT: Record<Health, string> = {
  critical: "text-health-critical",
  watch: "text-health-watch",
  healthy: "text-health-healthy",
};

const HEALTH_BORDER: Record<Health, string> = {
  critical: "border-health-critical",
  watch: "border-health-watch",
  healthy: "border-health-healthy",
};

const HEALTH_FILL: Record<Health, string> = {
  critical: "bg-health-critical-surface",
  watch: "bg-health-watch-surface",
  healthy: "bg-health-healthy-surface",
};

/** Shape, not colour: triangle warns, square waits, circle is fine. */
export function HealthMark({ health, className }: { health: Health; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" width="11" height="11" aria-hidden className={cn("shrink-0", className)}>
      {health === "critical" && <path d="M6 1L11.2 10.5H0.8z" fill="currentColor" />}
      {health === "watch" && <rect x="1.4" y="1.4" width="9.2" height="9.2" rx="1" fill="currentColor" />}
      {health === "healthy" && <circle cx="6" cy="6" r="4.6" fill="currentColor" />}
    </svg>
  );
}

/** Three segments filled 0 / 1 / 3. Deliberately monochrome. */
export function EvidenceMark({
  completeness,
  className,
}: {
  completeness: Completeness;
  className?: string;
}) {
  const filled = completeness === "full" ? 3 : completeness === "partial" ? 1 : 0;
  return (
    <span className={cn("inline-flex items-center gap-[2px]", className)} aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={cn(
            "h-[7px] w-[3px] rounded-[1px] border",
            i < filled ? "border-foreground bg-foreground" : "border-border-strong bg-transparent",
          )}
        />
      ))}
    </span>
  );
}

/**
 * The hatch that means "partial" — a pattern, never a colour.
 *
 * Kept deliberately faint. It has to be identifiable next to a solid fill and
 * an empty one, and it has to stay out of the way of the text sitting on top
 * of it: a card nobody can read is worse than an axis nobody can see.
 */
function HatchFill({ health }: { health: Health }) {
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-0 rounded-[7px] opacity-[0.14]",
        HEALTH_TEXT[health],
      )}
      style={{
        backgroundImage:
          "repeating-linear-gradient(45deg, currentColor 0 1.5px, transparent 1.5px 7px)",
      }}
    />
  );
}

export function NodeCard({
  node,
  selected = false,
  onSelect,
  onOpen,
}: {
  node: CanvasNode;
  selected?: boolean;
  onSelect?: () => void;
  onOpen?: () => void;
}) {
  const value = node.gapIds.reduce((s, id) => s + (gapById(id).amountCr ?? 0), 0);
  const drillable = canDrill(node.id);
  const empty = node.completeness === "none";

  // Weight increases with depth: Level 0 is a map legend, Level 2 is the destination.
  const pad = node.level === 0 ? "px-3 py-2" : node.level === 1 ? "px-3.5 py-3" : "px-4 py-3.5";
  const title = node.level === 2 ? "text-base" : "text-small";

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-lg border-2 transition-colors",
        HEALTH_BORDER[node.health],
        empty ? "border-dashed bg-transparent" : "border-solid",
        node.completeness === "full" && HEALTH_FILL[node.health],
        selected && "ring-2 ring-ring ring-offset-2 ring-offset-background",
      )}
    >
      {node.completeness === "partial" && <HatchFill health={node.health} />}

      <button
        type="button"
        onClick={onSelect ?? onOpen}
        aria-pressed={onSelect ? selected : undefined}
        className={cn("relative block w-full text-left", pad)}
      >
        <span className="flex items-start justify-between gap-2">
          <span className="min-w-0">
            <span className="flex items-center gap-1.5">
              <HealthMark health={node.health} className={HEALTH_TEXT[node.health]} />
              <span className={cn("font-medium", title, empty && "text-muted-foreground")}>
                {node.name}
              </span>
            </span>
            {node.level > 0 && (
              <span className="mt-1 block text-micro text-muted-foreground">{node.plainLine}</span>
            )}
          </span>
          <EvidenceMark completeness={node.completeness} className="mt-1" />
        </span>

        {/* Level 0 stays quiet: a name, the two marks, and a number. The status
            words and the drill hint are noise on a row that is only orientation. */}
        <span className="relative mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-micro">
          {node.level > 0 && (
            <>
              <span className={cn(HEALTH_TEXT[node.health], "font-medium")}>
                {HEALTH_LABEL[node.health]}
              </span>
              <span className="text-muted-foreground">
                {COMPLETENESS_LABEL[node.completeness]}
              </span>
            </>
          )}
          {value > 0 && <span className="tabular ml-auto font-medium">{money(value)}</span>}
          {value === 0 && node.gapIds.length > 0 && (
            <span className="tabular ml-auto text-muted-foreground">not priced</span>
          )}
          {value === 0 && node.gapIds.length === 0 && node.level === 0 && (
            <span className="tabular ml-auto text-muted-foreground">—</span>
          )}
        </span>

        {node.level > 0 && (
          <span className="relative mt-1.5 block text-micro text-muted-foreground">
            {drillable ? (
              <>
                {node.gapIds.length > 0 &&
                  `${node.gapIds.length} gap${node.gapIds.length > 1 ? "s" : ""} · `}
                Open to go deeper
              </>
            ) : (
              "Lowest level — this is where it gets priced"
            )}
          </span>
        )}
      </button>

      {onOpen && onSelect && (
        <button
          type="button"
          onClick={onOpen}
          className="relative -mt-1 mb-2 ml-4 text-micro text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Detail
        </button>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The legend has to make the two axes separable in one read. Showing them as
 * rows and columns is the point — a single combined key is what the current
 * prototype does wrong.
 */
export function CanvasLegend() {
  const healths: Health[] = ["critical", "watch", "healthy"];
  const completes: Completeness[] = ["none", "partial", "full"];

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <h2 className="text-base font-medium">How to read a box</h2>
      <p className="mt-1 text-small text-muted-foreground measure">
        Two separate things. The colour tells you how the process is running. The fill tells you how
        much we actually know about it. A green box we know nothing about and a red box with full
        evidence are opposite situations — they should never look similar.
      </p>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <div className="text-micro font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Colour and shape — how this is running
          </div>
          <ul className="mt-2 space-y-1.5">
            {healths.map((h) => (
              <li key={h} className="flex items-baseline gap-2 text-small">
                <HealthMark health={h} className={cn("translate-y-[1px]", HEALTH_TEXT[h])} />
                <span className={cn("font-medium", HEALTH_TEXT[h])}>{HEALTH_LABEL[h]}</span>
                <span className="text-muted-foreground">{HEALTH_MEANING[h]}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <div className="text-micro font-medium uppercase tracking-[0.08em] text-muted-foreground">
            Fill and bars — what evidence we have
          </div>
          <ul className="mt-2 space-y-1.5">
            {completes.map((c) => (
              <li key={c} className="flex items-baseline gap-2 text-small">
                <EvidenceMark completeness={c} className="translate-y-[1px]" />
                <span className="font-medium">{COMPLETENESS_LABEL[c]}</span>
                <span className="text-muted-foreground">{COMPLETENESS_MEANING[c]}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="mt-5">
        <div className="text-micro font-medium uppercase tracking-[0.08em] text-muted-foreground">
          All nine combinations
        </div>
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-[420px] border-separate border-spacing-1">
            <thead>
              <tr>
                <td />
                {completes.map((c) => (
                  <th
                    key={c}
                    scope="col"
                    className="pb-1 text-micro font-medium text-muted-foreground"
                  >
                    {COMPLETENESS_LABEL[c]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {healths.map((h) => (
                <tr key={h}>
                  <th
                    scope="row"
                    className={cn("pr-2 text-right text-micro font-medium", HEALTH_TEXT[h])}
                  >
                    {HEALTH_LABEL[h]}
                  </th>
                  {completes.map((c) => (
                    <td key={c}>
                      <div
                        className={cn(
                          "relative flex h-11 items-center justify-between overflow-hidden rounded-md border-2 px-2",
                          HEALTH_BORDER[h],
                          c === "none" ? "border-dashed" : "border-solid",
                          c === "full" && HEALTH_FILL[h],
                        )}
                      >
                        {c === "partial" && <HatchFill health={h} />}
                        <HealthMark health={h} className={cn("relative", HEALTH_TEXT[h])} />
                        <EvidenceMark completeness={c} className="relative" />
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

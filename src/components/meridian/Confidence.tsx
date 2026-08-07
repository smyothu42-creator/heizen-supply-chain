import { cn } from "@/lib/cn";
import type { ConfidenceLevel, Tier } from "@/lib/suvarna";
import { TierMark } from "./Icons";

/**
 * Confidence is a trust feature, not a disclaimer. A level on its own is noise,
 * so the reason travels with it everywhere. See .claude/skills/data-display-patterns.
 *
 * The scale is a neutral ramp, never a hue — if confidence used colour it would
 * read as process health, which is a different axis entirely.
 */

const STEPS: Record<ConfidenceLevel, number> = {
  Low: 1,
  Medium: 2,
  "Medium-high": 3,
  High: 4,
};

export function ConfidenceBadge({
  level,
  reason,
  className,
  showReason = true,
}: {
  level: ConfidenceLevel;
  reason?: string;
  className?: string;
  showReason?: boolean;
}) {
  const filled = STEPS[level];
  return (
    <div className={cn("min-w-0", className)}>
      <div className="flex items-center gap-2">
        <span className="flex items-end gap-[2px]" aria-hidden>
          {[1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className={cn(
                "w-[3px] rounded-[1px]",
                i <= filled ? "bg-confidence-high" : "bg-border-strong",
              )}
              style={{ height: `${4 + i * 2}px` }}
            />
          ))}
        </span>
        <span className="text-small font-medium">
          <span className="sr-only">Confidence: </span>
          {level}
        </span>
      </div>
      {showReason && reason && (
        <p className="mt-1 text-micro text-muted-foreground measure">{reason}</p>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const TIER_LABEL: Record<Tier, string> = {
  confirmed: "Confirmed",
  inferred: "Inferred",
  unverified: "Unverified",
};

const TIER_MEANING: Record<Tier, string> = {
  confirmed: "Traced to something they told us or published.",
  inferred: "Reasoned from sector patterns, not from their own data.",
  unverified: "A plausible guess. Ask about it before you say it.",
};

export { TIER_LABEL, TIER_MEANING };

/**
 * Shape carries the meaning — filled, half, dashed — so the ledger survives
 * greyscale and an unknown projector.
 */
export function TierBadge({
  tier,
  className,
  withLabel = true,
}: {
  tier: Tier;
  className?: string;
  withLabel?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-micro font-medium uppercase tracking-[0.07em]",
        tier === "confirmed" && "text-foreground",
        tier === "inferred" && "text-muted-foreground",
        tier === "unverified" && "text-muted-foreground",
        className,
      )}
    >
      <TierMark tier={tier} />
      {withLabel && TIER_LABEL[tier]}
    </span>
  );
}

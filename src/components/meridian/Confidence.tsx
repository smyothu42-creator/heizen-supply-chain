import { cn } from "@/lib/cn";
import type { ConfidenceLevel, Effort, Tier } from "@/lib/suvarna";
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

/**
 * Confidence as a chip, for a list row where the level has to be readable
 * before the sentence it qualifies.
 *
 * **It says "Medium confidence", not "Medium".** In a row that also carries an
 * effort rating on the same three-word scale, a bare "Medium" is ambiguous
 * about which axis it is on — and those two are the axes this product is most
 * careful to keep apart: *is the observation true* and *what will it cost to
 * fix* are unrelated questions. The noun is what disambiguates.
 *
 * **Neutral, never a hue.** Same rule as the badge above: colour on this scale
 * would read as process health. The ramp carries the level; the chip only
 * gives it an edge so it survives being read before a sentence rather than
 * after a number.
 */
export function ConfidenceChip({
  level,
  className,
}: {
  level: ConfidenceLevel;
  className?: string;
}) {
  const filled = STEPS[level];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-micro font-medium text-muted-foreground",
        className,
      )}
    >
      <span className="flex items-end gap-[2px]" aria-hidden>
        {[1, 2, 3, 4].map((i) => (
          <span
            key={i}
            className={cn(
              "w-[2px] rounded-[1px]",
              i <= filled ? "bg-confidence-high" : "bg-border-strong",
            )}
            style={{ height: `${3 + i * 1.5}px` }}
          />
        ))}
      </span>
      {level} confidence
    </span>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Effort as a chip, leading the gap row.
 *
 * **It carries colour, unlike the confidence chip above it.** The two scales
 * are both Low / Medium / High and for a long time neither was coloured, on the
 * rule that colour on a three-word scale would be read as process health. What
 * changed is that only one of them is now on the row: with confidence moved
 * into the expanded detail, a hue here cannot be confused with the hue on the
 * scale beside it, because there is no scale beside it.
 *
 * **Low is green.** Effort runs the opposite way to health — cheap to fix is
 * good news, and the gap you open a call with is the one that is worth a lot
 * and costs little. That inversion is exactly why the chip keeps its noun:
 * "Low" alone next to a rupee figure could be read as a low number.
 *
 * The dot repeats the level as a filled count, so the scale survives greyscale
 * and a projector that eats saturation. Colour is never the only carrier.
 */
const EFFORT_STEPS: Record<Effort, number> = { Low: 1, Medium: 2, High: 3 };

const EFFORT_TONE: Record<Effort, string> = {
  Low: "border-effort-low/30 bg-effort-low-surface text-effort-low",
  Medium: "border-effort-medium/30 bg-effort-medium-surface text-effort-medium",
  High: "border-effort-high/30 bg-effort-high-surface text-effort-high",
};

const EFFORT_DOT: Record<Effort, string> = {
  Low: "bg-effort-low",
  Medium: "bg-effort-medium",
  High: "bg-effort-high",
};

export function EffortChip({
  level,
  className,
}: {
  level: Effort;
  className?: string;
}) {
  const filled = EFFORT_STEPS[level];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-micro font-medium",
        EFFORT_TONE[level],
        className,
      )}
    >
      <span className="flex items-center gap-[2px]" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-[5px] w-[5px] rounded-full",
              i <= filled ? EFFORT_DOT[level] : "bg-current opacity-25",
            )}
          />
        ))}
      </span>
      {level} effort
    </span>
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
        "inline-flex items-center gap-1.5 text-micro font-medium ",
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

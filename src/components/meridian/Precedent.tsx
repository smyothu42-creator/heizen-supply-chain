import { pastProjectById } from "@/lib/atlas";
import { formatDay } from "@/lib/plan";
import { cn } from "@/lib/cn";
import type { Gap } from "@/lib/suvarna";

/**
 * What Atlas adds to a gap: whether Heizen has already built this fix
 * somewhere else. A precedent-backed gap is cheaper and safer to promise —
 * that is the whole argument for the tab, landing here as one line.
 *
 * Two states only, same binary Atlas itself carries per subdomain (§ the
 * `atlas.ts` header comment) — this is not a third effort scale next to
 * `EffortChip`'s three, it is a yes/no on top of the effort `EffortChip`
 * already states, which is why the badge repeats `gap.weeks` rather than
 * inventing its own number.
 */
export function precedentLine(gap: Gap): string {
  const project = gap.precedentId ? pastProjectById(gap.precedentId) : undefined;
  /* A colon, not the em dash the brief's own example used — §6a bans a dash
     standing in for a second sentence anywhere a user reads, no exception for
     a badge. */
  return project
    ? `~${gap.weeks} weeks: done before in ${project.name}`
    : `~${gap.weeks} weeks: new build`;
}

/** The longer form, for the expanded detail: what was actually built, and
    when, rather than just the project's name. */
export function precedentReason(gap: Gap): string {
  const project = gap.precedentId ? pastProjectById(gap.precedentId) : undefined;
  if (!project) {
    return "Nobody has built this fix for a client yet. The estimate is a first build, not a repeat of one.";
  }
  return `${project.name} built this on ${formatDay(project.deliveredOn)}: ${project.built}`;
}

/**
 * The badge itself. Green when a past project backs the estimate, neutral
 * when it does not — the same direction `EffortChip` already runs (Low is
 * green because cheap is good news), reused here because "proven" is the same
 * kind of good news. Neutral rather than red for "new build": a fix nobody
 * has built before is the ordinary case, not a warning.
 */
export function PrecedentBadge({ gap, className }: { gap: Gap; className?: string }) {
  const hasPrecedent = Boolean(gap.precedentId && pastProjectById(gap.precedentId));
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-micro font-medium",
        hasPrecedent
          ? "border-effort-low/30 bg-effort-low-surface text-effort-low"
          : "border-border bg-muted text-muted-foreground",
        className,
      )}
    >
      {precedentLine(gap)}
    </span>
  );
}

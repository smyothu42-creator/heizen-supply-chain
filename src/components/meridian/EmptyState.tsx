import { cn } from "@/lib/cn";

/**
 * Three states that mean opposite things. Rendering any of them as a blank cell
 * or as "N/A" is a real bug, not a polish issue — most nodes are in one of
 * these states most of the time. See .claude/skills/ux-copy.
 */
export type EmptyKind = "not-researched" | "no-sources" | "confirmed-none";

const COPY: Record<EmptyKind, { title: string; body: string; action: string | null }> = {
  "not-researched": {
    title: "Not yet researched",
    body: "We have not looked at this area. Nothing here is a finding either way.",
    action: "Run research on this section",
  },
  "no-sources": {
    title: "Add a transcript or filing and we'll research this",
    body: "We looked, but there is nothing to read. This needs input before it can say anything.",
    action: "Add sources",
  },
  "confirmed-none": {
    title: "No issues found here",
    body: "We looked and found nothing worth raising. This is a good outcome, not a gap in the research.",
    action: null,
  },
};

export function EmptyState({
  kind,
  scope,
  className,
  compact = false,
}: {
  kind: EmptyKind;
  /** What was or was not researched, e.g. "Returns and reverse logistics". */
  scope?: string;
  className?: string;
  compact?: boolean;
}) {
  const copy = COPY[kind];

  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-border-strong bg-muted",
        compact ? "px-3 py-2.5" : "px-4 py-5",
        className,
      )}
    >
      {scope && (
        <div className="text-micro text-muted-foreground">{scope}</div>
      )}
      <p className={cn("font-medium", compact ? "text-small mt-0.5" : "text-base mt-1")}>
        {copy.title}
      </p>
      <p className="mt-1 text-small text-muted-foreground measure">{copy.body}</p>
      {copy.action && (
        <button
          type="button"
          className={cn(
            "mt-2.5 rounded-md border border-border-strong bg-card px-2.5 py-1 text-small",
            "hover:border-foreground transition-colors",
          )}
        >
          {copy.action}
        </button>
      )}
    </div>
  );
}

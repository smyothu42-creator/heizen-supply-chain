"use client";

import { cn } from "@/lib/cn";
import { sourceById, type Evidence, type SourceKind } from "@/lib/suvarna";
import { EmailIcon, FilingIcon, TranscriptIcon, WebIcon } from "./Icons";
import { usePanel } from "./EvidencePanel";

const KIND_ICON: Record<SourceKind, (p: { className?: string }) => React.ReactElement> = {
  filing: FilingIcon,
  transcript: TranscriptIcon,
  email: EmailIcon,
  web: WebIcon,
};

const KIND_LABEL: Record<SourceKind, string> = {
  filing: "Filing",
  transcript: "Transcript",
  email: "Email",
  web: "Web",
};

export function SourceChip({ sourceId, className }: { sourceId: string; className?: string }) {
  const source = sourceById(sourceId);
  const Icon = KIND_ICON[source.kind];
  const { open } = usePanel();

  return (
    <button
      type="button"
      onClick={() => open({ kind: "source", id: source.id })}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card",
        "px-2 py-0.5 text-micro text-muted-foreground",
        "hover:border-border-strong hover:text-foreground transition-colors",
        className,
      )}
    >
      <Icon className="text-evidence" />
      <span className="truncate max-w-[16ch]">{source.name}</span>
      <span className="text-muted-foreground">{KIND_LABEL[source.kind]}</span>
    </button>
  );
}

/**
 * Source → excerpt → finding, walkable backwards. The excerpt is what a
 * consultant reads aloud in a meeting, so it is never replaced by a filename.
 */
export function EvidenceChain({
  evidence,
  className,
}: {
  evidence: Evidence[];
  className?: string;
}) {
  const { open } = usePanel();

  if (evidence.length === 0) {
    return (
      <p className={cn("text-small text-muted-foreground italic", className)}>
        No source attached. This claim has nothing behind it yet — do not say it on a call.
      </p>
    );
  }

  return (
    <ul className={cn("space-y-2.5 border-l border-border pl-3", className)}>
      {evidence.map((e, i) => {
        const source = sourceById(e.sourceId);
        const Icon = KIND_ICON[source.kind];
        return (
          <li key={`${e.sourceId}-${i}`} className="relative">
            <span
              className="absolute -left-[15px] top-[7px] h-1.5 w-1.5 rounded-full bg-evidence"
              aria-hidden
            />
            <blockquote className="text-small measure text-foreground">{e.excerpt}</blockquote>
            <button
              type="button"
              onClick={() => open({ kind: "source", id: source.id })}
              className="mt-1 inline-flex items-center gap-1.5 text-micro text-evidence hover:underline underline-offset-4"
            >
              <Icon />
              {source.name}
              <span className="text-muted-foreground">
                · {KIND_LABEL[source.kind]} · {e.locator}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

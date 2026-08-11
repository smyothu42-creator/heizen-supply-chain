"use client";

import { cn } from "@/lib/cn";
import {
  claims,
  dealRisks,
  gaps,
  sourceById,
  timingSignals,
  type Evidence,
  type SourceKind,
} from "@/lib/suvarna";
import { EmailIcon, FilingIcon, TranscriptIcon, WebIcon } from "./Icons";
import { usePanel } from "./EvidencePanel";

/** Which sources anything on the platform actually cites. Computed once. */
const cited = new Set<string>([
  ...claims.flatMap((c) => c.sourceIds),
  ...gaps.flatMap((g) => g.evidence.map((e) => e.sourceId)),
  ...timingSignals.flatMap((t) => t.items.map((i) => i.sourceId)),
  ...dealRisks.flatMap((r) => r.sourceIds),
]);

export const SOURCE_ICON: Record<SourceKind, (p: { className?: string }) => React.ReactElement> = {
  filing: FilingIcon,
  transcript: TranscriptIcon,
  email: EmailIcon,
  web: WebIcon,
};

export const SOURCE_KIND_LABEL: Record<SourceKind, string> = {
  filing: "Filing",
  transcript: "Transcript",
  email: "Email",
  web: "Web",
};

/**
 * **The chip is neutral, and the category is carried by the icon and the word.**
 *
 * A ground per kind was tried — filing indigo, transcript teal, email amber,
 * web green — and taken off on request. Worth recording why it looked right
 * and was not: nine chips in four colours turns a strip that is *provenance*
 * into a strip that is *taxonomy*, and taxonomy is not the question anyone
 * brings to it. What a consultant does here is check that a claim has
 * something behind it and then open the thing; sorting filings from emails at
 * a glance is not a task. Four hues bought that non-task and spent the page's
 * whole colour budget doing it, on a surface where cyan is supposed to mean
 * "somewhere to go".
 *
 * The `--source-*` tokens went with it. If a version of this comes back, the
 * cheaper move is one hue on the icon, not four on the grounds.
 */
export function SourceChip({ sourceId, className }: { sourceId: string; className?: string }) {
  const source = sourceById(sourceId);
  const Icon = SOURCE_ICON[source.kind];
  const { open } = usePanel();

  return (
    <button
      type="button"
      onClick={() => open({ kind: "source", id: source.id })}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-border bg-card",
        // Roomier than it was: `px-2 py-0.5` on a chip with an icon, a name and
        // a kind word packed the three together tightly enough that the row
        // read as one long object rather than as separate sources.
        "px-2.5 py-1 text-micro text-muted-foreground",
        "transition-colors hover:border-border-strong hover:text-foreground",
        className,
      )}
    >
      <Icon className="text-evidence" />
      {/* The name in ink and the kind in grey: the name is what you are looking
          for, the kind is what you check once you have found it. That weight
          step is what the four grounds were really for, and it survives them. */}
      <span className="truncate max-w-[18ch] font-medium text-foreground">{source.name}</span>
      <span>{SOURCE_KIND_LABEL[source.kind]}</span>
    </button>
  );
}

/**
 * Every source behind a dossier, under the document's lead. On all six Full
 * views, so the same strip appears wherever you land.
 *
 * Three things about its shape:
 *
 * - **It is titled, on its own line.** `SOURCES` as a tracked micro-cap, above
 *   the chips rather than beside them. Without it the strip is a row of
 *   unexplained pills under a headline, and a chip that reads `FY25 Annual
 *   Report  Filing` does not say what the row of them is *for*. Beside the
 *   chips it was worse than useless: it read as the first item in the row, and
 *   it took ~90px off the scroller on exactly the screens with the least of it.
 *   Above, the row starts at the sheet's left edge like everything else on the
 *   page, and the title is a heading rather than a label on a pill.
 * - **It scrolls sideways rather than wrapping.** Nine chips run well past
 *   1400px and there will be more the moment a real project is loaded. A
 *   wrapped second row pushes the document down on every screen; scrolling
 *   costs nothing vertically. The title sits outside the scroller, so it does
 *   not scroll away from the thing it names.
 * - **The confidence badge is gone from it**, on request. It was the only
 *   confidence display on Full — Brief still carries one in its footer. See
 *   CLAUDE.md §7.5: if Full needs to state confidence again, the band's tiles
 *   are where it can go without being a caption on the sources.
 */
/**
 * It wraps, and it leads with the sources that are actually behind something.
 *
 * It was nine chips on a horizontal scroller, which ran off the sheet edge at
 * every width and put the last three sources behind a swipe. Two changes:
 * the row wraps instead of scrolling, and the four sources that were ingested
 * but carry no claim collapse into one chip. At desktop widths that is one
 * line; the worst case is two.
 *
 * Leading with what carries a finding is the better order anyway. Nine equal
 * chips said "here is the taxonomy"; five and a tail says "here is what this
 * page rests on, and here is what else we read".
 */
export function SourceStrip({ sourceIds }: { sourceIds: string[] }) {
  const carrying = sourceIds.filter((id) => cited.has(id));
  const quiet = sourceIds.filter((id) => !cited.has(id));

  return (
    <div>
      <p className="text-micro font-medium text-muted-foreground">
        Sources
        <span className="ml-1.5 tabular font-normal">{sourceIds.length}</span>
      </p>
      <ul className="mt-2 flex flex-wrap items-center gap-2">
        {carrying.map((id) => (
          <li key={id}>
            <SourceChip sourceId={id} />
          </li>
        ))}
        {quiet.length > 0 && (
          /* Not hidden, and not a "+4 more". Four documents read that carry no
             finding is a true and slightly awkward state, and the count is the
             honest way to say it — a consultant drops in a folder, the pipeline
             reads all of it, and most of it corroborates rather than carries. */
          <li className="rounded-full border border-dashed border-border-strong px-3 py-1 text-small text-muted-foreground">
            +{quiet.length} read, not cited
          </li>
        )}
      </ul>
    </div>
  );
}

/**
 * Source → excerpt → finding, walkable backwards. The excerpt is what a
 * consultant reads aloud in a meeting, so it is never replaced by a filename.
 */
export function EvidenceChain({
  evidence,
  className,
  compact = false,
}: {
  evidence: Evidence[];
  className?: string;
  /**
   * Sources only: no quote, no rail, no dots.
   *
   * Gaps' delivery detail uses it. The excerpt is the right thing to show where
   * the claim is being *argued* — Research quotes the line that supports the
   * sentence above it — and the wrong thing at the end of five cards about what
   * to do next, where the question is only whether there is something behind
   * this and what it was. The quote is one click away in the panel, which is
   * what §7.4 asks for; it does not ask for it to be on the page.
   */
  compact?: boolean;
}) {
  const { open } = usePanel();

  if (evidence.length === 0) {
    return (
      <p className={cn("text-small text-muted-foreground italic", className)}>
        No source attached. This claim has nothing behind it yet. Do not say it on a call.
      </p>
    );
  }

  if (compact) {
    return (
      <ul className={cn("flex flex-wrap gap-x-5 gap-y-1", className)}>
        {evidence.map((e, i) => {
          const source = sourceById(e.sourceId);
          const Icon = SOURCE_ICON[source.kind];
          return (
            <li key={`${e.sourceId}-${i}`}>
              <button
                type="button"
                onClick={() => open({ kind: "source", id: source.id })}
                className="inline-flex items-center gap-1.5 text-micro text-evidence transition-colors hover:text-foreground"
              >
                <Icon />
                {source.name}
                <span className="text-muted-foreground">· {e.locator}</span>
              </button>
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <ul className={cn("space-y-2.5 border-l border-border pl-3", className)}>
      {evidence.map((e, i) => {
        const source = sourceById(e.sourceId);
        const Icon = SOURCE_ICON[source.kind];
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
              className="mt-1 inline-flex items-center gap-1.5 text-micro text-evidence transition-colors hover:text-foreground"
            >
              <Icon />
              {source.name}
              <span className="text-muted-foreground">
                · {SOURCE_KIND_LABEL[source.kind]} · {e.locator}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

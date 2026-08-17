"use client";

import { BASIS_LABEL, businessContext, type BusinessFact } from "@/lib/suvarna";
import { cn } from "@/lib/cn";
import { Eyebrow } from "./Primitives";
import { SourceChip } from "./Evidence";

/**
 * The company, before any finding about it.
 *
 * Four groups, because the four questions are different questions: what they
 * earn, who they sell to, who they buy from, and how much operation there is.
 * A flat grid of fifteen numbers is a table of trivia; the same fifteen under
 * four headings is a business somebody can describe out loud after one read.
 *
 * Three things each fact carries, and each of them is a standing rule rather
 * than a decoration:
 *
 * - **The comparator** (§7.3). "₹104 Cr" is nothing. "9.0% of revenue, against
 *   11 to 13% for the sector" is the pitch. It is set in ink and the definition
 *   above it in grey, because the comparison is the half worth reading.
 * - **Whose number it is.** A figure off a filing and one we modelled from
 *   sector structure look identical on a slide. The chip appears only when it
 *   is not simply filed, so the marked ones are the ones to defend.
 * - **The source, one click away** (§7.4). `SourceChip` opens the evidence
 *   panel, so the chain runs backwards from any number on the screen.
 */
export function BusinessContext({
  groups = businessContext,
  compact = false,
  className,
}: {
  groups?: typeof businessContext;
  /**
   * Label, value and definition only. For Money's folded *Company* section,
   * which is a reference block under an argument about something else: the
   * sources and the comparators are what that section would be borrowing from
   * this one, and it does not need them to do its job.
   */
  compact?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("space-y-6", className)}>
      {groups.map((group) => (
        <div key={group.id}>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
            <Eyebrow>{group.title}</Eyebrow>
            {!compact && (
              <span className="text-small text-muted-foreground">{group.line}</span>
            )}
          </div>
          {/* Two columns, not three. Every group here holds four or five facts,
              and in a three-column grid four leaves a single entry alone on a
              second row with two columns of ivory beside it, which reads as a
              fact that did not load. Two columns makes a group of four a
              square. It also gives the benchmark line about 440px at 1440,
              which is roughly one sentence per line. */}
          <dl className="mt-2.5 grid gap-x-8 gap-y-4 sm:grid-cols-2">
            {group.facts.map((fact) => (
              <Fact key={fact.id} fact={fact} compact={compact} />
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

function Fact({ fact, compact }: { fact: BusinessFact; compact: boolean }) {
  return (
    <div>
      <dt className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
        <span className="text-small text-muted-foreground">{fact.label}</span>
        {/* Neutral, like every other chip on this platform: colour here is a
            reading about the client's process, and whose figure this is is not
            a reading about anything of theirs. */}
        {fact.basis !== "stated" && (
          <span className="rounded border border-border px-1.5 text-micro text-muted-foreground">
            {BASIS_LABEL[fact.basis]}
          </span>
        )}
      </dt>
      <dd className="tabular mt-0.5 text-lead font-medium">{fact.value}</dd>
      <dd className="reading mt-0.5 text-small text-muted-foreground">{fact.detail}</dd>
      {!compact && fact.benchmark && (
        <dd className="reading mt-1 text-small">{fact.benchmark}</dd>
      )}
      {!compact && (
        <dd className="mt-1.5 flex flex-wrap gap-1.5">
          {fact.sourceIds.map((id) => (
            <SourceChip key={id} sourceId={id} />
          ))}
        </dd>
      )}
    </div>
  );
}

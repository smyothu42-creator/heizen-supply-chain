"use client";

import { cn } from "@/lib/cn";
import { buckets } from "@/lib/suvarna";
import { pluralise } from "@/lib/format";
import {
  COMPLETENESS_LABEL,
  HEALTH_LABEL,
  entities,
  entityEdges,
  type EntityNode,
  type Health,
} from "@/lib/canvas";
import { usePanel } from "@/components/meridian/EvidencePanel";

/**
 * Entities — the same operation seen as the things that move through it.
 *
 * **It was a graph and is now a grouped list**, on request, and the change is
 * larger than a layout: a graph asserts that the shape of the connections is
 * the point, and for entities it is not. Eleven records with eleven arrows
 * between them is a flow anyone in procurement could draw from memory —
 * requisition, order, receipt, invoice, payment — so the picture spent a whole
 * viewport restating what the vocabulary already says. What a consultant does
 * not know, and cannot get from the shape, is *which of these are in the ERP,
 * how many there are a month, and which ones are on fire*. That is a list.
 *
 * **Processes stayed a graph for the opposite reason.** There the connections
 * genuinely differ between companies. §4: Level 2 is where companies differ,
 * and it is the cross-links at Level 1 that show you where to go down.
 *
 * **The four groups are Gaps' four areas**, not a taxonomy invented here. A
 * consultant who has filtered Gaps by *Paying for what they buy* should meet the
 * same four names when they ask what moves through it. `bucketId` is a field on
 * the entity rather than derived from its gaps, and `check:data` fails the build
 * if the two disagree.
 *
 * **The flow survives without the arrows.** Each row says what it follows, read
 * off the same `entityEdges` the graph drew, so the one thing the picture
 * carried that the list does not have a column for is in words. Nothing was
 * deleted from the data; `entityPositions` went, because coordinates are the
 * only part of it that was about the drawing rather than the business.
 */
export function EntityList({ switcher }: { switcher: React.ReactNode }) {
  const { open } = usePanel();

  return (
    <div className="h-full overflow-y-auto">
      <div className="surface-frame py-5">
        {/* The switch sits on the page here, not in a raised card. On the graph
            it needs a ground because a node can pan under it; on a list there
            is nothing to pan and it takes the same page tone every other switch
            in the product does. */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
          {switcher}
          {/* The graph's legend lives in its bottom-left corner and does not
              come with the list. Four words is the whole of what a reader needs
              to decode a coloured dot, so it is stated once at the top rather
              than repeated on eleven rows. */}
          <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
            {(["critical", "watch", "healthy", "unknown"] as Health[]).map((h) => (
              <span key={h} className="flex items-center gap-1.5 text-micro text-muted-foreground">
                <span className={cn("h-2 w-2 rounded-full", HEALTH_DOT[h])} aria-hidden />
                {HEALTH_LABEL[h]}
              </span>
            ))}
          </p>
        </div>

        <div className="space-y-4">
          {buckets.map((bucket) => {
            const rows = entities.filter((e) => e.bucketId === bucket.id);
            if (rows.length === 0) return null;
            return (
              <section
                key={bucket.id}
                className="overflow-hidden rounded-lg border border-border bg-card shadow-card"
              >
                <div className="border-b border-border px-4 py-2.5">
                  <h2 className="text-micro font-semibold text-foreground">
                    {bucket.name} · {rows.length}
                  </h2>
                  <p className="mt-0.5 text-small text-muted-foreground">{bucket.plainLine}</p>
                </div>
                <ul className="divide-y divide-border px-4">
                  {rows.map((e) => (
                    <EntityRow
                      key={e.id}
                      entity={e}
                      onOpen={() => open({ kind: "entity", id: e.id })}
                    />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const HEALTH_DOT: Record<Health, string> = {
  critical: "bg-health-critical",
  watch: "bg-health-watch",
  healthy: "bg-health-healthy",
  // Hollow, not grey. On this palette every neutral reads as a colour, so a
  // filled dot put "not looked at" alongside the three real states as a fourth
  // one. Absence is encoded as absence of fill.
  unknown: "border border-border-strong bg-transparent",
};

function EntityRow({ entity, onOpen }: { entity: EntityNode; onOpen: () => void }) {
  /* What this record follows, read off the edges the graph used to draw. It is
     the one thing a picture carried that a list has no column for, so it is
     stated in words rather than lost. */
  const follows = entityEdges
    .filter((edge) => edge.to === entity.id)
    .map((edge) => entities.find((e) => e.id === edge.from)?.name)
    .filter(Boolean);

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="group -mx-2 flex w-full items-baseline gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted"
      >
        <span
          className={cn("mt-1.5 h-2 w-2 shrink-0 rounded-full", HEALTH_DOT[entity.health])}
          aria-hidden
        />
        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-base leading-snug transition-colors group-hover:text-muted-foreground">
              {entity.name}
            </span>
            <span className="sr-only">{HEALTH_LABEL[entity.health]}.</span>
            <span className="text-small text-muted-foreground">{entity.plainLine}</span>
          </span>
          {/* Where it lives, how much of it there is, and what it comes after.
              System first: "Excel" and "Paper, then SAP MM" are the finding on
              half these rows, and the reason this view exists at all. */}
          <span className="mt-1 block text-micro text-muted-foreground">
            {entity.system} · {entity.volume} · {COMPLETENESS_LABEL[entity.completeness]}
            {follows.length > 0 && <> · follows {follows.join(", ")}</>}
          </span>
        </span>
        <span className="shrink-0 text-micro text-muted-foreground">
          {/* "None" rather than "0 gaps": §6a, and a nothing-found is a real
              reading on this surface rather than a blank. */}
          {entity.gapIds.length === 0 ? "None" : pluralise(entity.gapIds.length, "gap", "gaps")}
        </span>
        <span
          aria-hidden
          className="shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
        >
          ›
        </span>
      </button>
    </li>
  );
}

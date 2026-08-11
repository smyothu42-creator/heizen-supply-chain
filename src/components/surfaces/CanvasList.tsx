"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { company, gapById } from "@/lib/suvarna";
import { childrenOf, counts, level0, nodeById, nodes, type CanvasNode } from "@/lib/canvas";
import { CanvasLegend, NodeCard } from "@/components/meridian/NodeCard";

import { usePanel } from "@/components/meridian/EvidencePanel";
import { SummaryStrip } from "@/components/directions/Frames";
import { ChevronIcon } from "@/components/meridian/Icons";

/**
 * Canvas — the three-level map.
 *
 * Level 0 is a legend, not a destination: it is identical for every
 * manufacturing company on earth, so it gets the least weight on screen.
 * Weight increases as you descend, and Level 2 is where a gap becomes
 * priceable. See CLAUDE.md section 4 and layout-and-density.
 */
export function CanvasList() {
  const [l0, setL0] = useState("l0-source");
  const [l1, setL1] = useState<string | null>("l1-ap");
  const [showLegend, setShowLegend] = useState(true);
  const { open } = usePanel();

  const l1Nodes = childrenOf(l0);
  const l2Nodes = l1 ? childrenOf(l1) : [];
  const selectedL1 = l1 ? nodeById(l1) : null;

  const selectL0 = (id: string) => {
    setL0(id);
    // Drop straight to the first child so the screen is never a dead end.
    const first = childrenOf(id)[0];
    setL1(first ? first.id : null);
  };

  const valueOf = (node: CanvasNode) =>
    node.gapIds.reduce((s, id) => s + (gapById(id).amountCr ?? 0), 0);

  return (
    <div className="surface-frame py-5">
      {/* No title here — the hero band above carries it. */}
      <div className="flex flex-wrap items-start justify-end gap-4">
        <button
          type="button"
          onClick={() => setShowLegend((v) => !v)}
          aria-expanded={showLegend}
          className="shrink-0 rounded-md border border-border-strong px-2.5 py-1 text-small hover:border-foreground"
        >
          {showLegend ? "Hide" : "Show"} legend
        </button>
      </div>

      <div className="mt-3">
        <SummaryStrip
          items={[
            { label: "Processes mapped", value: String(counts.total) },
            {
              label: "With evidence",
              value: `${counts.withData} of ${counts.total}`,
            },
            { label: "Nothing known", value: String(counts.empty) },
            { label: "Critical", value: String(counts.critical) },
            { label: "No reading at all", value: String(counts.unknown) },
            { label: "Claimable", value: money(company.netLeakageCr) },
          ]}
        />
      </div>

      <p className="mt-3 text-small text-muted-foreground measure">
        {counts.empty} of {counts.total} boxes have nothing behind them, and {counts.unknown}
        carry no health reading at all. That is normal — clients never hand over everything, and a
        grey box is honest where a green one would have been a guess.
      </p>

      {showLegend && (
        <div className="mt-5">
          <CanvasLegend />
        </div>
      )}

      {/* ------------------------------------------------------- Level 0 */}
      <section className="mt-8">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-micro font-medium text-muted-foreground">
            Level 0 · the value chain
          </h2>
          <span className="text-micro text-muted-foreground">
            Same for every manufacturer — orientation, not insight
          </span>
        </div>
        <ol className="mt-2 flex flex-wrap items-stretch gap-1.5">
          {level0.map((node, i) => (
            <li key={node.id} className="flex items-center gap-1.5">
              <div className="w-[9.5rem]">
                <NodeCard
                  node={node}
                  selected={node.id === l0}
                  onSelect={() => selectL0(node.id)}
                />
              </div>
              {i < level0.length - 1 && <ChevronIcon className="shrink-0 text-border-strong" />}
            </li>
          ))}
        </ol>
      </section>

      {/* ------------------------------------------------------- Level 1 */}
      <section className="mt-7">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="text-micro font-medium text-muted-foreground">
            Level 1 · inside {nodeById(l0).name}
          </h2>
          <span className="tabular text-micro text-muted-foreground">
            {l1Nodes.length} processes · {money(l1Nodes.reduce((s, n) => s + valueOf(n), 0))}
          </span>
        </div>
        {l1Nodes.length > 0 ? (
          <ul className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {l1Nodes.map((node) => (
              <li key={node.id}>
                <NodeCard
                  node={node}
                  selected={node.id === l1}
                  onSelect={() => setL1(node.id)}
                  onOpen={() => open({ kind: "node", id: node.id })}
                />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-small text-muted-foreground">
            Nothing mapped underneath this yet.
          </p>
        )}
      </section>

      {/* ------------------------------------------------------- Level 2 */}
      <section className="mt-7 rounded-xl border border-border bg-card p-4 shadow-card sm:p-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div>
            <h2 className="text-micro font-medium text-muted-foreground">
              Level 2 · inside {selectedL1?.name ?? "—"}
            </h2>
            <p className="mt-0.5 text-base font-medium">
              Where companies differ, and gaps get a price
            </p>
          </div>
          <span className="tabular text-base font-medium">
            {money(l2Nodes.reduce((s, n) => s + valueOf(n), 0))}
          </span>
        </div>

        {l2Nodes.length > 0 ? (
          <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
            {l2Nodes.map((node) => (
              <li key={node.id}>
                <NodeCard node={node} onOpen={() => open({ kind: "node", id: node.id })} />
              </li>
            ))}
          </ul>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-border-strong bg-muted px-4 py-5">
            <p className="text-base font-medium">Not yet researched</p>
            <p className="mt-1 text-small text-muted-foreground measure">
              {selectedL1?.name ?? "This area"} is not mapped. Nothing here is a finding either way.
            </p>
            <button
              type="button"
              className="mt-2.5 rounded-md border border-border-strong bg-card px-2.5 py-1 text-small hover:border-foreground"
            >
              Run research on this section
            </button>
          </div>
        )}
      </section>

      {/* The honest note about the two-axis problem, on the screen itself. */}
      <section className="mt-8 border-t border-border pt-5">
        <h2 className="text-base font-medium">Where the colours are a guess</h2>
        <p className="mt-1 text-small text-muted-foreground measure">
          Health colour, no evidence. The colour is the sector default, not something we checked.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {nodes
            .filter((n) => n.completeness === "none")
            .map((node) => (
              <li key={node.id}>
                <button
                  type="button"
                  onClick={() => open({ kind: "node", id: node.id })}
                  className={cn(
                    "flex w-full items-baseline justify-between gap-2 rounded-md border border-dashed",
                    "border-border-strong px-2.5 py-1.5 text-left text-small hover:border-foreground",
                  )}
                >
                  <span className="truncate">{node.name}</span>
                  <span className="shrink-0 text-micro text-muted-foreground">
                    Level {node.level}
                  </span>
                </button>
              </li>
            ))}
        </ul>
      </section>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { gapById } from "@/lib/suvarna";
import {
  COMPLETENESS_LABEL,
  HEALTH_LABEL,
  canDrill,
  childrenOf,
  entities,
  entityEdges,
  entityPositions,
  nodeById,
  nodes,
  positions,
  processEdges,
  type Health,
} from "@/lib/canvas";
import { GraphCanvas, type GraphItem } from "@/components/meridian/GraphCanvas";
import { CanvasLegend } from "@/components/meridian/NodeCard";
import { usePanel } from "@/components/meridian/EvidencePanel";
import { CanvasList } from "./CanvasList";

/**
 * Canvas — a spatial map of the operation.
 *
 * Two graphs of the same business: Processes (what happens) and Entities (what
 * moves). Both carry the same two-axis encoding, because "how is this running"
 * and "what do we actually know about it" are separate questions of a purchase
 * order just as much as of a process.
 *
 * A List view sits alongside them. It is not a lesser fallback — a pannable
 * graph is genuinely hard to work through on a keyboard or a phone, and the
 * same information has to be reachable without one.
 */

type Mode = "processes" | "entities" | "list";

const HEALTH_DOT: Record<Health, string> = {
  critical: "bg-health-critical",
  watch: "bg-health-watch",
  healthy: "bg-health-healthy",
};

export function CanvasView() {
  const [mode, setMode] = useState<Mode>("processes");
  /** Level 2 only ever shows one parent's children; 0 and 1 show everything. */
  const [level, setLevel] = useState<0 | 1 | 2>(0);
  const [l2Parent, setL2Parent] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [showLegend, setShowLegend] = useState(false);
  const { open } = usePanel();

  /**
   * Levels 0 and 1 show the whole graph at that depth — that is what makes the
   * cross-links legible, and Level 1 is where the real shape of the operation
   * lives. Level 2 narrows to one process, because sub-processes only connect
   * within their parent.
   */
  const shownNodes = useMemo(() => {
    if (level === 2 && l2Parent) return childrenOf(l2Parent);
    return nodes.filter((n) => n.level === level);
  }, [level, l2Parent]);

  const goToLevel0 = () => {
    setLevel(0);
    setL2Parent(null);
    setSelected(null);
  };
  const goToLevel1 = () => {
    setLevel(1);
    setL2Parent(null);
    setSelected(null);
  };

  const processItems: GraphItem[] = useMemo(
    () =>
      shownNodes.map((n) => {
        const value = n.gapIds.reduce((s, id) => s + (gapById(id).amountCr ?? 0), 0);
        return {
          id: n.id,
          x: positions[n.id]?.x ?? 0,
          y: positions[n.id]?.y ?? 0,
          title: n.name,
          subtitle: n.plainLine,
          health: n.health,
          completeness: n.completeness,
          valueCr: value,
          footer: COMPLETENESS_LABEL[n.completeness],
          drillable: canDrill(n.id),
        };
      }),
    [shownNodes],
  );

  const entityItems: GraphItem[] = useMemo(
    () =>
      entities.map((e) => {
        const value = e.gapIds.reduce((s, id) => s + (gapById(id).amountCr ?? 0), 0);
        return {
          id: e.id,
          x: entityPositions[e.id].x,
          y: entityPositions[e.id].y,
          title: e.name,
          subtitle: e.plainLine,
          health: e.health,
          completeness: e.completeness,
          valueCr: value,
          footer: COMPLETENESS_LABEL[e.completeness],
        };
      }),
    [],
  );

  if (mode === "list") {
    return (
      <div className="flex h-full flex-col overflow-y-auto">
        <div className="border-b border-border px-3 py-2 sm:px-4">
          <ModeSwitch mode={mode} setMode={setMode} />
        </div>
        <CanvasList />
      </div>
    );
  }

  const isEntities = mode === "entities";

  return (
    <GraphCanvas
      items={isEntities ? entityItems : processItems}
      edges={isEntities ? entityEdges : processEdges}
      selectedId={selected}
      onOpen={(id) => {
        setSelected(id);
        open({ kind: isEntities ? "entity" : "node", id });
      }}
      onDrill={
        isEntities
          ? undefined
          : (id) => {
              const n = nodeById(id);
              if (n.level === 0) goToLevel1();
              else if (n.level === 1 && canDrill(id)) {
                setLevel(2);
                setL2Parent(id);
                setSelected(null);
              }
            }
      }
      emptyNote="Nothing is mapped underneath this yet. Go back a level, or run research on this section."
      overlay={
        <>
          {/* Top left: where you are, and which graph you are looking at. */}
          <div className="pointer-events-none absolute left-3 top-3 flex flex-wrap items-start gap-2">
            <div className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border bg-card p-1">
              <span className="px-2 font-mono text-micro uppercase tracking-[0.08em] text-muted-foreground">
                Level {isEntities ? "—" : level}
              </span>
              <ModeSwitch mode={mode} setMode={setMode} compact />
            </div>

            {!isEntities && (
              <nav
                aria-label="Level path"
                className="pointer-events-auto flex items-center gap-1 rounded-lg border border-border bg-card px-2 py-1.5"
              >
                <Crumb label="Value chain" active={level === 0} onClick={goToLevel0} />
                <span className="text-muted-foreground" aria-hidden>
                  ›
                </span>
                <Crumb label="All processes" active={level === 1} onClick={goToLevel1} />
                {level === 2 && l2Parent && (
                  <>
                    <span className="text-muted-foreground" aria-hidden>
                  ›
                </span>
                    <Crumb label={nodeById(l2Parent).name} active onClick={() => {}} />
                  </>
                )}
              </nav>
            )}

            {!isEntities && level > 0 && (
              <button
                type="button"
                onClick={() => (level === 2 ? goToLevel1() : goToLevel0())}
                className="pointer-events-auto rounded-lg border border-border bg-card px-2.5 py-1.5 text-small text-muted-foreground hover:text-foreground"
              >
                ← Back
              </button>
            )}
          </div>

          {/* Bottom left: the legend, and how to drive the thing. */}
          <div className="pointer-events-none absolute bottom-3 left-3 flex flex-col items-start gap-2">
            {showLegend && (
              <div className="pointer-events-auto max-w-2xl overflow-y-auto rounded-lg shadow-lg max-h-[60vh]">
                <CanvasLegend />
              </div>
            )}
            <div className="pointer-events-auto flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-border bg-card px-3 py-1.5">
              {(["critical", "watch", "healthy"] as Health[]).map((h) => (
                <span key={h} className="flex items-center gap-1.5 text-micro">
                  <span className={cn("h-2 w-2 rounded-full", HEALTH_DOT[h])} aria-hidden />
                  {HEALTH_LABEL[h]}
                </span>
              ))}
              <span className="h-3 w-px bg-border-strong" aria-hidden />
              <span className="font-mono text-[10px] text-muted-foreground">
                scroll to zoom · drag to pan{!isEntities && " · double-click to go deeper"}
              </span>
              <button
                type="button"
                onClick={() => setShowLegend((v) => !v)}
                aria-expanded={showLegend}
                className="text-micro text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                {showLegend ? "Hide" : "What do the fills mean?"}
              </button>
            </div>
          </div>
        </>
      }
    />
  );
}

function Crumb({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "true" : undefined}
      className={cn(
        "text-small underline-offset-4 hover:underline",
        active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

function ModeSwitch({
  mode,
  setMode,
  compact = false,
}: {
  mode: Mode;
  setMode: (m: Mode) => void;
  compact?: boolean;
}) {
  const OPTIONS: { key: Mode; label: string; hint: string }[] = [
    { key: "processes", label: "Processes", hint: "What happens" },
    { key: "entities", label: "Entities", hint: "What moves" },
    { key: "list", label: "List", hint: "Same map, no panning" },
  ];
  return (
    <div
      className={cn("flex items-center gap-0.5", !compact && "rounded-lg border border-border p-1")}
      role="group"
      aria-label="Canvas view"
    >
      {OPTIONS.map((o) => (
        <button
          key={o.key}
          type="button"
          aria-pressed={mode === o.key}
          title={o.hint}
          onClick={() => setMode(o.key)}
          className={cn(
            "rounded-md px-2.5 py-1 text-small transition-colors",
            mode === o.key
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

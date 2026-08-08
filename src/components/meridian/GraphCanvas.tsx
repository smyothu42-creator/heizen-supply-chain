"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import {
  COMPLETENESS_LABEL,
  HEALTH_LABEL,
  NODE_H,
  NODE_W,
  type Completeness,
  type GraphEdge,
  type Health,
} from "@/lib/canvas";
import { EvidenceMark, HealthMark } from "./NodeCard";

/**
 * A spatial canvas: scroll to zoom, drag to pan, curved edges labelled with the
 * thing that moves along them, and a minimap.
 *
 * Hand-rolled rather than pulled from a graph library — the whole point of this
 * screen is the two-axis encoding on the node, and every library wants to own
 * that rendering. It is about 200 lines of maths for full control.
 *
 * Keyboard: every node is a real button in reading order. Tabbing to one that
 * is off-screen pans it into view, so the canvas is navigable without a mouse.
 */

export interface GraphItem {
  id: string;
  x: number;
  y: number;
  title: string;
  subtitle: string;
  health: Health;
  completeness: Completeness;
  /** Bottom-right slot. Annual value where there is one, else the evidence state. */
  valueCr?: number | null;
  footer: string;
  drillable?: boolean;
}

const MIN_K = 0.3;
const MAX_K = 2;
const LOOP_DEPTH = 150;

const HEALTH_TEXT: Record<Health, string> = {
  critical: "text-health-critical",
  watch: "text-health-watch",
  healthy: "text-health-healthy",
};
const HEALTH_BORDER: Record<Health, string> = {
  critical: "border-health-critical",
  watch: "border-health-watch",
  healthy: "border-health-healthy",
};

/* -------------------------------------------------------------------------- */
/* Geometry                                                                    */
/* -------------------------------------------------------------------------- */

/** Cubic bezier evaluated at t — used to place a label anywhere along a curve. */
const bez = (p0: number, c1: number, c2: number, p3: number, t = 0.5) => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t * p3;
};

export const isBackEdge = (a: GraphItem, b: GraphItem) =>
  b.x < a.x + NODE_W - 40 && Math.abs(b.x - a.x) >= 40;

export const isVerticalEdge = (a: GraphItem, b: GraphItem) =>
  b.x < a.x + NODE_W - 40 && Math.abs(b.x - a.x) < 40;

/**
 * Three routings, because one curve cannot serve all three relationships:
 *   forward   — left to right, the common case
 *   vertical  — same column, bowed out to the right so it clears any card
 *               sitting between the two it joins
 *   backward  — looped underneath the whole graph, staggered by depth, so
 *               return flows never cut across the diagram
 */
function edgeGeometry(a: GraphItem, b: GraphItem, loopY: number, t = 0.5, vRank = 0) {
  if (b.x >= a.x + NODE_W - 40) {
    const sx = a.x + NODE_W;
    const sy = a.y + NODE_H / 2;
    const tx = b.x;
    const ty = b.y + NODE_H / 2;
    const dx = Math.max(70, (tx - sx) * 0.5);
    return {
      d: `M ${sx} ${sy} C ${sx + dx} ${sy} ${tx - dx} ${ty} ${tx} ${ty}`,
      mx: bez(sx, sx + dx, tx - dx, tx, t),
      my: bez(sy, sy, ty, ty, t),
    };
  }

  if (Math.abs(b.x - a.x) < 40) {
    // Several edges often run down the same column. They alternate sides and
    // step further out as they stack, so neither the curves nor their labels
    // land on top of one another.
    const down = b.y > a.y;
    const side = vRank % 2 === 0 ? 1 : -1;
    const sx = side === 1 ? a.x + NODE_W : a.x;
    const tx = side === 1 ? b.x + NODE_W : b.x;
    const sy = a.y + NODE_H * (down ? 0.72 : 0.28);
    const ty = b.y + NODE_H * (down ? 0.28 : 0.72);
    const bow = side * (78 + Math.abs(b.y - a.y) * 0.14 + Math.floor(vRank / 2) * 46);
    return {
      d: `M ${sx} ${sy} C ${sx + bow} ${sy} ${tx + bow} ${ty} ${tx} ${ty}`,
      mx: bez(sx, sx + bow, tx + bow, tx, t),
      my: bez(sy, sy, ty, ty, t),
    };
  }

  const sx = a.x + NODE_W / 2;
  const sy = a.y + NODE_H;
  const tx = b.x + NODE_W / 2;
  const ty = b.y + NODE_H;
  return {
    d: `M ${sx} ${sy} C ${sx} ${loopY} ${tx} ${loopY} ${tx} ${ty}`,
    mx: bez(sx, sx, tx, tx, t),
    my: bez(sy, loopY, loopY, ty, t),
  };
}

/* -------------------------------------------------------------------------- */

export function GraphCanvas({
  items,
  edges,
  onOpen,
  onDrill,
  selectedId,
  overlay,
  emptyNote,
}: {
  items: GraphItem[];
  edges: GraphEdge[];
  onOpen: (id: string) => void;
  onDrill?: (id: string) => void;
  selectedId?: string | null;
  /** Chrome rendered above the canvas — level chip, toggles, legend. */
  overlay?: ReactNode;
  emptyNote?: string;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [t, setT] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const visibleEdges = useMemo(
    () => edges.filter((e) => byId.has(e.from) && byId.has(e.to)),
    [edges, byId],
  );

  // Back edges are stacked at increasing depths so several return flows never
  // land on the same line with their labels on top of each other.
  const loopRank = useMemo(() => {
    const m = new Map<number, number>();
    let r = 0;
    visibleEdges.forEach((e, i) => {
      if (isBackEdge(byId.get(e.from)!, byId.get(e.to)!)) m.set(i, r++);
    });
    return m;
  }, [visibleEdges, byId]);

  // Vertical edges are ranked per column, so two different columns both start
  // from the innermost offset rather than inheriting each other's stacking.
  const vertRank = useMemo(() => {
    const m = new Map<number, number>();
    const perColumn = new Map<number, number>();
    visibleEdges.forEach((e, i) => {
      const a = byId.get(e.from)!;
      const b = byId.get(e.to)!;
      if (!isVerticalEdge(a, b)) return;
      const col = Math.round(a.x / 40);
      const r = perColumn.get(col) ?? 0;
      m.set(i, r);
      perColumn.set(col, r + 1);
    });
    return m;
  }, [visibleEdges, byId]);

  const bounds = useMemo(() => {
    if (!items.length) return { x: 0, y: 0, w: 1, h: 1 };
    const xs = items.map((i) => i.x);
    const ys = items.map((i) => i.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs) + NODE_W;
    const maxY = Math.max(...ys) + NODE_H;
    const loops = loopRank.size;
    return {
      x: minX,
      y: minY,
      w: maxX - minX + 40,
      h: maxY - minY + (loops ? LOOP_DEPTH + loops * 46 : 0),
    };
  }, [items, loopRank]);

  const nodeFloor = useMemo(
    () => (items.length ? Math.max(...items.map((i) => i.y)) + NODE_H : 0),
    [items],
  );
  const loopYFor = (i: number) => nodeFloor + LOOP_DEPTH + (loopRank.get(i) ?? 0) * 46;

  /* ---- sizing ---- */
  useLayoutEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const r = entry.contentRect;
      setSize({ w: r.width, h: r.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const fitTransform = useCallback(() => {
    const pad = 72;
    const k = Math.min(
      MAX_K,
      Math.max(MIN_K, Math.min((size.w - pad * 2) / bounds.w, (size.h - pad * 2) / bounds.h)),
    );
    return {
      k,
      x: (size.w - bounds.w * k) / 2 - bounds.x * k,
      y: (size.h - bounds.h * k) / 2 - bounds.y * k,
    };
  }, [size, bounds]);

  const fit = useCallback(() => {
    if (!size.w || !size.h || !items.length) return;
    setT(fitTransform());
  }, [fitTransform, size, items.length]);

  // Refit whenever the node set or the container changes — drilling into a
  // level should land framed, not wherever the previous level was panned to.
  // Adjusted during render rather than in an effect: this is derived state,
  // and an effect would paint one frame at the wrong offset first.
  const fitSignature = `${items.map((i) => i.id).join(",")}|${size.w}x${size.h}`;
  const [fittedFor, setFittedFor] = useState<string | null>(null);
  if (size.w > 0 && size.h > 0 && items.length > 0 && fittedFor !== fitSignature) {
    setFittedFor(fitSignature);
    setT(fitTransform());
  }

  /* ---- zoom at cursor ---- */
  useEffect(() => {
    const el = hostRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const px = e.clientX - rect.left;
      const py = e.clientY - rect.top;
      setT((prev) => {
        const factor = Math.exp(-e.deltaY * 0.0015);
        const k = Math.min(MAX_K, Math.max(MIN_K, prev.k * factor));
        const ratio = k / prev.k;
        return { k, x: px - (px - prev.x) * ratio, y: py - (py - prev.y) * ratio };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomBy = (factor: number) =>
    setT((prev) => {
      const k = Math.min(MAX_K, Math.max(MIN_K, prev.k * factor));
      const ratio = k / prev.k;
      const cx = size.w / 2;
      const cy = size.h / 2;
      return { k, x: cx - (cx - prev.x) * ratio, y: cy - (cy - prev.y) * ratio };
    });

  /* ---- pan ---- */
  const onPointerDown = (e: React.PointerEvent) => {
    // Panning captures the pointer, which would otherwise swallow the click on
    // anything sitting over the canvas — nodes, the level crumbs, zoom controls.
    if ((e.target as HTMLElement).closest("[data-node], [data-nodrag]")) return;
    drag.current = { px: e.clientX, py: e.clientY, ox: t.x, oy: t.y };
    setDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    setT((prev) => ({ ...prev, x: d.ox + (e.clientX - d.px), y: d.oy + (e.clientY - d.py) }));
  };
  const endDrag = () => {
    drag.current = null;
    setDragging(false);
  };

  /* ---- keyboard: pan a focused node into view ---- */
  const revealNode = (item: GraphItem) => {
    setT((prev) => {
      const left = item.x * prev.k + prev.x;
      const top = item.y * prev.k + prev.y;
      const right = left + NODE_W * prev.k;
      const bottom = top + NODE_H * prev.k;
      const m = 90;
      let { x, y } = prev;
      if (left < m) x += m - left;
      else if (right > size.w - m) x -= right - (size.w - m);
      if (top < m) y += m - top;
      else if (bottom > size.h - m) y -= bottom - (size.h - m);
      return { ...prev, x, y };
    });
  };

  return (
    <div
      ref={hostRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={cn(
        "relative h-full w-full overflow-hidden bg-canvas touch-none",
        dragging ? "cursor-grabbing" : "cursor-grab",
      )}
      style={{
        backgroundImage: "radial-gradient(var(--canvas-dot) 1px, transparent 1px)",
        backgroundSize: `${24 * t.k}px ${24 * t.k}px`,
        backgroundPosition: `${t.x}px ${t.y}px`,
      }}
    >
      <div
        className="absolute left-0 top-0 origin-top-left"
        style={{ transform: `translate(${t.x}px, ${t.y}px) scale(${t.k})` }}
      >
        <svg
          className="pointer-events-none absolute left-0 top-0 overflow-visible"
          width={Math.max(1, bounds.x + bounds.w)}
          height={Math.max(1, bounds.y + bounds.h)}
          aria-hidden
        >
          <defs>
            <marker
              id="mrd-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 9 5 L 0 9 z" fill="var(--canvas-edge)" />
            </marker>
          </defs>
          {visibleEdges.map((e, i) => {
            const g = edgeGeometry(byId.get(e.from)!, byId.get(e.to)!, loopYFor(i), e.t, vertRank.get(i) ?? 0);
            return (
              <path
                key={i}
                d={g.d}
                fill="none"
                stroke="var(--canvas-edge)"
                strokeWidth={1.25}
                markerEnd="url(#mrd-arrow)"
              />
            );
          })}
        </svg>

        {/* Edge labels are HTML, not SVG text — they need a pill, a border and
            a background that matches the rest of the interface. */}
        {visibleEdges.map((e, i) => {
          const g = edgeGeometry(byId.get(e.from)!, byId.get(e.to)!, loopYFor(i), e.t, vertRank.get(i) ?? 0);
          return (
            <span
              key={`l-${i}`}
              className={cn(
                "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap",
                "rounded-full border border-border bg-canvas px-2 py-[2px]",
                "font-mono text-[10px] leading-none text-muted-foreground",
              )}
              style={{ left: g.mx, top: g.my }}
            >
              {e.label}
            </span>
          );
        })}

        {items.map((item) => (
          <NodeBox
            key={item.id}
            item={item}
            selected={selectedId === item.id}
            onOpen={() => onOpen(item.id)}
            onDrill={onDrill && item.drillable ? () => onDrill(item.id) : undefined}
            onFocus={() => revealNode(item)}
          />
        ))}
      </div>

      <div className="contents" data-nodrag>
        {overlay}
      </div>

      {items.length === 0 && emptyNote && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <p className="max-w-sm rounded-lg border border-dashed border-border-strong bg-card px-4 py-3 text-center text-small text-muted-foreground">
            {emptyNote}
          </p>
        </div>
      )}

      <Minimap items={items} bounds={bounds} t={t} size={size} />

      <div
        data-nodrag
        className="absolute right-3 top-3 flex overflow-hidden rounded-lg border border-border bg-card"
      >
        <button
          type="button"
          onClick={() => zoomBy(1.25)}
          className="px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <PlusIcon />
          <span className="sr-only">Zoom in</span>
        </button>
        <button
          type="button"
          onClick={() => zoomBy(0.8)}
          className="border-l border-border px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <MinusIcon />
          <span className="sr-only">Zoom out</span>
        </button>
        <button
          type="button"
          onClick={fit}
          className="border-l border-border px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <FitIcon />
          <span className="sr-only">Fit to screen</span>
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function NodeBox({
  item,
  selected,
  onOpen,
  onDrill,
  onFocus,
}: {
  item: GraphItem;
  selected: boolean;
  onOpen: () => void;
  onDrill?: () => void;
  onFocus: () => void;
}) {
  const empty = item.completeness === "none";

  return (
    <div
      data-node
      className="absolute"
      style={{ left: item.x, top: item.y, width: NODE_W, height: NODE_H }}
    >
      <button
        type="button"
        onClick={onOpen}
        onDoubleClick={onDrill}
        onFocus={onFocus}
        aria-label={`${item.title}. ${HEALTH_LABEL[item.health]}. ${COMPLETENESS_LABEL[item.completeness]}.`}
        className={cn(
          "relative flex h-full w-full flex-col rounded-md border-2 px-3.5 py-3 text-left shadow-sm",
          HEALTH_BORDER[item.health],
          // "No evidence" means no fill — painted as the canvas itself rather than a
          // translucent card, so the contrast of the text on it is knowable.
          empty ? "border-dashed bg-canvas" : "border-solid bg-canvas-node",
          selected && "ring-2 ring-ring ring-offset-2 ring-offset-[var(--canvas-bg)]",
          "hover:shadow-md",
        )}
      >
        {item.completeness === "partial" && (
          <span
            aria-hidden
            className={cn(
              "pointer-events-none absolute inset-0 rounded-[4px] opacity-[0.13]",
              HEALTH_TEXT[item.health],
            )}
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg, currentColor 0 1.5px, transparent 1.5px 7px)",
            }}
          />
        )}

        <span className="relative flex items-start justify-between gap-2">
          <span className="font-display text-[17px] leading-tight">{item.title}</span>
          <HealthMark health={item.health} className={cn("mt-1", HEALTH_TEXT[item.health])} />
        </span>

        <span className="relative mt-1 line-clamp-2 text-micro text-muted-foreground">
          {item.subtitle}
        </span>

        <span className="relative mt-auto flex items-end justify-between gap-2">
          <EvidenceMark completeness={item.completeness} />
          <span className="text-micro text-muted-foreground">
            {item.valueCr != null && item.valueCr > 0 ? (
              <span className="tabular font-medium text-foreground">{money(item.valueCr)}</span>
            ) : (
              item.footer
            )}
          </span>
        </span>
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function Minimap({
  items,
  bounds,
  t,
  size,
}: {
  items: GraphItem[];
  bounds: { x: number; y: number; w: number; h: number };
  t: { x: number; y: number; k: number };
  size: { w: number; h: number };
}) {
  const W = 176;
  const H = 108;
  if (!items.length || !size.w) return null;
  const s = Math.min(W / bounds.w, H / bounds.h);
  const ox = (W - bounds.w * s) / 2;
  const oy = (H - bounds.h * s) / 2;

  const vx = (-t.x / t.k - bounds.x) * s + ox;
  const vy = (-t.y / t.k - bounds.y) * s + oy;
  const vw = (size.w / t.k) * s;
  const vh = (size.h / t.k) * s;

  return (
    <div
      className="pointer-events-none absolute bottom-3 right-3 overflow-hidden rounded-lg border border-border bg-card"
      style={{ width: W, height: H }}
      aria-hidden
    >
      {items.map((i) => (
        <span
          key={i.id}
          className={cn(
            "absolute rounded-[1px]",
            i.health === "critical"
              ? "bg-health-critical"
              : i.health === "watch"
                ? "bg-health-watch"
                : "bg-health-healthy",
            i.completeness === "none" && "opacity-30",
            i.completeness === "partial" && "opacity-60",
          )}
          style={{
            left: (i.x - bounds.x) * s + ox,
            top: (i.y - bounds.y) * s + oy,
            width: Math.max(3, NODE_W * s),
            height: Math.max(2, NODE_H * s),
          }}
        />
      ))}
      <span
        className="absolute rounded-[2px] border border-foreground/60"
        style={{
          left: Math.max(0, vx),
          top: Math.max(0, vy),
          width: Math.min(W, vw),
          height: Math.min(H, vh),
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const PlusIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden>
    <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const MinusIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden>
    <path d="M3 8h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);
const FitIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" aria-hidden>
    <path
      d="M2 5.5V2.5h3M14 5.5V2.5h-3M2 10.5v3h3M14 10.5v3h-3"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

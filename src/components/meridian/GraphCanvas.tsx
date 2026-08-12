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
  type Completeness,
  type GraphEdge,
  type Health,
} from "@/lib/canvas";
import { EvidenceMark } from "./NodeCard";

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
  /** Per level, from `NODE_SIZE`. The box is not one size any more. */
  w: number;
  h: number;
  level: 0 | 1 | 2;
  title: string;
  subtitle: string;
  health: Health;
  completeness: Completeness;
  /** Bottom-right slot. Annual value where there is one, else the evidence state. */
  valueCr?: number | null;
  footer: string;
  drillable?: boolean;
  /** How many processes sit under this one, at any depth. */
  childCount?: number;
  /** How many of those carry a flagged reading. */
  flaggedUnder?: number;
  /** Set when somebody has marked this node's own reading as wrong. */
  needsCorrection?: string;
}

const MIN_K = 0.3;
const MAX_K = 2;
/**
 * Fit frames the graph; it does not magnify it.
 *
 * Level 2 is two or three boxes, so fitting them to a 1440px viewport asked for
 * k≈1.8 and got it: two nodes rendered at 540px wide with 28px titles, which is
 * not "the destination is where the weight is", it is a billboard. Worse, it
 * inverted the hierarchy the level sizes are for — the deepest level arrived on
 * screen four times the size of the value chain above it.
 *
 * So fit stops at 1. The node then renders at exactly the size it was designed
 * at, and the user can still zoom to `MAX_K` by hand, which is a different act
 * with a different intent.
 */
const MAX_FIT_K = 1;
/**
 * Fit has its own floor, and it is far below the manual one.
 *
 * `MIN_K` is a floor on *zooming out by hand* — past it the nodes stop being
 * readable and you are panning a mosaic. Fit is not that act. Fit's contract is
 * that the whole graph is on screen afterwards, and a floor that stops short of
 * the width available breaks exactly that: at Level 1 the graph is ~2500 world
 * pixels wide, so with the assistant open beside it the canvas is ~850 and the
 * honest fit is k≈0.28. Clamped up to 0.3 it stayed centred and ran off both
 * edges, with two nodes cut in half at the left. Same shape as `MAX_FIT_K` —
 * fit and hand-zoom are different acts and take different limits.
 *
 * This value is a guard against a degenerate container, not a design decision.
 */
const MIN_FIT_K = 0.08;
const LOOP_DEPTH = 150;

/**
 * Below this zoom the node drops to its compact form.
 *
 * The graph fits to the viewport, and Level 1 is fourteen boxes across 2200
 * world pixels, so it lands at about k=0.47 — where a 17px title renders at
 * eight physical pixels and the 11px health mark at five. Every one of the
 * encodings this screen is built on stopped working at exactly the level that
 * has the most to say. Level 0 fits at ~0.74 and Level 2 at ~1.09, so this
 * threshold is really "Level 1, and anything the user has zoomed away from".
 *
 * The compact node is not less informative, it is differently informative:
 * subtitle and status words go, and the title and the marks grow in world units
 * so they come back to a readable physical size. What survives is what you scan
 * a map for — where is it, what is it called, is it on fire, do we know anything.
 */
const COMPACT_BELOW = 0.62;

const HEALTH_BORDER: Record<Health, string> = {
  critical: "border-health-critical",
  watch: "border-health-watch",
  healthy: "border-health-healthy",
  unknown: "border-border-strong",
};

/* -------------------------------------------------------------------------- */
/* Geometry                                                                    */
/* -------------------------------------------------------------------------- */

/** A rectangle in world units. Nodes and label pills are both compared as these. */
type Box = { x: number; y: number; w: number; h: number };

/** Cubic bezier evaluated at t — used to place a label anywhere along a curve. */
const bez = (p0: number, c1: number, c2: number, p3: number, t = 0.5) => {
  const u = 1 - t;
  return u * u * u * p0 + 3 * u * u * t * c1 + 3 * u * t * t * c2 + t * t * t * p3;
};

export const isBackEdge = (a: GraphItem, b: GraphItem) =>
  b.x < a.x + a.w - 40 && Math.abs(b.x - a.x) >= 40;

export const isVerticalEdge = (a: GraphItem, b: GraphItem) =>
  b.x < a.x + a.w - 40 && Math.abs(b.x - a.x) < 40;

/**
 * Three routings, because one curve cannot serve all three relationships:
 *   forward   — left to right, the common case
 *   vertical  — same column, bowed out to the right so it clears any card
 *               sitting between the two it joins
 *   backward  — looped underneath the whole graph, staggered by depth, so
 *               return flows never cut across the diagram
 */
/**
 * Daylight at both ends of a forward edge, in world units.
 *
 * The curve used to run from one box's edge to the other's, so the arrowhead
 * landed *on* the target's border — it read as a mark on the box rather than as
 * something arriving at it, and there was nothing between the two to say the
 * gap was deliberate.
 */
const EDGE_GAP = 12;

/**
 * How much of the corridor a label pill may not have, per side.
 *
 * The pill is centred in the gap between two boxes, so this is the daylight it
 * keeps from each of them. It was 8 (`- 16` across the pair), which on the
 * value chain's 80-unit corridor left a two-line pill jammed between two cards
 * with the arrowhead cutting into it.
 *
 * **It only bites on a tight corridor.** The pill takes its natural width
 * wherever that fits, so raising this changes nothing at Level 1, where the
 * corridor is 180 and the longest label wants 132.
 */
const LABEL_MARGIN = 24;

function edgeGeometry(a: GraphItem, b: GraphItem, loopY: number, t = 0.5, vRank = 0) {
  if (b.x >= a.x + a.w - 40) {
    /* The corridor is measured between the boxes; the curve is drawn inside it.
       Insetting both ends by the same amount keeps the midpoint where it was,
       so the label stays centred in the gap rather than drifting toward the
       source. */
    const x0 = a.x + a.w;
    const x1 = b.x;
    const sx = x0 + EDGE_GAP;
    const sy = a.y + a.h / 2;
    const tx = x1 - EDGE_GAP;
    const ty = b.y + b.h / 2;
    const dx = Math.max(70, (tx - sx) * 0.5);
    return {
      d: `M ${sx} ${sy} C ${sx + dx} ${sy} ${tx - dx} ${ty} ${tx} ${ty}`,
      mx: bez(sx, sx + dx, tx - dx, tx, t),
      my: bez(sy, sy, ty, ty, t),
      room: Math.max(56, x1 - x0 - LABEL_MARGIN * 2),
    };
  }

  if (Math.abs(b.x - a.x) < 40) {
    // Several edges often run down the same column. They alternate sides and
    // step further out as they stack, so neither the curves nor their labels
    // land on top of one another.
    const down = b.y > a.y;
    const side = vRank % 2 === 0 ? 1 : -1;
    const sx = side === 1 ? a.x + a.w : a.x;
    const tx = side === 1 ? b.x + b.w : b.x;
    const sy = a.y + a.h * (down ? 0.72 : 0.28);
    const ty = b.y + b.h * (down ? 0.28 : 0.72);
    const bow = side * (78 + Math.abs(b.y - a.y) * 0.14 + Math.floor(vRank / 2) * 46);
    return {
      d: `M ${sx} ${sy} C ${sx + bow} ${sy} ${tx + bow} ${ty} ${tx} ${ty}`,
      mx: bez(sx, sx + bow, tx + bow, tx, t),
      my: bez(sy, sy, ty, ty, t),
      // A bowed edge hangs in open canvas beside the column, so the label is
      // limited by legibility rather than by a corridor.
      room: 170,
    };
  }

  const sx = a.x + a.w / 2;
  const sy = a.y + a.h;
  const tx = b.x + b.w / 2;
  const ty = b.y + b.h;
  return {
    d: `M ${sx} ${sy} C ${sx} ${loopY} ${tx} ${loopY} ${tx} ${ty}`,
    mx: bez(sx, sx, tx, tx, t),
    my: bez(sy, loopY, loopY, ty, t),
    // The return lane runs under the whole graph with nothing else in it.
    room: 220,
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
  full,
  onToggleFull,
}: {
  items: GraphItem[];
  edges: GraphEdge[];
  onOpen: (id: string) => void;
  onDrill?: (id: string) => void;
  selectedId?: string | null;
  /** Chrome rendered above the canvas — level chip, toggles, legend. */
  overlay?: ReactNode;
  emptyNote?: string;
  /** Whether the caller is currently rendering this canvas over the whole
   *  window. The canvas does not own that state — the surface does, because
   *  going full screen means not rendering the band above it. */
  full?: boolean;
  onToggleFull?: () => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [t, setT] = useState({ x: 0, y: 0, k: 1 });
  const drag = useRef<{ px: number; py: number; ox: number; oy: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  /* ---- moved nodes ----
     The laid-out position is a starting point, not the truth. A consultant
     walking a client through the map pulls the box being talked about clear of
     the rest, and a graph that refuses to be tidied is one they take a
     screenshot of and rearrange in a slide instead.

     Offsets keyed by id, not rewritten coordinates: the layout in `canvas.ts`
     stays the thing that decides where a level opens, and this is a delta on
     top of it. They are cleared whenever the node set changes, which is the
     honest reset — drilling into a level and coming back is arriving at a
     level, not returning to a workspace, and the alternative is a stored
     arrangement of a graph the user cannot see to undo. */
  const [moved, setMoved] = useState<Record<string, { dx: number; dy: number }>>({});
  const idKey = items.map((i) => i.id).join(",");
  const [movedFor, setMovedFor] = useState(idKey);
  if (movedFor !== idKey) {
    setMovedFor(idKey);
    setMoved({});
  }

  const placed = useMemo(
    () =>
      items.map((i) => {
        const m = moved[i.id];
        return m ? { ...i, x: i.x + m.dx, y: i.y + m.dy } : i;
      }),
    [items, moved],
  );

  const byId = useMemo(() => new Map(placed.map((i) => [i.id, i])), [placed]);
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
    if (!placed.length) return { x: 0, y: 0, w: 1, h: 1 };
    const xs = placed.map((i) => i.x);
    const ys = placed.map((i) => i.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...placed.map((i) => i.x + i.w));
    const maxY = Math.max(...placed.map((i) => i.y + i.h));
    const loops = loopRank.size;
    return {
      x: minX,
      y: minY,
      w: maxX - minX + 40,
      h: maxY - minY + (loops ? LOOP_DEPTH + loops * 46 : 0),
    };
  }, [placed, loopRank]);

  const nodeFloor = useMemo(
    () => (placed.length ? Math.max(...placed.map((i) => i.y + i.h)) : 0),
    [placed],
  );
  const loopYFor = useCallback(
    (i: number) => nodeFloor + LOOP_DEPTH + (loopRank.get(i) ?? 0) * 46,
    [nodeFloor, loopRank],
  );

  /* ---- edge labels, placed so nothing lands on anything ----
     `t` in the data puts a label somewhere sensible along its curve, and that
     is as far as authored placement can go: two edges through one corridor
     still collide, and **every hand-tuned value goes stale the moment a node is
     dragged**. So the anchor is a starting point and this is the resolver.

     The box is estimated rather than measured. Measuring would mean rendering,
     reading the DOM and rendering again, and a 10px mono pill is the one thing
     in the product whose width is genuinely predictable from its text.

     It only ever moves a label perpendicular to the flow, and only far enough:
     the offsets are tried nearest-first, so a label that fits where it belongs
     never moves at all. Anything that cannot be placed stays on its line and
     overlaps — a label pushed 80 units off its own edge has stopped labelling
     it. */
  const labels = useMemo(() => {
    const CHAR = 6; // a 10px mono glyph, in world units
    const PAD_X = 18; // px-2 plus the two borders
    const LINE = 13; // 10px at leading 1.25
    const PAD_Y = 9;
    const CLEAR = 6; // hairline of daylight, so nothing reads as touching

    const hit = (a: Box, b: Box) =>
      a.x < b.x + b.w + CLEAR &&
      a.x + a.w + CLEAR > b.x &&
      a.y < b.y + b.h + CLEAR &&
      a.y + a.h + CLEAR > b.y;

    const nodeBoxes: Box[] = placed.map((i) => ({ x: i.x, y: i.y, w: i.w, h: i.h }));
    const taken: Box[] = [];

    return visibleEdges.map((e, i) => {
      const g = edgeGeometry(
        byId.get(e.from)!,
        byId.get(e.to)!,
        loopYFor(i),
        e.t,
        vertRank.get(i) ?? 0,
      );
      const textW = e.label.length * CHAR;
      const w = Math.min(g.room, textW + PAD_X);
      const lines = Math.max(1, Math.ceil(textW / Math.max(1, w - PAD_X)));
      const h = lines * LINE + PAD_Y;

      const at = (dy: number): Box => ({ x: g.mx - w / 2, y: g.my + dy - h / 2, w, h });
      const free = (b: Box) => !nodeBoxes.some((n) => hit(b, n)) && !taken.some((o) => hit(b, o));

      const dy = [0, -20, 20, -38, 38, -56, 56].find((d) => free(at(d))) ?? 0;
      taken.push(at(dy));
      return { key: i, label: e.label, x: g.mx, y: g.my + dy, room: g.room };
    });
  }, [visibleEdges, byId, placed, vertRank, loopYFor]);

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

  // The padding is a fraction of the smaller side rather than a flat 72, so a
  // narrow canvas does not spend a fifth of its width on margin and then blame
  // the shortfall on the zoom.
  const fitPad = Math.min(72, Math.min(size.w, size.h) * 0.06);

  const fitTransform = useCallback(() => {
    const pad = fitPad;
    const k = Math.min(
      MAX_FIT_K,
      Math.max(MIN_FIT_K, Math.min((size.w - pad * 2) / bounds.w, (size.h - pad * 2) / bounds.h)),
    );
    return {
      k,
      x: (size.w - bounds.w * k) / 2 - bounds.x * k,
      y: (size.h - bounds.h * k) / 2 - bounds.y * k,
    };
  }, [size, bounds, fitPad]);

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
  /* The hand floor is `MIN_K`, **or wherever you already are if fit put you
     below it**. A flat `Math.max(MIN_K, …)` on a graph fitted at 0.28 turns a
     zoom-*out* gesture into a jump *in*, which reads as the map fighting you. */
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
        const k = Math.min(MAX_K, Math.max(Math.min(MIN_K, prev.k), prev.k * factor));
        const ratio = k / prev.k;
        return { k, x: px - (px - prev.x) * ratio, y: py - (py - prev.y) * ratio };
      });
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const zoomBy = (factor: number) =>
    setT((prev) => {
      const k = Math.min(MAX_K, Math.max(Math.min(MIN_K, prev.k), prev.k * factor));
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

  /* ---- moving a node ----
     The pointer is captured on the node's own wrapper, so it can outrun the box
     without the drag ending — the same reason the assistant's resize handle
     listens past its own element.

     `slack` is what keeps the box a button as well as a handle. Under 4px of
     travel nothing moves and the click goes through to open the detail; past
     it, the node follows and the click is swallowed on the way up. Without the
     threshold every open would nudge the graph by a pixel or two, and with a
     flag instead of a distance every drag would also open the panel it just
     dragged out of the way. */
  const nodeDrag = useRef<{ id: string; px: number; py: number; live: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [movingId, setMovingId] = useState<string | null>(null);
  const SLACK = 4;

  const onNodePointerDown = (id: string) => (e: React.PointerEvent) => {
    // The drill strip and anything else that is its own control keeps its press.
    if ((e.target as HTMLElement).closest("[data-nodrag]")) return;
    if (e.button !== 0) return;
    nodeDrag.current = { id, px: e.clientX, py: e.clientY, live: false };
  };

  const onNodePointerMove = (e: React.PointerEvent) => {
    const d = nodeDrag.current;
    if (!d) return;
    const dx = e.clientX - d.px;
    const dy = e.clientY - d.py;
    if (!d.live) {
      if (Math.hypot(dx, dy) < SLACK) return;
      d.live = true;
      setMovingId(d.id);
      /* **The capture is taken here, not on pointerdown.** A captured pointer
         retargets the click and dblclick that follow it to the capturing
         element, so capturing on press moved both off the button inside the
         node — the panel stopped opening on a click and, less visibly, the
         double-click that drills a level stopped working. Capturing at the
         moment the drag becomes real leaves a plain press untouched, and the
         drag still gets what it needs: the pointer may leave the box without
         the move ending. */
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
    d.px = e.clientX;
    d.py = e.clientY;
    // Client pixels are world units divided by the zoom, or the node lags the
    // pointer at anything other than k=1.
    nudge(d.id, dx / t.k, dy / t.k);
  };

  const onNodePointerUp = () => {
    const d = nodeDrag.current;
    nodeDrag.current = null;
    if (!d?.live) return;
    setMovingId(null);
    suppressClick.current = true;
    // Cleared on the next task, after the click this pointerup is about to fire.
    setTimeout(() => (suppressClick.current = false), 0);
  };

  const nudge = (id: string, dx: number, dy: number) =>
    setMoved((prev) => {
      const m = prev[id] ?? { dx: 0, dy: 0 };
      return { ...prev, [id]: { dx: m.dx + dx, dy: m.dy + dy } };
    });

  /* ---- keyboard: pan a focused node into view ---- */
  const revealNode = (item: GraphItem) => {
    setT((prev) => {
      const left = item.x * prev.k + prev.x;
      const top = item.y * prev.k + prev.y;
      const right = left + item.w * prev.k;
      const bottom = top + item.h * prev.k;
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
            {/* **The head is sized in user units, not in stroke widths.** The
                default `markerUnits` is `strokeWidth`, so the triangle was
                6 × 1.25 = 7.5px of a viewBox it only filled 90% of — a head
                barely wider than the line it ended, with its tip blunted by the
                0..9 path in a 0..10 box. `userSpaceOnUse` makes it 9px flat,
                the path runs corner to corner, and `refX` sits on the tip so
                the point lands exactly where the line stops rather than one
                unit short of it.

                It stays in world units, which means it scales with the zoom
                like everything else on the map. A head that held its pixel size
                while the graph shrank would swamp the nodes at Level 1's fit. */}
            <marker
              id="mrd-arrow"
              viewBox="0 0 10 10"
              refX="10"
              refY="5"
              markerWidth="9"
              markerHeight="9"
              markerUnits="userSpaceOnUse"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--canvas-edge)" />
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
                strokeWidth={1.75}
                strokeLinecap="round"
                strokeLinejoin="round"
                markerEnd="url(#mrd-arrow)"
              />
            );
          })}
        </svg>

        {/* Edge labels are HTML, not SVG text — they need a pill, a border and
            a background that matches the rest of the interface.

            **`width: max-content` is load-bearing, and its absence was the
            actual bug behind every wrapped pill on this canvas.** The pill is
            absolutely positioned inside `origin-top-left`, which is a
            zero-width box: it only exists to carry the pan and zoom transform.
            For an absolutely positioned child, available width is the
            containing block's width minus `left` — here 0 minus 1240, which
            clamps to nothing — so shrink-to-fit fell all the way to the
            *preferred minimum*, which is the longest single word. Measured,
            *finished goods* wants 100 units on one line and was laying out at
            65 and wrapping, with 112 units of `max-width` it never used.

            So the corridor was only half the story. `max-content` asks for the
            nowrap width and `maxWidth` still caps it, which is the behaviour
            the `room` calculation was written for and never got.

            **Wrapping is still the fallback, and truncation still is not**: the
            label is two or three words naming what flows between two stages,
            and half of *finished goods* is not a shorter version of it. What
            has changed is that a label only wraps when the corridor genuinely
            cannot hold it — Level 1's *accepted deliveries* — rather than
            always.

            `text-center` is what makes a wrapped pill read as one label rather
            than as a ragged block, and `leading-[1.25]` gives the second line
            somewhere to sit — `leading-none` stacks the two lines touching. */}
        {labels.map((l) => (
          <span
            key={`l-${l.key}`}
            className={cn(
              "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 text-center",
              "rounded-lg border border-border bg-canvas px-2 py-[3px]",
              "font-mono text-[10px] leading-[1.25] text-muted-foreground",
            )}
            style={{ left: l.x, top: l.y, width: "max-content", maxWidth: l.room }}
          >
            {l.label}
          </span>
        ))}

        {placed.map((item) => (
          <NodeBox
            key={item.id}
            item={item}
            compact={t.k < COMPACT_BELOW}
            selected={selectedId === item.id}
            moving={movingId === item.id}
            onOpen={() => {
              if (suppressClick.current) return;
              onOpen(item.id);
            }}
            onDrill={onDrill && item.drillable ? () => onDrill(item.id) : undefined}
            onFocus={() => revealNode(item)}
            onPointerDown={onNodePointerDown(item.id)}
            onPointerMove={onNodePointerMove}
            onPointerUp={onNodePointerUp}
            /* Shift plus an arrow moves the node a grid square. A drag is a
               pointer-only gesture and §7.8 has no exception for a map, so the
               keyboard gets the same move on the same element — the plan
               panel's grip makes exactly this trade. Shift is what keeps the
               bare arrows free for the browser's own scrolling. */
            onNudge={(dx, dy) => nudge(item.id, dx, dy)}
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

      {/* `placed`, not `items`: a node that has been nudged has moved on the
          map, and a minimap showing it at its original coordinates is a map of
          a graph nobody is looking at. `bounds` was already computed from
          `placed`, so the two disagreed. */}
      <Minimap items={placed} edges={visibleEdges} bounds={bounds} t={t} size={size} />

      <div
        data-nodrag
        className="absolute right-3 top-3 flex overflow-hidden rounded-lg border border-border bg-card shadow-raised"
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
        {/* Fit and full screen are next to each other and are not the same
            thing, which is why both are here. Fit changes the zoom so the graph
            is all visible; full screen changes how much window there is to be
            visible in. Confusing them is what "fit to screen" invites, so the
            two icons have to be unalike: a target that centres, and brackets
            that push out. They were two sets of corner brackets until the
            target landed — see `FitIcon`. */}
        {onToggleFull && (
          <button
            type="button"
            onClick={onToggleFull}
            aria-pressed={full}
            className="border-l border-border px-2.5 py-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            {full ? <ShrinkIcon /> : <ExpandIcon />}
            <span className="sr-only">{full ? "Leave full screen" : "Full screen"}</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The health strip along the top of the box.
 *
 * The border already carries the hue, and at Level 1's fit zoom a 2px border is
 * one physical pixel and the 11px shape mark is five. A 6px strip is three, and
 * it is the one part of the node that is a solid block of the colour rather
 * than an outline of it — which is what makes a fourteen-box graph readable as
 * a distribution before it is readable as fourteen names.
 *
 * **It is flat.** It was extruded for a revision — a `.health-bar` class laying
 * white and black at low alpha over the hue, for a lit top edge and a shadow
 * cast onto the card — and that came off on request. The class is gone from
 * `globals.css` rather than left unused.
 *
 * **`unknown` draws no strip at all.** It had a dashed hairline, on the
 * argument that a filled grey block would put "nobody has looked" alongside the
 * three real readings as a fourth one. That argument holds and the hairline was
 * still wrong: an unknown node has no evidence, so its own border is already
 * dashed, and the strip laid a second dash line 2px inside the first. Two
 * dashed rules 2px apart read as one thick fuzzy edge rather than as a mark.
 *
 * Absence stays absence, which is the rule the whole surface is built on — and
 * an absent strip is the most literal reading of it. The dashed border carries
 * the same thing at the same weight, round all four sides.
 */
function HealthStrip({ health }: { health: Health }) {
  if (health === "unknown") return null;
  return (
    <span
      aria-hidden
      className={cn(
        "pointer-events-none absolute inset-x-0 top-0 h-[6px]",
        health === "critical"
          ? "bg-health-critical"
          : health === "watch"
            ? "bg-health-watch"
            : "bg-health-healthy",
      )}
    />
  );
}

/** A nib. Small enough to survive being the second mark on a crowded corner,
 *  and specific enough not to be read as a warning triangle. */
const PenMark = () => (
  <svg viewBox="0 0 12 12" width="9" height="9" aria-hidden className="shrink-0">
    <path d="M8.4 1.2l2.4 2.4-6 6L1.2 10.8l1.2-3.6z" fill="currentColor" />
  </svg>
);

/**
 * "Somebody thinks this is wrong."
 *
 * Ink on ink, not a hue, and that is the whole design of it. The three health
 * colours are readings about the client's process; this is a reading about
 * *our* reading, so giving it red would say Transport is on fire when what is
 * actually on fire is our description of Transport. Filled rather than outlined
 * because it has to win the corner against a health mark that is already there,
 * and because a human put it there deliberately — it should look placed.
 */
function CorrectionBadge({ compact }: { compact: boolean }) {
  return (
    <span
      className={cn(
        "relative flex shrink-0 items-center gap-1 rounded-[3px] bg-foreground px-1 py-[2px] font-medium text-card",
        compact ? "text-[9px]" : "text-[10px]",
      )}
    >
      <PenMark />
      {!compact && "Check"}
    </span>
  );
}

function NodeBox({
  item,
  compact,
  selected,
  moving,
  onOpen,
  onDrill,
  onFocus,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onNudge,
}: {
  item: GraphItem;
  /** Zoomed out past the point the full node is legible. See `COMPACT_BELOW`. */
  compact: boolean;
  selected: boolean;
  /** Being dragged right now. Lifts it over its neighbours and off the ground. */
  moving: boolean;
  onOpen: () => void;
  onDrill?: () => void;
  onFocus: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  /** Keyboard equivalent of the drag, in world units. */
  onNudge: (dx: number, dy: number) => void;
}) {
  const empty = item.completeness === "none";
  const flagged = Boolean(item.needsCorrection);

  /* Weight increases with depth, and it has to do so in a way that survives
     zoom-to-fit. World-unit size alone does not: you never see two levels at
     once, and each level is scaled to fill the same viewport, so a bigger Level
     2 box arrives on screen the same size as a smaller Level 0 one. What does
     survive is the *ratio* of the type to the box it sits in, and how much is
     inside. Level 0 is a name and a number in a wide quiet box; Level 2 is a
     title a third larger holding four facts. */
  const titleClass =
    item.level === 0
      ? "text-[15px] font-medium leading-tight"
      : item.level === 1
        ? "font-display text-[17px] leading-tight"
        : "font-display text-[20px] leading-tight";
  const pad = item.level === 0 ? "px-3 pb-2.5" : item.level === 1 ? "px-3.5 pb-3" : "px-4 pb-3.5";

  const label = [
    item.title,
    HEALTH_LABEL[item.health],
    COMPLETENESS_LABEL[item.completeness],
    flagged ? "Flagged for correction" : "",
  ]
    .filter(Boolean)
    .join(". ");

  /* **The card does three things, and the whole card does all three.**
       click        open the detail beside it
       double-click go down a level
       press, move  put it somewhere else

     Going down used to be on the body button alone, so it fired on the top
     four-fifths of the card and did nothing on the strip at the bottom or on
     the two or three pixels of border around it. It is on the wrapper now,
     which is also the element the drag is on, so the three gestures share one
     surface and there is no dead margin between them.

     The drill strip is the exception in both directions: it drills on a single
     press, so a double press there would go down twice, and it must not start a
     move. `[data-nodrag]` marks it and both handlers skip it. */
  const enter = (e: React.MouseEvent) => {
    if (!onDrill) return;
    if ((e.target as HTMLElement).closest("[data-nodrag]")) return;
    onDrill();
  };

  return (
    <div
      data-node
      onDoubleClick={enter}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      className={cn("absolute", moving ? "z-20 cursor-grabbing" : "cursor-grab")}
      style={{ left: item.x, top: item.y, width: item.w, height: item.h }}
    >
      {/* A box with two controls in it, not one control.
          It was a single `<button>` whose double-click drilled, which is the
          one interaction on this surface nothing on screen mentioned — the
          driving instructions that named it were removed and the affordance
          went with them. Splitting the box means going deeper is a labelled
          control in the tab order, and it cannot be nested inside the button
          that opens the detail. Double-click still works for whoever learnt it. */}
      <div
        className={cn(
          "relative flex h-full w-full flex-col overflow-hidden rounded-md border-2 shadow-sm transition-shadow",
          HEALTH_BORDER[item.health],
          // "No evidence" means no fill — painted as the canvas itself rather than a
          // translucent card, so the contrast of the text on it is knowable.
          empty ? "border-dashed bg-canvas" : "border-solid bg-canvas-node",
          selected && "ring-2 ring-ring ring-offset-2 ring-offset-[var(--canvas-bg)]",
          moving ? "shadow-lg" : "hover:shadow-md",
        )}
      >
        <HealthStrip health={item.health} />

        <button
          type="button"
          onClick={onOpen}
          onFocus={onFocus}
          onKeyDown={(e) => {
            /* Enter opens the panel, which the button does for free. This is
               the other two gestures, for someone without a pointer.

               A bare right arrow goes down a level, the tree idiom. It is not
               belt and braces for the drill strip: below `COMPACT_BELOW` that
               strip is not rendered at all, and Level 1 *fits* at about 0.47 —
               so without this there is no keyboard route into Level 2 from the
               level that has the most under it. */
            if (!e.shiftKey && e.key === "ArrowRight" && onDrill) {
              e.preventDefault();
              onDrill();
              return;
            }
            if (!e.shiftKey) return;
            const step = 20;
            const d =
              e.key === "ArrowLeft"
                ? [-step, 0]
                : e.key === "ArrowRight"
                  ? [step, 0]
                  : e.key === "ArrowUp"
                    ? [0, -step]
                    : e.key === "ArrowDown"
                      ? [0, step]
                      : null;
            if (!d) return;
            e.preventDefault();
            onNudge(d[0], d[1]);
          }}
          aria-label={label}
          className={cn("relative flex min-h-0 flex-1 flex-col pt-3 text-left", pad)}
        >
          <span className="flex items-start justify-between gap-1.5">
            <span className={cn(compact ? "font-display text-[24px] leading-tight" : titleClass)}>
              {item.title}
            </span>
            {/* The health shape mark is gone from the corner, on request. The
                strip along the top and the border still carry the reading, and
                the key names all four. */}
            {flagged && (
              <span className="mt-0.5 flex shrink-0 items-center gap-1">
                <CorrectionBadge compact={compact} />
              </span>
            )}
          </span>

          {/* The subtitle is the first thing to go when the box is small on
              screen. It is a full sentence at 11px, which is the least legible
              thing on the node and the least scannable: a plain-language gloss
              is what you read once when you arrive somewhere, not what you scan
              fourteen of. */}
          {/* Three lines, not two, and `text-small` rather than `text-micro`.
              At 11px clamped to two lines every Level 0 subtitle was cut
              mid-sentence — "Working out what they will need, and…" — which is
              text paid for and not readable. The boxes grew to fit it; see
              `NODE_SIZE`. */}
          {!compact && (
            <span className="mt-1 line-clamp-3 text-small leading-snug text-muted-foreground">
              {item.subtitle}
            </span>
          )}

          <span className="mt-auto flex items-end justify-between gap-2 pt-1.5">
            <span className="flex items-center gap-1.5">
              <EvidenceMark
                completeness={item.completeness}
                className={compact ? "scale-[1.4] origin-left" : undefined}
              />
              {/* Both the evidence word and the money, where there is room. It
                  used to be one slot: a priced node showed its rupees and said
                  nothing at all about what was behind them, which is the exact
                  pairing §7.11 is about.

                  **The word is on Level 0 too now**, on request, so the node
                  reads the way the key does: three bars and what they mean.
                  It was gated to `level > 0` on the argument that the value
                  chain is orientation rather than a finding, and that argument
                  does not survive the mark being there anyway — a glyph with
                  no word is the one thing on the box a reader has to go to the
                  corner of the screen to decode, and §4's data-completeness
                  rule is about exactly this axis. */}
              {!compact && (
                <span className="text-micro text-muted-foreground">{item.footer}</span>
              )}
            </span>
            {item.valueCr != null && item.valueCr > 0 && (
              <span className={cn("tabular font-medium", compact ? "text-small" : "text-micro")}>
                {money(item.valueCr)}
              </span>
            )}
            {compact && (item.valueCr == null || item.valueCr === 0) && empty && (
              <span className="text-[10px] text-muted-foreground">No data</span>
            )}
          </span>
        </button>

        {/* What is underneath, as a control rather than as a hint.
            A stage is a place you go down from, so the useful thing it can say
            is what is waiting below — and the flagged count is the reason to go
            now rather than later. */}
        {onDrill && !compact && (
          <button
            type="button"
            /* The drill strip never starts a move. It is 24px of a node you
               drag by its body, and going down a level is the one press here
               that cannot be undone by dragging the box back. */
            data-nodrag
            onClick={onDrill}
            onFocus={onFocus}
            className={cn(
              "relative flex shrink-0 items-center justify-between gap-2 border-t border-border-strong/50 py-1.5 text-micro text-muted-foreground transition-colors hover:bg-muted hover:text-foreground",
              item.level === 0 ? "px-3" : "px-3.5",
            )}
          >
            <span>
              {item.childCount} inside
              {item.flaggedUnder ? ` · ${item.flaggedUnder} to check` : ""}
            </span>
            <span aria-hidden>›</span>
          </button>
        )}

        {/* The floor, said rather than inferred.
            A box with nothing under it looks exactly like a box whose children
            have not loaded, and §4 puts all the value at the bottom level — so
            arriving there should be a statement, not an absence of a chevron.
            It is a `<span>` and not a button: it goes nowhere, and a second tab
            stop that does nothing is worse than no affordance at all. */}
        {!onDrill && !compact && item.level > 0 && (
          <span
            className={cn(
              "relative flex shrink-0 items-center justify-between gap-2 border-t border-border-strong/50 py-1.5 text-micro text-muted-foreground",
              item.level === 0 ? "px-3" : "px-3.5",
            )}
          >
            Lowest level. Priced here
          </span>
        )}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The map of the map, bottom right.
 *
 * Four things were wrong with it and all four were the same fault: it was drawn
 * as a fixed box with the graph poured into it, rather than as a small picture
 * of the graph.
 *
 * - **The box was 176×108 whatever was in it.** The value chain is five boxes
 *   in one wide row, so it landed as a strip of colour across the middle of a
 *   card that was two thirds empty. The height now follows the graph's own
 *   aspect, clamped, so there is no void to explain.
 * - **Nodes touched the edges and were sliced by them.** The scale used the
 *   full width, so at Level 0 the first and last node ran under the card's
 *   border. There is a `PAD` now, and it is inside the scale rather than a
 *   margin around it.
 * - **There were no edges**, so five rectangles in a row read as a swatch strip
 *   rather than as a diagram. They are hairlines at low opacity: enough to say
 *   *this is a graph and it flows left to right*, not enough to be read.
 * - **The viewport frame drew itself even when it framed everything.** At fit
 *   zoom it is exactly the card, so it rendered as a second border a pixel
 *   inside the first. It appears only once there is something outside it.
 */
function Minimap({
  items,
  edges,
  bounds,
  t,
  size,
}: {
  items: GraphItem[];
  edges: GraphEdge[];
  bounds: { x: number; y: number; w: number; h: number };
  t: { x: number; y: number; k: number };
  size: { w: number; h: number };
}) {
  const W = 176;
  /* **The box is the canvas's shape, not the graph's**, and that is the whole
     idea rather than a detail. This is a picture of the *canvas* — what is on
     screen, and where in the map that is — so a card shaped like the window it
     reduces is the thing that makes the viewport frame legible: at fit the
     frame is the same rectangle as the card, and every zoom from there reads as
     a smaller rectangle of the same proportion.

     It followed the node bounds for one revision and that was wrong. The value
     chain is five boxes in one wide row, so the card collapsed to a 56px strip:
     tidier, no empty space, and no longer a map of anything — a strip cannot
     show you that you are looking at the left third of something, because it
     has no room left to be the other two thirds in.

     Clamped, because the canvas is a flexible box: on a phone in portrait its
     own ratio would ask for a minimap taller than the map. */
  const H = Math.max(88, Math.min(132, Math.round((W * size.h) / (size.w || 1))));
  const PAD = 8;

  if (!items.length || !size.w) return null;

  const s = Math.min((W - PAD * 2) / bounds.w, (H - PAD * 2) / bounds.h);
  const ox = (W - bounds.w * s) / 2;
  const oy = (H - bounds.h * s) / 2;
  const at = (i: GraphItem) => ({
    x: (i.x - bounds.x) * s + ox,
    y: (i.y - bounds.y) * s + oy,
  });

  const vx = (-t.x / t.k - bounds.x) * s + ox;
  const vy = (-t.y / t.k - bounds.y) * s + oy;
  const vw = (size.w / t.k) * s;
  const vh = (size.h / t.k) * s;
  /* **Nothing is clamped, and the window is always drawn.** Both were wrong and
     for the same reason: they were trying to stop the frame looking silly when
     it covered everything, and they cost the one thing the frame is for.

     Clamping the rectangle to the card meant that panning at fit zoom moved
     nothing — the rect was already pinned to all four edges, so a user dragging
     the graph off to the left saw a minimap that did not react. Hiding it below
     a size threshold meant the same thing more bluntly.

     Unclamped, `vx`/`vy` go negative and the rect runs past the card; the card
     is `overflow-hidden`, so what you see is the part of the window that is over
     the map, which is exactly the truth being reported. */

  // The canvas's 24px world grid, stepped up to whichever multiple sits nearest
  // 20 screen pixels. See the note on the ground below.
  const cell = 24 * s;
  const dot = cell * Math.max(1, Math.round(20 / cell));

  const byId = new Map(items.map((i) => [i.id, i]));

  return (
    <div
      /* **The ground is the canvas's, with the canvas's dot grid on it**, not a
         white card. That is what makes the empty space mean something: at Level
         0 the value chain is one wide row, so a card shaped like the window has
         air above and below it — which is exactly what the window has too. On
         white that air reads as an unfinished card; on the dotted canvas tone it
         reads as the rest of the map, which is what it is.

         **The grid is a multiple of the canvas's, not the canvas's own.** Drawn
         at `24 * s` it lands about 2px apart at Level 0, which is not a grid, it
         is noise — measured, and it made the card look like sandpaper. Stepping
         up to whichever multiple sits nearest 20px keeps every dot on a real
         world gridline, so the pattern is still the canvas's own grid rather
         than a texture that resembles one, at a density you can see through. */
      className="pointer-events-none absolute bottom-3 right-3 overflow-hidden rounded-lg border border-border bg-canvas shadow-raised"
      style={{
        width: W,
        height: H,
        backgroundImage: "radial-gradient(var(--canvas-dot) 1px, transparent 1px)",
        backgroundSize: `${dot}px ${dot}px`,
        backgroundPosition: `${ox - bounds.x * s}px ${oy - bounds.y * s}px`,
      }}
      aria-hidden
    >
      {/* Straight lines centre to centre, not the real bezier routing. At this
          size a curve and a straight line are the same three pixels, and the
          loop lane under the graph would spend a third of the height on flows
          nobody can trace here anyway. */}
      <svg className="absolute inset-0" width={W} height={H}>
        {edges.map((e, n) => {
          const a = byId.get(e.from);
          const b = byId.get(e.to);
          if (!a || !b) return null;
          const p = at(a);
          const q = at(b);
          return (
            <line
              key={n}
              x1={p.x + (a.w * s) / 2}
              y1={p.y + (a.h * s) / 2}
              x2={q.x + (b.w * s) / 2}
              y2={q.y + (b.h * s) / 2}
              stroke="currentColor"
              strokeWidth={0.5}
              className="text-muted-foreground/30"
            />
          );
        })}
      </svg>

      {items.map((i) => {
        const p = at(i);
        return (
          <span
            key={i.id}
            className={cn(
              "absolute rounded-[2px]",
              i.health === "critical"
                ? "bg-health-critical"
                : i.health === "watch"
                  ? "bg-health-watch"
                  : i.health === "unknown"
                    ? "bg-border-strong"
                    : "bg-health-healthy",
              /* Evidence is opacity here, as it is on the node itself, where it
                 is a dashed or hatched fill. `unknown` already reads as absence
                 through its neutral, so dimming it as well would put two marks
                 on one reading. */
              i.health !== "unknown" && i.completeness === "none" && "opacity-30",
              i.health !== "unknown" && i.completeness === "partial" && "opacity-60",
            )}
            style={{
              left: p.x,
              top: p.y,
              width: Math.max(3, i.w * s),
              height: Math.max(2, i.h * s),
            }}
          />
        );
      })}

      {/* **The veil is outside the window, not inside it**, and that is what
          lets the frame be permanent.

          A tinted rectangle *on* the viewport had to be hidden whenever the
          viewport covered everything, or it drew as a second border a few
          pixels inside the card's own. Shading what is *not* on screen has no
          such state: at fit there is nothing outside the window, so nothing
          paints and the card is simply the map; pan or zoom and the part you
          have left behind dims. One element does it, with a spread bigger than
          the card and `overflow-hidden` to trim it.

          **No border on it**, which took driving it to settle. A 1px rule
          looked like the right way to keep the edge exact, and at fit it drew
          two pixels inside the card's own border — the double border again,
          arriving through the last door left open. It is also redundant: a
          box-shadow spread has a hard boundary, so the veil already ends on an
          exact line. The rule was crispness on top of something already crisp,
          bought at the price of a mark that shows when there is nothing to
          mark. */}
      <span
        className="absolute rounded-[3px]"
        style={{
          left: vx,
          top: vy,
          width: vw,
          height: vh,
          boxShadow: "0 0 0 9999px color-mix(in oklab, var(--foreground) 16%, transparent)",
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
const ExpandIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
    <path
      d="M6.5 2.5H2.5V6.5M9.5 2.5H13.5V6.5M6.5 13.5H2.5V9.5M9.5 13.5H13.5V9.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
const ShrinkIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
    <path
      d="M2.5 6.5H6.5V2.5M13.5 6.5H9.5V2.5M2.5 9.5H6.5V13.5M13.5 9.5H9.5V13.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
/**
 * A target, on request, and it settles a claim this file was making and not
 * keeping.
 *
 * The comment beside the two buttons says the icons are "deliberately unalike:
 * one frames, one pushes out". They were not. Fit was four corner brackets
 * pointing inward and full screen is four pointing outward — at 15px, one
 * stroke's difference in direction, sitting side by side in the same cluster.
 * Two controls a user is already primed to confuse, wearing the same glyph.
 *
 * A target says *centre this*, which is what fit does: it does not change how
 * much window there is, it puts the whole graph in the middle of the window
 * there is. Nothing else in the cluster is a circle, so it is now the one
 * button in the row findable by shape.
 */
const FitIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="4.25" stroke="currentColor" strokeWidth="1.4" />
    {/* The crosshairs stop short of the ring rather than crossing it. Through
        the middle they would read as a dead centre mark on a map; outside it,
        they read as the sight being brought onto something. */}
    <path
      d="M8 1.5v2.2M8 12.3v2.2M1.5 8h2.2M12.3 8h2.2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

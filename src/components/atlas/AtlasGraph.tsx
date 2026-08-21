"use client";

import { useEffect, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { atlasDomains, provenCountOf } from "@/lib/atlas";

/**
 * The canvas: one centre node, five domains around it, edges between them.
 *
 * **Computed, not hand-authored**, which is the one place this deliberately
 * departs from Operations' `GraphCanvas`. `canvas.ts` positions every SCOR
 * node by hand because that graph is a left-to-right process flow with no
 * regular shape to formula. Atlas is Heizen's territory around one centre,
 * which *is* a regular shape — five domains evenly spaced on a ring is
 * `angle = i * (360 / n)`, so the position table Operations needs is exact
 * trigonometry here instead. Adding a sixth domain is one entry in
 * `atlasDomains`, not a new hand-picked coordinate.
 *
 * **Two levels on the canvas, not four.** Subdomains and past projects are
 * real and navigable, but they live in the detail rail beside the canvas
 * once a domain is selected, not as two further rings of nodes. `GraphItem`
 * in `GraphCanvas.tsx` is typed to a hard `0 | 1 | 2`, and `CanvasView`'s
 * drill state is a fixed three-level machine built for SCOR specifically —
 * forking both for one Atlas page was a worse trade than a canvas that draws
 * what a ring can hold and a rail that reads the rest as a list, which is
 * what a list of eleven names ever wanted to be.
 *
 * ---
 *
 * **It is drawn on the product's own canvas ground now.** It used to sit on
 * `bg-card`, so the one other surface in the product that draws a graph —
 * Operations — and this one shared nothing: same product, two different ideas
 * of what a canvas is. The ground, the dot grid, the edge stroke and the node
 * fill are all `--canvas-*` here, the same four tokens `GraphCanvas` paints
 * with, which is most of what "match the theme" meant on this screen.
 *
 * **The proven mark is `--evidence`, not `--effort-low`.** The green was
 * borrowed off the effort chip on the reading that *proven* is good news the
 * same way *cheap* is. But `--effort-*` is a token family with exactly one job
 * (`CLAUDE.md` §4, and the note there about what happens when a second scale
 * borrows a hue), and a green pill next door to Gaps reads as *low effort*
 * rather than *we have built this*. Blue is this product's evidence colour —
 * a source, a citation, a thing that backs a claim — and a past project
 * behind a sub-process is precisely that.
 *
 * **Coverage is a bar as well as a sentence.** A node said "4 of 4 proven" and
 * nothing else, so telling a walked domain from an unwalked one meant reading
 * five pairs of digits. A segment per sub-process, filled to the count, is the
 * shape the ring was supposed to give and never did. Colour is not the only
 * carrier: the words are still on the node, the same rule `EffortChip`'s three
 * dots follow.
 */

/** The narrowest the canvas is ever drawn. Below this the frame scrolls. */
const MIN_W = 760;
const H = 440;
const CENTER_Y = H / 2;
const CENTER_R = 56;
/** Vertical radius, fixed: the height is fixed, so this one cannot breathe. */
const RING_RY = 168;
/** Horizontal radius at `MIN_W`, and the floor for the measured one. */
const MIN_RX = 168;
/** Past this the ring stops spreading. Five nodes on a 900px-wide ellipse read
    as a row of cards with faint lines behind them, not as a thing with a
    centre, and the edges get long enough that following one is work. */
const MAX_RX = 320;
const NODE_W = 156;
const NODE_H = 88;

const ANGLES = atlasDomains.map((domain, i) => ({
  domain,
  angle: (i * (360 / atlasDomains.length) - 90) * (Math.PI / 180),
}));

/** The ring is an ellipse, not a circle, and the width of it is measured.

    The canvas was a fixed 760 box centred in a frame that is half again as
    wide on a laptop and twice as wide on a monitor, so the dot grid had more
    area than the graph did and the whole thing read as a small diagram adrift
    in a large box. The height is fixed and the width is not, so the radius
    that can respond is the horizontal one: the ring stretches to whatever the
    frame gives it, up to `MAX_RX`, and the five nodes spread with it. */
const positionsFor = (rx: number, boxW: number) =>
  ANGLES.map(({ domain, angle }) => ({
    domain,
    x: boxW / 2 + rx * Math.cos(angle),
    y: CENTER_Y + RING_RY * Math.sin(angle),
  }));

export function AtlasGraph({
  selectedId,
  hoveredId,
  onSelect,
  onHover,
}: {
  selectedId: string | null;
  hoveredId: string | null;
  onSelect: (id: string | null) => void;
  onHover: (id: string | null) => void;
}) {
  /* **The canvas opens centred, not at its left edge.** Below 760px the frame
     scrolls, and a scroller starts at `scrollLeft: 0` — so at 375 the first
     thing on the page was the empty top-left corner of the ring with two
     nodes half off the right edge and no "Supply chain" in sight. Centring it
     puts the middle of the graph in the middle of the frame, which is the
     view the ring was drawn for, and the two domains either side are one swipe
     away rather than three.

     One shot on mount, deliberately: re-centring on every render would fight
     whoever has just scrolled. */
  const frame = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    el.scrollLeft = (el.scrollWidth - el.clientWidth) / 2;
  }, []);

  /* The measured width, which is what the ring is drawn against. It starts at
     `MIN_W` so the first paint is the narrow ring rather than a flash of
     nothing, and a `ResizeObserver` rather than a window listener because the
     rail beside it changes this column's width without the window moving. */
  const [boxW, setBoxW] = useState(MIN_W);
  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setBoxW(Math.max(MIN_W, entry.contentRect.width)),
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* Half the room left once a node's own width and a margin are taken off
     both ends, so the outermost node never touches the frame. */
  const rx = Math.min(MAX_RX, Math.max(MIN_RX, (boxW - NODE_W - 64) / 2));
  const domainPositions = positionsFor(rx, boxW);
  const centerX = boxW / 2;

  return (
    <div
      ref={frame}
      className="scroll-slim overflow-x-auto rounded-lg border border-border bg-canvas shadow-card"
      style={{
        // The dot grid is on the *frame*, not on the 760px canvas inside it.
        // On the inner box it stopped at the canvas's own width and left two
        // ivory bands down the sides of a wider column, which read as the
        // ground having failed rather than as a canvas centred in its frame.
        backgroundImage: "radial-gradient(var(--canvas-dot) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Fixed pixel canvas rather than a responsive viewBox — the same trade
          `SwitchScroller` documents for a track wider than its frame: below
          the canvas's own minimum it scrolls rather than the domains crowding
          each other or the labels truncating to nothing. Above it the box is
          the frame's width and the ring spreads into it. */}
      <div className="relative mx-auto" style={{ width: boxW, height: H }}>
        <svg
          className="pointer-events-none absolute left-0 top-0"
          width={boxW}
          height={H}
          aria-hidden
        >
          {domainPositions.map(({ domain, x, y }) => {
            const lit = domain.id === selectedId || domain.id === hoveredId;
            return (
              <line
                key={domain.id}
                x1={centerX}
                y1={CENTER_Y}
                x2={x}
                y2={y}
                // `--canvas-edge` at a third opacity at rest, full when the
                // domain is live. A graph whose every edge is drawn at full
                // strength has no way left to say which one you are on, and
                // five lines from one point is exactly the case where the
                // resting state should recede.
                stroke="var(--canvas-edge)"
                strokeOpacity={lit ? 0.9 : 0.4}
                strokeWidth={lit ? 2 : 1}
              />
            );
          })}
        </svg>

        {/* The centre node. Clicking it clears a selection rather than opening
            one — there is nothing under "Supply chain" itself to drill to,
            only the five things it is made of. It says so on the node: a
            control whose whole job is to undo has to name what it undoes, and
            "Supply chain" on its own reads as a sixth thing to open. */}
        <button
          type="button"
          onClick={() => onSelect(null)}
          onMouseEnter={() => onHover("center")}
          onMouseLeave={() => onHover(null)}
          onFocus={() => onHover("center")}
          onBlur={() => onHover(null)}
          className={cn(
            "absolute grid -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 text-center shadow-card transition-colors",
            "border-border-strong bg-canvas-node hover:border-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas-bg)]",
          )}
          style={{ left: centerX, top: CENTER_Y, width: CENTER_R * 2, height: CENTER_R * 2 }}
        >
          <span className="px-2 text-small font-semibold leading-tight">Supply chain</span>
          <span className="text-micro text-muted-foreground">
            {atlasDomains.length} domains
          </span>
        </button>

        {domainPositions.map(({ domain, x, y }) => {
          const { proven, total } = provenCountOf(domain.id);
          const selected = domain.id === selectedId;
          const hovered = domain.id === hoveredId;
          return (
            <button
              key={domain.id}
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(selected ? null : domain.id)}
              onMouseEnter={() => onHover(domain.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onHover(domain.id)}
              onBlur={() => onHover(null)}
              className={cn(
                "absolute flex -translate-x-1/2 -translate-y-1/2 flex-col gap-1.5 rounded-md border-2 bg-canvas-node p-2.5 text-left shadow-card transition-shadow",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--canvas-bg)]",
                // **One state, drawn one way.** The node used to carry a green
                // tint for "has any precedent" *and* a dark border for
                // selected, so a proven domain and the open one competed for
                // the same edge. Coverage is the bar now and nothing else;
                // the border says only which node you are on.
                selected
                  ? "border-foreground shadow-raised"
                  : hovered
                    ? "border-border-strong shadow-md"
                    : "border-border",
              )}
              style={{ left: x, top: y, width: NODE_W, height: NODE_H }}
            >
              {/* Two lines of room, and the node is tall enough to hold
                  them: three of the five domain names wrap, and at 72px the
                  second line was sliced in half by the bar underneath it. */}
              <p className="line-clamp-2 flex-1 text-micro font-semibold leading-tight">
                {domain.name}
              </p>
              <div>
                <CoverageBar proven={proven} total={total} />
                <p className="tabular mt-1 text-micro text-muted-foreground">
                  {proven} of {total} proven
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * One segment per sub-process, filled for the ones a past project stands
 * behind. Decorative on its own and marked `aria-hidden`: the count beside it
 * is the reading, and this is the thing that makes five of them comparable
 * without reading any of them.
 */
export function CoverageBar({
  proven,
  total,
  className,
}: {
  proven: number;
  total: number;
  className?: string;
}) {
  return (
    <span className={cn("flex gap-0.5", className)} aria-hidden>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full",
            i < proven ? "bg-evidence" : "bg-border-strong/40",
          )}
        />
      ))}
    </span>
  );
}

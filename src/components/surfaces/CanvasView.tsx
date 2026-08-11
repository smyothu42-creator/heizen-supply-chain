"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { gapById } from "@/lib/suvarna";
import {
  COMPLETENESS_LABEL,
  HEALTH_LABEL,
  NODE_SIZE,
  canDrill,
  childrenOf,
  descendantsOf,
  nodeById,
  nodes,
  positions,
  processEdges,
  type Completeness,
  type Health,
} from "@/lib/canvas";
import { EvidenceMark } from "@/components/meridian/NodeCard";
import { GraphCanvas, type GraphItem } from "@/components/meridian/GraphCanvas";
import { usePanel } from "@/components/meridian/EvidencePanel";
import { SurfaceHero } from "@/components/shell/SurfaceHero";

/**
 * Operations — a spatial map of how the company runs.
 *
 * **`Canvas` is the internal name** and stays that way in this file, in
 * `lib/canvas.ts` and in `CanvasNode`. It named the drawing surface rather than
 * what is drawn on it, which is fine for a component and useless as a tab. Same
 * split as Meridian / Heizen Discovery Tool, and Money-first / `Money`.
 *
 * **There is one view, and it is the graph.** Entities and List were both chips
 * on a View switch beside it; both are gone on request, and with the second one
 * the switch went too. A tab control offering one tab is a control that only
 * says what you are already looking at.
 *
 * Worth knowing what went with them, because neither was only a view:
 *
 * - **List was the no-panning route through the map.** A pannable graph is hard
 *   to work through on a keyboard or a small screen, and the graph now carries
 *   those users alone. `check:ui` confirms every node is reachable by Tab and
 *   that the panel opens, closes and returns focus; whether panning-free
 *   reading is *comfortable* is not something a script can check.
 * - **Entities was the record-shaped reading of the same business** — what moves
 *   through it rather than what happens to it, grouped by the four areas Gaps
 *   filters by. `EntityList.tsx` and the `entities` data stay in the tree with
 *   nothing importing them, which is the same state `CanvasList.tsx` has been
 *   in since it was removed: putting either back is one chip and one branch.
 */
const HEALTH_DOT: Record<Health, string> = {
  critical: "bg-health-critical",
  watch: "bg-health-watch",
  healthy: "bg-health-healthy",
  // Hollow, not grey. On a warm palette every neutral reads as a colour, so a
  // filled dot put "not looked at" alongside the three real states as a fourth
  // one. Absence is encoded as absence of fill.
  unknown: "border border-border-strong bg-transparent",
};

/**
 * What each depth *is*, in words, and why you would go down from it.
 *
 * §4 says the three levels are the core structural idea of this surface, and
 * this is the only place in the product that states them. The nouns are the
 * plain-language halves of the domain terms: a Level 0 box is a stage of the
 * value chain, a Level 1 box a process, a Level 2 box a sub-process, which is
 * the level a gap is priced at and therefore the reason to descend at all.
 *
 * The tails end at the *next* level rather than describing the current one,
 * because a map's caption should point at where you have not been.
 */
const LEVEL_GLOSS = {
  0: { noun: "stages", tail: "The same five at every manufacturer, so nothing here is a finding yet" },
  1: { noun: "processes", tail: "Open one to reach the level a gap is priced at" },
  2: { noun: "sub-processes", tail: "The lowest level, and where the money is" },
} as const;

export function CanvasView() {
  /** Level 2 only ever shows one parent's children; 0 and 1 show everything. */
  const [level, setLevel] = useState<0 | 1 | 2>(0);
  const [l2Parent, setL2Parent] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  /** The key, on a phone. See the legend below. Shown from `sm` regardless. */
  const [openOnSmall, setOpenOnSmall] = useState(false);
  const [full, setFull] = useState(false);
  const { open } = usePanel();

  /* Escape leaves full screen. It is the only way out that does not need the
     user to find a 30px button on a map they have just filled the window with,
     and it is what every full-screen thing on the web has taught them. */
  useEffect(() => {
    if (!full) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFull(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [full]);

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
        const under = descendantsOf(n.id);
        return {
          id: n.id,
          x: positions[n.id]?.x ?? 0,
          y: positions[n.id]?.y ?? 0,
          w: NODE_SIZE[n.level].w,
          h: NODE_SIZE[n.level].h,
          level: n.level,
          title: n.name,
          subtitle: n.plainLine,
          health: n.health,
          completeness: n.completeness,
          valueCr: value,
          footer: COMPLETENESS_LABEL[n.completeness],
          drillable: canDrill(n.id),
          childCount: under.length,
          flaggedUnder: under.filter((d) => d.needsCorrection).length,
          needsCorrection: n.needsCorrection,
        };
      }),
    [shownNodes],
  );

  /* Canvas is viewport-locked, so the band costs map. The tiles earn it: what
     is mapped, how much of it has anything behind it, and what the mapped part
     is worth — which is the question the map exists to answer and previously
     took a trip to the List view to see. Tiles fold to one column below sm,
     where the map is small anyway and panning is the interaction.

     It used to pass `compact` — half the padding and a smaller title — which
     made it the one band in the product with its own height, and it opened
     with "How this company runs" where every other surface opens with its own
     name. Both are gone: the `compact` variant no longer exists, the title is
     the surface name, and the sentence moved into the line. Six surfaces with
     six identical headers is worth more than the ~40px of map the short band
     saved, and the map is a flexible box: it absorbs the difference.

     The line kept that sentence when the tab was called Canvas, because the
     title said nothing about the contents. It still earns its place: "in three
     levels" and "the money is at the bottom one" are what the title cannot
     say, and the second half is the reason to go down there. */
  const hero = <SurfaceHero title="Operations" />;

  /* **Full screen is the surface's state, not the canvas's.** The canvas cannot
     hide the band above it or the masthead above that, and those are most of
     what "full screen" means here: the map goes `fixed inset-0` over the whole
     window at `z-[80]`, above the masthead's `z-30`, and the band is simply not
     rendered. Nothing is dimmed or scrimmed, because there is nothing behind it
     the user is meant to see. */
  return (
    <div
      className={cn("flex min-h-0 flex-col", full ? "fixed inset-0 z-[80] bg-canvas" : "h-full")}
    >
      {!full && hero}
      <div className="min-h-0 flex-1">
        <GraphCanvas
          items={processItems}
          edges={processEdges}
          selectedId={selected}
          onOpen={(id) => {
            setSelected(id);
            open({ kind: "node", id });
          }}
          onDrill={(id) => {
            const n = nodeById(id);
            if (n.level === 0) goToLevel1();
            else if (n.level === 1 && canDrill(id)) {
              setLevel(2);
              setL2Parent(id);
              setSelected(null);
            }
          }}
          emptyNote="Nothing is mapped underneath this yet. Go back a level, or run research on this section."
          full={full}
          onToggleFull={() => setFull((v) => !v)}
          overlay={
            <>
              {/* Top left: how to get back, and where you are.

              `inset-x-3`, not `left-3`, so the row knows how much width it has
              and stops short of the zoom cluster in the opposite corner. That
              cap was measured once and is worth keeping: something sitting
              underneath the zoom buttons is not clipped, not unreachable by
              Tab, and so invisible to `check:ui`. */}
              {/* **`pr-[9.5rem]` is the cap, and it is load-bearing at 375.**
              The zoom cluster is a 145px card pinned `right-3 top-3`, and this
              row shares the corner with it. `inset-x-3` alone gives the row the
              whole width, so at 375 the path box ran to x=363 against a cluster
              starting at x=218 and the gloss set its lines underneath it.

              **Nothing automated sees this.** Two overlapping boxes are not a
              clipped element, an unreachable control or a contrast failure —
              the same blind spot as the project switcher over the first surface
              tab and the old View switch under these same buttons. Found the
              same way: by measuring the two rectangles. 145px of cluster plus
              the 8px gap is 9.5rem. */}
              <div className="pointer-events-none absolute inset-x-3 top-3 flex flex-wrap items-start gap-2 pr-[9.5rem]">
                {/* **Back comes first, in front of the path**, on request. It is
                the control, and the path beside it is the label: a button you
                are hunting for after every drill should not be at the far end
                of a breadcrumb whose width changes with the name of the process
                you drilled into. It appears only below Level 0, so the row does
                not shift sideways at the top level. */}
                {level > 0 && (
                  <button
                    type="button"
                    onClick={() => (level === 2 ? goToLevel1() : goToLevel0())}
                    className="pointer-events-auto rounded-lg border border-border bg-card px-2.5 py-1.5 text-small text-muted-foreground shadow-raised hover:text-foreground"
                  >
                    ← Back
                  </button>
                )}

                {/* **The path says what you are looking at, in words**, on
                  request, because the old one did not.

                  It read `Level 0 · 5 | Value chain › All processes` in mono,
                  which is four faults on one line. *Level 0* is a level of
                  nothing a non-expert can name, and Aryan is not an expert
                  (§7.6). The `5` counted something the line never said. *Level
                  0* and *Value chain* are the same fact stated twice, once in
                  jargon and once in English. And the mono face made the whole
                  thing read as debug output rather than as the label of the
                  screen.

                  So: the crumbs on the first line, in plain names, and one
                  short line under them saying what this depth *is* and how
                  many boxes are in it. **This is §7.6's inline gloss, not §7.2's
                  screen explaining itself** — the difference is that a gloss
                  names a term the reader has to decode to use the screen, and
                  this one changes with where you are standing. It is also the
                  only place in the product that teaches the three-level model,
                  which §4 says is the core structural idea of this surface. */}
                <nav
                  aria-label="Level path"
                  className="pointer-events-auto max-w-full rounded-lg border border-border bg-card px-2.5 py-1.5 shadow-raised"
                >
                  <div className="flex flex-wrap items-center gap-x-1 gap-y-0.5">
                    <Crumb label="Value chain" active={level === 0} onClick={goToLevel0} />
                    <span className="text-muted-foreground" aria-hidden>
                      ›
                    </span>
                    <Crumb label="Processes" active={level === 1} onClick={goToLevel1} />
                    {level === 2 && l2Parent && (
                      <>
                        <span className="text-muted-foreground" aria-hidden>
                          ›
                        </span>
                        <Crumb label={nodeById(l2Parent).name} active onClick={() => {}} />
                      </>
                    )}
                  </div>
                  {/* The count moved off the caption and into the sentence,
                    where it finally has a noun on it. How many boxes are in
                    front of you is the one thing the crumbs cannot say, and it
                    is what tells you Level 1 is the crowded one before you have
                    counted them. */}
                  <p className="mt-0.5 text-micro text-muted-foreground">
                    {shownNodes.length} {LEVEL_GLOSS[level].noun}
                    {/* **The teaching half hides below `sm`, the noun never
                      does.** At 375 the map is about 230px tall and the full
                      line took the box to 94px of it, which is 40% of the
                      surface spent on its own caption. What has to survive is
                      the noun on the count — *5 stages* rather than *· 5* — and
                      that is the whole of the fault being fixed. The sentence
                      after it is the part that has somewhere to go. */}
                    <span className="hidden sm:inline">. {LEVEL_GLOSS[level].tail}</span>
                  </p>
                </nav>
              </div>

              {/* Bottom left: what the colours mean, and nothing else.

              **The driving instructions and the fills disclosure are gone**, on
              request. What went with them, so it is a decision and not a
              discovery: "scroll to zoom · drag to pan · double-click to go
              deeper" was the only place double-click was named, and
              `CanvasLegend` was the only gloss on the hatching. Both survive
              elsewhere in weaker form — every node card states its own evidence
              level in words on its footer, and drilling is also reachable by
              pressing a node — but if either turns out to be needed, this is
              where it was and why it left.

              The four health dots stay. Including "not looked at" in the
              always-visible legend is what stopped grey reading as a fourth
              shade of fine rather than as an absence of any reading. */}
              <div className="pointer-events-none absolute bottom-3 left-3 max-w-[calc(100%-1.5rem)] sm:max-w-[calc(100%-13rem)]">
                <div className="pointer-events-auto space-y-1 rounded-lg border border-border bg-card px-3 py-2 shadow-raised">
                  {/* Two labelled rows is the right key on a monitor and most of
                  the map on a phone: at 375 the canvas is about 230px tall and
                  the legend was covering all of it. So below `sm` the body is
                  behind a toggle and the chip is what shows.

                  One copy of the markup, not a `sm:hidden` duplicate — the
                  body's own classes decide whether it is shown, and the toggle
                  is the only thing that appears and disappears. `openOnSmall`
                  starts false and is never seeded from the window, so there is
                  no hydration mismatch to get wrong. */}
                  <button
                    type="button"
                    aria-expanded={openOnSmall}
                    onClick={() => setOpenOnSmall((v) => !v)}
                    className="flex w-full items-center justify-between gap-3 text-[10px] font-medium text-muted-foreground transition-colors hover:text-foreground sm:hidden"
                  >
                    Key
                    <span
                      aria-hidden
                      className={cn("transition-transform", openOnSmall && "rotate-90")}
                    >
                      ›
                    </span>
                  </button>
                  <div className={cn(openOnSmall ? "block" : "hidden", "sm:block")}>
                    {/* **A title and two rows of marks. That is the whole card.**

                  It has been wrong in both directions, which is what makes the
                  current shape worth writing down. It was `RUNNING` and
                  `EVIDENCE` beside two strips of marks, with nothing saying the
                  box was a key. Then it was a title, three stacked rows and a
                  sentence each — *Colour, and how it is running* — which said
                  everything and was reported, correctly, as too much text on a
                  map. Then a title and two one-word labels, `Colour` and
                  `Fill`.

                  **The labels are gone too, on request**, and what carries §4's
                  two-axis rule now is the line break: health on one row,
                  evidence on the next, with the title above saying the box is a
                  key. That is thinner than a named mark, and it is the thing to
                  restore first if the two rows ever read as one strip — the
                  labels were a 2.75rem leading column, not a redesign.

                  **The correction chip has gone with them.** It was the third
                  axis, sat at the end of the evidence row for want of anywhere
                  better, and it was the only entry in the key that needed a
                  sentence rather than a word. A reader meeting an ink `Check`
                  chip on a node now has nothing on this card to look it up in;
                  the chip itself carries the word, and the panel says what is
                  wrong.

                  **The title stays**, over a rule bleeding to both card edges —
                  the boxed-`Field` voice, and inside the padding it would read
                  as an underline on the words. */}
                    <p className="-mx-3 border-b border-border px-3 pb-1.5 text-micro font-semibold text-foreground">
                      What the marks mean
                    </p>
                    <div className="mt-2 space-y-2">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {(["critical", "watch", "healthy", "unknown"] as Health[]).map((h) => (
                          <span key={h} className="flex items-center gap-1.5 text-micro">
                            <span
                              className={cn("h-2 w-2 rounded-full", HEALTH_DOT[h])}
                              aria-hidden
                            />
                            {HEALTH_LABEL[h]}
                          </span>
                        ))}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                        {(["full", "partial", "none"] as Completeness[]).map((c) => (
                          <span key={c} className="flex items-center gap-1.5 text-micro">
                            <EvidenceMark completeness={c} />
                            {COMPLETENESS_LABEL[c]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          }
        />
      </div>
    </div>
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
        "text-small transition-colors",
        active
          ? "font-medium text-foreground hover:text-muted-foreground"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { directions } from "@/lib/directions";
import { SwitchScroller, SwitchTrack, switchItemClass } from "./SwitchTrack";

/**
 * Research's two switches, and the row that holds them.
 *
 * Both are on the page now, side by side on one line above the document, each
 * behind its own label. They were on the band — first as one row under the
 * tiles, then split with Full/Brief in the band's top-right corner — and the
 * band's corner has since gone to `RunButton`, which is the only thing on a
 * Research screen that *does* something rather than navigating.
 *
 * Putting them on one row is not just tidiness: both change what the body says
 * and neither changes which surface you are on, so both belong with the body.
 * What keeps them reading as two questions rather than one six-item control is
 * the labels, not the distance between them.
 *
 * Full is the default view. Brief is the thing you switch *to*, minutes before
 * a call — so Full leads the segment and owns the entry points into Research.
 */

function useResearchRoute() {
  const parts = usePathname().split("/").filter(Boolean);
  return {
    slug: parts[1] ?? "money",
    view: parts[2] === "brief" ? ("brief" as const) : ("full" as const),
  };
}

/**
 * The row: both switches side by side on one line, neither of them labelled.
 *
 * **The gap is what makes side by side possible.** Two tracks used to carry
 * `DIRECTION` and `DETAIL` micro-caps saying they were two questions rather
 * than one six-item control; with underline tabs the break in the rule says it
 * instead, which is why the gap between the tracks (28px) has to beat the gap
 * inside one (16px). See `SwitchTrack` for why the labels came off.
 *
 * **The switch scroller is one horizontal scroller**, not two boxes that can
 * wrap. A wrapped second row costs Brief around 28px it does not have, and
 * scrolling costs nothing vertically, which on a screen that may not scroll is
 * the only currency there is. Losing the labels and the rails took the tracks
 * from ~525px to 351px, so at 375 they now fit exactly rather than scrolling —
 * but the scroller stays, because the failure it prevents is a wrap.
 *
 * **`actions` shares this row, on request, and it is what removed the header
 * from Research entirely.** `RunButton` was in `SurfaceHero`'s `actions` slot,
 * which after the surface name and its description came off was a row holding
 * one button and a great deal of ivory. On this row it costs nothing: the
 * tracks are ~350px of a full-width frame, so the button drops into space that
 * was already empty, and Research gains the whole header back.
 *
 * The distinction the old placement was protecting — *work you start* on the
 * chrome, *readings of the body* on the page — does not survive the header
 * going away, because there is no chrome left to put the first one on. What
 * replaces it is position on the row: the tabs at the reading edge, the button
 * at the far end.
 */
export function ResearchSwitches({
  tight = false,
  actions,
}: {
  /**
   * Brief. **It no longer changes the size of anything** — the tabs, their
   * padding and the gaps are one set of values in both views, on request,
   * because this row is the skeleton Full and Brief share and a control that
   * resizes when you press it is the one thing it may not do. All `tight` still
   * decides is whether `RunButton` shows below `roomy`.
   */
  tight?: boolean;
  actions?: ReactNode;
}) {
  return (
    // `items-end`, so the button's baseline lands on the rule the tabs sit on
    // rather than floating above it. It wraps below `sm`, where the tracks need
    // the whole width; the button then takes its own line under them.
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      {/* `w-full` below `sm`, `flex-1` above it — **not `flex-1` alone**, which
          is the trap this repo has now hit five times. `flex: 1 1 0%` with
          `min-w-0` is permission to shrink below the content's own width, so
          beside a `shrink-0` button the tracks collapsed to ~180px at 375 and
          the last tab scrolled out of sight rather than the row wrapping.
          Giving the scroller a hypothetical size the button's line cannot hold
          is what actually forces the wrap. */}
      <SwitchScroller className="w-full sm:flex-1">
        {/* A rule between the two tracks, because with no labels the gap was the
            only thing saying they are two questions and not one six-item bar.
            Space alone had to be large to carry that (28px, against 16px inside
            a track); a divider says it outright, so the gaps come down to 12px a
            side and the row gets 4px narrower rather than wider. On a 351px
            phone that is not nothing.

            `self-stretch` rather than a fixed height: the rule then runs the
            height of the tabs including the pad their underline hangs in, so it
            reads as the boundary between two bars and not as a tick floating
            beside them. */}
        {/* **Detail leads the row now**, on request. It is two words against
            nine, and it is the switch a consultant reaches for most — Brief is
            the thing you move to in the five minutes before a call. At the far
            end it was the last thing on a row that scrolls; at the near end it
            is the first thing the eye and the tab order both reach. */}
        {/* 24px either side of the rule, in both views. It was 16 on Brief,
            which is the same `tight` shrink the tabs themselves carried and it
            went for the same reason: this row is the one thing Full and Brief
            share exactly, and it may not change size when you switch between
            them. */}
        <div className="flex w-max items-stretch gap-6">
          <ViewSwitch />
          <span className="w-px shrink-0 self-stretch bg-border" aria-hidden />
          <DirectionSwitch />
        </div>
      </SwitchScroller>
      {actions && (
        // Hidden below `roomy` on Brief, which is a fixed screen read in a
        // corridor four minutes before a call: re-running the pipeline is not
        // something anybody does there, and the button would take a line of its
        // own out of a screen that has none.
        <div
          className={cn(
            "ml-auto flex shrink-0 items-center gap-2",
            tight && "hidden roomy:flex",
          )}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

/** Which of the four dossiers you are reading. */
function DirectionSwitch() {
  const { slug, view } = useResearchRoute();

  return (
    <SwitchTrack as="nav" label="Direction">
      {directions.map((d) => (
        <Link
          key={d.slug}
          href={`/research/${d.slug}/${view}`}
          aria-current={d.slug === slug ? "page" : undefined}
          className={switchItemClass(d.slug === slug)}
        >
          {d.name}
        </Link>
      ))}
    </SwitchTrack>
  );
}

/** How much of it. */
function ViewSwitch() {
  const { slug, view } = useResearchRoute();

  return (
    <SwitchTrack label="Detail" className="shrink-0">
      {(["full", "brief"] as const).map((m) => (
        <Link
          key={m}
          href={`/research/${slug}/${m}`}
          aria-current={m === view ? "true" : undefined}
          className={cn(switchItemClass(m === view), "capitalize")}
        >
          {m}
        </Link>
      ))}
    </SwitchTrack>
  );
}

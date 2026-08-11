"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The one tab control in the product, and every surface with a setting uses it:
 * Research's Direction and Detail, Questions' Arrange, Operations' View,
 * Compare's Time and Workflow. Gaps left for two dropdowns, on request.
 *
 * **Underline tabs on a rule.** A row of words, a hairline under the whole set,
 * and the active word in ink at 500 with a 2px segment of that rule thickened
 * beneath it. It was a stadium rail with a raised chip for most of its life,
 * went to this shape, went back to the rail for a revision, and came here —
 * the round trip is worth recording, because what made the difference was not
 * the shape. It was the label.
 *
 * **There is no visible label, and that is what makes this work.** Each track
 * used to carry a tracked micro-cap to its left — `ORDER  [Value|Effort|…]`.
 * Beside a rail that reads as an annotation on a box; beside underline tabs it
 * reads as a sixth word in the row that happens not to be pressable. Removing
 * it is what let the rail go.
 *
 * `label` survives as the group's `aria-label`. A control that sets what a list
 * shows still has to say what it sets, and with nothing on screen to point
 * `aria-labelledby` at, naming the group directly is the only way left.
 *
 * **The rule spans the tabs, not the container.** In the reference this is a
 * lone tab bar filling its card, so its rule runs edge to edge. Three of our
 * surfaces put two tracks on one line, and one continuous rule under both would
 * make them one bar with two active tabs in it — which is the confusion the
 * labels used to prevent and there is now nothing else to prevent. So each
 * track's rule is its own width, and the gap between two tracks is what says
 * they are two questions.
 *
 * **Page-toned, always.** `--foreground` on the active label and its segment,
 * `--muted-foreground` on the rest, `--border` on the rule. Nothing here may use
 * `--masthead-*`: those greys are 2.03:1 on ivory. The masthead's own tabs keep
 * their cyan underline and are not this component.
 */

/**
 * One tab. A `<Link>` on Research, a `<button>` everywhere else.
 *
 * `-mb-px` is what makes the active mark sit *on* the rule rather than stacked
 * above it. The row draws a 1px line under every tab; pulling each tab down by
 * one pixel lands its own 2px border over that line, so the active segment
 * reads as a thickening of the rule instead of a second rule a pixel higher.
 * Without it the mark is 3px of stacked borders.
 */
/**
 * **One size, on request, and `tight` no longer changes it.**
 *
 * Brief used to set these at `text-micro` with 6px of side padding below
 * `roomy`, against Full's `text-small` and 8px — so switching Full↔Brief
 * changed the size of the control you switched with, on the one row that is
 * identical between the two views and is the skeleton they are meant to share.
 * At a window under 1024px the two rows were visibly different type, which is
 * the width the product is designed on.
 *
 * The pixels Brief bought with the smaller tabs are about five of vertical, and
 * it has them: `check:ui` clears all four viewports with the row at full size.
 * What it costs instead is horizontal, on a row that already scrolls at 375.
 */
export function switchItemClass(active: boolean) {
  return cn(
    "-mb-px whitespace-nowrap border-b-2 px-2 pb-1.5 text-small transition-colors",
    active
      ? "border-foreground font-medium text-foreground"
      : "border-transparent text-muted-foreground hover:text-foreground",
  );
}

export function SwitchTrack({
  label,
  children,
  as = "div",
  className,
}: {
  /**
   * The track's accessible name. Not rendered — see the note above on the label
   * coming off — so this is the only thing naming the control for a screen
   * reader, and it may not be dropped along with the visible text.
   */
  label: string;
  children: ReactNode;
  /** `nav` when the tabs navigate, `div` (a group) when they set state. */
  as?: "div" | "nav";
  /** Lands on the wrapper, which is what Operations dresses as a raised card. */
  className?: string;
}) {
  const Row = as;

  return (
    // The wrapper survives the label's removal even though it now holds one
    // child, because `className` cannot go on the row itself: Operations
    // dresses this as a `rounded-lg` card, and `cn` is a plain join rather than
    // tailwind-merge, so two conflicting utilities on one element are settled
    // by their order in the stylesheet and not by the order they are written —
    // the same trap `SwitchScroller` documents below for `max-w-full`. Two
    // elements, no collision.
    //
    // `w-max`, because the row inside is `w-max` and would otherwise overflow a
    // wrapper sized to the space available. On Operations, where the wrapper is
    // a card with a border, that put the last tab outside the card's own
    // rounded edge at 375. Sized to its content, the scroller clips card and
    // tab together.
    <div className={cn("flex w-max", className)}>
      <Row
        aria-label={label}
        {...(as === "div" ? { role: "group" as const } : {})}
        className={cn(
          // The rule the whole set sits on. The active tab's own border lands
          // on top of it, which is the difference between a tab bar and a lone
          // mark floating under one word.
          // 16px between tabs inside a track, at every width and in every
          // view. The outer gap between two tracks is the caller's job and has
          // to beat it — see `ResearchSwitches`.
          "flex w-max items-baseline gap-4 border-b border-border",
        )}
      >
        {children}
      </Row>
    </div>
  );
}

/**
 * A track that may be wider than the space it is in.
 *
 * Gaps' Area filter carries four bucket names in full, and Research's row is
 * two tracks against a 351px phone. A wrapped track is not an option: a set of
 * tabs on two rows is a different object, and on Brief a second row costs
 * ~28px of a screen that may not scroll. Scrolling costs nothing vertically,
 * which on that screen is the only currency there is.
 */
export function SwitchScroller({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  // `min-w-0` and not `max-w-full`: a caller needs to be able to cap this — the
  // Operations overlay has to stop short of the zoom cluster — and two
  // max-width utilities on one element are settled by their order in the
  // stylesheet, not by the order they are written in the class attribute. The
  // base rule would silently win.
  return <div className={cn("scroll-slim min-w-0 overflow-x-auto", className)}>{children}</div>;
}

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * What sits between the masthead and a surface's content. On most surfaces
 * that is now nothing you can see.
 *
 * **It was a 213px indigo band with a photograph in it and three tiles on it**,
 * and then a compact header carrying the surface name and a line describing it.
 * Both the name and the line are gone, on request, and the reasoning is the
 * same one that took the tiles: the masthead is two inches above with
 * *Operations* underlined in it, so an `<h1>Operations</h1>` under that is the
 * screen telling you where you are for the second time, and *"How this company
 * runs, in three levels"* is the screen explaining itself, which §7.2 rules
 * out. Between them they cost about 70px at the top of every surface in the
 * product.
 *
 * What is left is the two things that are not restatements:
 *
 * - **`actions`** — what you *do* here. `RunButton` and `NewGapButton`, and
 *   nothing else: a control that rearranges what is already on screen belongs
 *   beside the thing it rearranges.
 * - **`titleNode`** — an opening that is content rather than a label. Money
 *   Brief's ₹9.1 Cr display is the whole point of that direction, and
 *   Stakeholder's person picker is a control that cannot move into the document
 *   without duplicating its state.
 *
 * **`title` survives as an `sr-only` `<h1>` and must keep being passed.** A page
 * with no `h1` is a page a screen reader user cannot orient in, and "the tab
 * says it" is not true for someone who has jumped straight to the main landmark.
 * It costs nothing and it is the only reason the prop is still here.
 *
 * With neither `titleNode` nor `actions` — Operations, Compare, Sources — this
 * renders the heading and no box at all, so the surface's own frame decides the
 * space under the masthead. That is deliberate: an empty header with padding on
 * it is the band coming back in miniature.
 */
export function SurfaceHero({
  title,
  titleNode,
  actions,
  tight = false,
  collapseAtRoomy = false,
}: {
  /** The surface's name. Not drawn — see the note above on why it is still
      required. */
  title?: string;
  /** An opening that is content, not a label. */
  titleNode?: ReactNode;
  actions?: ReactNode;
  /** Research Brief, which is a fixed screen and pays for its own padding. */
  tight?: boolean;
  /**
   * The header has nothing to show from `roomy` and must take no space there.
   *
   * Five of the six Briefs put the direction's opening in `titleNode` wrapped
   * in `roomy:hidden`, because at that size the opening moves into the lead
   * column beside the content. The header went on drawing its padding around
   * the invisible child, so switching Full → Brief pushed the switch row 40px
   * down and the two views of one dossier did not line up. Stakeholder does not
   * pass this: its `titleNode` is the person picker, which is a control and
   * shows at every width.
   */
  collapseAtRoomy?: boolean;
}) {
  const drawn = Boolean(titleNode || actions);

  return (
    <header
      className={cn(
        "surface-frame shrink-0",
        drawn && (tight ? "pb-1 pt-3 roomy:pb-4 roomy:pt-6" : "pb-3 pt-5 sm:pb-4 sm:pt-6"),
        collapseAtRoomy && "roomy:hidden",
      )}
    >
      {title && <h1 className="sr-only">{title}</h1>}
      {drawn && (
        /* The row wraps on a phone, where the opening is wider than what is
           left beside the actions. A wrapped `justify-between` line puts its
           one item at the start, so the actions need `ml-auto` to stay in the
           corner they belong in. */
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-2">
          {titleNode && <div className="min-w-0">{titleNode}</div>}
          {actions && (
            /* **Hidden below `roomy` on a tight header, and that is a real
               decision rather than a way to save pixels.** Brief on a phone is
               a glance: one screen, no scrolling, read in the corridor with
               four minutes to go. Re-running the pipeline is not something
               anybody does there, and beside a wide opening the button wrapped
               to a line of its own — 40px of a screen that has none, spent on a
               control for a moment that is not this one. */
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
      )}
    </header>
  );
}

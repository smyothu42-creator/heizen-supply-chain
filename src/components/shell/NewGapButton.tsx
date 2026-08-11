import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Add a gap the research did not find.
 *
 * Sits beside `RunButton` in the Gaps header's `actions` slot, and is the
 * second thing ever to go in there. It belongs: that slot holds what you *do*
 * on the surface you are on, and on a surface whose whole subject is a list of
 * findings, adding one is the other verb.
 *
 * **This is not the manual editing §5 rules out.** That rule is about not
 * hand-correcting pipeline output, because a hand-edited claim loses its
 * provenance and its audit trail. A gap the consultant heard on the call and
 * the research never saw is a new observation with a person as its source, not
 * a rewrite of one the model produced. When it is wired, it needs to record who
 * added it and when, so the chain in §4 still ends somewhere real.
 *
 * **Secondary, deliberately.** `RunButton` is filled; this is an outline.
 * Re-running is the thing you do far more often, and two filled buttons side by
 * side make you read both before pressing either.
 *
 * It opens `GapPanel`, which is where the honesty lives: the form takes input
 * and its footer says nothing was added. The button carries no "not wired up"
 * note, because it *is* wired up — pressing it does what it says.
 */
export function NewGapButton({
  onClick,
  ref,
  tight = false,
}: {
  onClick: () => void;
  /** So the panel can put focus back here when it closes. React 19 takes `ref`
   *  as an ordinary prop; there is no `forwardRef` in this codebase. */
  ref?: React.Ref<HTMLButtonElement>;
  tight?: boolean;
}) {
  return (
    <Button
      ref={ref}
      type="button"
      variant="outline"
      size={tight ? "sm" : "default"}
      onClick={onClick}
    >
      <Plus className="size-4" />
      Add a gap
    </Button>
  );
}

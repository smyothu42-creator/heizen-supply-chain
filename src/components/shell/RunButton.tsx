import { RerunIcon } from "@/components/meridian/Icons";
import { Button } from "@/components/ui/button";

/**
 * Re-run the pipeline for the surface you are on.
 *
 * It sits in the header's `actions` slot on **Research, Gaps and Questions** —
 * the three surfaces whose whole content is pipeline output. Operations,
 * Compare and Sources do not have it: Sources is where you *add* the input
 * rather than re-read it, and the other two are views onto research run
 * elsewhere.
 *
 * **The label names the surface, not the pipeline.** "Run Gaps" on Gaps rather
 * than one "Run research" everywhere, because from the header you can only see
 * the surface you are on, and a button saying "research" on the Questions
 * screen is ambiguous about whether it regenerates eleven questions or the
 * whole dossier.
 *
 * Like the connectors and the "Run research on this section" buttons in the
 * empty states, it is **designed as real and labelled honestly**: a real
 * control in the real place, wired to nothing, because the prototype reads one
 * static research set.
 *
 * It is a shadcn `Button` in the default fill now rather than a white pill on
 * indigo. The header is the page, so the button is a page control.
 */
/** `tight` is kept on the signature and no longer changes the size. Brief only
 *  shows its actions from `roomy`, which is exactly where it takes Full's
 *  frame — so a smaller button there was the last thing still different
 *  between the two views of one dossier. */
export function RunButton({ label }: { label: string; tight?: boolean }) {
  return (
    <Button type="button" size="default">
      <RerunIcon />
      {label}
    </Button>
  );
}

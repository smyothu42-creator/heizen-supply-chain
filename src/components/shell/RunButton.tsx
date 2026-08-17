"use client";

import { useState } from "react";

import { RerunIcon } from "@/components/meridian/Icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { RunProgress, type RunKind } from "@/components/shell/RunProgress";

/**
 * Re-run the pipeline for the surface you are on.
 *
 * It sits in the header's `actions` slot on **Research, Gaps and Questions** —
 * the three surfaces whose whole content is pipeline output. Operations,
 * Compare and Sources do not have it: Sources is where you *add* the input
 * rather than re-read it, and the other two are views onto research run
 * elsewhere.
 *
 * **The label names the work, not the pipeline**, and it is written per surface
 * rather than as one "Run research" everywhere: from the header you can only
 * see the surface you are on, and a button saying "research" on the Questions
 * screen is ambiguous about whether it regenerates eleven questions or the
 * whole dossier.
 *
 * The three read *Run research*, **Run Gap Analysis** and **Refresh
 * Questions**, on request, and the last two stopped being "Run " plus the tab
 * name for reasons worth keeping:
 *
 * - *Run Gaps* named the tab, and the tab is a noun for a list of findings. You
 *   do not run findings; you run the analysis that produces them, which is also
 *   the phrase a consultant would use out loud.
 * - *Refresh*, not *Run*, on Questions, because that surface always has eleven
 *   questions on it and pressing this replaces them. "Run" suggests starting
 *   something that has not happened; the honest verb for redoing work already
 *   on screen is refresh. Research and Gaps keep *Run* because both can
 *   legitimately be empty.
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
  const [open, setOpen] = useState(false);

  /* The surface is already in the label, so the run does not need a second
     prop that could disagree with it.

     **`Gap`, not `Gaps`.** The Gaps button says *Run Gap Analysis*, singular,
     so the plural test never matched and that surface has been running the
     research script rather than its own. Exactly the failure mode a label-sniff
     invites: it fails silently and shows a plausible run. If a third label ever
     drifts, this is the line to look at. */
  const kind: RunKind = label.includes("Gap")
    ? "gaps"
    : label.includes("Questions")
      ? "questions"
      : "research";

  return (
    /* Radix, for the three things a run has to get right and nothing on screen
       shows: focus goes into the dialog, Escape closes it, and focus comes back
       to this button. `DialogContent` unmounts on close, which is also what
       resets the run — a second press starts from the first step rather than
       from wherever the last one was stopped. */
    <Dialog open={open} onOpenChange={setOpen}>
      <Button type="button" size="default" onClick={() => setOpen(true)}>
        <RerunIcon />
        {label}
      </Button>
      <DialogContent>
        <RunProgress kind={kind} onClose={() => setOpen(false)} />
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useEffect, useId, useState } from "react";
import { cn } from "@/lib/cn";
import { stakeholderById, type Question } from "@/lib/suvarna";
import { CheckIcon, CopyIcon } from "./Icons";
import { Field } from "./GapRow";

/**
 * The clipboard form of one question. The parenthetical matches the chip the row
 * puts on the same question: the data request changes the register of the call,
 * and a line pasted into notes without the marker has dropped the warning.
 *
 * No ask number. A number is an ordering within a list, and the moment one
 * question is on its own in a message it is a stray "7." at the head of a
 * sentence.
 */
function questionText(q: Question): string {
  return `${q.text}${q.askWhen === "data-request" ? " (data request, ask last)" : ""}`;
}

/**
 * Copy one question, and say whether it worked.
 *
 * The argument for it is the one the removed By text tab used to make: a
 * consultant does not read this surface during the call. He reads it before,
 * and then he is in Meet or on a phone with the tool behind something else. A
 * question he has to retype is a question he shortens, and a shortened
 * discovery question is a different question. Per row rather than per script,
 * because what he takes away is the two or three he means to ask.
 *
 * **It is a sibling of the disclosure button, not a child of it.** The whole
 * collapsed row is a `<button>`, and a button inside a button is invalid markup
 * that browsers repair by moving the inner one out of the row. Same reason the
 * edit control on a gap sits outside `GapRow`.
 *
 * **Always visible, not revealed on hover**, for the reason that control also
 * records: a hover-reveal puts it out of reach of every touch device, which is
 * the phone this surface is read on in the minutes before a call.
 *
 * **The cost, so it stays a decision.** Eleven drawn buttons down a page is
 * exactly the weight §7.1 warns about, and the words counter cannot see it —
 * `check:density` counts controls, and these were already controls when they
 * were bare icons. If the list starts reading as a form, the cheap fix is the
 * ghost icon this replaced, not moving it into the expanded detail: a copy
 * control you have to open the row to reach is one nobody uses mid-call.
 */
function CopyQuestion({ question }: { question: Question }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  // A timer that cleans itself up, not a synchronous setState inside an effect.
  useEffect(() => {
    if (state === "idle") return;
    const t = setTimeout(() => setState("idle"), 2400);
    return () => clearTimeout(t);
  }, [state]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(questionText(question));
      setState("copied");
    } catch {
      setState("failed");
    }
  };

  return (
    <div className="flex shrink-0 items-center gap-1.5 pt-0.5">
      {/* The button's own label changes, which a screen reader on a pressed
          button does not reliably re-announce. The live region does. */}
      <span aria-live="polite" className="sr-only">
        {state === "copied"
          ? "Question copied to the clipboard"
          : state === "failed"
            ? "Could not copy. Select the text instead."
            : ""}
      </span>
      {/* The same drawn button as Research's *Related resources* and *Fold
          all*, on request: border, ground, shadow, icon and label at
          `text-micro`. No accent — cyan on this page means somewhere to go, and
          this goes nowhere.

          **Icon and label, not the bare icon it was for a revision.** A
          document icon could be anything until it is named, which is the same
          argument `RelatedResources` records about sitting beside a chevron
          that says its own meaning. It is also what lets the control report its
          own result in words rather than through a swapped glyph and a live
          region nobody sees. */}
      <button
        type="button"
        // The visible word is `display:none` below `sm`, which takes it out of
        // the accessibility tree with it — so the name is stated here and is
        // the same at every width. The result is the live region's job, not
        // the name's.
        aria-label="Copy this question"
        onClick={copy}
        className={cn(
          "flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1.5 text-micro font-medium text-muted-foreground shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground sm:px-2.5",
          // Below `sm` the word is hidden, so colour is the only thing left
          // that can report a failure to a sighted user. It is the caveat hue
          // the product already uses for *Check before you say it*.
          state === "failed" && "text-health-watch",
        )}
      >
        {state === "copied" ? <CheckIcon /> : <CopyIcon />}
        {/* **The word hides below `sm` and the drawn box stays**, the same
            trade the masthead makes with `Ask Helix`. At 375 the labelled
            button is ~95px of a 319px row, and beside a `shrink-0` control
            that comes straight out of the question: the longest of the eleven
            went from five lines to seven. The button is the same *kind* of
            button at every width, which is what was asked for; it is only the
            label that cannot be afforded on a phone. */}
        <span className="hidden sm:inline">
          {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy"}
        </span>
      </button>
    </div>
  );
}

/**
 * A question is an action, not a finding. Future-tense, sequenced, never priced.
 *
 * Shares FindingCard's structure with GapRow and none of its visual register:
 * no money column, and the ask order is a structural element rather than a
 * sort key, because "ask this first, then this" is the part that saves three
 * calls.
 *
 * Collapsed it is the question and who to ask. Everything about why, and what
 * the answers mean, is one interaction away.
 */

export function QuestionRow({
  question,
  last = false,
  showTarget = true,
  boxed = false,
}: {
  question: Question;
  last?: boolean;
  /** False when a heading above already names the person. Repeating
   *  "Rohan Deshpande · Head of Procurement" under a section called
   *  "Rohan Deshpande" is four words of noise on every row. */
  showTarget?: boolean;
  /**
   * The expanded detail as three cards rather than three paragraphs. True on
   * `/questions`, false in the dossier: Research Full is a continuous document
   * and a border between two of its sections is a wall between two halves of
   * one argument. Same distinction `Field`'s own `boxed` prop carries on Gaps.
   */
  boxed?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const target = stakeholderById(question.targetId);
  const id = useId();

  return (
    <li className="relative flex gap-3.5">
      {/* The spine. Order is visible as structure, not inferred from position.
          The mark is the bare number — 1, 2, 3 — and was `1st`, `2nd`, `3rd` for
          most of its life. The ordinal was there to say "ask this first", but
          the spine already says it: eleven numbers running down a rule in one
          direction is an order, and nothing else on the page is numbered for it
          to be confused with. The suffix cost two glyphs on every row and 20px
          of column on a surface whose sentences now run the full width.

          `min-w-6` and `text-center`, so 1 and 11 are the same width and the
          spine below them is one line rather than two that step. */}
      <div className="relative flex w-8 shrink-0 flex-col items-center pt-1.5">
        <span className="z-10 min-w-6 rounded-full border border-border-strong bg-card px-1.5 py-0.5 text-center text-micro font-medium tabular whitespace-nowrap">
          {question.askOrder}
        </span>
        {!last && <span className="absolute bottom-0 top-7 w-px bg-border" aria-hidden />}
      </div>

      <div className="min-w-0 flex-1 pb-4">
        {/* The row and the copy control are two siblings in one flex line, not
            one control with the other nested in it. `-mx-2` is on the wrapper so
            the disclosure button's hover ground still bleeds to the row's edge
            and the copy button sits inside the same optical margin. */}
        <div className="-mx-2 flex items-start gap-1">
          <button
            type="button"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setOpen((v) => !v)}
            className="group flex min-w-0 flex-1 items-baseline gap-3 rounded-md px-2 py-1.5 text-left transition-colors hover:bg-muted"
          >
            <span className="min-w-0 flex-1">
              {/* Full width, on request, and this reverses the cap that went on
                when the surfaces widened. The cost is the one Gaps' detail
                cards already record: at 1440 an uncapped question sets past the
                ~120 characters `.measure` was protecting against. What pays for
                it here is that a question is one sentence and not a paragraph —
                the eye returns to a numbered mark on the spine every two lines
                rather than running down an undifferentiated column. Restoring
                the cap is adding `measure` back to these four spans. */}
              <span className="block text-base leading-snug transition-colors group-hover:text-muted-foreground">
                {question.text}
              </span>
              {/* The one question that is not a discovery question. It changes the
                register of the call, so it needs marking even when it is sitting
                in ask order with the rest. */}
              {question.askWhen === "data-request" && (
                <span className="mt-0.5 inline-block rounded border border-border-strong px-1.5 text-micro text-muted-foreground">
                  Data request · ask last
                </span>
              )}
              {showTarget && (
                <span className="mt-0.5 block truncate text-small text-muted-foreground">
                  {target.name} · {target.role}
                  {!target.met && " · not met"}
                </span>
              )}
            </span>
            <span
              aria-hidden
              className={cn(
                "shrink-0 text-muted-foreground transition-transform",
                open && "rotate-90",
              )}
            >
              ›
            </span>
          </button>

          <CopyQuestion question={question} />
        </div>

        {open && (
          <div id={id} className="mt-2.5 space-y-3">
            {question.gloss && (
              <p className="reading text-small text-muted-foreground">{question.gloss}</p>
            )}

            {/* **Three labelled cards on Questions, three labelled paragraphs
                on Research.** On request, and it is `Field`'s `boxed` prop
                doing exactly the job it was written for on Gaps.

                The argument is the same one Gaps' detail records. Three
                labelled paragraphs on one ground is a wall of small grey text
                with bold run-ins in it, and a consultant two clicks into a
                question is looking for *one* of the three: what a weak answer
                sounds like, so he knows whether to push. Three boxes is a list
                of answers to three questions.

                **`Weak answer` and `Good answer` were run-in `<dt>`s**, bold
                words at the head of a sentence, which is the weakest heading
                the product has: at a glance the row reads as one paragraph with
                two bold phrases in it, and the two answers are exactly the pair
                you want to compare side by side.

                **It is a prop and not the default, because `QuestionRow` is
                rendered on Research too** — inside Call's probe beat and under
                each person on Stakeholder. Research Full is a continuous
                document, where a border between two sections is a wall between
                two halves of one argument, and that is the same distinction
                `Field`'s own prop exists for. Boxed on `/questions`, plain in
                the dossier. */}
            <dl className={cn(boxed ? "space-y-2" : "space-y-3")}>
              <Field label="Why this matters" boxed={boxed}>
                {question.whyItMatters}
              </Field>
              <Field label="Weak answer" boxed={boxed}>
                {question.badAnswer}
              </Field>
              <Field label="Good answer" boxed={boxed}>
                {question.goodAnswer}
              </Field>
            </dl>
          </div>
        )}
      </div>
    </li>
  );
}

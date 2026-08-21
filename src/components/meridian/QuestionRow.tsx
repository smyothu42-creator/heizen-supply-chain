"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";
import { TAG_LABEL, stakeholderById, type Question, type QuestionTag } from "@/lib/suvarna";
import { CheckIcon, CopyIcon, InfoIcon } from "./Icons";
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
const TAG_ORDER = Object.keys(TAG_LABEL) as QuestionTag[];

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


/** Where the box goes: which side of the icon, how far from that edge of the
 *  viewport, and how tall it may be before it scrolls inside itself. */
interface TipBox {
  below: boolean;
  offset: number;
  left: number;
  maxHeight: number;
}

/**
 * The question's detail, on an information icon, in a box that floats.
 *
 * On request, replacing the disclosure that opened three cards under the row.
 * The trade is deliberate: the detail is *reference* rather than *material*.
 * Why the question matters and what a weak answer sounds like are read once
 * while deciding whether to ask it, and having eleven rows able to push each
 * other down the page to say so made the surface change shape under the reader
 * every time he checked one.
 *
 * **Hover is not the only way in, and that is not optional.** A hover-only
 * control does not exist on the phone this surface is read on and cannot be
 * reached by keyboard at all. So: hover opens it, focus opens it, and a click
 * or tap pins it open until something closes it. Escape closes and leaves focus
 * on the icon.
 *
 * **It closes on a delay, not on `mouseleave`.** The box sits below the icon
 * with a gap between them, and a box that vanishes the instant the pointer
 * leaves the icon is one nobody can move into. 120ms is long enough to cross
 * the gap and short enough not to feel stuck.
 */
function InfoTip({ question, id }: { question: Question; id: string }) {
  const [open, setOpen] = useState(false);
  /* Pinned by a click, so it survives the pointer leaving. Touch has no hover
     at all, which makes this the only way in on a phone. */
  const [pinned, setPinned] = useState(false);
  const [box, setBox] = useState<TipBox | null>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const shut = useRef<ReturnType<typeof setTimeout> | null>(null);
  /* Escape has to return focus to the icon, and focus is one of the things that
     opens the box, so without this the box shut and reopened in the same frame
     and Escape appeared to do nothing. Cleared the next time the pointer or the
     focus arrives fresh, so one dismissal never sticks. */
  const dismissed = useRef(false);

  const cancelClose = () => {
    if (shut.current) clearTimeout(shut.current);
    shut.current = null;
  };
  const closeSoon = () => {
    cancelClose();
    shut.current = setTimeout(() => {
      if (!pinned) setOpen(false);
    }, 120);
  };

  /* Measured from the trigger at the moment it opens, not from a layout hook:
     the box is `position: fixed` in a portal, so what it needs is the icon's
     viewport rectangle and nothing else.
     
     **It takes the side with more room and caps its own height to fit**, rather
     than guessing at how tall it will be. The guess was a fixed 260px, and at
     375 the same three answers wrap to 470 — so the box picked "below", ran off
     the bottom of the phone, and the good answer was unreachable. Whichever
     side wins, the box can never be taller than the space it was put in; past
     that it scrolls inside itself. */
  const place = () => {
    const r = btn.current?.getBoundingClientRect();
    if (!r) return;
    const W = 340;
    const GAP = 8;
    const EDGE = 12;
    const below = window.innerHeight - r.bottom >= r.top;
    setBox({
      below,
      offset: below ? r.bottom + GAP : window.innerHeight - r.top + GAP,
      // Right-aligned to the icon, then clamped so it cannot run off either
      // edge. At 375 the clamp is what does all the work.
      left: Math.min(Math.max(EDGE, r.right - W), window.innerWidth - W - EDGE),
      maxHeight: (below ? window.innerHeight - r.bottom : r.top) - GAP - EDGE,
    });
  };

  const show = () => {
    if (dismissed.current) return;
    cancelClose();
    place();
    setOpen(true);
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      dismissed.current = true;
      setOpen(false);
      setPinned(false);
      btn.current?.focus();
    };
    /* Reposition rather than vanish. A tip that disappears the moment the page
       moves under it is the fault `SelectionAsk` already records. */
    const onMove = () => place();
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", onMove, true);
    window.addEventListener("resize", onMove);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", onMove, true);
      window.removeEventListener("resize", onMove);
    };
  }, [open]);

  useEffect(() => () => cancelClose(), []);

  return (
    <>
      <button
        ref={btn}
        type="button"
        /* A toggle in fact as well as in name: pressing it pins the box open,
           which is the whole of how this works without a pointer. */
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-label="Why this question matters"
        onPointerEnter={() => {
          dismissed.current = false;
          show();
        }}
        onPointerLeave={() => {
          dismissed.current = false;
          closeSoon();
        }}
        onFocus={show}
        onBlur={() => {
          dismissed.current = false;
          closeSoon();
        }}
        onClick={() => {
          dismissed.current = false;
          if (pinned) {
            setPinned(false);
            setOpen(false);
          } else {
            setPinned(true);
            show();
          }
        }}
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground",
          open && "border-border-strong text-foreground",
        )}
      >
        <InfoIcon />
      </button>

      {open && box && <QuestionTip question={question} id={id} box={box} onEnter={cancelClose} onLeave={closeSoon} />}
    </>
  );
}

/**
 * The box itself, in a portal on `document.body`.
 *
 * **A portal rather than an absolutely positioned sibling**, because the row
 * sits inside a `Panel` and inside the tree's nested lists, and a floating box
 * that is a descendant of either can be clipped by an ancestor's overflow or
 * captured by a transformed one. Out at the body it is answerable to nothing
 * but the viewport.
 */
function QuestionTip({
  question,
  id,
  box,
  onEnter,
  onLeave,
}: {
  question: Question;
  id: string;
  box: TipBox;
  onEnter: () => void;
  onLeave: () => void;
}) {
  /* No mounted guard, and none is needed: this component only ever renders
     after a pointer or a keypress opened it, so there is no server render of
     it to mismatch. A `useState` + effect pair to discover that would be the
     synchronous setState inside an effect that `pnpm lint` rejects. */
  return createPortal(
    <div
      id={id}
      role="tooltip"
      onPointerEnter={onEnter}
      onPointerLeave={onLeave}
      /* Above the masthead, below every panel. A row near the top of the page
         would otherwise open its tip behind the band; and a tip is never the
         thing that should cover a drawer somebody opened deliberately. See the
         stacking list in `AppShell`. */
      className="scroll-slim fixed z-[35] w-[21.25rem] max-w-[calc(100vw-1.5rem)] overflow-y-auto rounded-lg border border-border-strong bg-card p-3.5 shadow-raised"
      style={{
        [box.below ? "top" : "bottom"]: box.offset,
        left: box.left,
        maxHeight: box.maxHeight,
      }}
    >
      {/* The question again, at the top. The tip can be read while the pointer
          is over an icon two rows from the sentence it belongs to, and a box of
          three answers with no question in it is three answers to nothing. */}
      <p className="text-small font-medium">{question.text}</p>
      {question.gloss && (
        <p className="reading mt-1 text-small text-muted-foreground">{question.gloss}</p>
      )}
      {/* A rule between each block, matching the one under the question above
          them. Three labelled paragraphs on one ground read as a single column
          of grey text with bold words in it, and the two that most need telling
          apart — the weak answer and the good one — are adjacent and similar in
          length. The rule is what makes them three answers to three questions
          rather than one passage.

          **Not `divide-y` with `space-y`, and the reason is a Tailwind v4
          change worth knowing.** Both of those compile to
          `:where(& > :not(:last-child))` with *bottom* edges now, where v3 used
          `& > * + *` with top ones. So the rule landed on the bottom of the
          preceding block with its margin below it: measured, 0px above the rule
          and 20px under it, which reads as a line belonging to the paragraph it
          is touching rather than as a divider between two. Margin-top plus
          border-top plus padding-top on the *following* sibling puts the gap on
          both sides: 10px, rule, 10px.

          It stops at the content width rather than bleeding to the card edge,
          because the rule under the question does too, and two rules of
          different lengths in one small box read as two kinds of divider. */}
      <dl className="mt-2.5 border-t border-border pt-2.5 [&>div+div]:mt-2.5 [&>div+div]:border-t [&>div+div]:border-border [&>div+div]:pt-2.5">
        <Field label="Why this matters">{question.whyItMatters}</Field>
        <Field label="Weak answer">{question.badAnswer}</Field>
        <Field label="Good answer">{question.goodAnswer}</Field>
      </dl>
    </div>,
    document.body,
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
  showTags = false,
  linked = false,
  saveSlot,
  children,
}: {
  question: Question;
  last?: boolean;
  /* `last` no longer hides a rail, because there is no rail. It drops the
     trailing padding instead: the old bottom gap on the final row was measured
     against a line that had to reach the next one, and without it the row just
     pushed the panel open by 16px of nothing. */
  /** False when a heading above already names the person. Repeating
   *  "Rohan Deshpande · Head of Procurement" under a section called
   *  "Rohan Deshpande" is four words of noise on every row. */
  showTarget?: boolean;
  /**
   * The tags this question carries, as chips under it. True on `/questions`,
   * where they are what the Tag filter filters on: a filter whose vocabulary is
   * invisible on the rows is one the reader has to guess at, and a chip that
   * never appears is a label nobody can learn.
   *
   * False in the dossier. Research renders these rows inside a continuous
   * document, where a strip of taxonomy under a sentence is the fault
   * `SourceStrip` records about colouring its chips by kind: sorting questions
   * into families is not a task anybody has while reading the argument.
   */
  showTags?: boolean;
  /**
   * A control that belongs to the surface rather than to the row, rendered in
   * front of the information icon. Questions passes its save button here; the
   * dossier passes nothing.
   *
   * **It is `saveSlot` and must not be called `action`.** React 19 treats
   * `action` as a special prop, and passing an element under that name meant the
   * server rendered the row without it while the client rendered it with — a
   * hydration mismatch whose diff pointed at the save button being where the
   * info button should be. Renaming it fixed it outright.
   *
   * A slot rather than a prop per control, because the row is rendered on two
   * surfaces and only one of them has an ask list. Teaching `QuestionRow` about
   * that list would put a Questions-only concern inside a component Research
   * renders.
   */
  saveSlot?: ReactNode;
  /**
   * True on a follow-up, false on the question that opens a thread.
   *
   * It draws the elbow into this row from the one above it. A root has nothing
   * to be joined to, and drawing one anyway would leave a hairline hooking out
   * of the panel's own padding.
   */
  linked?: boolean;
  /**
   * The follow-ups, rendered inside this row's content column so the tree
   * indents itself off the spine that is already there.
   *
   * A nested `<ol>` inside the parent's `<li>` is what the markup is for, and
   * it is what makes the branch survive with no styling at all: a screen reader
   * announces a list inside a list item, which is exactly the relationship.
   */
  children?: ReactNode;
}) {
  const target = stakeholderById(question.targetId);
  const id = useId();

  return (
    <li className={cn("relative", linked && "thread-link")}>
      <div className={cn("min-w-0", last ? "pb-0" : "pb-2")}>
        {/* **The condition strip is gone**, on request. It was a headed row at
            the top of every card carrying the tier word on an opener and
            "If he says suppliers…" on everything below one.

            It had been outside the card and was moved in; removing it outright
            is the third position and the settled one. The thread already says
            what it was saying: the elbow draws which question follows which,
            and a card that opens with a condition rather than with the question
            makes the reader parse a clause before reaching the sentence he came
            for. `askIf` is untouched in the data, so restoring the strip is one
            block here and one prop at the two call sites. */}
        {/* **The question is a card**, and it is the card the rest of the
            product draws: `rounded-lg border border-border bg-card shadow-card`,
            the same object as a gap in the plan panel and a boxed `Field`.
            White on white with a border rather than a tint, for the reason the
            plan panel records: on a panel that is already `bg-card` there is no
            tint left to shift to, so what defines the block is its edge.

            It replaces flat rows on request. What it buys is that a question is
            now a *thing* rather than a line of type: at three tiers the indent
            alone was carrying the whole hierarchy, and a stack of edges makes
            each level legible without another rule or another ring.

            Hover deepens the border rather than filling the box, so nothing
            inside moves a pixel. */}
        {/* **The controls drop below the question at phone width.** Two
            `shrink-0` buttons beside the text is about 80px of a 280px card
            once the tree has indented it twice, which left the question 150px
            and four lines deep. Stacked, the sentence gets the whole card and
            the buttons take a line that was going to be white space anyway. */}
        <div className="rounded-lg border border-border bg-card shadow-card transition-colors hover:border-border-strong">
          <div className="flex flex-col gap-1 px-3.5 py-2.5 sm:flex-row sm:items-start">
            <div className="flex min-w-0 flex-1 items-baseline gap-3 py-0.5">
              <span className="min-w-0 flex-1">
                {/* Full width, on request, and this reverses the cap that went on
                  when the surfaces widened. The cost is the one Gaps' detail
                  cards already record: at 1440 an uncapped question sets past the
                  ~120 characters `.measure` was protecting against. What pays for
                  it here is that a question is one sentence and not a paragraph —
                  the eye returns to a numbered mark on the spine every two lines
                  rather than running down an undifferentiated column. Restoring
                  the cap is adding `measure` back to these four spans. */}
                {/* **No ask number**, on request. It was a ringed badge on a
                    rail, then a numeral in a gutter, then a numeral inside the
                    card, and each move made it quieter without making it earn
                    its place: the thread already runs top to bottom, the elbow
                    says which question follows which, and the condition line
                    says what sends you there. A count from 1 to 23 running
                    across six panels was answering a question nobody had.

                    `askOrder` is untouched and still sorts every list in the
                    product; this only stops drawing it. */}
                <span className="block text-base leading-snug">{question.text}</span>
                {/* The marker and the tags share one line. They were two blocks,
                    so the one question with both rendered a boxed chip on its own
                    line and a stray "Master data" under it, which read as a
                    wrapping fault rather than as two kinds of label. */}
                {(question.askWhen === "data-request" ||
                  (showTags && question.tags.length > 0)) && (
                  <span className="mt-1 flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                    {/* The one question that is not a discovery question. It
                        changes the register of the call, so it keeps its box even
                        now that the tags have lost theirs: it is a warning rather
                        than a label. */}
                    {question.askWhen === "data-request" && (
                      <span className="rounded border border-border-strong px-1.5 text-micro text-muted-foreground">
                        Data request · ask last
                      </span>
                    )}
                    {/* **Words, not boxes.** Two or three outlined chips under
                        every question is six or nine rectangles down a thread, and
                        they competed with the one box on the row that has to be
                        seen. A middot list at micro size is still the filter's
                        vocabulary, verbatim, and costs no ink.

                        Registry order, not the order they happen to be written on
                        the question: two rows carrying the same pair in opposite
                        orders read as two different pairs at a glance. */}
                    {showTags && question.tags.length > 0 && (
                      <span className="text-micro text-muted-foreground">
                        {TAG_ORDER.filter(
                          (t) =>
                            question.tags.includes(t) &&
                            !(t === "data-request" && question.askWhen === "data-request"),
                        )
                          .map((t) => TAG_LABEL[t])
                          .join(" · ")}
                      </span>
                    )}
                  </span>
                )}
                {showTarget && (
                  <span className="mt-0.5 block truncate text-small text-muted-foreground">
                    {target.name} · {target.role}
                    {!target.met && " · not met"}
                  </span>
                )}
              </span>
            </div>

            {/* Two controls at the tail, in the order they are reached for: read
                about it, then take it away. */}
            {/* In the order they are reached for: decide whether to ask it, read
                why it matters, then take it away. */}
            <div className="flex shrink-0 items-center gap-1.5 self-end sm:self-auto">
              {saveSlot}
              <InfoTip question={question} id={id} />
              <CopyQuestion question={question} />
            </div>
          </div>
        </div>

        {children}
      </div>
    </li>
  );
}

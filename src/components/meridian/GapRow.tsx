"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import {
  gapById,
  metricById,
  overlapGroupFor,
  stakeholderById,
  type Gap,
} from "@/lib/suvarna";
import { EvidenceChain } from "./Evidence";
import { ConfidenceChip, EffortChip, TIER_LABEL } from "./Confidence";
import { MetricLine } from "./MetricDelta";
import { usePanel } from "./EvidencePanel";
import { ValuationBridge } from "./ValuationBridge";

/**
 * A gap is a finding: past-tense, evidenced, priced.
 *
 * Collapsed, it is one line — rank, what it is, what it costs. Twelve gaps
 * should read as twelve lines, not seventy. Everything else lives behind a
 * single expander, because four controls per row across a twelve-row list is
 * forty-eight things to ignore before you have read anything.
 *
 * The collapsed row is four things: rank, effort, the finding, the price —
 * plus a one-off cash figure on the two gaps that have one, because ₹1.6 Cr a
 * year hiding ₹18 Cr off the balance sheet is a different sentence from ₹1.6
 * Cr a year and it changes what gets said out loud.
 *
 * **The tier mark and the weeks-to-deliver used to sit between the finding and
 * the price, and are gone from every surface**, Gaps included. They were a
 * second and third subject sharing the money column, and twelve rows of shape
 * plus estimate is a lot of ignoring to do before the list can be read. Both
 * are in the expanded detail's meta line, one click away.
 *
 * **The known cost, so it is a decision and not a regression:** Gaps' Order
 * track still offers *How sure*, and the row no longer shows the tier it is
 * being sorted by. The order is real and the shapes are one click down, but
 * nothing on the collapsed list says which end is which. If that turns out to
 * matter, the cheap fix is to bring `TierMark` back **only while that ordering
 * is active** — a sort key visible because it is the sort key, rather than a
 * mark on every row for the eleven-twelfths of the time nobody is sorting by
 * it.
 *
 * **All of that describes `mode="value"`, which is what Research renders.**
 * Gaps passes `mode="delivery"`, where there is no money on the surface at all:
 * the row is rank, finding, effort chip, chevron, and the detail trades the
 * valuation bridge for what we think is happening, what is still unknown and
 * what to do next. See the `mode` prop.
 *
 * Expands in place: a consultant scanning ten gaps must not lose their place
 * to check one. See data-display-patterns.
 */
export function GapRow({
  gap,
  showRank = true,
  mode = "value",
  className,
  as: As = "li",
}: {
  gap: Gap;
  showRank?: boolean;
  /**
   * What the row is a row *about*.
   *
   * `"value"` is the original and is what Research renders: the finding and
   * what it is worth. `"delivery"` is Gaps, where money has come off the
   * surface entirely — the price and the cash-release qualifier go, the effort
   * chip moves from the front of the row to the far end where the price was,
   * and the detail carries the four sections a delivery conversation needs
   * instead of the valuation bridge.
   *
   * It is one prop and not three because the three changes are one decision.
   * Splitting them into `showMoney`, `chipPosition` and `showNextSteps` would
   * make it possible to build the half-states, and none of the half-states are
   * a screen anybody wants.
   */
  mode?: "value" | "delivery";
  className?: string;
  /** "div" when the caller already provides the list item, e.g. a plan tick-box. */
  as?: "li" | "div";
}) {
  const [open, setOpen] = useState(false);
  const { open: openPanel } = usePanel();
  const id = useId();
  const overlap = overlapGroupFor(gap.id);
  const delivery = mode === "delivery";
  const oneOff = delivery ? undefined : gap.valuation?.oneOffCr;

  return (
    <As className={cn("min-w-0", className)}>
      {/* A row that expands has to look like it can be pressed. Twelve of these
          stacked under hairlines read as a printed table, so the row takes a
          hover surface and bleeds 8px past the text column to sit under the
          cursor rather than beside it. */}
      {/* **In delivery mode the row opens the side panel; it does not expand.**
          On request. Twelve rows that each unfold five cards in place meant the
          list moved under you every time you looked at one, and the plan panel
          beside it — the thing you are actually filling in — got pushed down the
          page by a detail you were only checking. The panel is the one place in
          this product for examining a thing in depth, and it leaves the list
          exactly where it was. Research keeps the inline fold: there the row
          sits inside a document you are reading top to bottom, and opening a
          drawer over it is the interruption. */}
      <button
        type="button"
        aria-expanded={delivery ? undefined : open}
        aria-controls={delivery ? undefined : id}
        onClick={() => (delivery ? openPanel({ kind: "gap", id: gap.id }) : setOpen((v) => !v))}
        className={cn(
          "group -mx-2 flex w-full items-baseline gap-x-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted",
          /* Delivery mode wraps and value mode does not. Value mode does its
             wrapping inside the title span, which is a different arrangement
             and would fight this one; see the note on it below. */
          /* Taller rows on Gaps only. Research Brief is a fixed screen that
             may not scroll, and it renders these same rows. */
          delivery && "flex-wrap gap-y-1.5 py-4",
        )}
      >
        {showRank && (
          <span className="tabular w-5 shrink-0 text-small text-muted-foreground">{gap.rank}</span>
        )}

        {/* Effort leads the row, in front of the finding it qualifies.
            What a fix costs to deliver is what decides whether the gap is the
            one you open with, so it is read first rather than found at the far
            end of the row among the qualifiers on the price.

            Confidence used to be here and is now in the expanded detail, where
            it has room for its reason. That is what freed the chip to carry a
            hue: two three-word scales on one row could not both be coloured
            without reading as one axis.

            **Below `sm` the chip takes its own line and the title takes the
            next.** `w-full`, not `flex-1`, and that is the whole fix for a real
            regression: `flex-1` is `flex: 1 1 0%`, so with `min-w-0` beside it
            the title would shrink to nothing rather than wrap, and at 375 the
            row rendered one word per line straight through the price beside
            it. `flex-wrap` alone cannot help a child that has agreed to be
            zero wide. `w-full` gives it a hypothetical size the chip's line
            cannot hold, which is what actually forces the wrap; `sm:w-auto
            sm:flex-1` puts it back on one line from `sm` up.

            `check:ui` is blind to this — two boxes overlapping is not a
            clipped element, an unreachable control or a contrast failure. It
            is the same blind spot as the project switcher running over the
            first surface tab, and it was found the same way: by looking at the
            375 screenshot. */}
        {/* In delivery mode the chip is at the other end of the row, so the
            title is a plain flex child again and the wrap problem below does
            not arise: there is nothing to its left it can be squeezed by. */}
        {delivery ? (
          <span className="order-1 min-w-0 flex-1 text-base leading-snug transition-colors group-hover:text-muted-foreground">
            {gap.title}
          </span>
        ) : (
          <span className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-2.5 gap-y-1">
            <EffortChip level={gap.effort} />
            <span className="w-full min-w-0 text-base leading-snug transition-colors group-hover:text-muted-foreground sm:w-auto sm:flex-1">
              {gap.title}
            </span>
          </span>
        )}

        {/* One thing survives between the finding and the price: the cash
            release, where there is one.

            **It is the only qualifier left on the row, and it earns that.**
            ₹1.6 Cr a year hiding ₹18 Cr off the balance sheet is a different
            sentence from ₹1.6 Cr a year, and it changes what a consultant says
            out loud, so it cannot be one click away on any surface. It is also
            money, which is what this column is for — the tier shape and the
            weeks were a second and third subject sharing one lane.

            The tier and the weeks are both in the expanded detail's meta line.
            See the note on the row above for what that costs Gaps' *How sure*
            ordering. */}
        {oneOff != null && (
          <span className="tabular hidden shrink-0 text-small font-medium sm:block">
            +{money(oneOff)} once
          </span>
        )}

        {/* "Not priced", not a dash. §6a: a "—" used as a no-value marker says
            nothing about which of the several reasons a cell is empty for, and
            it was the one place in this row still using one. It reads at the
            same width the sr-only text was already saying. */}
        {delivery ? (
          /* The effort chip takes the price's place, at the end of the row in
             front of the chevron. On a surface with no money on it, what a fix
             costs to deliver is the only thing left that a consultant sorts
             on, and the end of the row is where the sortable quantity has
             always been. `self-center` because the chip is a box among
             baseline-aligned text.

             The slot is a fixed width from `sm` so the chips line up on their
             left edge as well as their right. Three labels of three different
             widths, right-aligned down twelve rows, is a ragged column that
             reads as an accident; the price it replaced was `tabular` and had
             the same problem solved for it by the font.

             **Below `sm` the chip drops to its own line under the title**, and
             the ordering is what does it rather than a second copy of the chip
             in the markup. `w-full` breaks the line; `order-3` puts it after
             the chevron so the chevron stays up on the title's line where a
             disclosure mark belongs. Sharing the line instead costs the title
             104px of a 319px row, which rendered these five lines deep. */
          <span className="order-3 flex w-full shrink-0 self-center sm:order-2 sm:w-[7.5rem]">
            <EffortChip level={gap.effort} />
          </span>
        ) : (
          <span
            className={cn(
              "shrink-0 font-medium",
              gap.amountCr == null
                ? "text-small text-muted-foreground"
                : "tabular text-base tracking-tight",
            )}
          >
            {gap.amountCr == null ? "Not priced" : money(gap.amountCr)}
          </span>
        )}

        <span
          aria-hidden
          className={cn(
            "shrink-0 text-muted-foreground transition-transform",
            delivery && "order-2 sm:order-3",
            !delivery && open && "rotate-90",
          )}
        >
          ›
        </span>
      </button>

      {open && !delivery && (
        /* **The detail runs the full width of the row in delivery mode**, on
           request: no `.measure` inside the cards and no left indent. The
           indent had nothing left to align to once the rank number came off
           this surface, so it was 32px of hanging space under a title that
           starts at the edge.

           The cost is the one `.prose-full` records on Research, and it lands
           harder here: a released paragraph in this column sets at about 150
           characters at 1440, against the 77 the cap allowed. `.reading` stays
           on every paragraph, which is what pays for it. Cards are what make it
           survivable at all — the eye returns to a labelled edge every three
           lines instead of running down one undifferentiated column. */
        <div className={cn("pt-1 pb-5", delivery ? "pl-0" : "pl-0 sm:pl-8")}>
          {/* The hypothesis leads in delivery mode and replaces the plain line
              rather than sitting above it. Both are the finding restated in
              ordinary words; the difference is that this one says *why it
              happens*, which is the question a consultant gets asked and the
              one a list of symptoms cannot answer. The plain line is still on
              Research and in the evidence panel. */}
          {!delivery && <p className="reading text-small measure">{gap.plainLine}</p>}

          {!delivery && gap.valuation && gap.amountCr != null && (
            <ValuationBridge
              valuation={gap.valuation}
              amountCr={gap.amountCr}
              className="mt-3"
            />
          )}

          {/* **Every section is a card in delivery mode**, the shape Call's
              beats already use: a micro-cap label, a hairline box, nothing
              else. Five labelled paragraphs stacked on one ground is a wall of
              small grey text with headings in it; five boxes is a list of
              answers to five questions, and the consultant reading this is
              looking for one of them rather than reading all five.

              Research keeps the plain fields. It is a document being read top
              to bottom, and a card there would be a wall between two halves of
              one argument. Same distinction the theme note draws about
              `Panel`. */}
          <dl className={cn("mt-4", delivery ? "space-y-3" : "space-y-3.5")}>
            {delivery && (
              <Field label="What we think is happening" boxed emphasis>
                {gap.hypothesis}
              </Field>
            )}
            {/* The row no longer carries confidence, so this is the only place
                it is stated. **In delivery mode the chip is up in the header
                beside the label**, on request, and the reason stays in the body
                as a plain muted line. That is the better split: the level is a
                property of the card, and reading it before the paragraph tells
                you how much weight to put on what follows rather than
                qualifying it afterwards. It also retires the wrap trap the
                chip and the reason used to share on one line. */}
            <Field
              label="Why we believe it"
              boxed={delivery}
              right={delivery ? <ConfidenceChip level={gap.confidence} /> : undefined}
            >
              {gap.why}
              {delivery ? (
                <span className="mt-2 block text-muted-foreground">{gap.confidenceReason}</span>
              ) : (
                <span className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <ConfidenceChip level={gap.confidence} />
                  {/* `w-full` below `sm`. `flex-1` is `flex: 1 1 0%`, so beside
                      a `shrink-0` chip the reason agrees to be zero wide and
                      renders one word per line rather than wrapping to its own
                      line. Same fix as the row title. */}
                  <span className="w-full min-w-0 text-muted-foreground sm:w-auto sm:flex-1">
                    {gap.confidenceReason}
                  </span>
                </span>
              )}
            </Field>
            <Field label="Expected impact" boxed={delivery}>
              {gap.impact}
            </Field>
            {gap.unpricedReason && !delivery && (
              <Field label="Why it has no number">{gap.unpricedReason}</Field>
            )}

            {/* Two lists, and they are the reason this mode exists. §7.14 says
                to state what has not been looked at, and it applies to a
                finding as much as to a total: a gap with no open question is
                either finished or overclaimed. The next steps are written as
                instructions because they are read as one.

                **Still unknown is the dashed one.** The product already codes a
                caveat that way — "Do not sell this alone" below, Certainty's
                "Check before you say it", Call's "Hold back" — and this is the
                same register: everything else in the stack is something we are
                telling you, and this is the part we cannot. */}
            {delivery && (
              <>
                <Field label="Still unknown" boxed tone="watch">
                  <Points items={gap.stillUnknown} />
                </Field>
                <Field label="Next steps" boxed>
                  <Points items={gap.nextSteps} />
                </Field>
              </>
            )}
          </dl>

          {/* **The prerequisite callout is off the delivery detail**, because
              the plan panel beside it is the thing that acts on prerequisites:
              it orders the waves by them, refuses a move that breaks one, and
              names any that have not been ticked with a link to add them. A
              second statement of the same fact inside a row that has to be
              opened first is the weaker of the two, and the overlap half of it
              was a rupee reconciliation on a surface with no money on it. */}
          {!delivery && (gap.requires.length > 0 || overlap) && (
            <div className="reading mt-4 space-y-1.5 rounded-md border border-dashed border-border-strong px-4 py-3 text-small measure">
              {gap.requires.length > 0 && (
                <p>
                  <span className="font-medium">Do not sell this alone. </span>
                  It needs{" "}
                  {gap.requires.map((r, i) => (
                    <span key={r}>
                      {i > 0 && (i === gap.requires.length - 1 ? " and " : ", ")}
                      <span className="font-medium">&ldquo;{gapById(r).title}&rdquo;</span>
                    </span>
                  ))}{" "}
                  first, or the saving does not arrive.
                </p>
              )}
              {overlap && (
                <p className="text-muted-foreground">
                  <span className="font-medium text-foreground">
                    Shares a root cause with {overlap.gapIds.length - 1} other
                    {overlap.gapIds.length - 1 === 1 ? "" : "s"}.{" "}
                  </span>
                  {overlap.why}
                </p>
              )}
            </div>
          )}

          {/* Benchmarks are off the delivery detail. They are the persuasion
              mechanic (§4) and they belong where the argument is being made,
              which is Operations and Research. Under a stack of cards about
              what to do next they were a fifth kind of block in one panel. */}
          {!delivery && gap.metricIds.length > 0 && (
            <div className="mt-4 divide-y divide-border border-y border-border">
              {gap.metricIds.map((mid) => (
                <MetricLine key={mid} metric={metricById(mid)} />
              ))}
            </div>
          )}

          {/* In delivery mode this is one line of sources under a label, on the
              same row where there is space for it. The label and the count stay
              — a strip of links with nothing naming it is a row of unexplained
              pills, which is the mistake `SourceStrip` already documents. */}
          <div className={cn("mt-4", delivery && "flex flex-wrap items-baseline gap-x-4 gap-y-1")}>
            <p className="shrink-0 text-micro font-medium text-muted-foreground">
              Evidence · {gap.evidence.length}
            </p>
            <div className={cn(delivery ? "min-w-0 flex-1" : "mt-1.5")}>
              <EvidenceChain evidence={gap.evidence} compact={delivery} />
            </div>
          </div>

          {/* **The meta line is gone from the delivery detail and the button is
              not.** Everything the line said is stated somewhere a consultant
              on this surface is already looking: the weeks are in the plan, the
              owner is on Stakeholder, the SCOR path is Operations' whole
              subject. *Open in panel* is the exception, because it is not a
              statement, it is the route out to the full evidence chain, and
              §7.4 does not have an exception for a tidy surface. Alone in the
              row it goes to the right, where a next step belongs. */}
          <div
            className={cn(
              "mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-micro text-muted-foreground",
              delivery && "justify-end",
            )}
          >
            {/* The weeks live here as well as on the row, so the Research
                surfaces that hide the row's copy still have them one click
                away. `TIER_LABEL` too — on Research the shape has gone with
                them and the tier would otherwise be stated nowhere on the
                object itself. */}
            {!delivery && (
              <span>
                {gap.weeks} weeks to deliver · {TIER_LABEL[gap.tier]} · sits with{" "}
                {stakeholderById(gap.ownerId).name} · {gap.scor} → {gap.level1} →{" "}
                {gap.level2}
              </span>
            )}
            <button
              type="button"
              onClick={() => openPanel({ kind: "gap", id: gap.id })}
              className="text-evidence transition-colors hover:text-foreground"
            >
              Open in panel
            </button>
          </div>
        </div>
      )}
    </As>
  );
}

/**
 * A short list under a field label.
 *
 * The marker is a dot rather than the dash the reference used. §6a takes the
 * dashes out of the product's prose, and a row of them running down the left of
 * two lists is the most visible dash on the page — it would read as the house
 * style reasserting itself two clicks below the rule that removed it.
 *
 * `mt-[0.5em]` rather than a fixed pixel, so the dot stays on the first line's
 * optical centre if the type scale moves.
 */
function Points({ items }: { items: string[] }) {
  return (
    <ul className="mt-0.5 space-y-1.5">
      {items.map((item) => (
        <li key={item} className="flex gap-2.5">
          <span
            className="mt-[0.5em] h-1 w-1 shrink-0 rounded-full bg-border-strong"
            aria-hidden
          />
          <span className="min-w-0 flex-1">{item}</span>
        </li>
      ))}
    </ul>
  );
}

/**
 * One labelled section of the detail, plain on Research and boxed on Gaps.
 *
 * `boxed` is one prop rather than a separate component because the two are the
 * same content in the same order — only the ground under it changes, and a
 * second component would be the place the two quietly drift apart.
 */
export function Field({
  label,
  children,
  boxed = false,
  /** The caveat register: dashed, transparent, amber label. */
  tone = "default",
  /** The lead paragraph of the stack, a size up from the rest. */
  emphasis = false,
  /** Sits at the far end of the header row. The confidence chip, and nothing else. */
  right,
}: {
  label: string;
  children: React.ReactNode;
  boxed?: boolean;
  tone?: "default" | "watch";
  emphasis?: boolean;
  right?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        boxed && "rounded-lg px-4 py-3",
        boxed &&
          (tone === "watch"
            ? "border border-dashed border-border-strong"
            : "border border-border bg-card shadow-card"),
      )}
    >
      {/* **Boxed labels are ink at 600 over a rule, not grey text.** Five cards
          whose only heading was an 11px grey micro-cap had no hierarchy inside
          them: the label read as a caption on the paragraph rather than as the
          question the paragraph answers, and five identical captions down a
          stack tell you nothing about which card to read first.

          Ink at 600 is the voice the section headings already use, so this is
          the existing landmark weight rather than a new one. The rule is what
          makes it a header rather than a bolder caption, and it has to bleed to
          both edges — inside the padding it reads as an underline on the words,
          which is the exact trap the navigator's heading documents.

          Research keeps the grey caption. Its fields are paragraphs in a
          document, not cards, and there is nothing there for a header to be the
          head of. */}
      <dt
        className={cn(
          "text-micro font-medium ",
          /* Boxed labels are sentence case, on request: at 14px over a rule the
             tracked caps read as a system label rather than as the question the
             card answers. Research's unboxed captions keep the micro-cap — they
             are captions on a paragraph, which is what that treatment is for. */
          boxed && "-mx-4 border-b px-4 pb-2 text-small font-semibold normal-case tracking-normal",
          /* The header rule matches the box it is in. A solid line across a
             dashed card is the one place the caveat register slips. */
          boxed && (tone === "watch" ? "border-dashed border-border-strong" : "border-border"),
          tone === "watch"
            ? "text-health-watch"
            : boxed
              ? "text-foreground"
              : "text-muted-foreground",
        )}
      >
        {/* The header is a row so a field can put something on the right of its
            own label. Only *Why we believe it* does, with its confidence chip:
            how sure we are is a property of the whole card rather than a note
            at the end of it, and in the header it is read before the paragraph
            it qualifies rather than after.

            **There is no mark before the label.** A cyan dot sat here for a
            revision, on the lead card, and came off on request. The lead is
            still marked, by its body being a size up, which was always doing
            most of the work. */}
        {right ? (
          <span className="flex items-center justify-between gap-3">
            <span className="min-w-0">{label}</span>
            {/* The header was uppercase and tracked out. A chip inheriting that
                renders "MEDIUM CONFIDENCE" at 0.12em, which is a second
                heading rather than a chip. */}
            <span className="shrink-0 normal-case tracking-normal">{right}</span>
          </span>
        ) : (
          label
        )}
      </dt>
      <dd
        className={cn(
          "reading",
          boxed ? "mt-2.5" : "mt-1.5",
          emphasis ? "text-base leading-relaxed" : "text-small",
          /* Boxed fields run the card. The cap is what Research still wants. */
          !boxed && "measure",
        )}
      >
        {children}
      </dd>
    </div>
  );
}

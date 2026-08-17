"use client";

import { useEffect, useRef, useState } from "react";
import { CloseIcon } from "@/components/meridian/Icons";
import { ConfidenceChip } from "@/components/meridian/Confidence";
import { buckets, sourceById, sources, type Gap } from "@/lib/suvarna";
import { UNIT_LABEL, type DurationUnit } from "@/lib/plan";
import { useToast } from "./Toast";

/**
 * A gap, in a form: the one the research missed, and the one it got wrong.
 *
 * A right-hand drawer, opened from *Add a gap* on the band or from the edit
 * control on a row. It is the same shape as `EvidencePanel` on purpose: this
 * product has one place where a thing is examined in depth, and a second drawer
 * with different manners would be a second product.
 *
 * **One component and one prop, not two panels.** `gap` present is an edit and
 * absent is an addition; everything else about the two is the same fields in
 * the same order, and a `NewGapPanel` beside an `EditGapPanel` is where the two
 * would quietly drift apart. Same argument `Field`'s `boxed` prop makes in
 * `GapRow`.
 *
 * **§5 says users never hand-edit AI output, and this is the edge of that
 * rule.** The rule exists because a hand-corrected claim loses its provenance:
 * the chain in §4 runs source → claim → gap → impact, and a consultant who can
 * retype the claim can break it silently. So the split here is not "add is fine
 * and edit is not". It is **what you observed against what the evidence says**:
 *
 * - Editable: the finding, the plain line, the hypothesis, the area, the
 *   effort, how long it takes, who it sits with, the expected impact, what is
 *   still unknown and what to do next. Every one of those is a judgement the
 *   consultant is better placed to make after a call than the pipeline was
 *   before one.
 * - **Read-only: why we believe it, how sure we are, and the evidence.** Those
 *   are the chain. They change when a source changes, not when an opinion does,
 *   and the panel says so rather than leaving the absence to be noticed.
 *
 * If a consultant needs to correct the *reasoning*, that is the correction
 * prompt §5 describes, and it belongs to the assistant rather than to a
 * textarea here.
 *
 * **The fields are the ones a gap cannot exist without**, and no more. There is
 * no price field: a number typed into a box has no base, no rate and no range,
 * which is the whole of §7.11, and there is no money on this surface anyway.
 * *Still unknown* and *Next steps* are here because `check:data` fails the build
 * on a gap that has neither, so a form that could not fill them was a form that
 * produced an invalid gap.
 *
 * Designed as real and labelled honestly: the form takes input, and the footer
 * says there is nothing behind it.
 *
 * **The parent mounts and unmounts it rather than passing `open`.** A half-typed
 * gap has to be gone when the drawer is reopened, and resetting that state on an
 * `open` prop is a `setState` inside an effect, which `pnpm lint` rejects for
 * the reason the assistant's width store already documents. Unmounting is the
 * version of "reset the form" that needs no code at all. **Editing needs the
 * same trick keyed one level finer** — the caller passes `key={gap.id}`, or
 * moving from one row's edit straight to another's would keep the first row's
 * text in the boxes.
 */
export function GapPanel({ gap, onClose }: { gap?: Gap; onClose: () => void }) {
  const panel = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLTextAreaElement>(null);
  const editing = gap != null;
  const [title, setTitle] = useState(gap?.title ?? "");
  const { notify } = useToast();

  useEffect(() => {
    first.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <>
      {/* The scrim is full-width here, not `lg:hidden` like the evidence
          panel's. That one is a reading surface you keep open beside the page;
          this is a form you finish and close, and a form the page can still be
          clicked behind is one you fill in twice. */}
      <button
        type="button"
        aria-label={editing ? "Close without saving" : "Close without adding"}
        onClick={onClose}
        className="fixed inset-0 z-[54] bg-foreground/20"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={editing ? `Edit “${gap.title}”` : "Add a gap"}
        className="fixed inset-y-0 right-0 z-[56] flex w-full max-w-[420px] flex-col border-l border-border bg-card shadow-xl outline-none"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          <span className="text-micro font-medium text-muted-foreground">
            {editing ? "Edit a gap" : "Add a gap"}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <CloseIcon />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            /* The confirmation lands in the corner with every other one rather
               than under the button, which on a drawer this tall is below the
               fold as often as not. */
            notify(editing ? "Changes saved" : "Gap added", {
              detail: `Nothing was ${editing ? "changed" : "added"}. This is not wired up: the prototype reads one static research set.`,
            });
            onClose();
          }}
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {/* **The finding is the record's name, and it is typeset as one.**
                It sat at the same 13px in the same hairline box as the ten
                fields under it, so the one line that says which gap you are
                editing read as the first of a list rather than as its subject.

                It takes `text-base` at 500 — **the size and weight the row it
                was opened from uses for the same string**, so the title does
                not change register on the way into the drawer. The border steps
                up to `--border-strong` and the padding by a step, which is what
                does the defining at rest: on open this field has the focus ring
                and looks primary for that reason alone, and the moment focus
                moves anywhere else it went back to looking like everything
                else.

                **It is a textarea because the bigger type does not fit on one
                line, and that was measured rather than assumed.** At `text-base`
                the longest of the twelve findings, "Approvals happen on email
                and WhatsApp with no audit trail", overruns a single-line input
                by 58px at 1440 and 103px at 375 — so the drawer opened on the
                *tail* of the title with the first word scrolled out of sight,
                which is worse than the small type it replaced. Two rows hold
                the worst case at both widths.

                **It stays a one-line title in every other respect.** Enter is
                suppressed and newlines are stripped on the way in, so a paste
                out of a document cannot turn the name of the record into a
                paragraph, and `resize-none` keeps the drawer's rhythm. A
                textarea here is the wrapping, not the licence. */}
            <Row label="The finding" hint="What is wrong, in the client's own terms.">
              <textarea
                ref={first}
                required
                rows={2}
                value={title}
                onChange={(e) => setTitle(e.target.value.replace(/\n/g, " "))}
                onKeyDown={(e) => {
                  if (e.key === "Enter") e.preventDefault();
                }}
                placeholder="Freight is tendered manually, one carrier per lane"
                className={`${TITLE_FIELD} w-full resize-none`}
              />
            </Row>

            <Row label="In plain words" hint="The version you can say out loud on the call.">
              <textarea
                rows={3}
                defaultValue={gap?.plainLine}
                className={`${FIELD} w-full`}
                placeholder="Transport is booked by phone…"
              />
            </Row>

            <Row
              label="What we think is happening"
              hint="Why it happens, not what it is. This is the first thing the detail shows."
            >
              {/* Four rows, not three. The boxes were sized for the empty form,
                  and a gap that already has a paragraph in it renders the
                  fourth line sliced in half through the x-height — which reads
                  as a rendering fault rather than as "there is more, scroll".
                  One extra row per prose field is the cheapest fix and costs
                  the drawer, which already scrolls, nothing it cannot pay. */}
              <textarea rows={4} defaultValue={gap?.hypothesis} className={`${FIELD} w-full`} />
            </Row>

            <div className="flex gap-3">
              <Row label="Area" className="min-w-0 flex-1">
                <select className={`${FIELD} w-full`} defaultValue={gap?.bucketId ?? buckets[0]?.id}>
                  {buckets.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </Row>
              <Row label="Effort" className="w-40 shrink-0">
                <select className={`${FIELD} w-full`} defaultValue={gap?.effort ?? "Medium"}>
                  {["Low", "Medium", "High"].map((e) => (
                    <option key={e}>{e}</option>
                  ))}
                </select>
              </Row>
            </div>

            <Row label="How long" className="w-[13rem]">
              <span className="flex gap-1">
                <input
                  type="number"
                  min={1}
                  max={99}
                  defaultValue={gap?.weeks ?? 8}
                  className={`${FIELD} w-16 shrink-0`}
                />
                {/* `flex-1` and not `w-full`: the unit needs room for "months",
                    and at the shared width it rendered "we". */}
                <select className={`${FIELD} min-w-0 flex-1`} defaultValue="weeks">
                  {(Object.keys(UNIT_LABEL) as DurationUnit[]).map((u) => (
                    <option key={u} value={u}>
                      {UNIT_LABEL[u]}
                    </option>
                  ))}
                </select>
              </span>
            </Row>

            <Row label="Expected impact" hint="What changes for the client once it is fixed.">
              <textarea rows={3} defaultValue={gap?.impact} className={`${FIELD} w-full`} />
            </Row>

            {/* Both lists take one item per line. A repeater with add and remove
                buttons is four more controls in a drawer that already has
                twelve, and a consultant typing what they just heard on a call
                types faster into a box than into a list of boxes. */}
            <Row label="Still unknown" hint="One per line. A gap with nothing open is overclaimed.">
              <textarea
                rows={4}
                defaultValue={gap?.stillUnknown.join("\n")}
                className={`${FIELD} w-full`}
              />
            </Row>

            <Row label="Next steps" hint="One per line, in order. Written as instructions.">
              <textarea
                rows={4}
                defaultValue={gap?.nextSteps.join("\n")}
                className={`${FIELD} w-full`}
              />
            </Row>

            {editing ? (
              /* **The chain, shown and not editable.** §4 says a user must
                  always be able to walk source → claim → gap backwards, and a
                  textarea over the middle of that is how it stops being
                  walkable. Showing it read-only rather than leaving it out is
                  the part that matters: an absence looks like an oversight, and
                  the next revision puts a box around it. */
              <div className="space-y-2 rounded-md border border-dashed border-border-strong px-3 py-2.5">
                <p className="flex items-center justify-between gap-3">
                  <span className="text-micro font-medium text-muted-foreground">
                    Why we believe it
                  </span>
                  <ConfidenceChip level={gap.confidence} />
                </p>
                <p className="reading text-small">{gap.why}</p>
                <p className="reading text-small text-muted-foreground">{gap.confidenceReason}</p>
                <p className="text-micro text-muted-foreground">
                  Evidence · {gap.evidence.length}:{" "}
                  {gap.evidence.map((e) => sourceById(e.sourceId).name).join(", ")}
                </p>
                <p className="text-micro text-muted-foreground">
                  Not editable here. This is what the finding hangs from, so it changes when a
                  source does. To correct the reasoning, ask the assistant.
                </p>
              </div>
            ) : (
              /* Not optional, and deliberately last: a gap with nothing behind
                 it is the one thing this product does not produce. */
              <Row label="Where it came from" hint="Every gap traces back to something.">
                <select className={`${FIELD} w-full`} defaultValue="heard">
                  <option value="heard">Heard on a call, not in a document</option>
                  {sources.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </Row>
            )}

            <p className="rounded-md border border-dashed border-border-strong px-3 py-2 text-micro text-muted-foreground">
              Recorded as {editing ? "changed" : "added"} by{" "}
              <span className="text-foreground">sai@heizen.work</span> on 10 August 2026, so the
              chain still ends somewhere.
              {editing && " The version the research produced stays in the log."}
            </p>
          </div>

          <div className="shrink-0 space-y-2 border-t border-border px-4 py-3">
            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full px-3 py-1 text-small text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-full bg-primary px-3 py-1 text-small font-medium text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {editing ? "Save changes" : "Add gap"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </>
  );
}

/**
 * **No `w-full` in here, and that is deliberate.** It carried one for a
 * revision, and beside it `${FIELD} w-12` on the duration input did nothing:
 * two width utilities on one element are settled by their order in the
 * stylesheet, not by the order they are written, so `w-full` won and the number
 * box took the whole row with the unit select crushed to a sliver beside it.
 * Same trap `SwitchScroller` documents about `max-w-full`. Width is the
 * caller's decision; everything else about a field is here.
 */
const FIELD =
  "min-w-0 rounded-md bg-muted px-3 py-2 text-small text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * The finding's box: the same field, one step up in every direction.
 *
 * **Written out in full rather than as `` `${FIELD} text-base px-3` ``**, which
 * is the trap this file has now hit twice. Two conflicting utilities on one
 * element are settled by their order in the stylesheet, not by the order they
 * are written in the attribute, so `text-small` and `px-2` would have quietly
 * won and the change would have looked like it did nothing. Width is still the
 * caller's, for the reason `FIELD` records.
 *
 * `placeholder:font-normal` because the weight is a property of the title, not
 * of the box: an empty add-a-gap form should not open with a bold grey example
 * sentence in it.
 */
const TITLE_FIELD =
  "min-w-0 rounded-md bg-muted px-3 py-2 text-base font-medium leading-snug text-foreground placeholder:font-normal placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Row({
  label,
  hint,
  children,
  className,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  /* **A card, matching the detail view**, on request. The form was a stack of
     labelled inputs on the drawer's bare ground, and the detail beside it is a
     stack of labelled cards — same drawer, same fields, two different objects.
     Now they are one: hairline box, sentence-case label over a rule that
     bleeds to both edges, the control inside.

     **The control loses its own border in exchange.** A bordered input inside a
     bordered card is a box in a box, and at this size the two rules sit four
     pixels apart and read as a rendering fault. It takes `bg-muted` instead,
     which still says "you can type here" and is the ground every other
     editable thing in the product uses. Focus is unchanged — the ring lands on
     the control, not on the card. */
  return (
    <label
      className={`block rounded-lg border border-border bg-card px-4 py-3 shadow-card ${className ?? ""}`}
    >
      <span className="-mx-4 block border-b border-border px-4 pb-2 text-small font-semibold text-foreground">
        {label}
      </span>
      {hint && <span className="mt-2 block text-micro text-muted-foreground">{hint}</span>}
      <span className={`block ${hint ? "mt-1.5" : "mt-3"}`}>{children}</span>
    </label>
  );
}

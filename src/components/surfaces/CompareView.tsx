"use client";

import { Fragment, useState } from "react";
import { cn } from "@/lib/cn";
import {
  HANDLING_LABEL,
  currentLane,
  lanes,
  laneById,
  stages,
  type Handling,
  type Lane,
} from "@/lib/compare";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { SwitchTrack, switchItemClass } from "@/components/shell/SwitchTrack";
import { StickyBar } from "@/components/shell/StickyBar";
import { ArrowIcon } from "@/components/meridian/Icons";

/**
 * Compare — lanes stacked, aligned on shared process stages.
 *
 * The delta row is the argument; everything else is supporting evidence, so the
 * delta gets the most weight on screen. Selecting a company adds a lane below,
 * it never replaces the view. See data-display-patterns and CLAUDE.md section 5.
 *
 * **Two readings of one comparison: Time and Workflow.** The same six stages,
 * the same stacked lanes, the same order; what changes is what is being
 * measured. Time asks how long each stage takes, which is the question a
 * benchmark answers. Workflow asks what the stage is actually made of, which is
 * the question a benchmark cannot: *"you are two days slower"* and *"you have
 * two steps they do not have"* are different sentences, and only the second one
 * says what to fix.
 *
 * It is one `SwitchTrack`, on the page above the material it rearranges, which
 * is where Questions' Arrange and Gaps' two dropdowns already sit.
 */
export function CompareView() {
  const [view, setView] = useState<"time" | "workflow">("time");
  const [shown, setShown] = useState<Set<string>>(new Set(["lane-bic"]));

  const toggle = (id: string) =>
    setShown((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const stacked = [currentLane, ...lanes.filter((l) => shown.has(l.id))];
  // The delta is always against best-in-class if it is on screen, otherwise
  // against the first stacked comparison. Comparing against nothing is not a view.
  const reference = lanes.find((l) => l.isBenchmark && shown.has(l.id)) ?? stacked[1] ?? null;

  return (
    <>
      <SurfaceHero title="Compare" />
      {/* Pinned while the lanes scroll, on request. The stacked lanes run past
          a screen at every width, and Time against Workflow is the whole
          question this surface asks. See `StickyBar`. */}
      <StickyBar className="pt-5 pb-3">
        {/* On the page above the material, like Questions' Arrange and Gaps'
            two dropdowns. Both tabs rearrange what the body says and neither
            changes which surface you are on, so neither belongs on the band. */}
        <SwitchTrack label="What to compare">
          {(["time", "workflow"] as const).map((v) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={cn(switchItemClass(view === v), "capitalize")}
            >
              {v}
            </button>
          ))}
        </SwitchTrack>
      </StickyBar>

      <div className="surface-frame pb-5">
        {/* ------------------------------------------------- lane picker */}
        <fieldset className="mt-1">
          <legend className="text-micro text-muted-foreground">
            Stack a lane below
          </legend>
          {/* Each lane is a card, and it is the card the rest of the product
              draws: `rounded-lg border border-border bg-card shadow-card`, the
              same shape as a gap in the plan panel and a boxed `Field`. They
              were transparent rectangles on the ivory page with only the
              ticked one lifted onto the card ground, so the two states read as
              a box and an absence of one rather than as three boxes, one of
              which is chosen. Selection is the ink border and the tick. */}
          <div className="mt-2 flex flex-wrap gap-2">
            {lanes
              .filter((l) => !l.isCurrent)
              .map((lane) => (
                <label
                  key={lane.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-lg border bg-card px-3 py-2.5 shadow-card transition-colors",
                    shown.has(lane.id)
                      ? "border-foreground"
                      : "border-border hover:border-border-strong",
                  )}
                >
                  {/* The product's tick-box, written out rather than taken from
                      `Checkbox`: that component is itself a `<label>` carrying
                      its own `sr-only` name, and a label inside a label is
                      invalid markup. Here the visible company name is the
                      label, so there is nothing to name it with. */}
                  <span className="relative mt-px flex size-[1.125rem] shrink-0">
                    <input
                      type="checkbox"
                      checked={shown.has(lane.id)}
                      onChange={() => toggle(lane.id)}
                      className="peer size-[1.125rem] shrink-0 appearance-none rounded-[5px] border border-border-strong bg-card transition-colors checked:border-evidence checked:bg-evidence hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
                    />
                    <svg
                      viewBox="0 0 16 16"
                      aria-hidden
                      className="pointer-events-none absolute inset-0 size-[1.125rem] text-card opacity-0 transition-opacity peer-checked:opacity-100"
                    >
                      <path
                        d="M3.75 8.5 6.6 11.25 12.25 5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                  <span>
                    <span className="block text-small font-medium">{lane.company}</span>
                    <span className="block text-micro text-muted-foreground">{lane.sector}</span>
                  </span>
                </label>
              ))}
          </div>
        </fieldset>

        {stacked.length === 1 && (
          <div className="mt-5 rounded-lg border border-dashed border-border-strong bg-muted px-4 py-5">
            <p className="text-base font-medium">Nothing to compare against</p>
            <p className="mt-1 text-small text-muted-foreground measure">
              One lane alone is a list of numbers. Tick a company to see the deltas.
            </p>
          </div>
        )}

        {view === "workflow" ? (
          <WorkflowLanes stacked={stacked} reference={reference} />
        ) : (
          /* ------------------------------------------------- the lanes */
          <div className="mt-6 space-y-6">
            {stages.map((stage) => (
              <section
                key={stage.id}
                className="rounded-lg border border-border bg-card p-4 shadow-card"
              >
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h2 className="text-base font-medium">{stage.name}</h2>
                  <span className="tabular text-small text-muted-foreground">days to complete</span>
                </div>
                <p className="mt-0.5 text-small text-muted-foreground measure">{stage.gloss}</p>

                <table className="mt-3 w-full text-small">
                  <caption className="sr-only">{stage.name} across every lane on screen</caption>
                  <thead className="sr-only">
                    <tr>
                      <th scope="col">Company</th>
                      <th scope="col">Score</th>
                      <th scope="col">Days</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stacked.map((lane) => {
                      const v = lane.values[stage.id];
                      return (
                        <tr key={lane.id} className="border-t border-border first:border-t-0">
                          <th
                            scope="row"
                            className={cn(
                              "py-1.5 pr-3 text-left font-normal",
                              lane.isCurrent && "font-medium",
                            )}
                          >
                            {lane.company}
                            {lane.isBenchmark && (
                              <span className="ml-1.5 text-micro text-muted-foreground">
                                benchmark
                              </span>
                            )}
                          </th>
                          {v ? (
                            <>
                              <td className="tabular py-1.5 pr-3 text-right text-muted-foreground">
                                {v.score}
                              </td>
                              <td className="tabular w-20 py-1.5 text-right font-medium">
                                {v.days} d
                              </td>
                            </>
                          ) : (
                            <td
                              colSpan={2}
                              className="py-1.5 text-right text-muted-foreground italic"
                            >
                              Not measured for this client
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* The loudest row on the screen. */}
                {reference && <DeltaRow stageId={stage.id} referenceId={reference.id} />}
              </section>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

/* ----------------------------------------------------------------- workflow */

/** Every step in the cycle, for the band tile's denominator. */
const allSteps = stages.flatMap((s) => s.steps);

/**
 * The workflow, one lane per company: a chain of the steps that company
 * actually runs, with what the chain costs beside the name.
 *
 * **A lane is a company, not a stage.** The Time view slices the other way,
 * six stage cards with every company inside each one, because a duration is
 * only meaningful next to the same duration elsewhere. A workflow is not: it is
 * a sequence, and cutting a sequence into six pieces to compare each piece
 * separately destroys the one thing it has to show, which is *shape*. Suvarna
 * runs 19 steps and best in class runs 17 different ones, and you see that in
 * one look only if each is drawn as one chain.
 *
 * **The chain wraps rather than scrolling.** Nineteen chips run past 2,500px,
 * and a scroller per lane desynchronises the moment there are two of them: you
 * would scroll one company's flow and be comparing it against the start of
 * another's. Wrapping keeps every step of every lane on screen at every width.
 *
 * **A step a company does not run is simply not in its chain.** That is the
 * whole reason this view exists next to the Time view: `none` is not a slower
 * step, it is a missing one, and it runs both ways. Best in class has no "chase
 * the sign-off" because nothing needs chasing; Suvarna has no "check they are
 * not already on the system", which is why it carries duplicate suppliers. The
 * two lines under the current client's chain say both out loud, because that is
 * the sentence a consultant repeats on the call.
 */
function WorkflowLanes({ stacked, reference }: { stacked: Lane[]; reference: Lane | null }) {
  return (
    <div className="mt-6">
      {/* The column heads sit above the cards rather than inside each of them.
          Four labels repeated on every lane is four times the ink for the same
          information, and the numbers line up on one grid regardless. */}
      <div className="hidden items-baseline gap-4 px-4 pb-2 sm:flex">
        <span className="flex-1 text-micro font-medium text-muted-foreground">
          Lane
        </span>
        {COLUMNS.map((c) => (
          <span
            key={c.key}
            className="w-[4.5rem] shrink-0 text-right text-micro font-medium text-muted-foreground"
          >
            {c.label}
          </span>
        ))}
      </div>

      <div className="space-y-3">
        {stacked.map((lane) => (
          <LaneCard key={lane.id} lane={lane} reference={reference} />
        ))}
      </div>
    </div>
  );
}

/**
 * Every figure here is computed from the flow and the stage days already on the
 * Time view. **Nothing is invented for this row**, which is the reason there is
 * no cost-per-transaction column: a rupee figure with no base, no rate and no
 * range is the number a client challenges first (§7.11), and there is no room
 * beside a company name to show any of the three.
 */
const COLUMNS = [
  { key: "cycle", label: "Cycle" },
  { key: "steps", label: "Steps" },
  { key: "hand", label: "By hand" },
  { key: "auto", label: "Auto" },
] as const;

function LaneCard({ lane, reference }: { lane: Lane; reference: Lane | null }) {
  const chain = allSteps.filter((s) => {
    const h = lane.flow[s.id];
    return h !== undefined && h !== "none";
  });
  const hand = chain.filter((s) => lane.flow[s.id] === "manual").length;
  const auto = chain.filter((s) => lane.flow[s.id] === "auto").length;

  /* A lane with a stage missing has an understated cycle, so the count of
     stages behind it is stated rather than left to be assumed. §7.14 applies to
     a total of six numbers as much as to a total of twelve. */
  const measured = stages.filter((st) => lane.values[st.id]);
  const cycle = measured.reduce((t, st) => t + (lane.values[st.id]?.days ?? 0), 0);

  /* A stage with no steps recorded at all is not a short flow, it is an
     unmapped one, and a chain that simply stops reads as the former. Naming it
     is §7.14 at the scale of one lane: a total is only a total of what was
     looked at. */
  const unmapped = stages.filter((st) => !st.steps.some((f) => lane.flow[f.id] !== undefined));

  /* The comparison, in words, and only on the client's own card: it is a
     statement about this lane against the benchmark, not a property of every
     lane on screen. */
  const extra =
    reference && !lane.isCurrent
      ? []
      : reference
        ? chain.filter((s) => (reference.flow[s.id] ?? "none") === "none")
        : [];
  const missing =
    reference && lane.isCurrent
      ? allSteps.filter(
          (s) =>
            (lane.flow[s.id] ?? "none") === "none" &&
            reference.flow[s.id] !== undefined &&
            reference.flow[s.id] !== "none",
        )
      : [];

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-card">
      {/* Below `sm` the name takes its own line and the figures take the next.
          `w-full`, not `flex-1`: `flex: 1 1 0%` beside a `shrink-0` row of
          numbers means the name agrees to be zero wide rather than wrapping,
          and the last figure runs off the card. Same fix as `GapRow`'s title,
          which is now the fourth place in this product it has been needed. */}
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 className="flex w-full min-w-0 flex-wrap items-baseline gap-x-2 gap-y-1 text-base sm:w-auto sm:flex-1">
          {/* The badge is the reference's "THIS CLIENT" mark. It is a border and
              ink rather than a filled block: one of these per screen does not
              need to be the loudest thing on it, and the name beside it is
              already at 500. */}
          {lane.isCurrent && (
            <span className="rounded border border-border-strong px-1.5 py-0.5 text-micro font-medium text-muted-foreground">
              This client
            </span>
          )}
          {lane.isBenchmark && (
            <span className="rounded border border-border-strong px-1.5 py-0.5 text-micro font-medium text-muted-foreground">
              Benchmark
            </span>
          )}
          <span className={cn("min-w-0", lane.isCurrent && "font-medium")}>{lane.company}</span>
        </h2>

        <span className="flex flex-wrap items-baseline gap-x-4 gap-y-1 sm:shrink-0 sm:flex-nowrap">
          <Figure
            label="Cycle"
            value={`${round(cycle)}d`}
            note={
              measured.length < stages.length ? `${measured.length} of ${stages.length}` : undefined
            }
          />
          <Figure label="Steps" value={String(chain.length)} />
          <Figure label="By hand" value={String(hand)} loud={hand > 0} />
          <Figure label="Auto" value={String(auto)} />
        </span>
      </div>

      {/* The chain. Chips joined by arrows, wrapping, in the order the work
          actually happens. `items-center` so an arrow sits on the chips' middle
          rather than on their baseline, which is where an arrow between two
          boxes belongs. */}
      <ol className="mt-3 flex flex-wrap items-center gap-y-2">
        {chain.map((step, i) => (
          /* **The arrow is inside the item it follows, not between two of
             them.** As a sibling it is a flex child of its own, so a wrap can
             put it first on the next line and the chain appears to start with
             an arrow pointing at nothing. Trailing its own chip, a wrapped line
             ends with "continues" and never begins with one. */
          <li key={step.id} className="flex items-center">
            <span
              className={cn(
                "flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-small",
                lane.flow[step.id] === "manual"
                  ? "border-border-strong font-medium text-foreground"
                  : "border-border text-muted-foreground",
              )}
            >
              <HandlingMark handling={lane.flow[step.id]} />
              {step.name}
              <span className="sr-only">, {HANDLING_LABEL[lane.flow[step.id]]}</span>
            </span>
            {i < chain.length - 1 && (
              <span aria-hidden className="px-1.5 text-border-strong">
                <ArrowIcon />
              </span>
            )}
          </li>
        ))}
      </ol>

      {unmapped.length > 0 && (
        <p className="mt-2.5 text-small italic text-muted-foreground measure">
          {unmapped.map((st) => st.name).join(", ")} was not mapped on this project, so the cycle
          above covers {measured.length} of {stages.length} stages.
        </p>
      )}

      {(extra.length > 0 || missing.length > 0) && (
        /* `.measure` goes on the paragraphs, not on this box. On the box the
           2px rule is capped at 64ch too, and a heavy black line stopping two
           thirds of the way across reads as a rendering fault rather than as
           the divider it is. Same trap the navigator's heading documents from
           the other direction. */
        <div className="mt-3 space-y-1 border-t-2 border-foreground pt-2 text-small">
          {extra.length > 0 && (
            <p className="measure">
              <span className="font-medium">
                {extra.length} step{extra.length === 1 ? "" : "s"} {reference?.company} does not
                run:{" "}
              </span>
              <span className="text-muted-foreground">{extra.map((s) => s.name).join(", ")}.</span>
            </p>
          )}
          {missing.length > 0 && (
            <p className="measure">
              <span className="font-medium">
                {missing.length} step{missing.length === 1 ? "" : "s"} they run and this client does
                not:{" "}
              </span>
              <span className="text-muted-foreground">
                {missing.map((s) => s.name).join(", ")}.
              </span>
            </p>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * One number in the lane header, in the column its label sits over.
 *
 * **It carries its own label below `sm`**, because the column heads are
 * `hidden sm:flex` and four bare numbers with nothing naming them is the exact
 * fault the plan panel's `12 w` had. Above `sm` the head does the naming and a
 * second copy would be a repetition, so the inline one hides and the fixed
 * width comes back to line the columns up.
 */
function Figure({
  label,
  value,
  note,
  loud,
}: {
  label: string;
  value: string;
  note?: string;
  loud?: boolean;
}) {
  return (
    <span className="text-right sm:w-[4.5rem] sm:shrink-0">
      <span className="mr-1 text-micro text-muted-foreground sm:hidden">{label}</span>
      <span className={cn("tabular text-base font-medium", loud && "text-metric-delta")}>
        {value}
      </span>
      {note && <span className="block text-micro text-muted-foreground">{note}</span>}
    </span>
  );
}

const round = (n: number) => Math.round(n * 10) / 10;

/**
 * Filled, half, open, absent.
 *
 * **Shape and not hue**, for the reason `TierMark` is shape: colour in this
 * product encodes health, and how a step is handled is a statement about the
 * process rather than about how healthy the company is. It also survives
 * greyscale and a projector in a bright room, which is where this gets shown.
 */
function HandlingMark({ handling }: { handling: Handling }) {
  return (
    <svg viewBox="0 0 16 16" width="11" height="11" aria-hidden className="shrink-0">
      <circle
        cx="8"
        cy="8"
        r="5.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeDasharray={handling === "none" ? "2.2 2" : undefined}
      />
      {handling === "auto" && <circle cx="8" cy="8" r="5.6" fill="currentColor" />}
      {handling === "assisted" && <path d="M8 2.4a5.6 5.6 0 010 11.2z" fill="currentColor" />}
    </svg>
  );
}

/* -------------------------------------------------------------------------- */

function delta(stageId: string, referenceId: string): number | null {
  const mine = currentLane.values[stageId];
  const theirs = laneById(referenceId).values[stageId];
  if (!mine || !theirs) return null;
  return Math.round((mine.days - theirs.days) * 10) / 10;
}

function DeltaRow({ stageId, referenceId }: { stageId: string; referenceId: string }) {
  const d = delta(stageId, referenceId);
  const ref = laneById(referenceId);

  if (d == null) {
    return (
      <p className="mt-2 border-t-2 border-border pt-2 text-small text-muted-foreground">
        No delta — {ref.company} has no figure for this stage.
      </p>
    );
  }

  const behind = d > 0;
  return (
    <div className="mt-2 flex items-baseline justify-between gap-3 border-t-2 border-foreground pt-2">
      <span className="text-small text-muted-foreground">Suvarna against {ref.company}</span>
      <span
        className={cn(
          "tabular text-h3 font-medium",
          behind ? "text-metric-delta" : "text-metric-delta-good",
        )}
      >
        {behind ? "+" : ""}
        {d} days
        <span className="ml-1.5 text-small font-normal text-muted-foreground">
          {behind ? "slower" : "faster"}
        </span>
      </span>
    </div>
  );
}

"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import {
  CLOSENESS_LABEL,
  HANDLING_LABEL,
  currentLane,
  lanes,
  laneById,
  daysSinceVerified,
  isStale,
  pastProjects,
  priorWorkOn,
  proofFor,
  overallMatch,
  similarityFor,
  stages,
  type Handling,
  type Lane,
  type Closeness,
} from "@/lib/compare";
import { pluralise } from "@/lib/format";
import { useAi } from "@/components/shell/AiPanel";
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
  const [view, setView] = useState<"precedent" | "time" | "workflow">("precedent");
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
        {/* Three now, and the new one leads. Time and Workflow both compare
            *processes*; Built before compares the **work**, which is the
            question somebody actually arrives at this surface with. It is also
            explicit label pairs rather than a `capitalize`d value, because
            "Built before" is two words and the old trick could not carry
            it. */}
        <SwitchTrack label="What to compare">
          {(
            [
              ["precedent", "Built before"],
              ["time", "Time"],
              ["workflow", "Workflow"],
            ] as const
          ).map(([v, label]) => (
            <button
              key={v}
              type="button"
              aria-pressed={view === v}
              onClick={() => setView(v)}
              className={switchItemClass(view === v)}
            >
              {label}
            </button>
          ))}
        </SwitchTrack>
      </StickyBar>

      <div className="surface-frame under-bar pb-5">
        {/* ------------------------------------------------- lane picker
            Hidden on Built before, and that is not a tidying. The picker
            chooses what to *stack*, and that view is not stacked lanes: it is
            this client's twelve findings reconciled against every project
            Heizen has run. Leaving it up would invite unticking a project and
            watching the reuse figure fall, which would read as a filter on the
            truth rather than on the view. It also opens with only best in
            class ticked, which has never built anything. */}
        <fieldset className={cn("mt-1", view === "precedent" && "hidden")}>
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

        {stacked.length === 1 && view !== "precedent" && (
          <div className="mt-5 rounded-lg border border-dashed border-border-strong bg-muted px-4 py-5">
            <p className="text-base font-medium">Nothing to compare against</p>
            <p className="mt-1 text-small text-muted-foreground measure">
              One lane alone is a list of numbers. Tick a company to see the deltas.
            </p>
          </div>
        )}

        {view === "precedent" ? (
          <PrecedentLanes />
        ) : view === "workflow" ? (
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

/* ---------------------------------------------------------------- precedent */

/**
 * How much of this opportunity Heizen has built before.
 *
 * The other two tabs compare processes: how long a stage takes, what steps it
 * is made of. This one compares the *work*, which is the question a consultant
 * and a delivery lead both arrive with and neither could answer from this
 * surface. "We have built seven of your twelve, three of them at a
 * packaged-foods company your size" is the strongest sentence available on a
 * first call.
 *
 * **The first read is one line and one bar.** Count, value, and the four bands
 * in proportion. Everything under it is the working: which project, what was
 * built there, what it took, and what was different. §7.1's three reads, with
 * the answer at the top rather than assembled by the reader from a table.
 *
 * **The honest half is a band and not a footnote.** Five findings have no
 * precedent at all, and they are ₹4.1 Cr of the total. That is where the
 * estimate is softest, so it gets a labelled band in the bar and a block of its
 * own rather than being the part you notice is missing.
 */
function PrecedentLanes() {
  return (
    /* No top margin: the lane picker above it is hidden on this view, so the
       gap under the control bar is `.under-bar`'s alone, like every other
       surface. The two views that do show the picker keep their `mt-6`, which
       is separating two things rather than setting the head of the page. */
    <div className="space-y-4">
      {/* **The precedent summary is gone**, on request: the "7 of 12 findings
          we have built something like before" figure, the ₹5.6 Cr of ₹9.7 Cr
          beside it, and the four band boxes under it.

          It was the surface's first read, and what it read as was a second
          scoreboard: a count and a rupee share above four boxes that split the
          same twelve findings four ways, all of it above the two project cards
          that actually name the work. `precedentBands`, `reusedGaps` and
          `reusedValueCr` are untouched in `compare.ts`, and `BandBox` has gone
          with the section rather than being left unimported — restoring it is
          one block here and one component back. */}
      {/* ------------------------------------------------ how close each one is */}
      {/* **Four readings per project, before any of the detail.** "Have you done
          this before" is really four questions, and a single yes answers none
          of them well: the same sector at half the size, the same steps
          automated, the same problems fixed, and most of the scope covered are
          four different kinds of reassurance. A consultant needs to know which
          one he is holding before he says it out loud.

          It sits above the per-project detail because it is the scan: two cards,
          four readings each, and the sentence to say. */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        {pastProjects.map((lane) => (
          <MatchCard key={lane.id} lane={lane} />
        ))}
      </div>

    </div>
  );
}

/**
 * How close one past project is, on the seven axes.
 *
 * **It was a paragraph per axis and is now a row per axis**, on request. Each
 * one had a label, a word, a reading and a full line explaining the reading:
 * eight sentences across two cards, before any of the detail underneath. The
 * reading was already legible on its own — *8 of 16 steps* compares itself —
 * so the sentence was the screen explaining what it had just said.
 *
 * **The word became a mark.** Three dots filled to the level, which is the
 * scale `EffortChip` already uses on every gap row: the product has one way of
 * drawing a three-step reading and this is it. Four word-chips per card was
 * four more things to read; four rows of dots is one shape to scan, and the
 * columns line up so the eye runs down them rather than across each line.
 *
 * There is no combined score. The header counts how many axes are close and
 * leaves the reader to see which, because the weak axis is the one somebody
 * will ask about.
 */
function MatchCard({ lane }: { lane: Lane }) {
  const axes = similarityFor(lane.id);
  const proof = proofFor(lane.id);

  return (
    <section className="rounded-lg border border-border bg-card p-4 shadow-card">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
        <h3 className="text-base font-medium">{lane.company}</h3>
        {/* **A percentage, on request**, and it is stated as what it is: the
            mean of the six axes below that are shares. A single figure with no
            working is the most persuasive number this surface can carry and the
            only one nobody can check, so the arithmetic sits directly under it.
            The source count is a count rather than a proportion and is kept out
            of the mean rather than quietly scaled into it. */}
        <p className="shrink-0 text-small text-muted-foreground">
          <span className="tabular text-base font-medium text-foreground">
            {overallMatch(lane.id)}%
          </span>{" "}
          match
        </p>
      </div>
      <p className="text-small text-muted-foreground">{lane.sector}</p>

      {/* **A table, on request**, and it is the honest element for what this
          already was: seven rows, three aligned columns, one axis per row. It
          was a `<dl>` on a three-track grid — the same picture, drawn by a
          layout rather than stated by the markup, so a screen reader met seven
          `<dd>` pairs with the mark orphaned as a third term and no column had
          a name.

          What the conversion buys beyond semantics is the **header**. The
          middle column carried readings in three different units — a size
          ratio, five *n of m* counts and a source count — with nothing saying
          what they had in common. *How close* names it once, at the top, where
          a caption per row would have been the screen explaining itself.

          It keeps everything the one-column arrangement was for: every label on
          the same edge, every reading on the next, and the marks stacked into a
          single right-hand column that reads on its own. Seven dots down the
          card is the shape of the match before a word of it is read.

          The labels stay sentence case. A tracked micro-cap is a landmark and
          seven of them stacked is seven landmarks on a card with one subject;
          the header row is three, which is what a header is for. */}
      <table className="mt-3 w-full text-small">
        <caption className="sr-only">
          How close {lane.company} is to this client, on seven axes
        </caption>
        <thead>
          <tr className="text-micro tracking-[0.12em] text-muted-foreground uppercase">
            <th scope="col" className="w-[6.5rem] pr-3 pb-1.5 text-left font-medium">
              Axis
            </th>
            <th scope="col" className="pr-3 pb-1.5 text-left font-medium">
              How close
            </th>
            {/* Named for the reader who cannot see the dots. A visible word over
                a 34px column of marks would be a heading wider than the thing
                it heads, and the mark carries its own label already. */}
            <th scope="col" className="pb-1.5 text-right font-medium">
              <span className="sr-only">Match</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {axes.map((a) => (
            <tr key={a.key} className="border-t border-border">
              <th
                scope="row"
                className="py-1.5 pr-3 text-left align-middle font-normal text-muted-foreground"
              >
                {a.label}
              </th>
              <td className="min-w-0 py-1.5 pr-3 align-middle">{a.value}</td>
              <td className="py-1.5 text-right align-middle">
                <CloseDots closeness={a.closeness} label={CLOSENESS_LABEL[a.closeness]} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {proof && (
        /* The sentence that leaves the screen, and the only prose on the card.
           It is the outcome of whichever build covers the most of this client's
           list, composed rather than authored so it cannot go stale against the
           work it quotes. */
        <div className="mt-3 border-t border-border pt-3">
          <p className="text-micro font-medium tracking-wide uppercase text-muted-foreground">
            Say on the call
          </p>
          <p className="reading mt-1 text-small">{proof.outcome}</p>
        </div>
      )}

      {/* **The one line the removed detail block cannot take with it.** The
          per-build rows are gone on request, and with them went the date each
          match was last checked and the route for saying one is wrong. Both had
          to survive somewhere: a reuse claim ages silently, and §5 says a
          correction is described to the assistant rather than typed over the
          record. One line per project does the same job as one line per build. */}
      <ProjectFreshness lane={lane} />
    </section>
  );
}

/**
 * How many builds are behind this project, when the oldest was last checked,
 * and the way to say it is wrong.
 *
 * The oldest, not the newest: a project is as current as its stalest match, and
 * showing the freshest date would be the flattering half of the truth.
 */
function ProjectFreshness({ lane }: { lane: Lane }) {
  const { attach } = useAi();
  const work = priorWorkOn(lane.id);
  const oldest = [...work].sort((a, b) => daysSinceVerified(b) - daysSinceVerified(a))[0];
  if (!oldest) return null;
  const stale = isStale(oldest);

  return (
    <div className="mt-2 flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
      <p className="tabular text-micro text-muted-foreground">
        {pluralise(work.length, "build", "builds")} ·{" "}
        <span className={cn(stale && "text-health-watch")}>
          {stale
            ? `not checked for ${Math.round(daysSinceVerified(oldest) / 30)} months`
            : `checked ${oldest.verifiedOn}`}
        </span>
      </p>
      <button
        type="button"
        onClick={() =>
          attach({
            kind: "Match",
            text: `What we have built at ${lane.company}`,
            query: lane.company,
          })
        }
        className="text-micro text-evidence transition-colors hover:text-foreground"
      >
        Not right?
      </button>
    </div>
  );
}

/**
 * Closeness as three dots filled to the level, the same scale `EffortChip`
 * draws on every gap row.
 *
 * **Neutral, and shape rather than hue.** Colour on this platform is a reading
 * about the client's process; how close a past project of ours is is not one.
 * The word survives as the accessible name, so nothing is carried by the mark
 * alone.
 */
function CloseDots({ closeness, label }: { closeness: Closeness; label: string }) {
  const filled = closeness === "close" ? 3 : closeness === "partial" ? 2 : 1;
  return (
    <span className="flex items-center gap-[3px]" title={label}>
      <span className="sr-only">{label}</span>
      {[1, 2, 3].map((i) => (
        <span
          key={i}
          aria-hidden
          className={cn(
            "size-[5px] rounded-full",
            i <= filled ? "bg-foreground" : "bg-foreground/20",
          )}
        />
      ))}
    </span>
  );
}

/**
 * One thing built at one past project.
 *
 * The two numbers on the right are the comparator §7.3 asks for, and they are
 * the pair a delivery lead reads: what it took there against what we have
 * estimated here. They disagree on most rows, which is the point of showing
 * both rather than one.
 */
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

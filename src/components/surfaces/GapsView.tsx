"use client";

import { useMemo, useRef, useState } from "react";
import { Plus } from "lucide-react";
import {
  gapById,
  gaps,
  missingPrerequisites,
  sequenceWaves,
  DOMAIN_LABEL,
  LENS_LABEL,
  TAG_LABEL,
  gapDomains,
  gapTags,
  type Gap,
  type QuestionDomain,
  type QuestionLens,
  type QuestionTag,
  type Tier,
} from "@/lib/suvarna";
import {
  NO_EDITS,
  PLAN_START,
  UNIT_LABEL,
  formatDay,
  formatShort,
  formatSpan,
  schedule,
  waveOf,
  type Duration,
  type DurationUnit,
  type PlanEdits,
  type ScheduledGap,
} from "@/lib/plan";
import { cn } from "@/lib/cn";
import { GapRow } from "@/components/meridian/GapRow";
import { TIER_LABEL } from "@/components/meridian/Confidence";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";
import { GapPanel } from "@/components/shell/GapPanel";
import { SaveMenu } from "@/components/shell/SaveMenu";
import { SelectField } from "@/components/shell/SelectField";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StickyBar } from "@/components/shell/StickyBar";
import { useMastheadVisible } from "@/components/shell/useScrollDirection";
import { DateField } from "@/components/shell/DateField";
import { ToggleField } from "@/components/shell/ToggleField";
import { EditIcon, SortIcon } from "@/components/meridian/Icons";
import { BookmarkIcon, useSaved } from "@/components/shell/SavedProvider";
import { MenuItem, OverflowMenu } from "@/components/shell/OverflowMenu";
import { Panel } from "@/components/meridian/Primitives";
import { Checkbox } from "@/components/shell/Checkbox";

/**
 * Gaps — findings and what it takes to fix them.
 *
 * **There is no money on this surface.** Not on the row, not on the band, not
 * in the plan. That is a deliberate split rather than a simplification: a rupee
 * figure is only honest with its base, its rate and its range attached (§7.11),
 * and there is exactly one place in the product with room for all three, which
 * is Research › Money. Twelve prices on twelve rows with the working two clicks
 * away was the number a client challenges first.
 *
 * What is left is the question the price was standing in for. Twelve problems,
 * what each one needs first, what it costs in weeks rather than crores, and a
 * plan that turns a tick-list into dates.
 */

type Sort = "effort" | "confidence" | "sequence";

/** The words the icon-only control cannot show. They are the accessible name,
 *  the tooltip and the option list, so all three say the same thing. */
const ORDER_LABEL: Record<Sort, string> = {
  sequence: "Sequence",
  effort: "Effort",
  confidence: "How sure",
};

const EFFORT_RANK = { Low: 0, Medium: 1, High: 2 } as const;
const TIER_RANK = { confirmed: 0, inferred: 1, unverified: 2 } as const;
/* Atlas's own tiebreak: proven before unproven, within the same effort tier.
   A gap Heizen has already built somewhere else is the safer of two equally
   cheap promises, so it sorts first rather than sitting wherever `rank`
   happens to land it. */
const PRECEDENT_RANK = (id: string) => (gapById(id).precedentId ? 0 : 1);

/* The suggested order across the whole list, not just the ticked rows: the
   position a gap would take if you did all twelve. It is a sort key here and
   the plan's starting shape there, computed from the same function so the two
   can never disagree. */
const SEQUENCE_RANK = new Map(
  sequenceWaves(gaps.map((g) => g.id)).flatMap((wave, i) =>
    [...wave]
      .sort(
        (a, b) =>
          EFFORT_RANK[gapById(a).effort] - EFFORT_RANK[gapById(b).effort] ||
          PRECEDENT_RANK(a) - PRECEDENT_RANK(b),
      )
      .map((id, j) => [id, i * 100 + j] as const),
  ),
);

export function GapsView() {
  const [sort, setSort] = useState<Sort>("sequence");
  /**
   * The same three filters Questions carries, plus the one this surface cannot
   * do without.
   *
   * Domain, Tag and Kind are the row a consultant already knows from the other
   * surface, on the same axes and in the same order, so the vocabulary is
   * learned once. **How sure** is the fourth and is particular to a finding:
   * a question is worth asking whatever we know, but a finding that rests on
   * one remark in one call is one you do not say out loud, and narrowing to
   * *confirmed* is how you decide what is safe to lead with.
   *
   * Area went to make room. It was the four money buckets, which is a cut of
   * the same business that Domain makes more finely and that Money owns
   * anyway; `bucketId` is untouched in the data and still builds that surface.
   *
   * `null` for "all" rather than a sentinel, so the list code never has to know
   * which value means unfiltered.
   */
  const [domain, setDomain] = useState<QuestionDomain | null>(null);
  const [tag, setTag] = useState<QuestionTag | null>(null);
  const [lens, setLens] = useState<QuestionLens | null>(null);
  const [tier, setTier] = useState<Tier | null>(null);
  const filtered = domain !== null || tag !== null || lens !== null || tier !== null;
  /**
   * **The surface opens on the findings that have something behind them**, on
   * request, and the rest are one press away.
   *
   * Four of the twelve are reasoned from sector structure rather than observed
   * in a source, and they are not the same kind of object as the other eight: a
   * consultant leading a call with one of them is asserting something nobody
   * has checked. §7.5 already says the product must state how sure it is; this
   * takes the next step and stops putting the two kinds in one undifferentiated
   * list of twelve, which is what made *how sure* a thing you had to go and
   * look up per row rather than a property of the list you are reading.
   *
   * **It is a default, not a rule.** The four are counted in words at the foot
   * of the list with a control that brings them back, because §7.14 applies
   * here exactly as it applies to a total: a list that quietly shows eight of
   * twelve is a list that lies about what was found.
   *
   * The *How sure* dropdown wins whenever it is set to anything — asking for
   * inferred findings and being shown none would be the control not working.
   */
  const [showAll, setShowAll] = useState(false);
  const evidencedOnly = !showAll && tier === null;
  const hidden = gaps.filter((g) => g.tier !== "confirmed").length;
  /* **Plan mode is off by default**, on request. Gaps opens as what it is:
     twelve findings and what each needs first. The plan is the conversation
     you have after that one has gone well, so it is a thing you turn on rather
     than a column you close. Plain state, not `localStorage` -- the panel is a
     mode you enter for a task, not an arrangement you set once. */
  const [planMode, setPlanMode] = useState(false);
  const [plan, setPlan] = useState<Set<string>>(new Set(["g3", "g9", "g6"]));
  const [edits, setEdits] = useState<PlanEdits>(NO_EDITS);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<Gap | null>(null);
  /* Focus goes back to the button that opened the drawer, or closing it strands
     the user at the top of the document with no idea what they just shut. Same
     rule `PanelProvider` follows for the evidence panel.

     The band's button is a ref because there is one of it. The row's is stored
     on the way in, because there are twelve and a ref per row would be a map
     kept in step with a list that filters and re-sorts under it. */
  const addButton = useRef<HTMLButtonElement>(null);
  const editButton = useRef<HTMLButtonElement | null>(null);
  const closeAdding = () => {
    setAdding(false);
    addButton.current?.focus();
  };
  const closeEditing = () => {
    setEditing(null);
    editButton.current?.focus();
  };

  const visible = useMemo(() => {
    const list = gaps.filter(
      (g) =>
        (!domain || g.domain === domain) &&
        (!tag || g.tags.includes(tag)) &&
        (!lens || g.lens === lens) &&
        (!tier || g.tier === tier) &&
        (!evidencedOnly || g.tier === "confirmed"),
    );
    return list.sort((a, b) => {
      if (sort === "effort")
        return (
          EFFORT_RANK[a.effort] - EFFORT_RANK[b.effort] ||
          PRECEDENT_RANK(a.id) - PRECEDENT_RANK(b.id) ||
          a.rank - b.rank
        );
      if (sort === "confidence") return TIER_RANK[a.tier] - TIER_RANK[b.tier] || a.rank - b.rank;
      return (SEQUENCE_RANK.get(a.id) ?? 0) - (SEQUENCE_RANK.get(b.id) ?? 0);
    });
  }, [sort, domain, tag, lens, tier, evidencedOnly]);

  const clear = () => {
    setDomain(null);
    setTag(null);
    setLens(null);
    setTier(null);
  };

  const toggle = (id: string) => {
    setPlan((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    /* An override on a gap that has left the plan is a stale instruction: the
       suggested order is recomputed from whatever is ticked, so a wave index
       kept from a different selection would land somewhere arbitrary if the
       gap came back. Weeks are the consultant's own estimate and survive. */
    setEdits((prev) => {
      if (!(id in prev.wave)) return prev;
      const wave = { ...prev.wave };
      delete wave[id];
      return { ...prev, wave };
    });
  };

  return (
    <>
      <SurfaceHero title="Gaps" />
      {/* **The settings row is pinned while the list scrolls**, on request, and
          twelve rows plus a plan panel is exactly the length that makes it
          worth it: Order and Area decide what is in the list, and a control you
          have to scroll back up to reach is one you set once and then live
          with. `StickyBar` renders the frame itself, so its ground runs to both
          window edges and the list passes under it rather than through it. */}
      <StickyBar from="sm" className="pt-5 pb-3">
        {/* The two settings sit on the page above the card, not in its header
            strip, and they are dropdowns rather than tabs. Both on request, and
            both are reversals of notes that used to be in CLAUDE.md — the old
            argument was that filters belong to the list they filter, and that
            there is one tab control in the product.

            What the move buys is real, whatever the argument was: Area carried
            four bucket names in full and ran 729px, so inside the card it was a
            scroller that hid its own last option, and the two tracks wrapped
            against each other at anything under a wide monitor. A dropdown is
            the width of its longest label plus a chevron, at every viewport, and
            it cannot hide an option off the right edge.

            **Order lost its Value option with the prices.** Sorting by a number
            that appears nowhere on the surface is a control whose effect cannot
            be read. Sequence took the default in its place, which is the
            ordering the plan panel beside it is built on.

            `mb-3` and `gap-x-6`, matching Questions' `Arrange` row above its
            panels — the two surfaces should not disagree about where a setting
            lives now that both put theirs on the page.

            **The two buttons share this row**, on request, and it is the same
            move Research made with its switches: once the surface name and its
            description came off the header, what was left was a row holding two
            buttons and a great deal of ivory. The dropdowns are ~380px of a
            full-width frame, so the buttons drop into space that was already
            empty and the surface gains the whole header back.

            It costs the distinction the header was protecting — *work you
            start* apart from *how the list is sorted*. Position on the row
            carries it instead: settings at the reading edge, buttons at the far
            end. `self-center` on them, because the row is `items-stretch` for
            the divider's sake and a stretched button is a 40px slab. */}
        {/* **16px between the controls, not 24**, on request. The row holds six
            things now — a sort, four filters and a mode — and at 24 the rules
            floated in the middle of a gap rather than marking a boundary
            between two neighbours. A divider needs very little space to be read
            as one, which is the same measurement the Research group row
            arrived at. */}
        <div className="flex flex-wrap items-stretch gap-x-4 gap-y-2">
          {/* **Every filter is on the strip, on request**, and the collapse
              control that used to hold them is gone.

              It was one "Filter and sort" button opening a row underneath, and
              the argument for it was that a reader arriving at Gaps is here to
              read twelve findings rather than to configure a list. The argument
              against, which wins: these are the surface's working controls, and
              a control you have to open a panel to reach is one you stop using.
              What the collapsed version was really fixing was that the row
              looked like nine competing objects — that part is fixed by what
              stayed from the change rather than by hiding anything. Three
              dividers came off, and the icon-only sort became a labelled
              *Order* select, so the strip now reads as five like-shaped
              dropdowns and a toggle instead of an icon, four boxes and a
              pile of rules. */}
          <SelectField
            label="Order"
            value={sort}
            onChange={(v) => setSort(v as Sort)}
            options={[
              ["sequence", "Sequence"],
              ["effort", "Effort"],
              ["confidence", "How sure"],
            ]}
          />
          {/* Domain, Tag, Kind: the same three, in the same order, with the same
              rules between them as Questions. Two surfaces that filter the same
              way should not disagree about what the controls are called or how
              they are spaced. */}
          <SelectField
            label="Domain"
            value={domain ?? "all"}
            onChange={(v) => setDomain(v === "all" ? null : (v as QuestionDomain))}
            options={[
              ["all", "All"],
              ...gapDomains.map((d) => [d, DOMAIN_LABEL[d]] as [string, string]),
            ]}
          />
          <SelectField
            label="Tag"
            value={tag ?? "all"}
            onChange={(v) => setTag(v === "all" ? null : (v as QuestionTag))}
            options={[
              ["all", "All"],
              ...gapTags.map((t) => [t, TAG_LABEL[t]] as [string, string]),
            ]}
          />
          <SelectField
            label="Kind"
            value={lens ?? "all"}
            onChange={(v) => setLens(v === "all" ? null : (v as QuestionLens))}
            options={[
              ["all", "All"],
              ["business", LENS_LABEL.business],
              ["technical", LENS_LABEL.technical],
            ]}
          />
          {/* The fourth, and the one Questions has no use for: how sure we are
              is what decides whether a finding may be said out loud. */}
          <SelectField
            label="How sure"
            value={tier ?? "all"}
            onChange={(v) => setTier(v === "all" ? null : (v as Tier))}
            options={[
              ["all", "All"],
              ["confirmed", TIER_LABEL.confirmed],
              ["inferred", TIER_LABEL.inferred],
              ["unverified", TIER_LABEL.unverified],
            ]}
          />
          {/* The one rule left on the strip, and it earns its place: everything
              to its left changes *which* findings are listed, and Plan changes
              whether there is a second column on the page. */}
          <span className="hidden w-px shrink-0 self-stretch bg-border sm:block" aria-hidden />
          <ToggleField label="Plan" checked={planMode} onChange={setPlanMode} />
          <div className="ml-auto flex shrink-0 items-center gap-2 self-center">
            {/* Only while a filter is on, and it says how many of the twelve
                survived it. A filtered list that does not say it is filtered is
                how a consultant walks into a call believing there are four
                findings. Same control, same words as Questions. */}
            {filtered && (
              <button
                type="button"
                onClick={clear}
                className="whitespace-nowrap rounded-md border border-border bg-card px-2.5 py-1.5 text-micro font-medium text-muted-foreground shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground"
              >
                {visible.length} of {gaps.length} · Clear
              </button>
            )}
            {/* **A plus beside Run, not a menu**, on request. It was an
                overflow with one item in it, which is a menu you have to open
                to find out it holds nothing. Icon-only rather than *Add a gap*
                spelled out: it sits directly beside the filled primary, and two
                labelled buttons in one corner read as two things of equal
                weight when only one of them is. The words survive as the
                accessible name and the tooltip, which is the same trade the
                theme control makes. */}
            <button
              type="button"
              ref={addButton}
              onClick={() => setAdding(true)}
              aria-label="Add a gap"
              title="Add a gap"
              className="flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Plus className="size-4" />
            </button>
            <RunButton label="Run Gap Analysis" />
          </div>
        </div>

      </StickyBar>

      <div className="surface-frame under-bar pb-5">

        {/* 60 / 40, not a fixed 320px sidebar. The panel is the densest column in
            the product — a date, a duration, waves with their own dates and a
            row of controls per gap — so it should grow with the window rather
            than sit as a fixed strip that gets narrower in proportion the wider
            the monitor. At 1440 the split is ~925 / ~400.

            The `minmax(320px, 3fr)` floor is load-bearing: 30% of the `lg`
            breakpoint is 285px, and at that width a plan row cannot hold a
            title, a week count and three buttons on one line. The ratio applies
            where there is room for it; below that the panel holds its floor and
            the list gives the pixels up, which is the right way round — the rows
            have more width than they need at every size. */}
        {/* **The split only exists in plan mode.** With the panel off, the list
            takes the whole frame rather than leaving a 40% column of ivory
            beside it: a one-column grid is the same element with one child, so
            nothing here needs a second branch. */}
        <div
          className={cn(
            "grid gap-6",
            planMode && "lg:grid-cols-[minmax(0,6fr)_minmax(360px,4fr)]",
          )}
        >
          <Panel className="min-w-0 px-0 py-0 sm:px-0 sm:py-0">
            <div className="px-3 py-3 sm:px-4">
              {/* 10px between cards. Two borders closer than that read as one
                  double rule, which is the measurement the plan panel's own
                  blocks arrived at from the other direction. */}
              <ul className="space-y-2.5">
                {visible.map((gap) => (
                  <SelectableGapRow
                    key={gap.id}
                    gap={gap}
                    checked={plan.has(gap.id)}
                    selectable={planMode}
                    onToggle={() => toggle(gap.id)}
                    onEdit={(trigger) => {
                      editButton.current = trigger;
                      setEditing(gap);
                    }}
                  />
                ))}
              </ul>
              {/* Nothing survived the filters. It is a real state rather than
                  an error, and the way out is the control that caused it. Same
                  shape as Questions' no-match panel. */}
              {visible.length === 0 && (
                <div className="py-6">
                  <p className="text-base font-medium">No findings match that</p>
                  <p className="mt-1 text-small text-muted-foreground measure">
                    Widen one of the four, or clear them and start again.
                  </p>
                  <button
                    type="button"
                    onClick={clear}
                    className="mt-3 rounded-md border border-border bg-card px-2.5 py-1.5 text-micro font-medium text-muted-foreground shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground"
                  >
                    Show all {gaps.length}
                  </button>
                </div>
              )}

              {/* **What is not on the list, said on the list.** §7.14 is
                  written about totals and applies here for the same reason: a
                  surface showing eight of twelve findings without saying so is
                  one a consultant walks into a call trusting. The sentence
                  names *why* they are out rather than counting them, because
                  "4 hidden" is a number and "they rest on inference rather than
                  observation" is the thing that decides whether he wants them.

                  It only shows while *How sure* is unset: with that dropdown
                  driving the list, this line would be a second, quieter filter
                  disagreeing with the visible one. */}
              {tier === null && (
                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-t border-border px-0.5 pt-3">
                  <p className="reading text-small text-muted-foreground measure">
                    {showAll
                      ? `${hidden} of these ${gaps.length} rest on inference rather than observation.`
                      : `${hidden} more rest on inference rather than observation, and are not shown.`}
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowAll((v) => !v)}
                    className="shrink-0 rounded-md border border-border bg-card px-2.5 py-1.5 text-micro font-medium text-muted-foreground shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground"
                  >
                    {showAll
                      ? `Show the ${gaps.length - hidden} evidenced`
                      : `Show all ${gaps.length}`}
                  </button>
                </div>
              )}
            </div>
          </Panel>

          {planMode && (
            <PlanPanel
              plan={plan}
              edits={edits}
              setEdits={setEdits}
              onAdd={toggle}
              onRemove={toggle}
            />
          )}
        </div>
      </div>

      {/* Mounted and unmounted rather than held open, so a half-typed gap is
          gone when the drawer comes back. `key` is what makes that true one
          level finer: pressing edit on a second row while the first is open
          would otherwise keep the first row's text in the boxes. */}
      {adding && <GapPanel onClose={closeAdding} />}
      {editing && <GapPanel key={editing.id} gap={editing} onClose={closeEditing} />}
    </>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The plan: what gets done, in what order, and by when.
 *
 * It was a rupee total with a sequence underneath it. It is now the sequence
 * with dates on it, and the consultant can move things. See `lib/plan.ts` for
 * why the prerequisite constraint is the one edit the panel refuses.
 */
function PlanPanel({
  plan,
  edits,
  setEdits,
  onAdd,
  onRemove,
}: {
  plan: Set<string>;
  edits: PlanEdits;
  setEdits: (next: PlanEdits) => void;
  onAdd: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const ids = [...plan];
  const sched = schedule(ids, edits);
  const missing = missingPrerequisites(ids);
  const mastheadVisible = useMastheadVisible();

  /** The gap being dragged, and the wave under the pointer. */
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<number | null>(null);

  /* A move is expressed as a target wave, whether it arrived from a pointer or
     from an arrow key. `to` beyond the last wave means "a new wave at the end",
     which is what dropping past everything should do. */
  const moveTo = (id: string, to: number) => {
    const last = sched.waves.length - 1;
    const raw = to > last ? sched.waves[last].raw + 1 : sched.waves[Math.max(0, to)].raw;
    setEdits({ ...edits, wave: { ...edits.wave, [id]: raw } });
  };

  const setDuration = (id: string, next: Duration) =>
    setEdits({
      ...edits,
      duration: {
        ...edits.duration,
        [id]: { ...next, value: Math.max(1, Math.min(99, next.value || 1)) },
      },
    });

  const drop = (to: number) => {
    const id = dragging;
    setDragging(null);
    setOver(null);
    if (!id) return;
    const item = sched.waves.flatMap((w) => w.gaps).find((g) => g.id === id);
    /* The refusal is here rather than in `schedule`, which would accept the
       drop and then repair it — the gap would snap back with no explanation. */
    if (!item || to < item.earliest) return;
    if (to !== waveOf(id, sched)) moveTo(id, to);
  };

  return (
    /* Two pinned things above this now, not one: the masthead at 48px and the
       settings row at 68. `lg:top-14` put the panel's own header behind the bar
       whenever the band was showing. Same two-value trick `SectionNav` uses,
       and the same reason it cannot be a constant. */
    <aside
      className={cn(
        "lg:sticky lg:self-start lg:transition-[top] lg:duration-200 motion-reduce:lg:transition-none",
        mastheadVisible ? "lg:top-[7.75rem]" : "lg:top-[4.75rem]",
      )}
    >
      <div className="rounded-lg border border-border bg-card p-4 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <p className="text-micro font-medium text-muted-foreground">
            Plan · {plan.size} of {gaps.length}
          </p>
          {plan.size > 0 && <SaveMenu sched={sched} />}
        </div>

        {plan.size === 0 ? (
          <p className="mt-2 text-small text-muted-foreground measure">
            Tick a row to start building one. The order is worked out from what each gap needs
            first, and you can change it here.
          </p>
        ) : (
          <>
            {/* Weeks is the display figure where a rupee total used to be. It
                is the number a consultant is asked for out loud, and unlike
                the total it does not need a base to be true. */}
            {/* **The figure and the dates share a line**, on request: the
                number at display size, and beside it two lines — what it counts,
                and the span it runs over. The dates used to sit on their own
                line underneath, which put a second landmark directly below the
                display figure with nowhere for the eye to go. Beside it they
                are the caption on the number rather than a second statement. */}
            <div className="mt-1.5 flex items-center gap-3">
              <span className="font-display text-display leading-none tabular">
                {formatSpan(sched.totalWeeks).split(" ")[0]}
              </span>
              <span className="min-w-0">
                <span className="block text-base text-muted-foreground">
                  {formatSpan(sched.totalWeeks).split(" ")[1]}
                </span>
                <span className="block text-small text-muted-foreground">
                  <DateField
                    value={edits.start}
                    onChange={(v) => setEdits({ ...edits, start: v || PLAN_START })}
                    label="Plan start date"
                  />{" "}
                  to <span className="tabular text-foreground">{formatDay(sched.endISO)}</span>
                </span>
              </span>
            </div>

            {/* **The parallelism gloss is gone from the panel**, on request.
                It read: "Everything in a wave starts together, so a wave takes
                as long as its longest job."

                Worth knowing what it was for, because the reading it prevented
                is still available: Wave 1 holds a 12-week job and an 8-week job
                and says 12 weeks, which looks like an error until you know the
                work runs at the same time. The rule lives in `plan.ts` and the
                screen shows only its result. **The sentence survives in the
                downloaded file**, where it earns its place more than it did
                here: a spreadsheet has no panel around it to explain the
                arithmetic, and nobody reading one can ask.

                **A wave is the drop target, not a position in a list.** Order
                inside a wave means nothing — the work runs in parallel and the
                wave costs its longest job — so dragging a row above another row
                in the same wave would be a gesture with no result. Dragging it
                onto a different wave is the only move that changes the plan,
                and it is the move the handle offers. */}
            {/* The rule came back onto the list when the gloss above it went:
                it was the gloss that carried the border, and without it the
                waves ran straight into the date line. */}
            <ol className="mt-3.5 space-y-3.5 border-t border-border pt-3.5">
              {sched.waves.map((wave, i) => (
                <li
                  key={wave.raw}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOver(i);
                  }}
                  onDragLeave={() => setOver((v) => (v === i ? null : v))}
                  onDrop={() => drop(i)}
                  /* The drop highlight is a ring and not a fill. It was a fill
                     until the gaps inside the wave took a ground of their own,
                     and it is still a ring now that they are cards: a tint
                     behind three bordered white blocks shows only in the 8px
                     between them. */
                  className={cn(
                    "-mx-1 rounded-md px-1 py-0.5 transition-colors",
                    over === i && "ring-1 ring-evidence",
                  )}
                >
                  {/* **Sprint, and its dates in brackets after it**, on
                      request. It carried the wave's own length as well —
                      "Wave 1 · 12 weeks" on the left and the span on the right
                      — which is the same fact twice: a sprint that runs 17 Aug
                      to 9 Nov is twelve weeks long. One line, one statement.

                      **It is typeset as a title now**, on request, and it had
                      to be: once the gaps under it became bordered white cards,
                      an 11px grey line above them read as a caption on the
                      first card rather than as the heading of all three. Ink at
                      600 at `text-small` is the voice `Field`'s boxed labels
                      already use one panel across, so the heading over a stack
                      of cards and the heading on a card are the same voice.

                      **The dates stay grey and stay small.** The sprint number
                      is what you scan the column for; the span is what you read
                      once you have found it. Promoting both would have made the
                      line a second title rather than a title with a note. */}
                  <p className="text-small font-semibold text-foreground">
                    Sprint {i + 1}{" "}
                    <span className="tabular text-micro font-normal text-muted-foreground">
                      ({formatShort(wave.startISO)} to {formatShort(wave.endISO)})
                    </span>
                  </p>
                  {/* 8px between cards, up from 6. Two bordered blocks need
                      more air between them than two tinted ones: the borders
                      are what say where one ends, and at 6px they read as a
                      double rule. */}
                  <ul className="mt-1.5 space-y-2">
                    {wave.gaps.map((g) => (
                      <PlanItem
                        key={g.id}
                        item={g}
                        wave={i}
                        lastWave={sched.waves.length - 1}
                        dragging={dragging === g.id}
                        onDragStart={() => setDragging(g.id)}
                        onDragEnd={() => {
                          setDragging(null);
                          setOver(null);
                        }}
                        onMoveTo={moveTo}
                        onDuration={setDuration}
                        onRemove={onRemove}
                      />
                    ))}
                  </ul>
                </li>
              ))}
            </ol>

            {/* The one thing a wave-shaped drop target cannot express: pulling
                a gap out into a wave of its own at the end. It only appears
                while something is being dragged, so it is not a permanent
                empty box under the plan. */}
            {dragging && (
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setOver(sched.waves.length);
                }}
                onDragLeave={() => setOver((v) => (v === sched.waves.length ? null : v))}
                onDrop={() => drop(sched.waves.length)}
                /* **It reads as a target now**, on request. It was a hairline
                   dashed box in muted grey at 11px, which is the same register
                   as the caption under a control — so the one thing on the
                   panel that is asking to be dropped into looked like a note
                   about the plan. It is 2px dashed in `--evidence`, on
                   `--evidence-muted`, which is the pairing the tick-box and
                   every other "you can operate this" mark on the page already
                   use, and it is a real surface token rather than an alpha so
                   the contrast is checked in both themes.

                   **The state under the pointer is a fill and a solid border**,
                   not the 1px ring the waves take: a wave already has three
                   bordered cards in it to be ringed around, and this box has
                   nothing inside it, so what changes has to be the box. */
                className={cn(
                  "mt-2.5 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed px-3 py-4 text-center text-small font-medium transition-colors",
                  over === sched.waves.length
                    ? "border-solid border-evidence bg-evidence text-card"
                    : "border-evidence bg-evidence-muted text-evidence",
                )}
              >
                <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" aria-hidden>
                  <path
                    d="M8 3.5v9M3.5 8h9"
                    stroke="currentColor"
                    strokeWidth="1.6"
                    strokeLinecap="round"
                  />
                </svg>
                Drop here for a sprint of its own
              </div>
            )}

            {/* **The two stats under the waves are gone**, on request. Both
                were restatements: the wave count is the number of headed blocks
                directly above it, and how many rest on inference is a reading
                about the *findings* rather than about the schedule, which is
                what Gaps' band tile and the confidence chip in each row's
                detail already carry. A summary of a list that is fully visible
                two inches up is weight without a second read. */}
            {missing.length > 0 && (
              <div className="mt-3 border-t border-border pt-2.5">
                <p className="text-micro font-medium">This will not deliver as ticked</p>
                <ul className="mt-1 space-y-1">
                  {missing.map(({ gapId, needs }) => (
                    <li key={gapId} className="text-micro text-muted-foreground measure">
                      {gapById(gapId).title} needs{" "}
                      {needs.map((n, i) => (
                        <span key={n}>
                          {i > 0 && ", "}
                          <button
                            type="button"
                            onClick={() => onAdd(n)}
                            className="font-medium text-foreground transition-colors hover:text-muted-foreground"
                          >
                            {gapById(n).title}
                          </button>
                        </span>
                      ))}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {sched.edited && (
              <button
                type="button"
                onClick={() => setEdits(NO_EDITS)}
                className="mt-2.5 border-t border-border pt-2.5 text-micro text-evidence transition-colors hover:text-foreground"
              >
                Put back the suggested order and dates
              </button>
            )}
          </>
        )}
      </div>
    </aside>
  );
}

/**
 * One gap in the plan: what it is, how long it takes, where it sits.
 *
 * **Dragged, not nudged.** The two arrow buttons are gone on request. What
 * replaced them is a grip that takes a pointer *and* the arrow keys, which is
 * the part that is not optional: a drag is a pointer-only gesture, and §7.8 has
 * no exception for controls that feel modern. Focus the grip and ↑ or ↓ moves
 * the gap a wave, with the same prerequisite floor the drop honours. One
 * control, two ways in, rather than a gesture plus a fallback that drifts.
 *
 * The duration is a number and a unit. A three-day cleanse and a four-month
 * rollout are both real answers, and rounding either into whole weeks makes the
 * plan lie in a way a client notices.
 */
function PlanItem({
  item,
  wave,
  lastWave,
  dragging,
  onDragStart,
  onDragEnd,
  onMoveTo,
  onDuration,
  onRemove,
}: {
  item: ScheduledGap;
  wave: number;
  lastWave: number;
  dragging: boolean;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMoveTo: (id: string, to: number) => void;
  onDuration: (id: string, next: Duration) => void;
  onRemove: (id: string) => void;
}) {
  const gap = gapById(item.id);
  const canEarlier = wave > item.earliest;
  const blocked =
    item.blockedBy.length > 0
      ? `Cannot start before “${gapById(item.blockedBy[0]).title}”`
      : "Already in the first sprint";

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp" && canEarlier) {
      e.preventDefault();
      onMoveTo(item.id, wave - 1);
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      onMoveTo(item.id, wave + 1);
    }
  };

  return (
    <li
      draggable
      onDragStart={(e) => {
        /* Firefox will not start a drag without data on the transfer. */
        e.dataTransfer.setData("text/plain", item.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnd={onDragEnd}
      /* **Each gap is a card**, on request, and the same card the gap detail is
         made of: `rounded-lg border border-border bg-card shadow-card` with
         `px-4 py-3` inside it, which is `Field`'s `boxed` shape written out.
         The two are the most closely related things on this surface — open a
         row and you get five of these; tick it and it appears here — so a plan
         block that was a tinted rectangle while the detail beside it was a
         bordered card made them look like two different kinds of object.

         It went through a tinted ground first (`bg-muted`, then `bg-background`
         when a subtler one was asked for), and the border is the better answer
         for the same reason it is on the detail: a fill says *this is a region
         of the panel*, a border says *this is a thing*, and a thing is what you
         pick up and drag.

         **The hover is a border, not a fill.** On `bg-card` there is no tint
         left to shift to that would not undo the card, so what deepens is the
         edge — `border-border-strong`, the same step the detail's own cards
         hover to. Border rather than ring because the border is already there
         and only changes colour, so nothing inside moves by a pixel.

         What this retires: the `--muted-foreground` on `--muted` rest-state
         pairing the tinted version introduced. The duration line is back on
         `--card`, which is checked everywhere. */
      className={cn(
        "group rounded-lg border border-border bg-card px-4 py-3 shadow-card transition-colors hover:border-border-strong",
        dragging && "opacity-40",
      )}
    >
      <div className="flex items-start gap-1.5">
        <button
          type="button"
          onKeyDown={onKeyDown}
          title={canEarlier ? "Drag to another sprint, or use the arrow keys" : blocked}
          className="flex h-6 w-5 shrink-0 cursor-grab items-center justify-center rounded text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
        >
          <span className="sr-only">
            Move “{gap.title}”. Sprint {wave + 1} of {lastWave + 1}. Arrow keys move it a sprint
            {canEarlier ? "" : `. It cannot go earlier: ${blocked}`}
          </span>
          <Grip />
        </button>
        <span className="min-w-0 flex-1 text-small leading-snug">{gap.title}</span>
        <IconButton label={`Take “${gap.title}” out of the plan`} onClick={() => onRemove(item.id)}>
          <Cross />
        </IconButton>
      </div>

      {/* **The duration is on its own line, and it says what it is.**
          It was `12  w` at the end of the title's line, which is three
          problems in eleven pixels. `w` is not a word. Nothing said whether the
          number was how long the fix takes or how long the problem has been
          running. And on this row in particular it sat beside a finding that
          already contains a duration — "Vendor onboarding takes 21 days" next
          to "12 w", two numbers in weeks and days meaning opposite things.

          **`to deliver` came off**, on request, and the number is now the two
          fields alone. It was a three-word tail on every row of a panel whose
          heading is *Plan* and whose display figure is `28 weeks, end to end` —
          in a schedule, a duration against a job is the job's length and there
          is nothing else it could be. The three faults above are all fixed by
          the unit being spelled: `8 weeks` under a title says what `8 w` beside
          one did not.

          **It went under the title rather than getting more room beside it**
          because there is no room beside it: at the panel's 320px floor a
          spelled unit leaves the title about 140px, and at 1440 the longest
          title wraps to two lines anyway. So the second line is free most of
          the time and clear all of it. The indent is the grip's 16px plus the
          1.5 gap, so the line hangs off the title rather than off the row. */}
      <p className="mt-1.5 flex items-center gap-1.5 pl-[1.625rem] text-micro text-muted-foreground">
        {/* **A stroke, on request, and the ghost is gone.** The number and the
            unit share one box with a border on all four sides, hovering to
            `border-border-strong` like the card around them.

            It was two borderless fields sharing a hover ground with a dotted
            underline under them, which was right while the gaps were tinted
            rectangles and stopped being right when they became cards: on a
            `bg-card` block the hover ground was `bg-card`, so the one thing
            that said "you can edit this" fired and painted nothing, and a
            dotted underline alone is a hint rather than a control. A field on a
            card is expected to be drawn.

            The old argument against drawing it was that three rows of
            number-box plus select-box plus close-box is nine outlined controls
            in a 400px column. It survives as one box rather than two, so the
            count is three plus three, and the number and the unit read as one
            quantity rather than two settings that happen to be adjacent.

            `focus-visible` still draws the product's ring on each field. */}
        <span className="flex items-center rounded-md border border-border bg-card transition-colors group-hover:border-border-strong">
          <label>
            <span className="sr-only">How long “{gap.title}” takes to deliver</span>
            <input
              type="number"
              min={1}
              max={99}
              value={item.duration.value}
              onChange={(e) =>
                onDuration(item.id, {
                  ...item.duration,
                  value: Number(e.target.value),
                })
              }
              /* `w-9`, not `w-7`. The spin buttons are hidden with `opacity-0`
                 rather than `appearance-none`, so they still take their width
                 and a two-digit value renders as "1:" with the second digit
                 sliced. Hiding them outright would cost the hover affordance
                 the row is built around. */
              className="tabular w-11 rounded-l-md border-0 bg-transparent py-0.5 pl-1.5 pr-0.5 text-right text-micro tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&::-webkit-inner-spin-button]:opacity-0 group-hover:[&::-webkit-inner-spin-button]:opacity-100"
            />
          </label>
          <label>
            <span className="sr-only">Unit for “{gap.title}”</span>
            {/* The options are words. They were `d`, `w` and `m`, which is the
                one place in the product a unit was abbreviated, and it is the
                place with the least context to recover it from.

                It was a native `<select>` and is now the product's, like every
                other dropdown here: the list it opened was the operating
                system's, which on a card this small was a dark system sheet
                over an ivory panel. The trigger keeps the borderless shape it
                has always had, because it shares one drawn box with the number
                beside it. */}
            <Select
              value={item.duration.unit}
              onValueChange={(v) =>
                onDuration(item.id, { ...item.duration, unit: v as DurationUnit })
              }
            >
              <SelectTrigger className="h-auto w-auto cursor-pointer rounded-r-md border-0 bg-transparent py-0.5 pl-0.5 pr-1.5 text-micro shadow-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring [&_[data-slot=select-chevron]]:hidden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="min-w-[7rem]">
                {(Object.keys(UNIT_LABEL) as DurationUnit[]).map((u) => (
                  <SelectItem key={u} value={u}>
                    {UNIT_LABEL[u]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        </span>
      </p>
    </li>
  );
}

/**
 * A 24px square that says what it does only to a screen reader.
 *
 * `title` carries the reason a disabled control is disabled, which is the whole
 * point of disabling it rather than letting the click fail — but a disabled
 * button does not fire pointer events in every browser, so the tooltip goes on
 * a wrapper. A control that refuses without saying why is a bug report.
 */
function IconButton({
  label,
  hint,
  disabled,
  onClick,
  children,
}: {
  label: string;
  hint?: string;
  disabled?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <span title={hint ?? label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent disabled:hover:text-muted-foreground"
      >
        <span className="sr-only">{label}</span>
        {children}
      </button>
    </span>
  );
}

const arrow = "h-3.5 w-3.5";

/**
 * A date that reads in the product's format and edits with the platform's.
 *
 * A bare `<input type="date">` renders in the reader's locale, so `08/17/2026`
 * sat next to `1 Mar 2027` in the same sentence. Formatting the input is not
 * possible, so the real input is laid over the formatted text at zero opacity:
 * you read `17 Aug 2026`, and clicking or tabbing to it gets the platform's own
 * picker, its keyboard handling and its screen-reader semantics.
 *
 * **The input is the element, not a decoration over a button.** It keeps its
 * label and its place in the tab order; the visible text takes the focus ring
 * off it through `peer-focus-visible`, which is the only part that had to be
 * wired by hand.
 */
/**
 * Six dots. The one shape a pointer reads as "pick this up" without a label.
 *
 * **20px, up from 14**, on request, and the dots grew with the box rather than
 * the box alone: a bigger square holding the same six specks is a bigger target
 * that does not look any more like a handle. The drag is the panel's whole
 * interaction and the mark for it was the smallest thing in the card.
 */
function Grip() {
  return (
    <svg viewBox="0 0 16 16" className="h-5 w-5" aria-hidden>
      {[4, 8, 12].map((y) =>
        [6, 10].map((x) => <circle key={`${x}-${y}`} cx={x} cy={y} r="1.4" fill="currentColor" />),
      )}
    </svg>
  );
}

function Cross() {
  return (
    <svg viewBox="0 0 16 16" className={arrow} fill="none" aria-hidden>
      <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

/**
 * GapRow plus a plan tick-box and an edit control. The row itself is unchanged
 * and shared: **the edit button is a sibling of `GapRow`, not a part of it.**
 *
 * Two reasons, and both are load-bearing. `GapRow`'s whole collapsed row is a
 * `<button>`, and a button inside a button is invalid markup that browsers
 * repair by moving the inner one out of the row. And editing belongs to Gaps
 * rather than to the component: Research renders the same rows and nothing on
 * Research is a working list you correct.
 *
 * **It is always visible, not revealed on hover.** A hover-reveal would be the
 * quieter list, and it would put the control out of reach of every touch
 * device — which is the phone this surface is read on in the minutes before a
 * call. The cost is real and is the one to watch: twelve more focusable things
 * in a list whose whole problem is density (§7.1), which is why it is a 24px
 * ghost in `--muted-foreground` rather than a labelled button.
 */
function SelectableGapRow({
  gap,
  checked,
  onToggle,
  onEdit,
  selectable,
}: {
  gap: Gap;
  checked: boolean;
  onToggle: () => void;
  onEdit: (trigger: HTMLButtonElement | null) => void;
  /** Plan mode. See below — the tick-box has nothing to do without it. */
  selectable: boolean;
}) {
  const { has, save, remove } = useSaved();
  const item = { kind: "gap" as const, id: gap.id, label: gap.plainLine, href: "/gaps" };
  const saved = has("gap", gap.id);
  const toggleSave = () => (saved ? remove("gap", gap.id) : save(item));
  /* The row's own overflow trigger, so the correction dialog can put focus
     back on the thing that was pressed. It is a ref per row, which the note on
     `lastEditTrigger` in `ProjectsView` argues against for a *list* — but that
     is a map of refs keyed by id, and this is one ref inside one row's own
     component instance, created and discarded with the row. */
  const menuTrigger = useRef<HTMLButtonElement>(null);

  return (
    /* **A drawn card per finding**, on request, and it is the shape Questions
       already uses one surface across: `rounded-lg border border-border bg-card
       shadow-card`, hovering its border rather than its fill so nothing inside
       moves a pixel. Twelve rows separated by hairlines read as a printed
       table, which is the register this surface is least well served by — the
       findings are twelve separate things a consultant picks one of, not twelve
       readings of one measure, and a card is what says separate.

       The controls sit inside the card, again like Questions: a bookmark and a
       pencil floating outside a drawn box read as marks on the page rather than
       as part of the thing they act on. */
    <li className="flex items-start gap-3 rounded-lg border border-border bg-card px-3.5 py-2 shadow-card transition-colors hover:border-border-strong">
      {/* **The tick-box goes with the plan panel**, because it is the plan
          panel's control: its whole job is choosing what appears over there.
          Left on screen with the panel hidden, twelve of them would be twelve
          tab stops whose effect cannot be seen — the exact fault this surface
          already records about sorting by a price that is not on the row.

          What is ticked survives being hidden, so turning the plan back on
          restores the selection rather than starting from the default three. */}
      {selectable && (
        <Checkbox
          checked={checked}
          onChange={onToggle}
          label={`Add “${gap.title}” to the plan`}
          className="mt-2.5"
        />
      )}
      {/* No rank number on this surface. `gap.rank` is the value ranking, and
          with money off the page it is a column of digits ordered by something
          invisible — under the Sequence ordering it reads 8, 9, 11, 12, 3,
          which looks like a fault. Research keeps it, where the value it ranks
          by is on the row. Putting it back is one prop if the list turns out to
          need a handle. */}
      <GapRow gap={gap} as="div" mode="delivery" showRank={false} className="min-w-0 flex-1" />
      {/* Save, then edit, in the order they are reached for: put it aside for
          the conversation, or correct it. Both are siblings of the row rather
          than inside it — `GapRow` is a `<button>` on other surfaces and a
          button inside a button is invalid markup.

          **Both are drawn boxes here, not ghosts**, on request. `SaveButton`
          already draws one by default and Gaps was the surface stripping it
          back to `border-0 bg-transparent shadow-none`; the edit control was
          built to match that ghost. What the box buys, beyond looking placed:
          the pair now reads as two controls rather than as two marks on the
          row, and at 32px each they clear the 24px touch floor the old 24px
          ghost sat under, on a list read on an actual phone.

          They are paired in their own `gap-1.5` box so the space between the
          two is tighter than the `gap-3` the row puts between its columns.
          Two buttons 12px apart read as two separate columns; at 6px they read
          as one control cluster, which is what they are.

          `mt-0.5` puts that cluster on the row's first baseline, beside the
          finding rather than beside the whole expanded detail. The tick-box
          sits a notch lower because it is smaller. Both follow the row's own
          vertical padding, so they move if `py-2` does — and it just did, when
          the row stopped drawing its own ground and the card took over the
          spacing. */}
      {/* **Both controls are in one overflow now**, and the row went from four
          trailing objects to three. Twelve findings each carrying a bookmark
          and a pencil drew twenty-four controls a reader had to look past to
          read twelve sentences, and neither is an action anybody takes while
          scanning: you save once you have chosen and you correct once you have
          read. Both are one press away rather than gone — see `OverflowMenu`.

          **Saved state survives the move**, which is the one thing hiding a
          bookmark could have cost. It is a dot on the trigger, and the menu row
          itself carries the tick and announces as pressed. */}
      {/* **`self-center`, not a top margin.** It carried `mt-0.5` to sit on the
          row's first baseline, which is what the pair of controls it replaced
          wanted: two 32px boxes beside a finding read as belonging to the first
          line of it. One 28px box does not — against a card that is taller than
          its single line of text it read as pinned to the top corner. The card
          keeps `items-start` for the tick-box, which does still belong on the
          first line, so this centres itself rather than the row centring
          everything. */}
      <OverflowMenu label={gap.title} marked={saved} triggerRef={menuTrigger} className="self-center">
        {(close) => (
          <>
            <MenuItem
              pressed={saved}
              icon={<BookmarkIcon filled={saved} />}
              onSelect={() => {
                toggleSave();
                close();
              }}
            >
              {saved ? "Saved for the call" : "Save for the call"}
            </MenuItem>
            <MenuItem
              icon={<EditIcon />}
              onSelect={() => {
                /* The trigger is handed up so focus can be put back on it when
                   the correction dialog closes. The menu's own trigger is the
                   thing that was pressed, so that is what goes up — `close()`
                   has already returned focus to it. */
                close();
                onEdit(menuTrigger.current);
              }}
            >
              Needs correction
            </MenuItem>
          </>
        )}
      </OverflowMenu>
    </li>
  );
}

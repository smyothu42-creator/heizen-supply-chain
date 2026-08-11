import { gapById, sequenceWaves } from "./suvarna";

/**
 * The plan, as a schedule rather than as a total.
 *
 * Gaps used to add up to a rupee figure and stop there. Money has come off this
 * surface entirely — it is Research › Money's subject, and it is stated there
 * with its base, its rate and its range, which is the only honest way to state
 * it (§7.11). What is left on Gaps is the thing money was standing in for: what
 * has to happen, in what order, and by when.
 *
 * **The order is computed and then editable, and both halves matter.** Computed,
 * because the prerequisites are real: five of the twelve gaps do not pay until
 * something else lands, and asking a consultant to hold that in their head is
 * the same mistake §7.12 records about overlapping savings. Editable, because a
 * delivery date is a negotiation and the pipeline does not sit in that meeting.
 *
 * **What cannot be edited is a prerequisite.** Moving a gap in front of
 * something it depends on is not a preference, it is a plan that does not
 * deliver, so `earliest` says where it may go and both the drag and the
 * keyboard refuse anything above it. This is the one place the tool holds its
 * ground against the user, and it holds it with a named reason rather than by
 * accepting the change and warning about it afterwards.
 */

/** A Monday, and a fixed constant rather than "today plus a fortnight".
 *  `new Date()` in a client component renders one date on the server and
 *  another in the browser, which is a hydration error. The prototype's clock is
 *  the research date; this is the working week after it. */
export const PLAN_START = "2026-08-17";

/**
 * Durations are stored in the unit they were typed in.
 *
 * A three-day cleanse and a four-month rollout are both real answers here, and
 * rounding either into whole weeks makes the plan lie in a way a client will
 * notice. The schedule converts to weeks to do its arithmetic, because a wave
 * costs its longest job and two jobs can only be compared in one unit, but the
 * number the consultant typed is the number they see.
 */
export type DurationUnit = "days" | "weeks" | "months";

export interface Duration {
  value: number;
  unit: DurationUnit;
}

/** A month is 4.345 weeks, not 4. Four weeks is 28 days, and twelve of those is
 *  336 days, which loses a month off a year-long plan. */
const WEEKS_PER: Record<DurationUnit, number> = { days: 1 / 7, weeks: 1, months: 4.345 };

export const UNIT_LABEL: Record<DurationUnit, string> = {
  days: "days",
  weeks: "weeks",
  months: "months",
};

export function weeksOf(d: Duration): number {
  return d.value * WEEKS_PER[d.unit];
}

export interface PlanEdits {
  /** ISO date the first wave starts. */
  start: string;
  /** Duration, where the consultant has overridden the estimate. */
  duration: Record<string, Duration>;
  /** Wave index, where the consultant has moved a gap. */
  wave: Record<string, number>;
}

export const NO_EDITS: PlanEdits = { start: PLAN_START, duration: {}, wave: {} };

export interface ScheduledGap {
  id: string;
  duration: Duration;
  weeks: number;
  /** Empty unless something in the plan has to land first. */
  blockedBy: string[];
  /** The earliest wave this gap may sit in, as a compacted index. */
  earliest: number;
}

export interface Wave {
  /** The uncompacted index this wave came from. A move is written back as one
   *  of these, so `edits.wave` and the computed order stay in the same space. */
  raw: number;
  gaps: ScheduledGap[];
  /** The longest job in the wave. Work inside a wave runs in parallel. */
  weeks: number;
  startISO: string;
  endISO: string;
}

export interface Schedule {
  waves: Wave[];
  totalWeeks: number;
  startISO: string;
  endISO: string;
  /** Any override at all, so the panel can offer to put it back. */
  edited: boolean;
}

export function durationFor(id: string, edits: PlanEdits): Duration {
  return edits.duration[id] ?? { value: gapById(id).weeks, unit: "weeks" };
}

const weeksFor = (id: string, edits: PlanEdits) => weeksOf(durationFor(id, edits));

/**
 * Wave index per gap: the suggested order, with overrides laid on top, then
 * pushed back down until every prerequisite is satisfied.
 *
 * The repair loop is what makes an override safe. A gap moved earlier than
 * something it needs gets pushed back behind it, and so does anything that then
 * depends on *it*, which is why this iterates rather than doing one pass.
 */
function waveIndex(ids: string[], edits: PlanEdits): Map<string, number> {
  const present = new Set(ids);
  const index = new Map<string, number>();

  sequenceWaves(ids).forEach((wave, i) => {
    wave.forEach((id) => index.set(id, edits.wave[id] ?? i));
  });

  for (let pass = 0; pass < ids.length + 1; pass++) {
    let moved = false;
    for (const id of ids) {
      const floor = minWave(id, present, index);
      if ((index.get(id) ?? 0) < floor) {
        index.set(id, floor);
        moved = true;
      }
    }
    if (!moved) break;
  }
  return index;
}

/** The earliest wave a gap may sit in: one past its latest prerequisite. */
function minWave(id: string, present: Set<string>, index: Map<string, number>): number {
  const needs = gapById(id).requires.filter((r) => present.has(r));
  return needs.reduce((floor, r) => Math.max(floor, (index.get(r) ?? 0) + 1), 0);
}

export function schedule(ids: string[], edits: PlanEdits): Schedule {
  const present = new Set(ids);
  const index = waveIndex(ids, edits);

  /* Indices are compacted before anything is shown. Moving the only gap out of
     wave 2 must not leave a labelled empty wave behind, and "Wave 4" on a plan
     with three of them is a bug the consultant reads as data. */
  const used = [...new Set([...index.values()])].sort((a, b) => a - b);
  const rank = new Map(used.map((v, i) => [v, i]));
  const at = (id: string) => rank.get(index.get(id) ?? 0) ?? 0;

  const grouped: string[][] = used.map(() => []);
  for (const id of ids) grouped[at(id)].push(id);
  for (const wave of grouped) {
    wave.sort((a, b) => weeksFor(b, edits) - weeksFor(a, edits) || a.localeCompare(b));
  }

  let cursor = edits.start;
  const waves: Wave[] = grouped.map((wave, i) => {
    const weeks = Math.max(0, ...wave.map((id) => weeksFor(id, edits)));
    const startISO = cursor;
    const endISO = addWeeks(cursor, weeks);
    cursor = endISO;
    return {
      raw: used[i] ?? i,
      weeks,
      startISO,
      endISO,
      gaps: wave.map((id) => {
        const blockedBy = gapById(id).requires.filter((r) => present.has(r));
        return {
          id,
          duration: durationFor(id, edits),
          weeks: weeksFor(id, edits),
          blockedBy,
          /* Compacted, because that is the space the UI drags in. */
          earliest: blockedBy.reduce((floor, r) => Math.max(floor, at(r) + 1), 0),
        };
      }),
    };
  });

  return {
    waves,
    totalWeeks: waves.reduce((sum, w) => sum + w.weeks, 0),
    startISO: edits.start,
    endISO: cursor,
    edited:
      edits.start !== PLAN_START ||
      Object.keys(edits.duration).length > 0 ||
      Object.keys(edits.wave).length > 0,
  };
}

/** The wave a gap is in today, so a move can be expressed as a target index. */
export function waveOf(id: string, sched: Schedule): number {
  return sched.waves.findIndex((w) => w.gaps.some((g) => g.id === id));
}

/* -------------------------------------------------------------------------- */
/* Dates. All UTC — a plan that shifts by a day depending on the reader's       */
/* timezone is worse than one with no dates on it.                             */
/* -------------------------------------------------------------------------- */

export function addWeeks(iso: string, weeks: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  /* Rounded to whole days, because a duration in months does not land on one.
     Half a day of drift compounds across four waves into a wrong date. */
  d.setUTCDate(d.getUTCDate() + Math.round(weeks * 7));
  return d.toISOString().slice(0, 10);
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** `18 Aug 2026`. Long enough to be unambiguous, short enough for a 400px column. */
export function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

/** `18 Aug`, for the two ends of a wave, where the year is already stated above. */
export function formatShort(iso: string): string {
  const d = new Date(`${iso}T00:00:00Z`);
  return `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

/**
 * A span in the largest unit that does not lie about it.
 *
 * Waves and totals are held in weeks because that is the only unit two jobs can
 * be compared in, but "0.4 weeks" is not something anybody says. Under a week
 * it reads in days.
 */
export function formatSpan(weeks: number): string {
  if (weeks < 1) {
    const days = Math.round(weeks * 7);
    return `${days} ${days === 1 ? "day" : "days"}`;
  }
  const w = Math.round(weeks * 10) / 10;
  return `${w % 1 === 0 ? w.toFixed(0) : w.toFixed(1)} ${w === 1 ? "week" : "weeks"}`;
}

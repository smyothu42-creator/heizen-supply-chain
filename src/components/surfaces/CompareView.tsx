"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { currentLane, lanes, laneById, stages } from "@/lib/compare";
import { Eyebrow } from "@/components/meridian/Primitives";
import { SummaryStrip } from "@/components/directions/Frames";

/**
 * Compare — lanes stacked, aligned on shared process stages.
 *
 * The delta row is the argument; everything else is supporting evidence, so the
 * delta gets the most weight on screen. Selecting a company adds a lane below,
 * it never replaces the view. See data-display-patterns and CLAUDE.md section 5.
 */
export function CompareView() {
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

  const worstStage = reference
    ? [...stages].sort((a, b) => {
        const da = delta(a.id, reference.id) ?? -Infinity;
        const db = delta(b.id, reference.id) ?? -Infinity;
        return db - da;
      })[0]
    : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-3 py-5 sm:px-4">
      <Eyebrow>{currentLane.company} · against other work</Eyebrow>
      <h1 className="mt-1.5 font-display text-h1 leading-tight">Where they sit</h1>
      <p className="mt-2 text-base text-muted-foreground measure">
        The same six steps, measured the same way, for every company. What matters is the row at the
        bottom of each block — the distance between Suvarna and whoever you are holding them
        against. That gap is the pitch.
      </p>

      <div className="mt-4">
        <SummaryStrip
          items={[
            { label: "Stages compared", value: String(stages.length) },
            { label: "Lanes on screen", value: String(stacked.length) },
            { label: "Measured against", value: reference?.company ?? "—" },
            {
              label: "Widest gap",
              value: worstStage ? worstStage.name : "—",
            },
          ]}
        />
      </div>

      {/* ------------------------------------------------- lane picker */}
      <fieldset className="mt-5">
        <legend className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
          Stack another lane below
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {lanes
            .filter((l) => !l.isCurrent)
            .map((lane) => (
              <label
                key={lane.id}
                className={cn(
                  "flex cursor-pointer items-start gap-2 rounded-lg border px-3 py-2 transition-colors",
                  shown.has(lane.id)
                    ? "border-foreground bg-card"
                    : "border-border hover:border-border-strong",
                )}
              >
                <input
                  type="checkbox"
                  checked={shown.has(lane.id)}
                  onChange={() => toggle(lane.id)}
                  className="mt-0.5 h-4 w-4 accent-foreground"
                />
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
            One lane on its own is a list of numbers. Tick a company above and the deltas appear —
            that is the only thing on this screen worth reading out loud.
          </p>
        </div>
      )}

      {/* ------------------------------------------------- the lanes */}
      <div className="mt-6 space-y-6">
        {stages.map((stage) => (
          <section key={stage.id} className="rounded-lg border border-border bg-card p-4">
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
                          <span className="ml-1.5 text-micro text-muted-foreground">benchmark</span>
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
                        <td colSpan={2} className="py-1.5 text-right text-muted-foreground italic">
                          Not measured for this client
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* The loudest row on the screen. */}
            {reference && (
              <DeltaRow stageId={stage.id} referenceId={reference.id} />
            )}
          </section>
        ))}
      </div>

      <section className="mt-8 border-t border-border pt-5">
        <h2 className="text-base font-medium">How to read this honestly</h2>
        <ul className="mt-2 space-y-1.5 text-small text-muted-foreground measure">
          <li>
            Suvarna&apos;s figures come from two calls and one email thread, not from their ERP.
            Kesarwani and Deccan are measured from delivered systems, so they are firmer numbers.
          </li>
          <li>
            &ldquo;Best in class&rdquo; is an upper-quartile benchmark for food and beverage, not a
            single real company. It is a target, not a competitor.
          </li>
          <li>
            A blank means we never measured it for that client. It does not mean zero and it does
            not mean good.
          </li>
        </ul>
      </section>
    </div>
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
      <span className="text-small text-muted-foreground">
        Suvarna against {ref.company}
      </span>
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

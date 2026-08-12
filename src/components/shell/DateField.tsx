"use client";

import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { formatDay } from "@/lib/plan";

/**
 * A date, written in the product's own words, that opens the product's own
 * calendar.
 *
 * **It was a native `<input type="date">` under a formatted span**, at zero
 * opacity, which bought the platform's picker for free. Two things were wrong
 * with it and both were asked about. Clicking the date did nothing in Chrome —
 * a date input only opens its picker from the calendar icon, and the icon was
 * the part being hidden — so the one editable thing in the panel looked like
 * text. And when it did open, it opened the *browser's* calendar: a white sheet
 * with the OS accent on it, in the middle of a themed dark panel.
 *
 * So the calendar is drawn here, from the same tokens as everything else, and
 * it is the same in both themes because it is made of `--card`, `--border` and
 * `--evidence` like every other popover in the product.
 *
 * **What that costs, stated rather than discovered later:** on a phone this no
 * longer opens the platform's own picker, which is the argument `SelectField`
 * makes for staying a native `<select>`. It is a real loss and the reason the
 * grid keeps full keyboard operation — arrows by a day, page keys by a month,
 * Home and End to the ends of the week — rather than being a pointer-only
 * control with a text fallback.
 *
 * All UTC, matching `lib/plan.ts`: a plan that shifts by a day depending on the
 * reader's timezone is worse than one with no dates on it.
 */

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/* Monday first. The week a plan is read against starts on a working day. */
const WEEKDAYS: [key: string, letter: string][] = [
  ["mon", "M"],
  ["tue", "T"],
  ["wed", "W"],
  ["thu", "T"],
  ["fri", "F"],
  ["sat", "S"],
  ["sun", "S"],
];

function parse(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function shiftDays(iso: string, days: number): string {
  const d = parse(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return toISO(d);
}

/** Same day next month, clamped: 31 Jan going forward is 28 Feb, not 3 Mar. */
function shiftMonths(iso: string, months: number): string {
  const d = parse(iso);
  const day = d.getUTCDate();
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  const last = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 0)).getUTCDate();
  d.setUTCDate(Math.min(day, last));
  return toISO(d);
}

/** The days of `iso`'s month, padded at the front to the Monday of its first week. */
function monthGrid(iso: string): (string | null)[] {
  const d = parse(iso);
  const year = d.getUTCFullYear();
  const month = d.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1));
  /* `getUTCDay` is Sunday-first; this is the offset in a Monday-first week. */
  const lead = (first.getUTCDay() + 6) % 7;
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  return [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: days }, (_, i) => toISO(new Date(Date.UTC(year, month, i + 1)))),
  ];
}

export function DateField({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  /* The day the arrow keys are standing on, which is also what decides which
     month is drawn. One piece of state rather than two that can disagree. */
  const [cursor, setCursor] = useState(value);
  const root = useRef<HTMLSpanElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const opening = useRef(false);

  const close = (refocus: boolean) => {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  };

  /* Focus follows the cursor, but only once it is already in the grid — moving
     the month with the chevrons must not snatch focus off the chevron you are
     pressing. `opening` is the one exception: the first pass after opening puts
     focus on the selected day. */
  useEffect(() => {
    if (!open) return;
    const el = grid.current;
    if (!el) return;
    if (!opening.current && !el.contains(document.activeElement)) return;
    opening.current = false;
    el.querySelector<HTMLButtonElement>(`[data-iso="${cursor}"]`)?.focus();
  }, [open, cursor]);

  /* Pointer down rather than click: a click that lands on something which moves
     under it never reaches the document. */
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  const onGridKey = (e: React.KeyboardEvent) => {
    const move = (next: string) => {
      e.preventDefault();
      setCursor(next);
    };
    if (e.key === "ArrowLeft") move(shiftDays(cursor, -1));
    if (e.key === "ArrowRight") move(shiftDays(cursor, 1));
    if (e.key === "ArrowUp") move(shiftDays(cursor, -7));
    if (e.key === "ArrowDown") move(shiftDays(cursor, 7));
    if (e.key === "PageUp") move(shiftMonths(cursor, -1));
    if (e.key === "PageDown") move(shiftMonths(cursor, 1));
    if (e.key === "Home") move(shiftDays(cursor, -((parse(cursor).getUTCDay() + 6) % 7)));
    if (e.key === "End") move(shiftDays(cursor, 6 - ((parse(cursor).getUTCDay() + 6) % 7)));
  };

  const shown = parse(cursor);

  return (
    <span
      ref={root}
      className="relative inline-flex"
      onKeyDown={(e) => {
        if (e.key === "Escape" && open) {
          e.stopPropagation();
          close(true);
        }
      }}
    >
      <button
        ref={trigger}
        type="button"
        aria-label={`${label}: ${formatDay(value)}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => {
          if (open) return close(false);
          setCursor(value);
          opening.current = true;
          setOpen(true);
        }}
        className="tabular -mx-1 rounded-md px-1 text-foreground underline decoration-border-strong decoration-dotted underline-offset-4 transition-colors hover:decoration-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {formatDay(value)}
      </button>

      {open && (
        /* Below the trigger and left-aligned to it, because the date sits at the
           reading edge of a 400px column: a right-aligned popover would hang off
           the panel. `z-20` keeps it under the masthead's `z-30`, which it never
           reaches anyway — it opens downwards. */
        <div
          role="dialog"
          aria-label={label}
          className="absolute left-0 top-full z-20 mt-2 w-[16.5rem] rounded-lg border border-border bg-card p-3 shadow-raised"
        >
          <div className="flex items-center justify-between gap-2">
            <Step label="Previous month" onClick={() => setCursor(shiftMonths(cursor, -1))}>
              <path d="M10 3.5L5.5 8l4.5 4.5" />
            </Step>
            <p className="text-small font-medium text-foreground">
              {MONTHS_LONG[shown.getUTCMonth()]} {shown.getUTCFullYear()}
            </p>
            <Step label="Next month" onClick={() => setCursor(shiftMonths(cursor, 1))}>
              <path d="M6 3.5L10.5 8L6 12.5" />
            </Step>
          </div>

          <div className="mt-2 grid grid-cols-7 gap-0.5">
            {WEEKDAYS.map(([key, letter]) => (
              <span
                key={key}
                aria-hidden
                className="flex h-6 items-center justify-center text-micro font-medium text-muted-foreground"
              >
                {letter}
              </span>
            ))}
          </div>

          <div ref={grid} onKeyDown={onGridKey} className="grid grid-cols-7 gap-0.5">
            {monthGrid(cursor).map((iso, i) =>
              iso === null ? (
                <span key={`pad-${i}`} />
              ) : (
                <button
                  key={iso}
                  type="button"
                  data-iso={iso}
                  /* Roving tab stop: one way in and out of the grid, and the
                     arrow keys do the rest. */
                  tabIndex={iso === cursor ? 0 : -1}
                  aria-label={formatDay(iso)}
                  aria-pressed={iso === value}
                  onClick={() => {
                    onChange(iso);
                    close(true);
                  }}
                  className={cn(
                    "tabular flex h-8 items-center justify-center rounded-md text-small transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
                    iso === value
                      ? "bg-evidence font-medium text-card"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  {parse(iso).getUTCDate()}
                </button>
              ),
            )}
          </div>
        </div>
      )}
    </span>
  );
}

/** A month step. 28px, which is the smallest a chevron can be and still be hit. */
function Step({
  label,
  onClick,
  children,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <svg viewBox="0 0 16 16" className="h-4 w-4" fill="none" aria-hidden>
        <g stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
          {children}
        </g>
      </svg>
    </button>
  );
}

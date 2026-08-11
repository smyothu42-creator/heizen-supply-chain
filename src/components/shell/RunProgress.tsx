"use client";

import { useEffect, useMemo, useState } from "react";

import {
  CheckIcon,
  EmailIcon,
  FilingIcon,
  TranscriptIcon,
  WebIcon,
} from "@/components/meridian/Icons";
import { Button } from "@/components/ui/button";
import {
  DialogBody,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/cn";
import { company } from "@/lib/suvarna";

/**
 * What a run looks like while it is running.
 *
 * The pipeline reads public sources before it reads anything the client has
 * handed over, and that order is the thing worth showing: a consultant who has
 * uploaded nothing still gets a dossier, and one who has uploaded three files
 * can see which of the findings rest on them. So this is a **research log**
 * rather than a spinner — named steps, and under each one the documents it
 * actually opened, arriving one at a time.
 *
 * The alternative was a bar and the word "Working". A bar says how long is
 * left; it does not say what is being read, and what is being read is the only
 * part a consultant can judge. It is also the part that makes an unattributable
 * claim impossible later (§4): every line here becomes a source chip.
 *
 * **It is designed as real and labelled honestly**, like `RunButton` itself and
 * the connectors. Nothing is fetched. The steps are timed, and the last screen
 * says so rather than letting the consultant believe the dossier behind it just
 * changed. A progress display that invents a result is worse than no progress
 * display, because the number it produces gets said out loud on a call.
 */

type Kind = "web" | "filing" | "transcript" | "email";

type Line = { text: string; kind?: Kind };
type Step = { title: string; lines: Line[] };

/** Which surface asked. The reading is shared; only the last step differs. */
export type RunKind = "research" | "gaps" | "questions";

/* The four sources named here are the four in `suvarna.ts` that carry
   findings. They are written out rather than mapped off `sources`, because the
   order a pipeline opens things in is not the order the fixture lists them —
   the web comes first, and the uploads come last. */
function stepsFor(kind: RunKind): Step[] {
  const shared: Step[] = [
    {
      title: "Reading the brief",
      lines: [
        { text: `${company.name} · ${company.sector}` },
        { text: "4 stakeholders named, 1 met" },
      ],
    },
    {
      title: "Searching public sources",
      lines: [
        { text: "Press and trade coverage · 11 items", kind: "web" },
        { text: "Careers page · 6 open roles", kind: "web" },
        { text: "MCA filings FY23 to FY25", kind: "filing" },
        { text: "FY25 Annual Report · 148 pages", kind: "filing" },
      ],
    },
    {
      title: "Reading what you uploaded",
      lines: [
        { text: "Discovery call 1 · 41 min", kind: "transcript" },
        { text: "Discovery call 2 · 55 min", kind: "transcript" },
        { text: "FY25 procurement pain points · 6 messages", kind: "email" },
      ],
    },
    {
      title: "Pulling out claims",
      lines: [
        { text: "19 claims, every one back to a source" },
        { text: "5 sources corroborate, none contradict" },
      ],
    },
  ];

  const last: Record<RunKind, Step> = {
    research: {
      title: "Writing the dossier",
      lines: [
        { text: "Seven directions" },
        { text: `Confidence: ${company.confidence}` },
      ],
    },
    gaps: {
      title: "Ranking the gaps",
      lines: [
        { text: "12 gaps, 3 waiting on something else" },
        { text: "Sequenced into 2 waves" },
      ],
    },
    questions: {
      title: "Ordering the questions",
      lines: [
        { text: "11 questions, 2 asking for data" },
        { text: "Ordered by what the next call can settle" },
      ],
    },
  };

  return [...shared, last[kind]];
}

const KIND_ICON = {
  web: WebIcon,
  filing: FilingIcon,
  transcript: TranscriptIcon,
  email: EmailIcon,
} as const;

/** 420ms a line. Fast enough not to be a wait, slow enough to be read. */
const EVERY = 420;

export function RunProgress({ kind, onClose }: { kind: RunKind; onClose: () => void }) {
  const steps = useMemo(() => stepsFor(kind), [kind]);
  const total = useMemo(() => steps.reduce((n, s) => n + s.lines.length, 0), [steps]);

  /** Lines revealed so far. One counter drives every mark on the screen. */
  const [seen, setSeen] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (seen >= total) {
      const t = setTimeout(() => setDone(true), 500);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setSeen((n) => n + 1), seen === 0 ? 300 : EVERY);
    return () => clearTimeout(t);
  }, [seen, total]);

  /* Where each step starts in the flat count, so a step's own state is
     arithmetic rather than a second piece of state to keep in step. */
  let offset = 0;
  const state = steps.map((s) => {
    const shown = Math.max(0, Math.min(s.lines.length, seen - offset));
    const at = offset;
    offset += s.lines.length;
    return { step: s, shown, running: seen >= at && seen < offset, done: seen >= offset };
  });

  const current = state.find((s) => s.running)?.step.title ?? "";

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {done ? "Run finished" : `Researching ${company.name}`}
        </DialogTitle>
        <DialogDescription>
          {done
            ? "Nothing on the page changed."
            : "Public sources first, then the files you have uploaded."}
        </DialogDescription>
      </DialogHeader>

      <DialogBody>
        {/* The bar is the second reading, not the first. It says how much is
            left; the list says what is happening, which is the part a
            consultant can judge. `motion-reduce` stops it sliding and leaves it
            correct — the same split the ask pill's ring documents. */}
        <div className="h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
          <div
            className="h-full rounded-full bg-evidence transition-[width] duration-300 motion-reduce:transition-none"
            style={{ width: `${Math.round((seen / total) * 100)}%` }}
          />
        </div>

        {/* One announcement per step, not per line. A screen reader reading
            fifteen document names in six seconds is noise, and the step title
            is the part that says where the run has got to. */}
        <p className="sr-only" role="status" aria-live="polite">
          {done ? "Run finished." : current}
        </p>

        <ol className="mt-4 space-y-3">
          {state.map(({ step, shown, running, done: over }) => (
            <li key={step.title} className="flex items-start gap-3">
              <Mark running={running && !done} done={over || done} />
              <div className="min-w-0 flex-1">
                <p
                  className={cn(
                    "text-small",
                    over || running ? "font-medium text-foreground" : "text-muted-foreground",
                  )}
                >
                  {step.title}
                </p>
                {shown > 0 && (
                  <ul className="mt-1 space-y-1">
                    {step.lines.slice(0, shown).map((line) => {
                      const Icon = line.kind ? KIND_ICON[line.kind] : null;
                      return (
                        <li
                          key={line.text}
                          className="flex items-start gap-1.5 text-micro text-muted-foreground"
                        >
                          {Icon && <Icon className="mt-px size-3 shrink-0" />}
                          <span className="min-w-0">{line.text}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ol>

        {done && (
          /* The honest ending. Everything above this is a timed sequence, and
             a consultant who believes the dossier behind it was just rebuilt
             will say so on a call. Dashed and in the caveat register the
             product already uses for what it cannot tell you. */
          <p className="mt-4 rounded-lg border border-dashed border-border-strong px-3 py-2 text-small text-muted-foreground">
            The prototype reads one static research set, so this run rebuilt the
            same dossier. Wiring the pipeline is what makes this real.
          </p>
        )}
      </DialogBody>

      <DialogFooter>
        <Button type="button" variant={done ? "default" : "outline"} onClick={onClose}>
          {done ? "Back to the dossier" : "Stop this run"}
        </Button>
      </DialogFooter>
    </>
  );
}

/** Pending, running, done — as shape, so the state survives greyscale. */
function Mark({ running, done }: { running: boolean; done: boolean }) {
  if (done) {
    return (
      <span className="mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full bg-evidence text-card">
        <CheckIcon className="size-3" />
      </span>
    );
  }
  if (running) {
    return (
      <span
        className="mt-0.5 size-4 shrink-0 animate-spin rounded-full border-2 border-border border-t-evidence motion-reduce:animate-none"
        aria-hidden
      />
    );
  }
  return (
    <span
      className="mt-0.5 size-4 shrink-0 rounded-full border border-dashed border-border-strong"
      aria-hidden
    />
  );
}

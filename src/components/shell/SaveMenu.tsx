"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronIcon, DownloadIcon } from "@/components/meridian/Icons";
import { company, gapById } from "@/lib/suvarna";
import { UNIT_LABEL, formatDay, formatSpan, type Schedule } from "@/lib/plan";

/**
 * Take the plan out of the tool. **It really downloads.**
 *
 * A plan that only exists inside the product is a plan that gets retyped into a
 * deck, and a retyped plan is where the dates stop matching the ones the client
 * was shown. So this is the one control on Gaps that is not "designed as real
 * and labelled honestly": it does the thing.
 *
 * **The formats changed when it was wired, and that is the honest trade.** It
 * offered PDF, PNG and JPG, which read as the three places a plan ends up. None
 * of the three can be produced in the browser without a rendering library, and
 * a text file named `.pdf` is worse than a button that admits it is not wired:
 * the consultant emails it to a client and it does not open. What is here
 * instead is three formats that are genuinely written, from the schedule
 * currently on screen, and that cover the same three destinations: a
 * spreadsheet to work in, a Markdown block to paste into a proposal, and plain
 * text to paste into a message.
 *
 * **The file is built from `sched`, not from the fixture.** Whatever the
 * consultant dragged, retimed or moved the start date to is what comes out,
 * because a plan that exports the suggested order rather than the agreed one is
 * how the dates stop matching again.
 *
 * The popover opens `right-0`, against the edge it is nearest, for the reason
 * `ProjectMenu` does. It is `text-foreground` explicitly for the same reason
 * too, in case this ever lands on a coloured ground: a popover that escapes a
 * band and inherits its ink renders white on white and simply is not there.
 */
export function SaveMenu({ sched }: { sched: Schedule }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open]);

  const take = (f: Format) => {
    const name = `${slug(company.name)}-delivery-plan-${sched.startISO}.${f.ext}`;
    download(name, f.mime, f.build(sched));
    setDone(name);
  };

  return (
    <div ref={wrap} className="relative shrink-0">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          setOpen((v) => !v);
          setDone(null);
        }}
        // Same drawn button as Research's *Related resources*, on request: both
        // are the control that takes the thing on screen somewhere else, and a
        // bare text link for one of them read as a caption on the card header.
        className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card px-2.5 py-1.5 text-micro font-medium text-muted-foreground shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {/* The label says what happens, not what it is called. "Save" in a tool
            with no server is a promise about storage that nothing here keeps;
            a file arriving in the downloads folder is the whole of what this
            does. The arrow says the same thing a second way, which is worth
            the 14px on a control that leaves the product. */}
        <DownloadIcon />
        Download
        {/* The product has one chevron and it points right, for disclosure.
            A menu opens downwards, so this one is turned rather than drawn a
            second time. */}
        <span className={open ? "-rotate-90" : "rotate-90"} aria-hidden>
          <ChevronIcon />
        </span>
      </button>

      {open && (
        <div
          role="menu"
          aria-label="Download the plan"
          className="absolute right-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-raised"
        >
          {FORMATS.map((f) => (
            <button
              key={f.ext}
              type="button"
              role="menuitem"
              onClick={() => take(f)}
              className="flex w-full items-baseline justify-between gap-2 px-3 py-2 text-left text-small transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
            >
              <span className="font-medium">{f.label}</span>
              <span className="text-micro text-muted-foreground">{f.note}</span>
            </button>
          ))}
          {/* `role="status"` because the file arrives silently: on most
              browsers a download is a line in a tray the consultant is not
              looking at, and a menu that appears to do nothing gets pressed
              three more times. Naming the file is also the only way to say
              *which* plan came out, now that the name carries the start date. */}
          <p
            role="status"
            className="border-t border-border px-3 py-2 text-micro text-muted-foreground"
          >
            {done ? `Downloaded ${done}` : "The plan, its waves and its dates, as one file."}
          </p>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

interface Format {
  ext: string;
  label: string;
  note: string;
  mime: string;
  build: (s: Schedule) => string;
}

const FORMATS: Format[] = [
  { ext: "csv", label: "CSV", note: "for a spreadsheet", mime: "text/csv", build: toCsv },
  { ext: "md", label: "Markdown", note: "for the proposal", mime: "text/markdown", build: toMarkdown },
  { ext: "txt", label: "Plain text", note: "for a message", mime: "text/plain", build: toText },
];

/** The line the panel shows under each gap, so the file and the screen agree. */
const spanOf = (d: { value: number; unit: keyof typeof UNIT_LABEL }) =>
  `${d.value} ${UNIT_LABEL[d.unit]}`;

const heading = (s: Schedule) =>
  `${company.name}: delivery plan\n${formatSpan(s.totalWeeks)}, ${formatDay(s.startISO)} to ${formatDay(s.endISO)}`;

/** The gloss that makes the wave lengths add up, carried into the file with them. */
const PARALLEL = "Everything in a wave starts together, so a wave takes as long as its longest job.";

function toCsv(s: Schedule): string {
  const rows = [["Wave", "Wave length", "Starts", "Ends", "Gap", "To deliver"]];
  s.waves.forEach((w, i) =>
    w.gaps.forEach((g) =>
      rows.push([
        String(i + 1),
        formatSpan(w.weeks),
        formatDay(w.startISO),
        formatDay(w.endISO),
        gapById(g.id).title,
        spanOf(g.duration),
      ]),
    ),
  );
  return rows.map((r) => r.map(cell).join(",")).join("\n");
}

/** A field with a comma, a quote or a newline in it has to be quoted, and a
 *  quote inside a quoted field is doubled. Gap titles carry commas today. */
function cell(v: string): string {
  return /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

function toMarkdown(s: Schedule): string {
  const out = [`# ${heading(s).replace("\n", "\n\n")}`, "", PARALLEL];
  s.waves.forEach((w, i) => {
    out.push(
      "",
      `## Wave ${i + 1}: ${formatSpan(w.weeks)} (${formatDay(w.startISO)} to ${formatDay(w.endISO)})`,
      "",
    );
    w.gaps.forEach((g) =>
      out.push(`- ${gapById(g.id).title}: ${spanOf(g.duration)} to deliver`),
    );
  });
  return out.join("\n") + "\n";
}

function toText(s: Schedule): string {
  const out = [heading(s), "", PARALLEL];
  s.waves.forEach((w, i) => {
    out.push(
      "",
      `Wave ${i + 1}: ${formatSpan(w.weeks)}, ${formatDay(w.startISO)} to ${formatDay(w.endISO)}`,
    );
    w.gaps.forEach((g) => out.push(`  ${gapById(g.id).title}: ${spanOf(g.duration)} to deliver`));
  });
  return out.join("\n") + "\n";
}

const slug = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

/**
 * A blob, an anchor, a click.
 *
 * **`revokeObjectURL` cannot be immediate on every browser** — Safari has
 * historically dropped a download whose URL was revoked in the same task, so it
 * goes on the next tick rather than on the line after `click()`. The anchor is
 * appended to the document because Firefox will not follow one that is not in
 * the tree.
 */
function download(name: string, mime: string, body: string) {
  const url = URL.createObjectURL(new Blob([body], { type: `${mime};charset=utf-8` }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

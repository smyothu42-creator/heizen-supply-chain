"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ChevronIcon } from "./Icons";

/**
 * Every surface opens the same way, and the shape is deliberately constrained:
 * a label, a title, at most one sentence, and at most four numbers.
 *
 * Meridian's failure mode is overwhelm, and the fastest way to overwhelm
 * someone is to explain the screen to them before they have looked at it.
 * Anything longer than one line belongs behind `about`, which nobody has to
 * open and most people never will.
 */
export function PageHeader({
  eyebrow,
  title,
  line,
  stats,
  about,
  actions,
}: {
  eyebrow: string;
  title: string;
  /** One sentence. Not two. */
  line?: string;
  /** Four at most — a fifth number means none of them are important. */
  stats?: { label: string; value: string }[];
  about?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="mb-5">
      <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
        <div className="min-w-0">
          <p className="text-micro font-medium uppercase tracking-[0.09em] text-muted-foreground">
            {eyebrow}
          </p>
          <h1 className="mt-1 font-display text-h1 leading-tight">{title}</h1>
          {line && <p className="mt-1.5 text-small text-muted-foreground measure">{line}</p>}
        </div>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>

      {stats && stats.length > 0 && (
        <dl className="mt-4 flex flex-wrap items-baseline gap-x-7 gap-y-2">
          {stats.slice(0, 4).map((s) => (
            <div key={s.label} className="flex items-baseline gap-2">
              <dd className="tabular text-lead font-medium leading-none">{s.value}</dd>
              <dt className="text-micro text-muted-foreground">{s.label}</dt>
            </div>
          ))}
          {about && <AboutView>{about}</AboutView>}
        </dl>
      )}

      {about && (!stats || stats.length === 0) && (
        <div className="mt-3">
          <AboutView>{about}</AboutView>
        </div>
      )}
    </header>
  );
}

/**
 * The one place a screen is allowed to explain itself. Closed by default,
 * because the explanation is third-read content and the screen is first-read.
 */
export function AboutView({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={cn(open && "w-full")}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 text-micro text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
      >
        <ChevronIcon className={cn("transition-transform", open && "rotate-90")} />
        About this view
      </button>
      {open && (
        <div id={id} className="mt-2 space-y-1.5 text-small text-muted-foreground measure">
          {children}
        </div>
      )}
    </div>
  );
}

"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ChevronIcon } from "./Icons";

/**
 * A domain term with its plain-language line attached. Not a tooltip —
 * nobody hovers under time pressure, and Aryan is reading this in a corridor.
 * See .claude/skills/ux-copy.
 */
export function Gloss({ term, children }: { term: string; children: ReactNode }) {
  return (
    <span className="inline">
      <span className="underline decoration-dotted decoration-border-strong underline-offset-4">
        {term}
      </span>
      <span className="block text-micro text-muted-foreground mt-0.5">{children}</span>
    </span>
  );
}

/** Small section label. Sentence case — there are no all-caps labels in the
 *  product any more. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "text-micro font-medium text-muted-foreground",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Expand in place. A consultant scanning ten gaps must not lose their place to
 * check one, so this never navigates and never moves the surrounding list.
 */
export function Disclosure({
  label,
  count,
  children,
  defaultOpen = false,
  tone = "default",
}: {
  label: string;
  count?: number;
  children: ReactNode;
  defaultOpen?: boolean;
  tone?: "default" | "evidence";
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  return (
    <div>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "group inline-flex items-center gap-1.5 rounded-sm py-1 text-small",
          "hover:text-foreground transition-colors",
          tone === "evidence" ? "text-evidence" : "text-muted-foreground",
        )}
      >
        <ChevronIcon className={cn("transition-transform", open && "rotate-90")} />
        <span>{label}</span>
        {count != null && <span className="tabular text-muted-foreground">· {count}</span>}
      </button>
      {open && (
        <div id={id} className="pb-1 pt-1.5">
          {children}
        </div>
      )}
    </div>
  );
}

/**
 * A quiet card, and a block of content on the ivory page.
 *
 * Both are one line of styling over shadcn's `Card`, kept as named exports
 * because they carry an `as` prop the primitive does not: these render as `li`
 * inside a list and as `section` on a surface, and a `<div>` wrapping a `<li>`
 * is a list item the browser will not associate with its list.
 *
 * The shared shape lives in `ui/card.tsx`, so a shadcn primitive dropped in
 * next to a `Panel` looks like the same object.
 *
 * The collection surfaces — Gaps, Questions, Sources, Compare, Operations — are
 * made of `Panel`: a list, a table, a group of connectors, each a separate
 * thing from the one beside it, which is exactly the condition a card is for.
 * Research Full deliberately is not; see the note in `FullFrame`.
 */
const CARD = "rounded-lg border border-border bg-card text-card-foreground shadow-card";

export function Card({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article" | "section";
}) {
  return <As className={cn(CARD, className)}>{children}</As>;
}

export function Panel({
  children,
  className,
  as: As = "section",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "section" | "aside";
}) {
  return <As className={cn(CARD, "px-4 py-4 sm:px-5 sm:py-5", className)}>{children}</As>;
}

/** Section heading plus an optional dense summary strip for scanners. */
export function SectionHeading({
  id,
  title,
  summary,
  right,
}: {
  id?: string;
  title: string;
  summary?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
      <div>
        <h2 id={id} className="accent-heading text-h3 scroll-mt-24">
          {title}
        </h2>
        {summary && <div className="mt-1 text-small text-muted-foreground measure">{summary}</div>}
      </div>
      {right && <div className="shrink-0 text-small text-muted-foreground">{right}</div>}
    </div>
  );
}

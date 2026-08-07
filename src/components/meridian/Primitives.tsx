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

/** Small all-caps section label. One of exactly two label treatments in the app. */
export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "text-micro font-medium uppercase tracking-[0.09em] text-muted-foreground",
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
        <span className="underline-offset-4 group-hover:underline">{label}</span>
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

/** A quiet card. The default container for anything that is not the one bold thing. */
export function Card({
  children,
  className,
  as: As = "div",
}: {
  children: ReactNode;
  className?: string;
  as?: "div" | "li" | "article" | "section";
}) {
  return (
    <As className={cn("rounded-lg border border-border bg-card", className)}>{children}</As>
  );
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
        <h2 id={id} className="text-h3 font-medium tracking-tight scroll-mt-24">
          {title}
        </h2>
        {summary && <div className="mt-1 text-small text-muted-foreground measure">{summary}</div>}
      </div>
      {right && <div className="shrink-0 text-small text-muted-foreground">{right}</div>}
    </div>
  );
}

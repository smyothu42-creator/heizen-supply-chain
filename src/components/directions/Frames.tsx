"use client";

import {
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";

/**
 * Brief is a fixed screen. The container cannot scroll — if a direction's Brief
 * does not fit at 375×667, that is a design failure and it should be visible
 * rather than quietly absorbed by a scrollbar.
 */
export function BriefFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 min-h-0 overflow-hidden">
      <div className="mx-auto flex h-full w-full max-w-lg flex-col gap-2.5 px-3 py-3 sm:gap-3 sm:px-4">
        {children}
      </div>
    </div>
  );
}

export interface SectionRef {
  id: string;
  label: string;
  meta?: string;
}

/**
 * Full is a reference document read by scanning, not reading. It gets a
 * persistent navigator that shows position, and anchor links, because a
 * consultant sends a colleague a specific section.
 */
export function FullFrame({
  sections,
  children,
}: {
  sections: SectionRef[];
  children: ReactNode;
}) {
  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-3 py-5 sm:px-4 lg:grid-cols-[190px_minmax(0,1fr)]">
      <SectionNav sections={sections} />
      <div className="min-w-0 space-y-8 pb-24">{children}</div>
    </div>
  );
}

function SectionNav({ sections }: { sections: SectionRef[] }) {
  const [active, setActive] = useState(sections[0]?.id);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-96px 0px -60% 0px", threshold: 0 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Sections" className="hidden lg:block">
      <ol className="sticky top-4 space-y-0.5 border-l border-border">
        {sections.map((s) => {
          const isActive = s.id === active;
          return (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                aria-current={isActive ? "true" : undefined}
                className={cn(
                  "-ml-px block border-l-2 py-1 pl-3 text-small transition-colors",
                  isActive
                    ? "border-foreground font-medium text-foreground"
                    : "border-transparent text-muted-foreground hover:border-border-strong hover:text-foreground",
                )}
              >
                {s.label}
                {s.meta && (
                  <span className="block text-micro tabular text-muted-foreground">{s.meta}</span>
                )}
              </a>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

/* -------------------------------------------------------------------------- */
/* Section collapse, remembered across reloads                                 */
/* -------------------------------------------------------------------------- */

const KEY = "meridian-collapsed";
const listeners = new Set<() => void>();
let cache: Record<string, boolean> | null = null;

function readAll(): Record<string, boolean> {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) || "{}");
  } catch {
    cache = {};
  }
  return cache!;
}

function toggleStored(id: string) {
  const next = { ...readAll(), [id]: !readAll()[id] };
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — collapse still works for this session */
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

/**
 * useSyncExternalStore rather than an effect: the server renders everything
 * open, and React swaps in the stored state after hydration without a mismatch.
 */
function useCollapsed(id: string, fallback: boolean) {
  return useSyncExternalStore(
    subscribe,
    () => readAll()[id] ?? fallback,
    () => fallback,
  );
}

/**
 * A section that can be folded away, with the state remembered.
 *
 * The dense summary stays visible when collapsed — the point is that a scanner
 * gets what a section says without entering it. See layout-and-density.
 */
export function Section({
  id,
  title,
  summary,
  right,
  stats,
  children,
  defaultCollapsed = false,
}: {
  id: string;
  title: string;
  summary?: string;
  right?: ReactNode;
  stats?: { label: string; value: string }[];
  children: ReactNode;
  /** Reference material starts folded — it is there when wanted, not by default. */
  defaultCollapsed?: boolean;
}) {
  const collapsed = useCollapsed(id, defaultCollapsed);

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4 border-b border-border pb-2">
        <h2 id={id} className="scroll-mt-6 min-w-0">
          <button
            type="button"
            aria-expanded={!collapsed}
            aria-controls={`${id}-body`}
            onClick={() => toggleStored(id)}
            className="group flex items-baseline gap-2 text-left"
          >
            <span
              aria-hidden
              className={cn(
                "text-muted-foreground transition-transform",
                !collapsed && "rotate-90",
              )}
            >
              ›
            </span>
            <span className="text-h3 font-medium tracking-tight group-hover:underline underline-offset-4">
              {title}
            </span>
          </button>
        </h2>
        {right && <div className="shrink-0 text-small text-muted-foreground">{right}</div>}
      </div>

      {summary && !collapsed && (
        <p className="mt-2 text-small text-muted-foreground measure">{summary}</p>
      )}

      {stats && stats.length > 0 && (
        <SummaryStrip items={stats} className={cn(summary && !collapsed ? "mt-2" : "mt-3")} />
      )}

      <div id={`${id}-body`} hidden={collapsed} className={cn(!collapsed && "mt-2")}>
        {children}
      </div>
    </section>
  );
}

/** Dense summary strip. Stays visible when its section is folded away. */
export function SummaryStrip({
  items,
  className,
}: {
  items: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <dl className={cn("flex flex-wrap gap-x-6 gap-y-1.5 rounded-md bg-muted px-3 py-2", className)}>
      {items.map((it) => (
        <div key={it.label} className="flex items-baseline gap-1.5">
          <dd className="tabular text-small font-medium">{it.value}</dd>
          <dt className="text-micro text-muted-foreground">{it.label}</dt>
        </div>
      ))}
    </dl>
  );
}

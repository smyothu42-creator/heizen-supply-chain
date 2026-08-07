"use client";

import { useEffect, useState, type ReactNode } from "react";
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
      <div className="min-w-0 space-y-10 pb-24">{children}</div>
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

/** Dense summary strip at the top of a section, so a scanner gets the point
 *  without entering it. */
export function SummaryStrip({ items }: { items: { label: string; value: string }[] }) {
  return (
    <dl className="flex flex-wrap gap-x-6 gap-y-2 rounded-md bg-muted px-3 py-2">
      {items.map((it) => (
        <div key={it.label}>
          <dt className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
            {it.label}
          </dt>
          <dd className="tabular text-small font-medium">{it.value}</dd>
        </div>
      ))}
    </dl>
  );
}

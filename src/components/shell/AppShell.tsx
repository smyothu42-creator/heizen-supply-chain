"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { company } from "@/lib/suvarna";
import { directions } from "@/lib/directions";
import { PanelProvider } from "@/components/meridian/EvidencePanel";
import { ThemeToggle } from "./ThemeToggle";

/** Six tabs. Only Research is built here; the rest are labelled honestly. */
const TABS = ["Canvas", "Research", "Gaps", "Questions", "Compare", "Sources"] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean); // ["research", slug, view]
  const slug = parts[1] ?? "money";
  const view = parts[2] === "full" ? "full" : "brief";

  // Brief is a single screen with no scrolling. Rather than guess the chrome
  // height in pixels, the whole shell becomes a fixed-height flex column and
  // the content area simply cannot overflow.
  const briefLock = view === "brief";

  return (
    <div className={cn("flex flex-col", briefLock ? "h-dvh overflow-hidden" : "min-h-dvh")}>
      <header className="shrink-0 border-b border-border bg-card">
        <div className="flex items-center gap-3 px-3 py-2 sm:px-4">
          <Link
            href="/"
            className="text-small font-medium tracking-tight hover:underline underline-offset-4 shrink-0"
          >
            Meridian
          </Link>
          <span className="h-3.5 w-px shrink-0 bg-border-strong" aria-hidden />
          <span className="truncate text-small text-muted-foreground">{company.name}</span>

          <nav aria-label="Product surfaces" className="ml-auto hidden items-center gap-0.5 lg:flex">
            {TABS.map((tab) => {
              const active = tab === "Research";
              return (
                <span
                  key={tab}
                  aria-current={active ? "page" : undefined}
                  aria-disabled={!active}
                  title={active ? undefined : "Not built in this prototype"}
                  className={cn(
                    "rounded-md px-2 py-1 text-small",
                    active
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground cursor-default",
                  )}
                >
                  {tab}
                </span>
              );
            })}
          </nav>

          <div className="ml-auto lg:ml-2 shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="shrink-0 border-b border-border bg-background">
        <div className="flex items-center gap-3 overflow-x-auto px-3 py-1.5 sm:px-4">
          <nav aria-label="Research directions" className="flex items-center gap-0.5">
            {directions.map((d) => {
              const active = d.slug === slug;
              return (
                <Link
                  key={d.slug}
                  href={`/research/${d.slug}/${view}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "whitespace-nowrap rounded-md px-2 py-1 text-small transition-colors",
                    active
                      ? "bg-foreground text-background font-medium"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {d.name}
                </Link>
              );
            })}
          </nav>

          <div
            className="ml-auto flex shrink-0 items-center rounded-md border border-border p-0.5"
            role="group"
            aria-label="Level of detail"
          >
            {(["brief", "full"] as const).map((m) => {
              const active = m === view;
              return (
                <Link
                  key={m}
                  href={`/research/${slug}/${m}`}
                  aria-current={active ? "true" : undefined}
                  className={cn(
                    "rounded-[5px] px-2.5 py-0.5 text-small capitalize transition-colors",
                    active ? "bg-muted font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {m}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <PanelProvider>
        <main className={cn("flex flex-col", briefLock ? "flex-1 min-h-0 overflow-hidden" : "flex-1")}>
          {children}
        </main>
      </PanelProvider>
    </div>
  );
}

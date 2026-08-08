"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { company } from "@/lib/suvarna";
import { directions } from "@/lib/directions";
import { PanelProvider } from "@/components/meridian/EvidencePanel";
import { ThemeToggle } from "./ThemeToggle";

/** Six surfaces. Research is the only one with more than one design on offer. */
const TABS = [
  { name: "Canvas", href: "/canvas" },
  { name: "Research", href: "/research/money/brief" },
  { name: "Gaps", href: "/gaps" },
  { name: "Questions", href: "/questions" },
  { name: "Compare", href: "/compare" },
  { name: "Sources", href: "/sources" },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const surface = parts[0] ?? "";
  const onResearch = surface === "research";

  const slug = onResearch ? (parts[1] ?? "money") : "money";
  const view = onResearch && parts[2] === "full" ? "full" : "brief";

  // Two surfaces are viewport-locked rather than document-scrolled: Research
  // Brief, which must be a single screen with no scrolling, and Canvas, which
  // is a pannable map and would be nonsense inside a scrolling page. Rather
  // than guess the chrome height in pixels, the shell becomes a fixed-height
  // flex column and the content area simply cannot overflow.
  const lockViewport = (onResearch && view === "brief") || surface === "canvas";

  return (
    <div className={cn("flex flex-col", lockViewport ? "h-dvh overflow-hidden" : "min-h-dvh")}>
      <header className="shrink-0 border-b border-border bg-card">
        <div className="flex items-center gap-3 px-3 py-1.5 sm:px-4 sm:py-2">
          <Link
            href="/"
            className="shrink-0 text-small font-medium tracking-tight underline-offset-4 hover:underline"
          >
            Meridian
          </Link>
          <span className="h-3.5 w-px shrink-0 bg-border-strong" aria-hidden />
          <span className="truncate text-small text-muted-foreground">{company.name}</span>
          <div className="ml-auto shrink-0">
            <ThemeToggle />
          </div>
        </div>

        {/* Tabs scroll horizontally on a phone rather than collapsing into a menu —
            a consultant will not find a hidden tab mid-call. */}
        <nav aria-label="Product surfaces" className="overflow-x-auto px-3 sm:px-4">
          <ul className="flex items-center gap-0.5 pb-1 sm:pb-1.5">
            {TABS.map((tab) => {
              const active = tab.href.startsWith(`/${surface}`) && surface !== "";
              return (
                <li key={tab.name}>
                  <Link
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "block whitespace-nowrap rounded-md px-2.5 py-0.5 text-small transition-colors sm:py-1",
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    {tab.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </header>

      {/* Research is the only surface carrying competing directions, so the
          switcher only exists there. */}
      {onResearch && (
        <div className="shrink-0 border-b border-border bg-background">
          <div className="flex items-center gap-3 overflow-x-auto px-3 py-1 sm:px-4 sm:py-1.5">
            <nav aria-label="Research directions" className="flex items-center gap-0.5">
              {directions.map((d) => {
                const active = d.slug === slug;
                return (
                  <Link
                    key={d.slug}
                    href={`/research/${d.slug}/${view}`}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "whitespace-nowrap rounded-md px-2 py-0.5 text-small transition-colors sm:py-1",
                      active
                        ? "bg-foreground font-medium text-background"
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
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {m}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <PanelProvider>
        <main
          className={cn(
            "flex flex-col",
            lockViewport ? "flex-1 min-h-0 overflow-hidden" : "flex-1",
          )}
        >
          {children}
        </main>
      </PanelProvider>
    </div>
  );
}

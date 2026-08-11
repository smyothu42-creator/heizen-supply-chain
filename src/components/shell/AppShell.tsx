"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { PanelProvider } from "@/components/meridian/EvidencePanel";
import { ThemeToggle } from "./ThemeToggle";
import { ProjectMenu } from "./ProjectMenu";
import { Wordmark } from "./Wordmark";
import { AiButton, AiPanel, AiProvider, useAi } from "./AiPanel";
import { SelectionAsk } from "./SelectionAsk";
import { WorkspaceProvider } from "./WorkspaceProvider";
import { useMastheadVisible } from "./useScrollDirection";

/** Six surfaces. Research is the only one with more than one design on offer. */
const TABS = [
  { name: "Operations", href: "/operations" },
  /* Full, not Brief. Brief is the thing you switch *to* in the five minutes
     before a call; Full is the dossier, and it is what "Research" means when
     you arrive from the masthead with no particular errand. */
  { name: "Research", href: "/research/all/full" },
  { name: "Gaps", href: "/gaps" },
  { name: "Questions", href: "/questions" },
  { name: "Compare", href: "/compare" },
  { name: "Sources", href: "/sources" },
] as const;

/**
 * The workspace: the level above a project, and the level the product opens on.
 *
 * `/` redirects to `/projects`, so this is the first screen anybody sees and
 * the wordmark is the way back to it from anywhere. These four are its nav.
 *
 * **The masthead carries one nav, not two, and which one depends on where you
 * are.** The six surface tabs are six readings of *one company*, so on a screen
 * where no company has been chosen they are six links into a question the
 * reader has not answered yet. Above a project you get the workspace; inside
 * one you get the surfaces. There is no third state and no column down the side
 * holding a second copy of either.
 */
const WORKSPACE_TABS = [
  { name: "Projects", href: "/projects" },
  { name: "Team", href: "/team" },
  { name: "Settings", href: "/settings" },
  { name: "Account", href: "/account" },
] as const;

const WORKSPACE_PAGES = new Set(["", "projects", "team", "settings", "account"]);

/**
 * The provider has to sit outside the thing that reads it, so the shell is two
 * components: this one owns `AiProvider`, and `Shell` below consumes it to
 * shrink the page when the panel is open.
 */
export function AppShell({ children }: { children: ReactNode }) {
  return (
    <WorkspaceProvider>
      <AiProvider>
        <Shell>{children}</Shell>
      </AiProvider>
    </WorkspaceProvider>
  );
}

function Shell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const surface = parts[0] ?? "";
  const onResearch = surface === "research";
  /* Inside a project, so the six surfaces mean something and the switcher has
     something to switch. Above one, the masthead carries the workspace instead
     and no control names a company: on the page whose whole job is to pick one,
     a switcher answers the question the page is asking. */
  const inProject = !WORKSPACE_PAGES.has(surface);
  const tabs = inProject ? TABS : WORKSPACE_TABS;

  // Two surfaces are viewport-locked rather than document-scrolled: Research
  // Brief, which must be a single screen with no scrolling, and Operations,
  // which
  // is a pannable map and would be nonsense inside a scrolling page. Rather
  // than guess the chrome height in pixels, the shell becomes a fixed-height
  // flex column and the content area simply cannot overflow.
  const lockViewport =
    (onResearch && parts[2] !== "full") || surface === "operations";

  const mastheadVisible = useMastheadVisible();
  const { open: aiOpen, full: aiFull, width: aiWidth } = useAi();

  /* From `lg` the panel pushes the page rather than covering it, and the
     padding here is what does the pushing. The point of a chat beside a
     dossier is that you can still see the dossier — a panel that sits on top
     of the paragraph you are asking about is a popover, which is the shape
     CLAUDE.md §5 already ruled out.

     Below `lg` there is no push: 320px of panel beside a 375px phone is not a
     layout, so there it overlays with a scrim. And in full view nothing is
     pushed, because there is nothing left to see. */
  const push = aiOpen && !aiFull;

  return (
    <div
      style={
        { ...(push ? { "--ai-w": `${aiWidth}px` } : {}) } as React.CSSProperties
      }
      className={cn(
        "flex flex-col transition-[padding] duration-200 motion-reduce:transition-none",
        lockViewport ? "h-dvh overflow-hidden" : "min-h-dvh",
        push && "lg:pr-[var(--ai-w)]",
      )}
    >
      {/* Chrome is a dark indigo band; everything below it is document. The
          split is the whole idea of the theme — you are either moving between
          surfaces or reading one, and the two never look alike.

          One line: wordmark, project switcher, surfaces, utilities — the shape
          the reference uses. It was two rows, and collapsing it buys about
          30px on every screen in the product. That matters more than it
          sounds: Research Brief is a fixed screen, and 30px of chrome is 30px
          of Brief — which is what paid for the tiles now on it.

          Items stretch to full height so the active tab's underline lands on
          the bottom edge of the band rather than floating inside it. */}
      {/* Sticky, and it hides on the way down.
          On a document that runs four screens the six surface tabs are
          irrelevant while you are reading one of them — but scrolling *up* is
          someone looking for something, and most often that something is
          another surface. So the band gets out of the way going down and comes
          back going up.

          `sticky` and not `fixed`: fixed takes the header out of flow and
          every page below it then needs a top offset that has to be kept in
          sync with the header's height. Sticky keeps the flex column honest.

          **THE STACK, in one place, because making this sticky broke it.**
          The header was `z-50` for an afternoon and sat on top of
          `EvidencePanel` (`z-40`), whose close button then did nothing — a
          regression `check:ui` could not see, because it closes that panel
          with Escape rather than by clicking. The order is:

            page content and map overlays   z-10, z-20
            workspace panel  scrim z-24     z-25
            masthead                        z-30   <- this
            Operations full screen          z-35
            evidence panel  scrim z-40      z-50
            gap panel       scrim z-54      z-56
            selection menu                  z-65
            AI panel        scrim z-60      z-70
            dialogs         scrim z-90      z-95

          A panel is a thing you opened deliberately; the chrome does not get
          to cover it. If you add a layer, add it here.

          **Full screen is chrome removal, so it sits with the chrome.** It was
          `z-[80]`, above everything, described here as the one thing meant to
          cover the lot — and the cost was that opening a process while full
          screen put the detail panel behind the map. Nothing it hides is a
          thing the user opened: it hides the masthead and the surface header.
          Everything above it in this list is something they asked for. See
          `CanvasView`.

          The two viewport-locked surfaces — Research Brief and Operations —
          never scroll the window at all, so this is inert there rather than
          special-cased. `motion-reduce:transition-none` is the whole reduced
          motion story: the hiding stays correct, it just stops sliding. */}
      <header
        className={cn(
          "sticky top-0 z-30 shrink-0 bg-masthead text-masthead-foreground transition-transform duration-200 motion-reduce:transition-none",
          !mastheadVisible && "-translate-y-full",
        )}
      >
        {/* 48px, down from 56, and the tabs came down a size with it. The type
            scale went up a step across the product for readability, and the
            masthead took that rise as well as the extra height — which is the
            one place it buys nothing: nobody reads the chrome, they aim at it.
            48px still clears the 44px touch floor with the tab's own padding,
            and it gives Brief back 8px on a screen that may not scroll. */}
        <div className="flex min-h-12 items-stretch gap-3 px-4 sm:gap-5 sm:px-6">
          {/* The mark stays below `sm` now that the brand is a mark and not a
              word: it is 11px wide, against the 70px the wordmark was costing
              the tabs on a 375px line. `Wordmark` hides its own text there. */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {/* The mark is the way back to the projects list, which is what `/`
                now is. A product whose first screen is the list of companies
                needs one control that always returns to it, and the brand is
                the one control on every screen. */}
            <Link
              href="/projects"
              aria-label="Heizen Discovery Tool — projects"
              className="rounded-sm transition-colors hover:text-masthead-accent"
            >
              <Wordmark />
            </Link>
            <span className="h-4 w-px bg-masthead-border" aria-hidden />
          </div>

          {/* Tabs scroll horizontally on a phone rather than collapsing into a
              menu — a consultant will not find a hidden tab mid-call.

              Marked by an underline rather than a filled chip, as the reference
              does: a chip on a dark band has to be a light block, which reads
              as heavier than the page content underneath it. */}
          <nav
            aria-label={inProject ? "Product surfaces" : "Workspace"}
            className="scroll-slim min-w-0 flex-1 overflow-x-auto sm:ml-2"
          >
            <ul className="flex h-full items-stretch gap-1">
              {tabs.map((tab) => {
                const active =
                  tab.href.startsWith(`/${surface}`) && surface !== "";
                return (
                  <li key={tab.name} className="flex">
                    <Link
                      href={tab.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        // 3px, not the 2 the page's `SwitchTrack` uses. This
                        // one sits on the bottom edge of a 48px dark band with
                        // no rule under it to thicken, so it is the mark on its
                        // own rather than a segment of an existing hairline —
                        // and at 2px against the indigo it read as a tint on
                        // the band's edge rather than as a chosen underline.
                        "flex items-center whitespace-nowrap border-b-[3px] px-2 text-small transition-colors",
                        active
                          ? "border-masthead-accent font-medium text-masthead-foreground"
                          : "border-transparent text-masthead-muted hover:text-masthead-foreground",
                      )}
                    >
                      {tab.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* The right cluster: which project, and which theme. The switcher
              was on the left, between the wordmark and the tabs, where it read
              as part of the brand rather than as something you operate — and
              it pushed six tabs rightwards on every screen. On the right it
              sits with the other control, and its popover opens against the
              window edge it is nearest.

              It keeps a width cap below `sm`: there the trigger is the
              monogram and the chevron, and the project name hides. */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {inProject && (
              <>
                <div className="flex min-w-0 max-w-[11rem] items-center lg:max-w-none">
                  <ProjectMenu />
                </div>
                <span
                  className="hidden h-4 w-px self-center bg-masthead-border sm:block"
                  aria-hidden
                />
              </>
            )}
            {/* Beside the theme control, which is the other thing you operate
                on the band rather than navigate with. */}
            <AiButton />
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* The direction and Brief/Full switches used to sit here, in a white bar
          of their own between the masthead and the band — a third horizontal
          strip, and the only surface chrome in the product drawn on the page
          rather than on the indigo. Both now sit on the page above the
          document, at opposite ends of one row (`ResearchSwitches`, rendered
          by the frames); the band's top-right corner holds `RunButton`. */}

      {/* There is no column down the left edge any more. It held Projects, Team
          and Settings, which are now the masthead's own nav on the pages above a
          project — and inside a project it was a second navigation competing
          with the six tabs for the same job. One nav, in one place, and which
          one it is depends on where you are. */}

      <PanelProvider>
        <main
          className={cn(
            "flex flex-col transition-[padding] duration-200 motion-reduce:transition-none",
            lockViewport ? "flex-1 min-h-0 overflow-hidden" : "flex-1",
          )}
        >
          {children}
        </main>
      </PanelProvider>
      {/* Select a sentence in the dossier and a small menu offers to ask the
          assistant about it. Research only: it is the surface made of prose,
          and a menu that appears on an accidental drag across a table of
          twelve rows would be noise on five surfaces to be useful on one. */}
      {onResearch && <SelectionAsk />}
      <AiPanel />
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  Bookmark,
  CircleUser,
  Columns3,
  FileSearch,
  Files,
  FolderKanban,
  MessageCircleQuestion,
  Network,
  Settings,
  TriangleAlert,
  Users,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { PanelProvider } from "@/components/meridian/EvidencePanel";
import { ThemeToggle } from "./ThemeToggle";
import { ProjectMenu } from "./ProjectMenu";
import { Wordmark } from "./Wordmark";
import { AiButton, AiPanel, AiProvider, useAi } from "./AiPanel";
import { SelectionAsk } from "./SelectionAsk";
import { UpdateAsk } from "./UpdateAsk";
import { NavButton, NavDrawer } from "./NavDrawer";
import { WorkspaceProvider } from "./WorkspaceProvider";
import { SavedProvider } from "./SavedProvider";
import { ToastProvider } from "./Toast";
import { useMastheadVisible } from "./useScrollDirection";

/**
 * Six surfaces. Research is the only one with more than one design on offer.
 *
 * **Each tab carries a mark, on request, and the label stays at every width.**
 * An icon in the chrome is not decoration here: the six tabs are the one
 * control on every screen of the product, and a shape is found by peripheral
 * vision faster than a word is read — which is the whole of what a consultant
 * does with this row while a call is running. What it must never become is an
 * icon-only rail: six unlabelled glyphs are six guesses.
 *
 * **The cost is horizontal, and below `xl` it is paid by a drawer rather than
 * by a scroller.** A `size-4` mark and its gap is about 22px a tab, so the row
 * wants 647px on its own and about 1130 of window to sit whole on the band.
 * This note used to say the row scrolls rather than collapsing into a menu,
 * because a consultant will not find a hidden tab mid-call — and what that
 * missed is that a horizontal scroller is also a hiding place, and a worse one:
 * at 375 four of the six were off the edge with nothing on screen saying so.
 * The marks stay, and from `xl` nothing about the row has changed. See
 * `NavDrawer`.
 *
 * The marks are chosen for what the surface *is*, not for its initial: a graph
 * for the map, a document for the dossier, a warning for the findings, a
 * question for the questions, two columns for the comparison, files for the
 * files.
 */
/**
 * **The order is the call, not the pipeline**, on request.
 *
 * It used to run Operations, Research, Gaps, Questions, Compare, Sources, which
 * is the order the product builds things in: map the company, write the
 * dossier, find the gaps, then ask about them. That is our sequence rather than
 * Aryan's. What he does with four minutes before a call is read the dossier and
 * take the questions in with him, so those two lead, and the four that support
 * them follow in the order they are reached for.
 *
 * The leftmost tab is also the cheapest to hit and the first one read, which is
 * the other half of the argument: on a row of six, position is the only
 * priority signal there is.
 */
const TABS = [
  /* **Prep is off the row**, on request. `/prep` and `PrepView` are untouched
     and the route still renders — nothing else in the product links to it, so
     it is reachable only by typing the URL. Putting it back is this one line.
     If it is meant to go for good, `src/app/(app)/prep/` and
     `components/surfaces/PrepView.tsx` are the two things to delete. */
  /* **Brief, not Full**, on request, which reverses what this comment used to
     say. The old argument was that Full is what "Research" means when you
     arrive with no particular errand. What it missed is that arriving with no
     errand is rare: the reason this tab gets pressed is a call, and the
     one-screen read is what that wants. Full is one tab away and every Brief
     carries its own way into it. */
  { name: "Research", href: "/research/company/brief", Icon: FileSearch },
  { name: "Questions", href: "/questions", Icon: MessageCircleQuestion },
  { name: "Operations", href: "/operations", Icon: Network },
  /* **"Gaps & problems", not "Gaps"**, on request. The house style everywhere
     else spells the conjunction ("Sourcing and quotes", "Size and profit"), so
     this is the one ampersand in the product; it is here because the label was
     asked for in these words. It is also the longest tab by some way, which is
     what the measurement below the tab list is about. */
  { name: "Gaps & problems", href: "/gaps", Icon: TriangleAlert },
  { name: "Compare", href: "/compare", Icon: Columns3 },
  { name: "Sources", href: "/sources", Icon: Files },
  /* **Last, because it is a list of things from the six before it.** Saved holds
     whatever has been bookmarked on Questions, Gaps and Research, so it can only
     ever be read after one of those has been used. */
  { name: "Saved", href: "/saved", Icon: Bookmark },
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
  { name: "Projects", href: "/projects", Icon: FolderKanban },
  { name: "Team", href: "/team", Icon: Users },
  { name: "Settings", href: "/settings", Icon: Settings },
  { name: "Account", href: "/account", Icon: CircleUser },
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
      {/* Outermost of the three, because everything under it reports into the
          same corner: saving a question, committing a form, writing a file. */}
      <ToastProvider>
        {/* Above `Shell`, so the saved set survives moving between surfaces:
            client navigation keeps React state that lives in the layout. A
            reload empties it, which is the honest scope of a prototype with no
            server. */}
        <SavedProvider>
          <AiProvider>
            <Shell>{children}</Shell>
          </AiProvider>
        </SavedProvider>
      </ToastProvider>
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

  // One surface is viewport-locked rather than document-scrolled: Operations,
  // which is a pannable map and would be nonsense inside a scrolling page.
  // Rather than guess the chrome height in pixels, the shell becomes a
  // fixed-height flex column and the content area simply cannot overflow.
  //
  // **Research Brief used to be the second one**, and it is not any more.
  // Brief was a single screen with no scrolling, and this lock is what
  // enforced it from the outside while `BriefFrame`'s own `overflow-hidden`
  // enforced it from the inside. Brief is Full's layout now — navigator, sheet,
  // one section — so the lock was clipping an ordinary document against the
  // bottom of the window with no scrollbar to reach the rest. A page that is
  // short because it is written short does not need the window to hold it
  // there.
  const lockViewport = surface === "operations";

  const mastheadVisible = useMastheadVisible();
  const { open: aiOpen, full: aiFull, width: aiWidth } = useAi();

  /* The nav below `xl`. State sits here rather than inside the drawer because
     the drawer has to render *outside* `<header>`: the band carries a transform
     on the way down, and a transformed ancestor is the containing block for
     `position: fixed`. See `NavDrawer`. */
  const [navOpen, setNavOpen] = useState(false);
  const navTrigger = useRef<HTMLButtonElement>(null);
  const closeNav = useCallback(() => setNavOpen(false), []);

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
            ask-list tray (Questions)       z-30, its flying mark z-31
            Operations full screen          z-35
            nav drawer      scrim z-36      z-38
            evidence panel  scrim z-40      z-50
            gap panel       scrim z-54      z-56
            ask-list panel  scrim z-58      z-59
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
            {/* Below `xl` the six tabs are behind this. See `NavDrawer` for
                why that reverses the note under the tab row, and for where the
                breakpoint comes from. */}
            <NavButton
              ref={navTrigger}
              open={navOpen}
              onToggle={() => setNavOpen((v) => !v)}
            />
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
            <span
              className="hidden h-4 w-px bg-masthead-border tabs-fit:block"
              aria-hidden
            />
          </div>

          {/* From `tabs-fit` (1360px, measured — see `globals.css`). Below it
              the row is a drawer: the seven tabs come to 807px and the rest of
              the band to about 550, so anything narrower puts *Sources* off the
              right edge. A horizontal scroller there is a hiding place too, and
              a worse one, which is the whole reason the drawer exists.

              Marked by an underline rather than a filled chip, as the reference
              does: a chip on a dark band has to be a light block, which reads
              as heavier than the page content underneath it. */}
          <nav
            aria-label={inProject ? "Product surfaces" : "Workspace"}
            className="scroll-slim hidden min-w-0 flex-1 overflow-x-auto tabs-fit:ml-2 tabs-fit:block"
          >
            {/* A notch more air between tabs, on request: `gap-1` was 4px, and
                with a mark now sitting in front of every label the six tabs
                read as one continuous strip of icon-word-icon-word. 10px is
                enough to group each mark with its own label and not so much
                that the row costs another wrap of scroll on a phone. */}
            <ul className="flex h-full items-stretch gap-2.5">
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
                        //
                        // **The active tab is a raised block now, on request,
                        // and that reverses a note in CLAUDE.md.** The old
                        // argument was that a chip on a dark band has to be a
                        // light block and would read heavier than the page
                        // content below it. What it missed is that a cyan
                        // hairline against indigo is the *only* thing marking
                        // where you are, on the one control that is on every
                        // screen in the product: the tab sat in the same colour
                        // as the band and the mark was three pixels at its
                        // bottom edge. The ground is `--masthead-border`, which
                        // is the band's own lifted tone rather than a light
                        // block, so it reads as a tab standing proud of the
                        // strip and not as a white chip laid on it. White on it
                        // is 7.1:1.
                        //
                        // **Square corners, on request.** A rounded top made
                        // the ground read as a chip laid on the band; a plain
                        // rectangle running the full height of the strip reads
                        // as a section of the band itself, which is what a
                        // surface tab is.
                        "flex items-center gap-1.5 whitespace-nowrap border-b-[3px] px-2.5 text-small transition-colors",
                        active
                          ? "border-masthead-accent bg-masthead-border font-medium text-masthead-foreground"
                          : // The hover ground is the same tone one step down
                            // in weight — it is what makes the row feel like
                            // six controls rather than six words. It cannot be
                            // the *active* ground, or hovering one tab would
                            // make two of them look current.
                            "border-transparent text-masthead-muted hover:bg-masthead-hover hover:text-masthead-foreground",
                      )}
                    >
                      {/* `aria-hidden`, because the label is right beside it
                          and a screen reader reading "graph Operations" is one
                          word of noise on every tab in the product. The mark
                          takes the label's colour rather than a colour of its
                          own: `--masthead-accent` is what the active underline
                          spends, and a cyan glyph on every tab would make the
                          one that means "you are here" mean nothing. */}
                      <tab.Icon aria-hidden className="size-4 shrink-0" />
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
          {/* `ml-auto` and not the nav's `flex-1`: below `xl` the nav is not
              rendered, so without this the cluster would sit against the
              wordmark with the rest of the band empty behind it. */}
          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
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

      {/* Outside the header on purpose — the band takes a transform on the way
          down, and a transformed ancestor is the containing block for
          `position: fixed`. See `NavDrawer`. */}
      <NavDrawer
        open={navOpen}
        onClose={closeNav}
        tabs={tabs}
        label={inProject ? "Product surfaces" : "Workspace"}
        surface={surface}
        triggerRef={navTrigger}
      />

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
      {/* *Do you have anything to update today?*, on the way into a project.
          It lives here rather than on a surface because it is not about any one
          of them: it is asked once on arrival, whichever surface you land on.
          See `UpdateAsk`. */}
      <UpdateAsk />
      <AiPanel />
    </div>
  );
}

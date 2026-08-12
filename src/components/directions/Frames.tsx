"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { ChevronsDownUp, ChevronsUpDown } from "lucide-react";
import { ArrowIcon, ChevronIcon, FilingIcon } from "@/components/meridian/Icons";
import { usePanel } from "@/components/meridian/EvidencePanel";
import { ResearchSwitches } from "@/components/shell/ResearchSwitch";
import { StickyBar } from "@/components/shell/StickyBar";
import { useMastheadVisible } from "@/components/shell/useScrollDirection";

/**
 * Brief is a fixed screen. The container cannot scroll — if a direction's Brief
 * does not fit at 375×667, that is a design failure and it should be visible
 * rather than quietly absorbed by a scrollbar.
 *
 * The rhythm tightens by 2px below sm. Inter costs a few pixels against the
 * face it replaced, and on the smallest screen Call and Certainty finished
 * 4px clear of a clip — close enough that one added word would break them.
 * Everything from sm up keeps the original spacing; only 375 is squeezed.
 */
export function BriefFrame({
  hero,
  lead,
  actions,
  children,
}: {
  hero?: ReactNode;
  /** Shares the switch row. See `ResearchSwitches` for why it is not in the
      header any more. */
  actions?: ReactNode;
  /**
   * The direction's own opening — its headline and standfirst — shown only at
   * `roomy`, in a left column.
   *
   * It is a column and not a block above the content for a measured reason.
   * Brief may not scroll, and at 1024×780 — the shortest viewport `roomy`
   * covers — the content already fills the frame: putting the lead above it
   * clipped Money-first's fourth bucket by 96px, and `check:ui` failed. What
   * Brief has spare at that size is *width*, not height. In a left column —
   * 19rem, stepping to 22rem at `xl`, the same two widths as Full's navigator
   * so the views line up — the lead costs nothing vertically and the layout
   * reads as Full's does: something fixed on the left, the material on the
   * right.
   *
   * **The step is not cosmetic.** On a flat 22rem, Stakeholder Brief with
   * Vikram selected clipped by 22px at 1024×780: the 48px came straight out of
   * the content column, which wrapped one line further. `check:ui` passed;
   * `verify-stakeholder.mjs` is what caught it, because that harness changes
   * the selection and `check:ui` does not.
   *
   * Below `roomy` there is no column and no lead; the band carries the
   * direction's headline itself, which is what a one-screen phone view wants.
   */
  lead?: ReactNode;
  children: ReactNode;
}) {
  return (
    <>
      {hero}
      <div className="prose-full flex-1 min-h-0 overflow-hidden">
        <div className=/* **The switch row sits exactly where Full's does, at every width**, on
              request: `sm:pt-6`, the same value `FullFrame` uses, with the same
              16px under the row. It was `py-1 sm:py-2 roomy:py-5` — a squeeze
              Brief levied on itself because it is a fixed screen — so switching
              Full↔Brief moved the one row the two views share, by 4px from
              `roomy` and by 16 below it. The row is the skeleton, and a
              skeleton that shifts when you press it is the thing it may not do.

              **375 keeps the squeeze, and that is measured rather than
              chosen.** Full's rhythm costs 26px at the top (16 here, 10 in the
              gap below the row), and at 375×667 four Briefs clip on it: Leaks
              by 21px, Tech by 20, Money by 11, Idea Build by 3. Every other
              viewport takes it with room to spare. Nobody compares the two
              views on a phone; Brief is simply what you read there.

              The bottom keeps the squeeze everywhere. Nothing is under it to
              line up with, and it is what pays for the top. */
            "surface-frame flex h-full max-w-lg flex-col pt-1 pb-1 sm:pt-6 sm:pb-2 roomy:max-w-none roomy:pb-5">
          {/* Both switches are the first thing on the page, above the
              document they change. On the band they were chrome describing
              the surface; here they are the choices you are making about what
              is underneath. The band's corner now holds `RunButton`. */}
          <ResearchSwitches tight actions={actions} />
          {/* From `roomy` both columns are cards, matching Full exactly: a
              short card on the left, a tall one on the right, white on ivory.
              Brief and Full are two views of one dossier and the toggle
              between them should not change the page's furniture.

              Cards only from `roomy`, and the padding is `p-5` rather than
              Full's `py-5 sm:py-6`, for the reason Brief always gives: it is a
              fixed screen. At 1024×780 — the shortest viewport `roomy` covers —
              the tightest Brief had about 50px spare, and dropping the frame
              from `py-8` to `py-6` bought 16 more. A card costs 40px of that;
              the footer rule coming off the six Briefs paid the last 8. Below
              `roomy` there is no card and no second column, because at 375
              there is nothing to spend. **`p-5` is measured, not chosen** — one
              step further and 1024×780 clips. Run `check:ui` before moving it.

              `self-start` on the lead so it sizes to its content instead of
              stretching to the grid row. Full's navigator does the same thing
              by being `sticky` inside a taller cell. */}
          <div className=/* **`lg:` and `xl:`, not `roomy:` and `xl:`** — and this is a trap
                worth keeping written down. `roomy` is a custom variant, and
                Tailwind emits custom variants *after* the built-in breakpoints,
                so at 1490px both `roomy:grid-cols-[19rem…]` and
                `xl:grid-cols-[22rem…]` matched and the later rule won. Brief's
                column sat at 19rem while Full's was at 22rem, and the two views
                of one dossier did not line up. `roomy` is defined as
                `min-width: 1024px`, which is exactly `lg`, so using `lg` here
                is identical in behaviour and correct in order. */
              /* 16px under the row from `sm`, which is Full's `pt-4` on the
                 grid below its own switch row. It was 6px up to `roomy`, so
                 the row sat on the content in one view and clear of it in the
                 other. 375 keeps the 6, for the reason above. */
          "mt-1.5 flex min-h-0 flex-1 flex-col sm:mt-4 lg:grid lg:grid-cols-[19rem_minmax(0,1fr)] lg:gap-x-10 xl:grid-cols-[22rem_minmax(0,1fr)]">
            {lead && (
              <div className="hidden roomy:block roomy:self-start roomy:rounded-lg roomy:border roomy:border-border roomy:bg-card roomy:p-5 roomy:shadow-card">
                {lead}
              </div>
            )}
            {/* **From `lg` the card is the height of its content, capped at the
                frame.** On request. It was `h-full`, which on a 1440×1400 window
                left All Brief's three findings sitting in the top third of a
                card with about 450px of white under them and the footer pinned
                to the bottom edge — a card the shape of the viewport rather than
                the shape of what is in it.

                **`max-h-full`, not just `h-auto`.** The cap is what keeps
                Brief's contract: it is the fixed screen, and content that
                overruns has to clip visibly rather than be absorbed by a
                scrollbar. `check:ui` measures exactly that, so dropping the cap
                would take the check with it.

                **`lg:` only.** Below it there is no card, the frame is the
                phone-shaped column, and `h-full` is what lets the content take
                the height and hold the footer at the bottom of the screen. In a
                *column* flex container `self-start` is the cross axis, so
                applying it there would shrink the card to the width of its
                longest line. */}
            <div className="flex h-full min-h-0 flex-col gap-2 sm:gap-3 roomy:gap-4 roomy:rounded-lg roomy:border roomy:border-border roomy:bg-card roomy:p-5 roomy:shadow-card lg:h-auto lg:max-h-full lg:self-start">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

/**
 * The foot of every Brief: how sure we are on the left, the way into Full on
 * the right.
 *
 * **It was twelve copies of the same eight lines**, one per direction, each
 * differing only in its href and its label. Twelve is where a treatment drifts,
 * and it had already started: Money's link was `text-evidence` and the other
 * eleven were ink.
 *
 * **It is a drawn button now, not bare words.** On request, and for the reason
 * `Fold all` gives on the other view: on a card whose whole content is
 * pressable rows, an unbordered phrase in the corner reads as one more line of
 * the document rather than as the one control that leaves it. This is *the*
 * thing a consultant does at the end of a Brief that is not reading, so it is
 * the one thing on the screen that should look placed.
 *
 * **It takes the accent, where `Fold all` does not**, and the difference is the
 * whole rule: cyan on the page means somewhere to go. Folding a section goes
 * nowhere; this goes to Full.
 */
export function BriefFooter({
  href,
  children,
  confidence,
}: {
  href: string;
  /** The direction's own words for what is on the other side. */
  children: ReactNode;
  /** Usually a `ConfidenceBadge`. Left end of the row. */
  confidence?: ReactNode;
}) {
  return (
    <div className="shrink-0 pt-1">
      <div className="flex items-end justify-between gap-4">
        {confidence ?? <span />}
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card px-3 py-1.5 text-small font-medium text-evidence shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground"
        >
          {children}
          <ArrowIcon />
        </Link>
      </div>
    </div>
  );
}

export interface SectionRef {
  id: string;
  label: string;
  meta?: string;
  /**
   * Reference material starts folded — there when wanted, not by default.
   *
   * It is declared here rather than on `<Section>` because two things need it
   * and only one of them renders the section: the section itself, and the
   * fold-all button, which has to tell "untouched and folded" from "open" or
   * its label lies for one click. One list, read by both.
   */
  defaultCollapsed?: boolean;
}

/**
 * The sections on the page, published by `FullFrame` and read by
 * `DocumentLead` so it can put the fold-all button in its own top right.
 *
 * A context and not a prop because the lead sits inside `children` — each
 * direction renders it, so the frame cannot hand it anything directly, and
 * threading `sections` through four call sites to reach a button would be four
 * chances to forget. `null` in Brief, which has no sections and no button.
 */
const SectionsContext = createContext<SectionRef[] | null>(null);

/**
 * Full is a reference document read by scanning, not reading. It gets a
 * persistent navigator that shows position, and anchor links, because a
 * consultant sends a colleague a specific section.
 */
export function FullFrame({
  sections,
  hero,
  actions,
  children,
}: {
  sections: SectionRef[];
  hero?: ReactNode;
  /** Shares the switch row. See `ResearchSwitches`. */
  actions?: ReactNode;
  children: ReactNode;
}) {
  // Full width on the surface frame, like every other surface. It was capped
  // at 5xl on the argument that prose caps at ~500px and a wider column leaves
  // an empty right-hand third — true of the paragraphs, but most of what is
  // actually in here is rows: a gap with its meta and its price, a claim with
  // its source, a coverage line with its count. Those are two-edge rows and
  // they use every pixel.
  //
  // The paragraphs used to keep `.measure`, so the frame widened containers
  // and never sentences. `prose-full` releases that here, on request: Research
  // sets to the full column in both views. See the class in `globals.css` for
  // what it costs and what pays for it.
  return (
    <>
      {hero}
      {/* Above the sheet and outside the grid, so the row spans the navigator
          and the document both: it changes the whole page, not one column.

          **Pinned while the document scrolls**, on request. Full runs three to
          four screens and Direction is what decides which dossier you are
          reading: having to scroll back to the top to change it is what made
          the seven directions feel like seven pages rather than seven views.
          See `StickyBar` for why the offset follows the masthead. */}
      <StickyBar className="pt-5 pb-3 sm:pt-6">
        <ResearchSwitches actions={actions} />
      </StickyBar>
      <div className="prose-full reading-airy surface-frame grid gap-x-10 gap-y-6 pt-4 pb-12 sm:pb-16 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)]">
        <SectionNav sections={sections} />
        {/* One sheet, not nine cards.

          The reference boxes every block because it is a dashboard of
          independent widgets — a card is the right shape for a thing that has
          no relationship to the thing beside it. Full is the opposite: a
          continuous document with a navigator, read top to bottom, where a
          border between "How the total is built" and the buckets it reconciles
          would be a wall between two halves of one argument. So the document
          gets the theme's white-on-ivory as a single sheet and keeps its
          sections open inside it. The collection surfaces — Gaps, Questions,
          Sources, Compare — do get cards, because there they are true.

          40px between sections against ~12px inside one. It was 48px, and 32px
          before that: at 32px the two gaps were close enough that the page read
          as one undifferentiated column and the only way to find structure was
          the navigator. 40px holds because the inner gaps came down with it —
          what has to stay true is the *ratio*, not the pixel. If you tighten
          inside a section, tighten between them too. */}
        <div className="min-w-0 rounded-lg border border-border bg-card px-4 py-5 shadow-card sm:px-6 sm:py-6">
          {/* `DocumentLead` picks the sections up from here and puts the
              fold-all button in the sheet's top right, on the eyebrow's line. */}
          <SectionsContext.Provider value={sections}>
            <div className="space-y-10">{children}</div>
          </SectionsContext.Provider>
        </div>
      </div>
    </>
  );
}

/**
 * The document's own opening: what this dossier says, at the top of the sheet.
 *
 * It used to be the band — each direction put its headline, its display figure
 * and its standfirst on the indigo, so the four Research bands looked nothing
 * like the five other surfaces, which all open `eyebrow / surface name / one
 * line`. The band now does that too, and the direction's own opening moved
 * down here, which is where a document's title belongs anyway: the band names
 * the surface you are on, the lead says what the research found.
 *
 * The headline is a `<p>`, not a heading. `SurfaceHero` renders the page's
 * `<h1>` and the sections below render `<h2>` — a second `<h1>` in between
 * would break that order for the sake of type size it already has.
 */
export function DocumentLead({
  eyebrow,
  title,
  titleNode,
  standfirst,
  bordered = true,
}: {
  /**
   * Optional, and nothing passes it.
   *
   * All eight leads opened `Suvarna Agro Foods · annual leakage` and the like,
   * removed on request. It was the company name a third time on one screen —
   * the masthead's project switcher says it, the band used to, and it named
   * the direction you had just picked from a switch two inches above. The prop
   * survives for a lead that genuinely needs to name *which* project or *when*
   * it was researched, the same reason `SurfaceHero` kept its own.
   */
  eyebrow?: string;
  title?: string;
  /** Money's ₹9.1 Cr display is typeset, not a string. */
  titleNode?: ReactNode;
  standfirst?: string;
  /** Full's lead sits above the sections and needs the rule under it. Brief's
      sits in a column beside the content, where a bottom border underlines
      nothing. */
  bordered?: boolean;
}) {
  const sections = useContext(SectionsContext);

  return (
    <header className={cn(bordered && "border-b border-border-strong pb-4")}>
      {/* Title left, fold-all right, on one row.

          The title used to sit *below* this row, which was written when there
          was an eyebrow to put in it. With the eyebrows gone the row held one
          button and an empty `<span />`, so the sheet opened with about 28px of
          nothing above its headline and then ran straight into the standfirst.
          Putting the title in the row spends that space where it is worth
          something: the headline starts at the top of the sheet, and the gap
          under it grows to `mt-3`, which is what separates the thing being said
          from the sentence explaining it.

          The button is here rather than absolutely positioned in the sheet's
          corner because at 375 the sheet has 319px of content and every one of
          these titles wraps in it — an absolute button would have landed on the
          second line. In a row anything on the left wraps inside what is left,
          at every width, with no breakpoint to get wrong.

          `items-start`, so the button sits on the first line rather than
          centring itself against a wrapped one. */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && (
            <p className="text-micro font-medium text-muted-foreground">
              {eyebrow}
            </p>
          )}
          {titleNode ? (
            <div className={cn(eyebrow && "mt-1")}>{titleNode}</div>
          ) : (
            <p className={cn("font-display text-h1 leading-tight", eyebrow && "mt-1")}>{title}</p>
          )}
        </div>
        {sections && (
          <div className="flex shrink-0 items-center gap-2">
            <RelatedResources />
            <CollapseAll sections={sections} />
          </div>
        )}
      </div>
      {standfirst && (
        <p className="reading measure mt-3 text-base text-muted-foreground">{standfirst}</p>
      )}
    </header>
  );
}

/**
 * The navigator is the primary wayfinding device on a page that runs three to
 * four screens, so it is built to be read rather than to stay out of the way.
 *
 * It sits on its own card, matching the document sheet beside it. A bare rail
 * on the ivory page read as loose text floating next to the content; the card
 * makes it an object, and it is the second thing on the screen rather than an
 * annotation on the first.
 *
 * Two rules hold it clean:
 *
 * - **One line per entry.** Label and count share a baseline, count right of
 *   the label. The old two-line entry doubled the navigator's height on a list
 *   of eight sections for information you get again at the top of the section.
 *   The column width is set by this and not by taste: at 200px five of Money's
 *   nine labels wrapped, which is the same doubling arriving through the back
 *   door. **22rem is the width at which the longest label in any of the six —
 *   Certainty's "The money by how it was priced", with its count — holds one
 *   line.** It was a flat 19rem while the entries were `text-small`; putting
 *   them up to `text-base` wrapped exactly that label and nothing else, which
 *   is what the 3rem is for. Change either number and re-measure all six, not
 *   just the one on screen — `scripts/` has no permanent check for this, so it
 *   means dividing each label's height by its computed line-height.
 *
 *   **The column is 19rem to `xl` and 22rem above it**, rather than 22rem
 *   throughout, because Brief's lead column carries the same widths and a flat
 *   22rem clipped Stakeholder Brief at 1024×780. See `BriefFrame`. The cost is
 *   that one Certainty label wraps between 1024 and 1280 — on a page that
 *   scrolls, which is the cheaper of the two failures.
 * - **No money in the navigator.** A rupee figure per entry made it a second
 *   summary of the page competing with the band, and the same total appeared
 *   three times on one screen at three sizes. The count says how much is in
 *   there; the money belongs where it can show its base (§7.11).
 */
function SectionNav({ sections }: { sections: SectionRef[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  /* **The navigator now has two sticky things above it, not one.** It used to
     clear the masthead alone at 68px; the switch row is pinned as well, and it
     is 72px tall at every width from `lg` up (measured, and it does not wrap —
     if it ever does, this is wrong). So the card sits below 48 + 72 + 12 while
     the band is showing and below 72 + 12 once it has gone. Without this the
     top 52px of the card, which is its heading and its rounded edge, is painted
     over by the bar's own ground. */
  const mastheadVisible = useMastheadVisible();

  /**
   * Open the section, then glide to it.
   *
   * Two things the plain `href="#id"` could not do. **It jumped**, which on a
   * four-screen document tells you nothing about where you went — the whole
   * value of a navigator is knowing you moved and roughly how far. And **it
   * could land on a folded section**, which is the worst outcome: you click
   * "Benchmarks", the page moves, and what you asked for is still shut.
   *
   * Expanding first matters for the scroll and not only for the reading. A
   * section that opens *after* the browser has computed the target position
   * pushes everything below it, so the landing is wrong by the height of the
   * body that just appeared. `setStored` is synchronous into the store and
   * React flushes it before the click handler returns, so by the time
   * `scrollIntoView` runs the layout is final.
   *
   * `behavior` follows `prefers-reduced-motion`, which is not decoration here:
   * a long smooth scroll is exactly the kind of vestibular trigger that
   * setting exists for. Both harnesses emulate `reduce`, so they get the jump.
   */
  const goTo = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    const el = document.getElementById(id);
    if (!el) return;
    e.preventDefault();
    setStored(id, false);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    // The hash still changes, so the URL stays sendable — the whole reason
    // these are anchors and not buttons. `replaceState` rather than assigning
    // `location.hash`, which would re-trigger the browser's own jump and
    // undo the smooth scroll.
    history.replaceState(null, "", `#${id}`);
    setActive(id);
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      /* -132px, up from -96: the top of the window is now the masthead's 48px
         plus the pinned switch row's 72, and a section counted as "current"
         while it sits behind the bar highlights an entry for something the
         reader cannot see. */
      { rootMargin: "-132px 0px -60% 0px", threshold: 0 },
    );
    sections.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav aria-label="Research table of contents" className="hidden lg:block">
      {/* `overflow-hidden` so the header rule meets the rounded corners rather
          than running past them, and no padding on the card itself — the rule
          has to reach both edges to read as a divider instead of as an
          underline on the words. The list keeps its own inset. */}
      {/* `top-14`, not `top-4`. The masthead is sticky now and comes back on
          any upward scroll; at 16px this card sat 28px underneath it and the
          first two entries were unreachable exactly when someone was scrolling
          up to reach them. 56px is the band's 44px plus the 12px gap it had
          before. If the masthead's height changes, this changes with it. */}
      <div
        className={cn(
          "sticky overflow-hidden rounded-lg border border-border bg-card shadow-card transition-[top] duration-200 motion-reduce:transition-none",
          mastheadVisible ? "top-[8.25rem]" : "top-[5.25rem]",
        )}
      >
        {/* No tint behind the header. `bg-muted` is exactly the fill the active
            row uses, so a tinted header reads as a selected entry — and an
            alpha tint is worse still: the contrast checker cannot blend, and
            `bg-muted/40` reported 3.28:1 on text that is 5.9:1 on the card. */}
        {/* **Table of contents, not results**, on request. The card lists the
            sections of one document and moves you between them, which is what a
            contents page is; *results* said it was the findings themselves, and
            the findings are the sheet beside it. The `aria-label` on the `nav`
            says the same words, so the two cannot drift. */}
        <p className="border-b border-border px-3 py-2.5 text-micro font-medium text-muted-foreground">
          Research table of contents
        </p>
        {/* `pt-3` rather than the list's own `p-1.5`: at 6px the first entry
            sat almost on the rule, which read as the heading having an
            underline rather than the card having a divider — the same thing
            the rule reaching both edges was meant to fix. The extra space is
            what makes it a divider between two parts of the card. */}
        <ol className="space-y-px p-1.5 pt-3">
          {sections.map((s) => {
            const isActive = s.id === active;
            return (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={(e) => goTo(e, s.id)}
                  aria-current={isActive ? "true" : undefined}
                  className={cn(
                    // The count is right-aligned and shrink-0, the label wraps.
                    // Truncating the label instead would put an ellipsis on
                    // exactly the words you navigate by.
                    // `text-base`, up from `text-small`, on request. The
                    // navigator is the one list on the page you read by
                    // scanning rather than by reading, and at 13px it was set
                    // a size below the document it points at. The column grew
                    // with it — see the note on the column width above.
                    "flex items-baseline justify-between gap-3 rounded-md px-2.5 py-1.5 text-base transition-colors",
                    isActive
                      ? "bg-muted font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  <span className="min-w-0">{s.label}</span>
                  {s.meta && (
                    <span className="shrink-0 text-small tabular text-muted-foreground">
                      {s.meta}
                    </span>
                  )}
                </a>
              </li>
            );
          })}
        </ol>
      </div>
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

function setStored(id: string, collapsed: boolean) {
  // `=== collapsed` against the raw entry, not against `?? false`. A section
  // with no entry yet is not necessarily open — Benchmarks ships folded — so
  // defaulting the comparison to `false` made "open this one" a no-op on
  // exactly the sections a navigator click most needs to open.
  if (readAll()[id] === collapsed) return;
  const next = { ...readAll(), [id]: collapsed };
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — collapse still works for this session */
  }
  listeners.forEach((l) => l());
}

function setAllStored(ids: string[], collapsed: boolean) {
  const next = { ...readAll() };
  ids.forEach((id) => {
    next[id] = collapsed;
  });
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
 * **Full opens folded**, on request. A section with nothing stored against it
 * starts closed; `defaultCollapsed` on a `SectionRef` still overrides, and the
 * entries that set it `true` are now saying the same thing as the default
 * rather than something extra.
 *
 * What it changes: the first read of a direction is its *shape* — eight or nine
 * headings with their summary lines, one screen — and the second read is
 * whichever one you open. That is §7.1's three reads with the first two doing
 * less work each. What it costs is that Full no longer arrives as a document
 * you can scroll straight through, so `Open all` in the sheet's corner is now
 * the control that produces the old view rather than an occasional convenience.
 *
 * **What stays visible is the heading and whatever the section puts in
 * `right`** — the rupee figure and its share on Money, the count on the others
 * — plus any `stats` strip, which was already written to survive a fold. The
 * `summary` line is not: it renders on `!collapsed`, so a folded document shows
 * nine headings with their numbers and no prose at all. That is a deliberate
 * shape read and not an oversight, but **if the folded page ever reads as bare,
 * the one-line fix is dropping `!collapsed` from the summary's condition** —
 * heading, line and number is a table of contents rather than a stack of shut
 * boxes.
 *
 * It is the fallback and not a rewrite of the store, so anything the reader has
 * already opened stays open: `readAll()[id]` still wins. It is also what the
 * server renders, so there is no hydration mismatch to get wrong.
 */
const STARTS_FOLDED = true;

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
 * True when every section on the page is folded.
 *
 * A boolean, so `useSyncExternalStore`'s identity check is a value comparison
 * and this cannot loop the way a derived array or object would.
 */
function useAllCollapsed(sections: SectionRef[]) {
  return useSyncExternalStore(
    subscribe,
    () => sections.every((s) => readAll()[s.id] ?? s.defaultCollapsed ?? STARTS_FOLDED),
    () => STARTS_FOLDED,
  );
}

/**
 * One button for all of it: fold the whole document away, or open it back up.
 *
 * Full runs three to four screens and every section already folds on its own,
 * which is the wrong granularity for the two things a consultant actually does
 * — collapse the lot to see the shape of the dossier, or open the lot to read
 * or search it. Eight clicks for either was the gap.
 *
 * **It lives in the sheet's top right, on the eyebrow's row**, put there by
 * `DocumentLead` reading `SectionsContext`. It was in the navigator's header
 * for a revision, which is where it belongs semantically — the navigator lists
 * exactly the sections it folds — but the navigator is `hidden lg:block`, so
 * that needed a second copy inside the sheet below `lg`, on the width with the
 * longest scroll. One control at every width beats two that are each correct
 * somewhere.
 */
function CollapseAll({ sections, className }: { sections: SectionRef[]; className?: string }) {
  const allCollapsed = useAllCollapsed(sections);

  return (
    <button
      type="button"
      onClick={() =>
        setAllStored(
          sections.map((s) => s.id),
          !allCollapsed,
        )
      }
      // A drawn button, not a text link. It was bare words in the sheet's
      // corner, which on a page whose every section heading is also pressable
      // read as one more heading rather than as the one control that acts on
      // all of them. A border and a ground say "press me" without needing a
      // colour, which is reserved for links.
      // Icon only, on request. It sits in a corner nobody reads a label in, and
      // the chevron already says which way it goes — down when the document is
      // open, right when it is folded. The words survive as the accessible name
      // and the tooltip.
      title={allCollapsed ? "Open all sections" : "Fold all sections"}
      aria-label={allCollapsed ? "Open all sections" : "Fold all sections"}
      className={cn(
        "grid size-8 place-items-center rounded-md border border-border bg-card text-muted-foreground shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      {/* Two arrows meeting or parting, not one chevron rotating. A rotated
          chevron is the mark a *single* section uses for its own open state, so
          on a page of nine of them the control that acts on all nine was
          wearing the same glyph as the thing it acts on. This pair says
          collapse and expand and nothing else. */}
      {allCollapsed ? (
        <ChevronsUpDown className="size-4" />
      ) : (
        <ChevronsDownUp className="size-4" />
      )}
    </button>
  );
}

/**
 * Open the whole folder in the side panel.
 *
 * Beside Fold all, and drawn the same way, because the two are the pair of
 * things that act on the document as a whole rather than on part of it. The
 * source strip under the lead says what this page rests on; this says what we
 * have. Different questions, and only the second one wants a list of nine.
 */
function RelatedResources() {
  const { open } = usePanel();

  return (
    <button
      type="button"
      onClick={() => open({ kind: "sources" })}
      // Icon *and* label, on request, unlike Fold all beside it. The two are
      // not the same kind of control: the chevron is a direction and says its
      // own meaning, where a document icon could be anything until it is named.
      className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card px-2.5 py-1.5 text-micro font-medium text-muted-foreground shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground"
    >
      <FilingIcon />
      Related resources
    </button>
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
}: {
  id: string;
  title: string;
  summary?: string;
  right?: ReactNode;
  stats?: { label: string; value: string }[];
  children: ReactNode;
}) {
  // Whether this one starts folded is declared once, on the frame's `sections`
  // list, and read from there by both this and the fold-all button. It used to
  // be a prop here and a module-level registry written during render, which is
  // the impurity `react-hooks/immutability` exists to catch.
  const sections = useContext(SectionsContext);
  const defaultCollapsed = sections?.find((s) => s.id === id)?.defaultCollapsed ?? STARTS_FOLDED;
  const collapsed = useCollapsed(id, defaultCollapsed);

  return (
    <section>
      {/* The heading steps up to 26px from lg, where the page is long enough to
          need landmarks. Below that the column is narrow, the page is already
          one thing at a time, and 20px is the right size. */}
      <div className="flex items-baseline justify-between gap-4 border-b border-border-strong pb-2">
        {/* The offset clears everything pinned above: the masthead at 48px and
            the switch row at 72. It is the *worst* case rather than the current
            one, because the two states differ and an anchor cannot follow them
            — a jump down hides the band and leaves 56px of air above the
            heading, and a jump up brings the band back and the heading still
            clears it by 8px. Air above a heading you asked for is a much
            cheaper error than a heading behind a bar. */}
        <h2 id={id} className="scroll-mt-[8.25rem] min-w-0">
          <button
            type="button"
            aria-expanded={!collapsed}
            aria-controls={`${id}-body`}
            onClick={() => toggleStored(id)}
            className="group flex items-center gap-2 text-left"
          >
            {/* An SVG rather than a `›` glyph: against a 26px italic heading the
                character sat low and off-centre and read as a stray tick. The
                icon rotates about its own middle and can be aligned. */}
            <ChevronIcon
              className={cn(
                "text-muted-foreground transition-transform",
                !collapsed && "rotate-90",
              )}
            />
            {/* Hover shifts the ink, it does not underline.
                An underline on a 26px heading is a heavy mark, and on a page
                where every section carries one it read as a row of links —
                which these are not. They fold in place and go nowhere, and the
                one thing on this page that is allowed to look like a
                destination is the accent colour, which for the same reason
                cannot be used here either.

                So the shift is towards `--muted-foreground`, which is already
                the chevron's colour: on hover the heading and its chevron
                become one object rather than a heading with a tick beside it.
                It is the only other ink token in the theme, and it moves far
                enough to be read as a state (#1c1c33 → #5b5e70) without
                reading as disabled, because the chevron rotates at the same
                time and nothing that is dimming also moves. */}
            <span className="accent-heading text-h3 transition-colors group-hover:text-muted-foreground lg:text-h2">
              {title}
            </span>
          </button>
        </h2>
        {right && <div className="shrink-0 text-small text-muted-foreground">{right}</div>}
      </div>

      {summary && !collapsed && (
        <p className="reading mt-2 text-small text-muted-foreground measure">{summary}</p>
      )}

      {stats && stats.length > 0 && (
        <SummaryStrip items={stats} className={cn(summary && !collapsed ? "mt-2.5" : "mt-3")} />
      )}

      <div id={`${id}-body`} hidden={collapsed} className={cn(!collapsed && "mt-3")}>
        {children}
      </div>
    </section>
  );
}

/**
 * Dense summary strip. Stays visible when its section is folded away.
 *
 * The value leads at body size and the label follows as a tracked micro-cap,
 * so the row reads as four numbers with names rather than eight equal-weight
 * fragments. Kept on one baseline rather than stacked — this sits under a
 * headline on four surfaces and a stacked version doubles its height for a
 * legibility gain the size step already buys.
 *
 * Separated by space rather than by rules. The strip has to wrap — Call's
 * first value is a person's name — and a divider drawn per item lands at the
 * start of the second row, pointing at nothing. The size step is what makes
 * the pairs read; the rules were only ever helping.
 */
export function SummaryStrip({
  items,
  className,
}: {
  items: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "flex flex-wrap items-baseline gap-x-6 gap-y-1.5 rounded-md bg-muted px-4 py-3",
        className,
      )}
    >
      {items.map((it) => (
        <div key={it.label} className="flex items-baseline gap-1.5">
          <dd className="tabular text-base font-medium">{it.value}</dd>
          <dt className="text-micro text-muted-foreground">
            {it.label}
          </dt>
        </div>
      ))}
    </dl>
  );
}

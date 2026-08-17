"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { GROUP_ICON, GROUP_LABEL, GROUP_ORDER, directionsInGroup } from "@/lib/directions";
import { SaveButton } from "@/components/shell/SavedProvider";
import { ArrowIcon, ChevronIcon, SearchIcon, SparkIcon } from "@/components/meridian/Icons";
import { ResearchSwitches } from "@/components/shell/ResearchSwitch";
import { StickyBar } from "@/components/shell/StickyBar";
import { useAi } from "@/components/shell/AiPanel";
import {
  HIGHLIGHT,
  MIN_QUERY,
  NO_HITS,
  readingHits,
  setHere,
  setQuery,
  startsWord,
  useFind,
  type FindHits,
} from "@/components/shell/useFind";

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
  /** Shares the switch row. See `ResearchSwitches`. */
  actions?: ReactNode;
  /** The direction's own opening: its headline, its display figure and the
      standfirst under them. `DocumentLead`, the same component Full uses. */
  lead?: ReactNode;
  /** One `Section`. See the note below on why it is one. */
  children: ReactNode;
}) {
  /* **Brief is Full's layout now**, on request: the same navigator on the left,
     the same white sheet on the right, the same switch row pinned above both.
     Switching Full↔Brief changes what the document says and nothing about the
     page it says it on, which is what the two views were always meant to be.

     **What that gives up is the fixed screen**, and it is worth writing down
     because it was a real contract. Brief used to be one viewport with no
     scrollbar, and `check:ui` enforced it: content that overran had to clip
     visibly rather than be quietly absorbed. `max-w-lg`, the squeezed rhythm,
     the `roomy` gate, the `-2px` tracking, three separate notes about which
     Brief clipped by how many pixels at 375×667 — all of it existed to hold
     that line, and all of it is gone. What replaces it is editorial rather
     than structural: a Brief is short because it is *written* short, one
     section and one paragraph, not because the box refuses to grow. That is
     the weaker guarantee and the honest one, since the strong version was
     already being paid for in tracking and leading a reader over fifty
     notices.

     It also retires the two clips the harness had been reporting on Leaks and
     Tech: there is no `overflow-hidden` left for them to clip against. */
  return (
    <>
      {hero}
      <StickyBar className="pt-5 pb-3">
        <ResearchSwitches actions={actions} />
      </StickyBar>
      {/* **No headings under the active direction here**, on request. Full's
          navigator threads its eight or nine section headings under whichever
          direction you are reading, because Full has eight or nine sections to
          reach. Brief has one, so the thread would be a list of one pointing at
          the thing already on screen. What is left is the part that is useful
          in both views: the eleven directions, grouped, and the find box, which
          searches this sheet exactly as it searches Full's. */}
      <ResearchColumns sections={[]}>
        {lead}
        {children}
      </ResearchColumns>
    </>
  );
}

/**
 * The foot of every Brief: the way into Full, and nothing else.
 *
 * **The confidence badge is off it**, on request, and it was the left end of
 * this row on all thirteen Briefs. It is worth knowing what that costs, because
 * §7.5 is a standing rule: Brief no longer says how sure the product is about
 * anything on it. What still does is Certainty, which is a whole direction
 * about the question, and the confidence chip inside every gap's expanded
 * detail. If a one-line reading has to come back to Brief, this row is where it
 * was and the prop was called `confidence`.
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
  left,
}: {
  href: string;
  /** The direction's own words for what is on the other side. */
  children: ReactNode;
  /**
   * A line at the far end of the row, for a direction that has one thing worth
   * saying here. Only Call uses it, with who has been met and who has not: the
   * thing you check last before dialling. It was the `confidence` slot and is
   * named for its position now, because the badge it was written for is gone.
   */
  left?: ReactNode;
}) {
  return (
    <div className="shrink-0 pt-1">
      <div className="flex items-end justify-between gap-4">
        {left ?? <span />}
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
}

/* -------------------------------------------------------------------------- */
/* Find in the dossier                                                         */
/*                                                                             */
/* The navigator's box used to filter the list of readings and nothing else, so */
/* typing a word that is *in* the document — a job title, a system name, a      */
/* person — emptied the navigator and said "no topic matches" over a page that  */
/* had the word on it four times. It searches the words now, and it searches    */
/* **every reading rather than the one on screen**: which tab you were standing */
/* on when you typed is not something the reader knows, so it cannot decide     */
/* what a search finds. See `useFind.ts` for the index behind the other ten.    */
/*                                                                             */
/* This file holds the half that only works on the page you are actually on:    */
/* reading the live DOM, which is what marking the words requires.              */
/*                                                                             */
/* **The marking is the CSS Custom Highlight API, not `<mark>` elements.**      */
/* Wrapping matches means splitting text nodes React owns, which survives       */
/* exactly until React next re-renders that paragraph. Ranges live beside the   */
/* DOM rather than in it, so nothing in `suvarna.ts` or the eleven direction    */
/* components has to know this feature exists. Where the API is missing the     */
/* counts in the navigator still work and only the marking is lost.             */
/* -------------------------------------------------------------------------- */

/**
 * The section a match belongs to, for the count beside the navigator entry.
 *
 * Two shapes have to be recognised, because two things carry an anchor: a
 * `Section`, whose body is `<div id="${id}-body">` beside the `<h2 id>`, and a
 * row that is its own anchor — Idea build's workflow table lists four ids that
 * are `<tr>`s inside one section.
 */
function anchorFor(from: Element, ids: Set<string>) {
  for (let el: Element | null = from; el; el = el.parentElement) {
    const id = el.id;
    if (!id) continue;
    if (ids.has(id)) return id;
    const stem = id.endsWith("-body") ? id.slice(0, -5) : "";
    if (stem && ids.has(stem)) return stem;
  }
  return undefined;
}

/**
 * Walk the sheet, register every match as a highlight range, and report where
 * they landed.
 *
 * It runs from an effect rather than from the input's change handler, because
 * typing is no longer the only way the query arrives: following a result into
 * another reading brings the query with it, and that page has to mark its own
 * words on arrival with nobody having typed anything. What it writes to is the
 * find store, not React state, so this is not the `setState`-inside-an-effect
 * shape `pnpm lint` rejects.
 *
 * Two characters is the floor. One letter matches most of the alphabet on a
 * four-screen document, which is a page painted cyan rather than a search.
 */
function scanSheet(root: HTMLElement | null, raw: string, ids: Set<string>): FindHits {
  const supported = typeof CSS !== "undefined" && "highlights" in CSS;
  if (supported) CSS.highlights.delete(HIGHLIGHT);

  const q = raw.trim().toLowerCase();
  if (!root || q.length < MIN_QUERY) return NO_HITS;

  const ranges: Range[] = [];
  const bySection: Record<string, number> = {};
  let total = 0;

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  for (let node = walker.nextNode(); node; node = walker.nextNode()) {
    const text = node.nodeValue ?? "";
    const parent = node.parentElement;
    if (!text || !parent) continue;
    const hay = text.toLowerCase();
    let at = hay.indexOf(q);
    if (at === -1) continue;
    /* `checkVisibility` walks the chain, where `getComputedStyle` on a child of
       a folded section still reports `block` — the same trap `check:density`
       records. A match inside a folded section is not counted, because the
       navigator would then send you to a heading with nothing under it. */
    if (!parent.checkVisibility()) continue;
    const anchor = anchorFor(parent, ids);
    while (at !== -1) {
      /* Word-start only, the same rule the index counts by. See `startsWord`:
         without it "CTO" marks the middle of *sector*. */
      if (startsWord(hay, at)) {
        const range = document.createRange();
        range.setStart(node, at);
        range.setEnd(node, at + q.length);
        ranges.push(range);
        total += 1;
        if (anchor) bySection[anchor] = (bySection[anchor] ?? 0) + 1;
      }
      at = hay.indexOf(q, at + q.length);
    }
  }

  if (supported && ranges.length > 0) {
    CSS.highlights.set(HIGHLIGHT, new Highlight(...ranges));
  }
  return { total, bySection };
}

/**
 * The two columns every Research view is made of: the navigator, and the sheet.
 *
 * It exists so the find box and the document it searches are held by one
 * component. Brief and Full differ in what goes in the sheet and in whether
 * there are section anchors to list, and in nothing else.
 */
function ResearchColumns({
  sections,
  children,
}: {
  sections: SectionRef[];
  children: ReactNode;
}) {
  const sheet = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const { query } = useFind();

  /* A string rather than the array, so the effect below does not re-run on
     every render just because `sections` was rebuilt with the same contents. */
  const ids = sections.map((s) => s.id).join(",");

  /* Mark the words on this sheet whenever the query or the reading changes.
     The second half of that is the whole point: arriving here from a result in
     another reading has to mark the words with nobody having typed on this
     page. `setHere` writes to the find store rather than to React state, so
     this is not a `setState` inside an effect. */
  useEffect(() => {
    setHere(scanSheet(sheet.current, query, new Set(ids ? ids.split(",") : [])));
  }, [query, pathname, ids]);

  return (
    <div className="prose-full reading-airy surface-frame under-bar grid gap-x-10 gap-y-6 pb-12 sm:pb-16 lg:grid-cols-[19rem_minmax(0,1fr)] xl:grid-cols-[22rem_minmax(0,1fr)]">
      <SectionNav sections={sections} />
      {/* The attribute is what `useFind`'s parser looks for when it fetches
          this same page for another reading's count. A class would work until
          somebody changed the class. */}
      <div
        ref={sheet}
        data-research-sheet
        className="min-w-0 rounded-lg border border-border bg-card px-4 py-5 shadow-card sm:px-6 sm:py-6"
      >
        <div className="space-y-10">{children}</div>
      </div>
    </div>
  );
}


/**
 * The table of contents: every category, its readings, and the headings inside
 * the one you are on.
 *
 * **It replaced the four group dropdowns**, on request, and it is the better
 * shape for the same information. A dropdown per category showed where you were
 * only when you happened to be inside that category; a tree shows the whole set
 * at once, says which reading you are on, and puts the headings of that reading
 * directly under it — which is the thing a four-screen dossier actually needs.
 *
 * **Three levels, and only one branch is ever expanded.** Eleven readings with
 * every section listed would be forty entries in a 22rem column. The sections
 * appear under the active reading alone, because they are the only ones whose
 * anchors go anywhere from here.
 *
 * - **A card, matching the sheet beside it.** On bare ivory it read as loose
 *   text set next to the document rather than as the page's second object.
 * - **The readings are `<Link>`s and the sections are anchors**, so both can be
 *   opened in a new tab and sent to a colleague. That is what the picker on the
 *   switch row gives up, and the reason it is only there where this is not.
 * - **It scrolls inside itself past the viewport.** Four categories plus a
 *   branch of headings runs past a short window, and a navigator that pushes its
 *   own last entry off the screen is one you cannot use to reach that entry.
 */
function SectionNav({ sections }: { sections: SectionRef[] }) {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean);
  const slug = parts[1] ?? "";
  const view = parts[2] === "brief" ? "brief" : "full";
  const [active, setActive] = useState(sections[0]?.id);

  /* `version` is unused by name and load-bearing: it changes when a reading
     finishes parsing, which is what makes `readingHits` below recount. */
  const { query, here, loading, version } = useFind();
  void version;
  const q = query.trim().toLowerCase();
  const searching = q.length >= MIN_QUERY;

  /* **It matches the topic's name and the category's**, and nothing else. A
     reading appearing for a word the reader cannot see in it reads as a bug,
     which is the rule `ProjectMenu`'s filter already keeps. The category is
     included because that is the other word on screen: typing "money" should
     find the two readings filed under *The money* as well as the one called
     Financial. */
  const matchesName = (name: string, group: (typeof GROUP_ORDER)[number]) =>
    q === "" ||
    name.toLowerCase().includes(q) ||
    GROUP_LABEL[group].toLowerCase().includes(q);

  /**
   * What one reading has to say about this query.
   *
   * The reading you are standing on is counted off the live DOM and every
   * other one off the index. Two sources for one number needs justifying: the
   * DOM is instant where the index is a fetch away, and it is the only reading
   * whose folded sections we can see. A count that appears the moment you
   * finish typing, on the page you are looking at, is worth more than one
   * consistent with ten pages you are not.
   */
  const readingFor = (d: { slug: string }) => {
    if (d.slug === slug) {
      return {
        total: here.total,
        sections: sections
          .filter((s) => here.bySection[s.id])
          .map((s) => ({ ...s, count: here.bySection[s.id] })),
      };
    }
    return readingHits(d.slug, view, query);
  };

  const rows = GROUP_ORDER.map((group) => ({
    group,
    shown: directionsInGroup(group)
      .map((d) => ({ d, hits: readingFor(d) }))
      .filter(({ d, hits }) => matchesName(d.name, group) || (searching && hits.total > 0)),
  })).filter((r) => r.shown.length > 0);

  const shownCount = rows.reduce((n, r) => n + r.shown.length, 0);
  const found = rows.reduce((n, r) => n + r.shown.filter((s) => s.hits.total > 0).length, 0);
  const total = rows.reduce(
    (n, r) => n + r.shown.reduce((m, s) => m + s.hits.total, 0),
    0,
  );

  /* Scroll-spy on the headings of the reading you are on: the last one that has
     passed the point where a reader would say they are in it. 160px is the two
     pinned things above the document — the masthead at 48 and the switch row at
     72 — plus a little, so a heading counts as reached when it clears them
     rather than when it touches the top of the window. `passive`, because this
     runs on every scroll frame. */
  useEffect(() => {
    const onScroll = () => {
      let current = sections[0]?.id;
      for (const s of sections) {
        const el = document.getElementById(s.id);
        if (el && el.getBoundingClientRect().top <= 160) current = s.id;
      }
      setActive(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sections]);

  return (
    /* `hidden lg:block`: below `lg` the document is one column and a navigator
       above it would push the material a screen down. That width is where the
       switch row's grouped picker takes over. */
    <nav
      aria-label="Research table of contents"
      className="hidden self-start overflow-hidden rounded-lg border border-border bg-card shadow-card lg:sticky lg:top-[7.5rem] lg:block"
    >
      <p className="border-b border-border px-3 py-2.5 text-micro font-normal tracking-[0.16em] uppercase text-muted-foreground">
        Research
      </p>

      {/* **The filter is inside the card and outside the scroller**, on
          request. Eleven readings in four categories is a list you can read,
          and it is also a list you scroll past to reach *The money*: a box that
          scrolls away from the thing it filters is a box you have to go back up
          to use.

          **No `autoFocus`.** `ProjectMenu`'s filter takes focus because that
          menu did not exist a moment ago and was opened deliberately. This is
          on the page, and a page that steals the caret on load is one where the
          first key you press goes somewhere you did not choose.

          A real `<label>` is not worth a line here: there is no visible text to
          point at and the placeholder repeats the name, so `aria-label` is the
          honest version. */}
      <div className="relative border-b border-border">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          <SearchIcon />
        </span>
        {/* `text`, not `search`. A `search` input draws the platform's own
            clear button, which is a different shape on every OS and is exactly
            the argument `SelectField` makes about the native chevron. The other
            filter in the product, `ProjectMenu`'s, is a `text` input; two
            search boxes disagreeing about whether they have a clear button is
            where a treatment drifts. */}
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value, view)}
          placeholder="Find a topic or a word"
          aria-label="Find a research topic, or a word anywhere in this research"
          className="w-full bg-transparent py-2.5 pl-9 pr-3 text-small text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
        />
      </div>

      {/* What the box found, across the whole dossier rather than this page.
          The marks are two feet to the right and only on the reading you happen
          to be on, so a reader who typed a word that lives three tabs away has
          to be told here — inferring it from an absence of cyan is inferring
          the opposite of the truth.

          **It says the reading count, not just the word count.** "9 in 3
          readings" is the sentence that answers *where*, which is the question
          somebody searching a dossier is asking. */}
      {searching && (
        <p
          role="status"
          className="border-b border-border px-3 py-2 text-micro text-muted-foreground"
        >
          {total > 0
            ? `${total} ${total === 1 ? "match" : "matches"} in ${found} ${found === 1 ? "reading" : "readings"}`
            : loading
              ? "Searching the other readings…"
              : "Not in this research"}
          {/* The other ten arrive a moment after this one. Saying so beats a
              count that silently grows under the reader's eyes. */}
          {total > 0 && loading && ", still searching…"}
        </p>
      )}

      <div className="scroll-slim max-h-[calc(100vh-18rem)] overflow-y-auto p-1.5 pt-2.5">
        {/* Said in words rather than left as an empty card: a filter that
            silently empties the thing it filters reads as the page having
            broken. */}
        {/* One letter never searches the words, so it may not claim to have. */}
        {shownCount === 0 && (
          <p className="px-2.5 py-2 text-small text-muted-foreground" role="status">
            No {searching ? "topic or text" : "topic"} matches “{query.trim()}”.
          </p>
        )}
        {rows.map(({ group, shown }) => {
          return (
          /* **A rule between the categories**, on request, and it bleeds to the
              card's edges rather than sitting inside the list's own inset: at
              `px-1.5` the line stopped short of both sides and read as an
              underline on the category above it instead of a boundary between
              two. Same reason the card's header rule reaches both edges.

              `first:` drops it on the first group, where there is nothing above
              to be separated from. */
          <div
            key={group}
            className="-mx-1.5 mt-3 border-t border-border px-1.5 pt-3 first:mt-0 first:border-t-0 first:pt-0"
          >
            {/* The category, as a label rather than a link: there is no page for
                a category and a heading that looks pressable and is not is worse
                than one that never invited the press. */}
            {/* Regular weight, wide tracking, and the gap below it equal to the
                gap between two entries. A category label that sits tight to its
                first item reads as a caption on that item rather than as the
                head of the list; one even rhythm is what says it heads all of
                them. It shares the entries' left edge for the same reason.

                **The mark does the job the masthead's tab icons do**: four
                labels that all open with "The" are four labels you read rather
                than aim at. `aria-hidden`, because the word beside it is the
                name and a category is not pressable. `gap-2` rather than the
                entries' own indent, so the label still starts on the list's
                left edge and the icon hangs in the padding beside it. */}
            <p className="flex items-center gap-2 px-2.5 pb-2 text-micro font-normal tracking-[0.16em] uppercase text-muted-foreground">
              {(() => {
                const Icon = GROUP_ICON[group];
                return <Icon aria-hidden className="size-3.5 shrink-0" />;
              })()}
              {GROUP_LABEL[group]}
            </p>
            <ol>
              {shown.map(({ d, hits }) => {
                const onThis = d.slug === slug;
                /* With no query the thread under the reading you are on is
                   every heading, which is what a table of contents is. With one
                   it is the headings the word is actually under, on **any**
                   reading: that is the difference between "Stakeholders
                   mentions the CTO" and "it is under Who decides", and it is
                   the thing that makes a result in another tab worth a click.

                   A query that matches only a reading's *name* has no text hits
                   to narrow by, so that reading shows its whole thread if it is
                   the one you are on and nothing if it is not. */
                const thread = searching
                  ? hits.sections
                  : onThis
                    ? sections.map((s) => ({ ...s, count: 0 }))
                    : [];
                return (
                  <li key={d.slug}>
                    <Link
                      href={`/research/${d.slug}/${view}`}
                      aria-current={onThis ? "page" : undefined}
                      /* **The active entry is a filled row again**, on request.
                         It was ink at 500 and nothing else, on the argument
                         that the active direction is the one unfolding its own
                         headings underneath it, so the tint was a second mark
                         saying what the branch already said. That argument
                         holds on Full and fails on Brief, which has one section
                         and therefore no branch: weight alone, in a column of
                         eleven entries that are all the same ink, is not a
                         selector you can find at a glance.

                         A fill rather than a rail, for the reason the navigator
                         has always given: inside a card a rail is a second
                         vertical line 12px from the card's own border. */
                      className={cn(
                        "flex items-baseline justify-between gap-2 rounded-md px-2.5 py-2 text-base transition-colors",
                        onThis
                          ? "bg-muted font-medium text-foreground"
                          : "text-foreground hover:text-muted-foreground",
                      )}
                    >
                      <span className="min-w-0">{d.name}</span>
                      {/* The count is on the reading rather than only on its
                          headings, because a Brief has no headings and would
                          otherwise show a hit with nowhere to put it. */}
                      {searching && hits.total > 0 && (
                        <span className="tabular shrink-0 text-micro font-normal text-evidence">
                          {hits.total}
                        </span>
                      )}
                    </Link>

                    {/* The headings, indented under the reading, joined by the
                        same elbow the question threads use: a curve out of the
                        entry above says *these came from that*, where a
                        straight rail beside them only said they were indented.
                        `.toc-link` in `globals.css`. */}
                    {thread.length > 0 && (
                      <ol className="mt-0.5 mb-1 ml-6 pl-1">
                        {thread.map((s) => (
                          <li key={s.id} className="toc-link relative">
                            {/* A bare hash on the reading you are on, a full
                                path on any other: a `#id` from Financial does
                                not reach a heading in Stakeholders, and a
                                result you cannot click is a result that made
                                the reader do the navigating themselves.

                                **`Link` off this page, `<a>` on it**, and the
                                difference is load-bearing rather than tidy. A
                                raw `<a href="/research/…">` is a document
                                navigation: the module the query lives in is
                                torn down and rebuilt empty, so following a
                                result cleared the search that found it and the
                                page you landed on marked nothing. `Link`
                                navigates on the client and the store survives,
                                which is the whole of how the highlight arrives
                                with you. Within the page a plain anchor is
                                still right — there is no route change to make,
                                and `Link` would only add one. */}
                            <SectionLink
                              href={
                                onThis ? `#${s.id}` : `/research/${d.slug}/${view}#${s.id}`
                              }
                              sameReading={onThis}
                              current={onThis && s.id === active}
                              label={s.label}
                              count={s.count}
                            />
                          </li>
                        ))}
                      </ol>
                    )}
                  </li>
                );
              })}
            </ol>
          </div>
          );
        })}
      </div>
    </nav>
  );
}

/** One heading in the navigator's thread. See the note at the call site for
    why the element differs between a heading here and one three tabs away. */
function SectionLink({
  href,
  sameReading,
  current,
  label,
  count,
}: {
  href: string;
  sameReading: boolean;
  current: boolean;
  label: string;
  count: number;
}) {
  const className = cn(
    "flex items-baseline justify-between gap-2 rounded-md px-2 py-1.5 text-small transition-colors",
    current
      ? "font-medium text-foreground"
      : "text-muted-foreground hover:text-foreground",
  );
  const body = (
    <>
      <span className="min-w-0">{label}</span>
      {count > 0 && (
        <span className="tabular shrink-0 text-micro text-evidence">{count}</span>
      )}
    </>
  );
  return sameReading ? (
    <a href={href} aria-current={current ? "true" : undefined} className={className}>
      {body}
    </a>
  ) : (
    <Link href={href} className={className}>
      {body}
    </Link>
  );
}

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
  /** The headings on this page, for the navigator beside it. */
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
      <StickyBar className="pt-5 pb-3">
        <ResearchSwitches actions={actions} />
      </StickyBar>
      {/* **The navigator and the sheet are back**, and what changed instead is
          the format inside them.
      
          They came off for a revision on the reading that "no special design
          elements" meant the frame too. It did not: a dossier that runs three
          or four screens is scanned rather than read, and the thing that makes
          it scannable is a list of its headings that stays on screen. What was
          actually wrong was inside the sheet — every section opened folded
          behind a chevron, so the page was a stack of shut boxes and the
          navigator was the only way to see what was in them.
          
          So: two columns as before, and every section open, headed and set as
          prose. See `Section`. */}
      {/* One sheet, not nine cards. The reference boxes every block because it
          is a dashboard of independent widgets; this is a continuous document,
          where a border between "How the total is built" and the buckets it
          reconciles would be a wall between two halves of one argument.

          40px between sections against ~12px inside one. What has to hold is
          the ratio, not the pixel: at 32px the page read as one
          undifferentiated column. */}
      <ResearchColumns sections={sections}>{children}</ResearchColumns>
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
        {/* **No controls in the corner**, on request. *Related resources* and
            *Fold all* were the two things up here that were not the document,
            and with the sections open and the navigator gone the second had
            nothing left to fold. The sources are still one click from every
            claim that cites them, which is where §7.4 asks for them. */}
      </div>
      {standfirst && (
        <p className="reading measure mt-3 text-base text-muted-foreground">{standfirst}</p>
      )}
    </header>
  );
}

/* -------------------------------------------------------------------------- */
/* Folding, remembered per section                                             */
/*                                                                             */
/* `useSyncExternalStore` rather than an effect: the server has no              */
/* `localStorage`, so reading it in render is a hydration mismatch and reading  */
/* it in an effect is a synchronous `setState` inside one, which `pnpm lint`    */
/* rejects. Same shape as the assistant's panel width, and the same reason.     */
/* -------------------------------------------------------------------------- */

const KEY = "meridian-collapsed";
const listeners = new Set<() => void>();
let cache: Record<string, boolean> | null = null;

function readAll(): Record<string, boolean> {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(KEY) ?? "{}") as Record<string, boolean>;
  } catch {
    cache = {};
  }
  return cache;
}

/**
 * `collapsed` is passed in rather than read back out of the store, and that is
 * the whole of a bug worth not reintroducing.
 *
 * Writing `!readAll()[id]` looks equivalent and is not: on a section nobody has
 * touched there is no entry, so that is `!undefined`, which is `true`. When the
 * default was folded, the first press on every heading wrote "collapsed" over
 * "collapsed" and the section sat there. The caller knows the real state
 * because it has already resolved the stored value against the default.
 */
function toggleStored(id: string, collapsed: boolean) {
  const next = { ...readAll(), [id]: !collapsed };
  cache = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* private mode — folding still works for this session */
  }
  listeners.forEach((l) => l());
}

const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};

function useCollapsed(id: string) {
  return useSyncExternalStore(
    subscribe,
    () => readAll()[id] ?? false,
    () => false,
  );
}

/**
 * A section: a heading you can fold, a line saying what it is, and the material.
 *
 * **The chevron is back on every title**, on request, in the shape it had
 * before: a rotating mark, the heading beside it, a rule under the row.
 *
 * **What is different is the default.** Sections used to open *folded*, so the
 * page arrived as a stack of shut boxes and the navigator was the only way to
 * see what was in any of them. They open now, which is what makes the document
 * scannable — heading, line, material, straight down — and folding is there for
 * a reader who wants a section out of the way rather than something they have to
 * undo eight times before they can read anything.
 *
 * **The summary stays visible when folded.** A folded section that says only its
 * own title is a box with a name on it; with the line under it the folded page
 * is a table of contents that happens to be in place.
 *
 * Hover shifts the ink rather than underlining. An underline on a 26px heading
 * is a heavy mark, and on a page carrying eight of them it read as a row of
 * links — which these are not: they fold in place and go nowhere. The shift is
 * towards `--muted-foreground`, which is the chevron's own colour, so on hover
 * the heading and its mark become one object; and nothing that is dimming also
 * moves, which is what keeps it from reading as disabled.
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
  /** Optional: a section may be its heading and its paragraph and nothing
      else. The chevron still folds the summary, which is the whole of what
      there is to fold. */
  children?: ReactNode;
}) {
  const collapsed = useCollapsed(id);
  const pathname = usePathname();
  const { attach } = useAi();

  return (
    <section>
      <div className="flex items-baseline justify-between gap-4 border-b border-border-strong pb-2">
        {/* The scroll offset clears the masthead at 48px and the switch row at
            72, and it is the worst case rather than the current one: the two
            states differ and an anchor cannot follow them. Air above a heading
            you asked for is a much cheaper error than a heading behind a bar. */}
        <h2 id={id} className="min-w-0 scroll-mt-[8.25rem]">
          <button
            type="button"
            aria-expanded={!collapsed}
            aria-controls={`${id}-body`}
            onClick={() => toggleStored(id, collapsed)}
            className="group flex items-center gap-2 text-left"
          >
            {/* An SVG rather than a `›` glyph: against a 26px heading the
                character sits low and off-centre and reads as a stray tick. */}
            <ChevronIcon
              className={cn(
                "shrink-0 text-muted-foreground transition-transform",
                !collapsed && "rotate-90",
              )}
            />
            <span className="accent-heading text-h3 transition-colors group-hover:text-muted-foreground lg:text-h2">
              {title}
            </span>
          </button>
        </h2>
        <div className="flex shrink-0 items-center gap-3">
          {right && <div className="text-small text-muted-foreground">{right}</div>}

          {/* **Save first, Ask Helix second**, on request, which reverses the
              order this file used to argue for. The old reasoning put asking
              first because it is the thing done during a call. What decides it
              instead is shape: the labelled button is the wider of the two and
              the row ends at the sheet's edge, so the bare box sits inboard and
              the button takes the end. It is also the order the question rows
              use, where the mark comes before the drawn button.

              `gap-1.5` between the two and `gap-3` back to `right`: they are
              one pair of controls, and the meta beside them is a different kind
              of thing. */}
          <div className="flex shrink-0 items-center gap-1.5">
            {/* **Saveable, like a question or a finding.** A section is the
                third thing worth putting aside before a call: the argument you
                mean to re-read. The href carries the anchor, so the saved list
                is a way back to this heading rather than to the top of the
                dossier.

                **It wears the component's own drawn box now**, on request. It
                carried an override stripping the border, the ground and the
                shadow, which made it the one bookmark in the product that was
                a bare glyph: the same control is a drawn box on every question
                and every gap, and a reader who has learnt the box on those two
                surfaces should not have to learn a second shape here. */}
            <SaveButton
              item={{
                kind: "research",
                id: `${pathname}#${id}`,
                label: title,
                href: `${pathname}#${id}`,
              }}
            />
            {/* **Ask Helix, as a labelled button rather than a bare spark**, on
                request, and it is the same drawn button `Copy` uses on a
                question: border, ground, shadow, icon and label at
                `text-micro`, no accent, because cyan on this page means
                somewhere to go and this opens a panel. A spark on its own could
                be anything until it is named, which is the argument the copy
                control already records about its own icon.

                It attaches and does not ask. Same contract as `SelectionAsk`
                and the detail panel's header button: the subject is ours to
                carry and the question is the reader's to write, so this drops a
                chip on the composer and puts the caret in the box. Composing a
                question here would be guessing at it from the one thing the
                reader has not told us. */}
            <button
              type="button"
              /* The word is `display:none` below `sm`, which takes it out of
                 the accessibility tree with it, so the name is stated here and
                 is the same at every width. */
              aria-label={`Ask Helix about “${title}”`}
              onClick={() =>
                attach({
                  kind: "Section",
                  /* The paragraph, not just the heading. A section is now its
                     title and its summary, so the summary *is* the material and
                     a chip carrying the heading alone would attach a label. */
                  text: summary ? `${title}. ${summary}` : title,
                  /* `answerFor` routes on this when the typed question lands
                     nowhere, and a heading is a far better query than 400 words
                     of prose. */
                  query: title,
                })
              }
              className="flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card px-2 py-1.5 text-micro font-medium text-muted-foreground shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-2.5"
            >
              <SparkIcon />
              {/* Hidden below `sm`, the same trade `Copy` makes: the drawn box
                  is the same button at every width and it is only the label a
                  phone cannot afford beside a wrapping heading. */}
              <span className="hidden sm:inline">Ask Helix</span>
            </button>
          </div>
        </div>
      </div>

      {/* **The summary stays visible when the section folds** — what you lose
          is the body and what you keep is knowing it is there.

          **Unless there is no body, in which case the summary is it.** A
          section that is a heading and a paragraph has nothing under the fold,
          so leaving the summary outside would give it a chevron that folds
          nothing: a control that lies about what it does, and the one thing a
          disclosure may not be. */}
      {summary && children && (
        <p className="reading measure mt-2 text-small text-muted-foreground">{summary}</p>
      )}

      {stats && stats.length > 0 && <SummaryStrip items={stats} className="mt-2.5" />}

      <div
        id={`${id}-body`}
        hidden={collapsed}
        className={cn(!collapsed && (children ? "mt-3" : "mt-2"))}
      >
        {children ?? (
          summary && (
            <p className="reading measure text-small text-muted-foreground">{summary}</p>
          )
        )}
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

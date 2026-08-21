"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { GROUP_LABEL, GROUP_ORDER, directionsInGroup } from "@/lib/directions";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SwitchScroller, SwitchTrack, switchItemClass } from "./SwitchTrack";

/**
 * Research's two switches, and the row that holds them.
 *
 * Both are on the page now, side by side on one line above the document, each
 * behind its own label. They were on the band — first as one row under the
 * tiles, then split with Full/Brief in the band's top-right corner — and the
 * band's corner has since gone to `RunButton`, which is the only thing on a
 * Research screen that *does* something rather than navigating.
 *
 * Putting them on one row is not just tidiness: both change what the body says
 * and neither changes which surface you are on, so both belong with the body.
 * What keeps them reading as two questions rather than one six-item control is
 * the labels, not the distance between them.
 *
 * Full is the default view and owns the entry points into Research. **Brief
 * leads the Detail switch**, on request: the position is about which one is
 * reached for rather than which one is arrived at. See `ViewSwitch`.
 */

/**
 * Where the reader is, in the two coordinates this row sets.
 *
 * **Four views, and only two of them take a direction.** Brief and Full are one
 * direction at a time, so their route carries a slug: `/research/company/full`.
 * An agenda is *across* the eleven by construction, so Intro and Discovery live
 * at `/research/intro` and `/research/discovery` with no slug in the URL. That
 * is why this hook reads the *shape* of the path rather than one segment: two
 * segments after `research` is a reading, one is an agenda.
 *
 * The slug it returns on an agenda is `company`, the direction Research lands
 * on, so the two reading tabs always point somewhere. Carrying the last-read
 * slug across would need state on a control whose whole job is to be a link.
 */
type ResearchView = "brief" | "full" | "intro" | "discovery";

/** The two that are agendas rather than readings. See `ViewSwitch`. */
const AGENDAS = ["intro", "discovery"] as const;

function isAgenda(seg: string | undefined): seg is (typeof AGENDAS)[number] {
  return (AGENDAS as readonly string[]).includes(seg ?? "");
}

function useResearchRoute(): { slug: string; view: ResearchView } {
  const parts = usePathname().split("/").filter(Boolean);

  if (isAgenda(parts[1]) && parts[2] === undefined) {
    return { slug: "company", view: parts[1] };
  }

  return {
    slug: parts[1] ?? "money",
    view: parts[2] === "brief" ? "brief" : "full",
  };
}

/**
 * The row: both switches side by side on one line, neither of them labelled.
 *
 * **The gap is what makes side by side possible.** Two tracks used to carry
 * `DIRECTION` and `DETAIL` micro-caps saying they were two questions rather
 * than one six-item control; with underline tabs the break in the rule says it
 * instead, which is why the gap between the tracks (28px) has to beat the gap
 * inside one (16px). See `SwitchTrack` for why the labels came off.
 *
 * **The switch scroller is one horizontal scroller**, not two boxes that can
 * wrap. A wrapped second row costs Brief around 28px it does not have, and
 * scrolling costs nothing vertically, which on a screen that may not scroll is
 * the only currency there is. Losing the labels and the rails took the tracks
 * from ~525px to 351px, so at 375 they now fit exactly rather than scrolling —
 * but the scroller stays, because the failure it prevents is a wrap.
 *
 * **`actions` shares this row, on request, and it is what removed the header
 * from Research entirely.** `RunButton` was in `SurfaceHero`'s `actions` slot,
 * which after the surface name and its description came off was a row holding
 * one button and a great deal of ivory. On this row it costs nothing: the
 * tracks are ~350px of a full-width frame, so the button drops into space that
 * was already empty, and Research gains the whole header back.
 *
 * The distinction the old placement was protecting — *work you start* on the
 * chrome, *readings of the body* on the page — does not survive the header
 * going away, because there is no chrome left to put the first one on. What
 * replaces it is position on the row: the tabs at the reading edge, the button
 * at the far end.
 */
export function ResearchSwitches({
  tight = false,
  actions,
}: {
  /**
   * Brief. **It no longer changes the size of anything** — the tabs, their
   * padding and the gaps are one set of values in both views, on request,
   * because this row is the skeleton Full and Brief share and a control that
   * resizes when you press it is the one thing it may not do. All `tight` still
   * decides is whether `RunButton` shows below `roomy`.
   */
  tight?: boolean;
  actions?: ReactNode;
}) {
  const { view } = useResearchRoute();
  const agenda = isAgenda(view);

  return (
    // `items-end`, so the button's baseline lands on the rule the tabs sit on
    // rather than floating above it. It wraps below `sm`, where the tracks need
    // the whole width; the button then takes its own line under them.
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      {/* `w-full` below `sm`, `flex-1` above it — **not `flex-1` alone**, which
          is the trap this repo has now hit five times. `flex: 1 1 0%` with
          `min-w-0` is permission to shrink below the content's own width, so
          beside a `shrink-0` button the tracks collapsed to ~180px at 375 and
          the last tab scrolled out of sight rather than the row wrapping.
          Giving the scroller a hypothetical size the button's line cannot hold
          is what actually forces the wrap. */}
      <SwitchScroller className="w-full sm:flex-1">
        {/* A rule between the two tracks, because with no labels the gap was the
            only thing saying they are two questions and not one six-item bar.
            Space alone had to be large to carry that (28px, against 16px inside
            a track); a divider says it outright, so the gaps come down to 12px a
            side and the row gets 4px narrower rather than wider. On a 351px
            phone that is not nothing.

            `self-stretch` rather than a fixed height: the rule then runs the
            height of the tabs including the pad their underline hangs in, so it
            reads as the boundary between two bars and not as a tick floating
            beside them. */}
        {/* **Detail leads the row now**, on request. It is two words against
            nine, and it is the switch a consultant reaches for most — Brief is
            the thing you move to in the five minutes before a call. At the far
            end it was the last thing on a row that scrolls; at the near end it
            is the first thing the eye and the tab order both reach. */}
        {/* 24px either side of the rule, in both views. It was 16 on Brief,
            which is the same `tight` shrink the tabs themselves carried and it
            went for the same reason: this row is the one thing Full and Brief
            share exactly, and it may not change size when you switch between
            them. */}
        {/* **The four group dropdowns are gone**, on request. What replaced
            them is the navigator down the left of Full, which lists every
            category with its readings under it — a tree that shows where you are
            in one look rather than four boxes that each show it only when you
            happen to be inside them. See `ResearchNav`.
            
            What is left on the row is Detail, and one grouped picker for the
            widths where the navigator is not there: below `lg` on Full, and on
            Brief, which has no left column of its own. Removing it as well would
            leave Research with no way to change direction on a phone, which is
            the width Brief exists for. */}
        {/* **The Reading picker is off on the two agendas.** They are across the
            eleven directions by construction, so a control that changes which
            direction you are reading would change nothing on the page in front
            of you, and a control that does nothing is worse than no control. */}
        <div className="flex w-max items-stretch gap-6">
          <ViewSwitch />
          {!agenda && (
            <>
              <span
                className={cn("w-px shrink-0 self-stretch bg-border", !tight && "lg:hidden")}
                aria-hidden
              />
              <DirectionPicker className={cn(!tight && "lg:hidden")} />
            </>
          )}
        </div>
      </SwitchScroller>
      {actions && (
        // Hidden below `roomy` on Brief, which is a fixed screen read in a
        // corridor four minutes before a call: re-running the pipeline is not
        // something anybody does there, and the button would take a line of its
        // own out of a screen that has none.
        <div
          className={cn(
            "ml-auto flex shrink-0 items-center gap-2",
            tight && "hidden roomy:flex",
          )}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

/**
 * One picker, grouped, for the widths the navigator does not cover.
 *
 * It is a single `<select>` with an `<optgroup>` per category rather than the
 * four group dropdowns it replaces: the same tree the navigator draws, in the
 * one control a phone can hold. `optgroup` is what makes it a tree rather than
 * a list of eleven — the platform draws the category headings itself, which is
 * exactly the structure being asked for.
 *
 * Native, like every other dropdown in the product: keyboard-operable and
 * screen-reader correct for free, and on a phone it opens the platform's own
 * picker. The cost is that these are no longer links, so a direction cannot be
 * opened in a new tab — which is why the navigator's entries still are.
 */
function DirectionPicker({ className }: { className?: string }) {
  const { slug, view } = useResearchRoute();
  const router = useRouter();
  const id = useId();

  return (
    <div className={cn("flex shrink-0 items-center gap-2 self-center", className)}>
      <label htmlFor={id} className="shrink-0 text-small font-medium text-muted-foreground">
        Reading
      </label>
      <Select value={slug} onValueChange={(v) => router.push(`/research/${v}/${view}`)}>
        <SelectTrigger id={id} className="h-8 w-auto shrink-0 py-0.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {GROUP_ORDER.map((group) => (
            <SelectGroup key={group}>
              <SelectLabel>{GROUP_LABEL[group]}</SelectLabel>
              {directionsInGroup(group).map((d) => (
                <SelectItem key={d.slug} value={d.slug}>
                  {d.name}
                </SelectItem>
              ))}
            </SelectGroup>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/** Which of the four, in one track. */
function ViewSwitch() {
  const { slug, view } = useResearchRoute();

  return (
    <SwitchTrack label="View" className="shrink-0">
      {/* **Four tabs, on request: the two readings and the two agendas back on
          one track.** They were split for a revision, the agendas going to a
          `/calls` surface of their own, on the argument that a control may only
          ask one question and this one was asking two — *how much of this
          subject* for the first pair, *what do I say on Tuesday* for the second.

          What that cost is the trip the pair exists to remove. A consultant
          reaching for an agenda is already in Research with a call starting,
          and sending him to the masthead to find the dossier's own agenda is a
          navigation for something that is the same material at a different
          altitude — every line of both agendas is read off the data these
          eleven directions render, see `lib/calls.ts`.

          So they are one track again, and what keeps the two questions apart is
          the order rather than a second bar: the readings first, in the order
          they are reached for, then the meetings in the order they happen. The
          rule under the tabs runs the whole width either way.

          **Brief leads**, which is about which one is *reached for* rather than
          which one is arrived at: it is the one-screen read in the five minutes
          before a call, and the leftmost tab is the cheapest to hit and the
          first one read. It is the landing too — the masthead's Research tab
          points at `/research/company/brief`.

          **They say "Brief Research" and "Full Research"**, not the bare
          adjective the route uses, and beside "Intro call" and "Discovery call"
          that pays for itself twice: four tabs where two name a reading and two
          name a meeting need the noun to say which kind each is. An explicit
          label pair, not a `capitalize`d slug — the moment a tab's words stop
          being its slug spelled differently, deriving them is a trick that has
          to be undone. Same reason `CompareView` writes its two out. */}
      {(
        [
          ["brief", "Brief Research", `/research/${slug}/brief`],
          ["full", "Full Research", `/research/${slug}/full`],
          ["intro", "Intro call", "/research/intro"],
          ["discovery", "Discovery call", "/research/discovery"],
        ] as const
      ).map(([m, label, href]) => (
        <Link
          key={m}
          href={href}
          aria-current={m === view ? "true" : undefined}
          className={switchItemClass(m === view)}
        >
          {label}
        </Link>
      ))}
    </SwitchTrack>
  );
}

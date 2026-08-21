"use client";

import Link from "next/link";
import { pluralise } from "@/lib/format";
import {
  DISCOVERY_MINUTES,
  INTRO_MINUTES,
  discoveryCall,
  introCall,
  type CallItem,
} from "@/lib/calls";
import { company } from "@/lib/suvarna";
import { cn } from "@/lib/cn";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";
import { ArrowIcon } from "@/components/meridian/Icons";
import {
  DocumentLead,
  FullFrame,
  Section,
  useSectionSpy,
  type SectionRef,
} from "./Frames";

/* --------------------------------------------------------------------------
   Calls: what to emphasise on each kind of meeting, and in what order.

   **These are agendas over the eleven directions, not two more directions.**
   Brief and Full both answer *what do we know about them*, cut by subject.
   These two answer *what do I say, and in what order*, cut by which meeting it
   is. The material is the same material — every line is read off the same data
   the direction it points at renders, see `lib/calls.ts` — and what these add
   is a sequence and a reason per step.

   **Why they are views rather than surfaces.** They were a `/calls` surface of
   their own for a revision, with a masthead tab and a switch of their own. A
   consultant reaching for these is already in Research with a call starting,
   and making him leave the dossier to find its agenda is the trip this pair
   exists to remove. They are back on the same switch as Brief and Full, which
   is four tabs on one track, because they are the same question at a different
   altitude. See `ViewSwitch`.

   **Why they do not take a direction.** Brief and Full are one direction at a
   time, so their route carries a slug. An agenda is *across* the directions by
   construction, so these two live at `/research/intro` and
   `/research/discovery` with no slug in the URL, and the Reading picker is
   hidden on them: a control that changes something the page does not show is
   worse than no control. See `ResearchSwitches`.
   ----------------------------------------------------------------------- */

export function IntroCallView() {
  return (
    <CallFrame
      title="Intro call"
      standfirst={`The first ${INTRO_MINUTES} minutes with somebody who has not decided whether we are worth a second meeting. Nine areas, in the order they are reached for. Nothing on this list is a claim we cannot back, and no rupee figure of ours is said out loud.`}
      minutes={INTRO_MINUTES}
      items={introCall}
      /* The one instruction that is about the call rather than about an area,
         so it cannot sit inside a numbered step. */
      close="The success condition is another meeting, not a scope. If the last item lands as a question they answer, the call worked."
    />
  );
}

export function DiscoveryCallView() {
  return (
    <CallFrame
      title="Discovery call"
      standfirst={`The second conversation, and a different job: confirm what we think is wrong, put the numbers on a footing that survives a CFO, and leave with a data extract rather than goodwill. About ${DISCOVERY_MINUTES} minutes.`}
      minutes={DISCOVERY_MINUTES}
      items={discoveryCall}
      close="The success condition is the extract. A discovery call that produced agreement and no data has to be run again."
    />
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Both agendas, in Research's own frame.
 *
 * **`FullFrame`, on request, and it reverses what this file used to argue.**
 * The first build deliberately avoided both Research frames on the grounds that
 * their navigator lists eleven directions, and an agenda is a summary *across*
 * those eleven rather than one of them. What that reasoning got wrong is what
 * the navigator is for: it is the table of contents for the page you are on,
 * not a list of things the page is about. An agenda that runs eight or nine
 * headed steps is exactly the shape that column exists to make scannable, and
 * arriving at it from Brief or Full to find the whole page furniture gone was
 * the tab announcing itself as a different product.
 *
 * So these keep Full Research's frame in every structural respect: a pinned
 * switch row, a navigator on the left, the same sheet, the same `Section` per
 * heading with its chevron, its bookmark and its Ask Helix. What is different
 * is what those two slots hold. The row asks which call rather than which
 * reading, and the column lists this agenda's own steps rather than the eleven
 * directions — on a surface of its own, a table of contents for the dossier
 * next door is a list of eleven places this page cannot take you.
 */
function CallFrame({
  title,
  standfirst,
  minutes,
  items,
  close,
}: {
  title: string;
  standfirst: string;
  minutes: number;
  items: CallItem[];
  close: string;
}) {
  /* The headings this view renders, for the navigator beside it. Built from
     the same items the sections are, so a heading cannot be missing from the
     list — the rule every direction's own `SECTIONS` constant follows. */
  const sections: SectionRef[] = items.map((item) => ({
    id: stepId(item),
    label: `${item.n}. ${item.title}`,
  }));

  return (
    <FullFrame
      sections={sections}
      hero={<SurfaceHero title="Calls" />}
      actions={<RunButton label="Run research" />}
      nav={<StepNav title={title} sections={sections} />}
    >
      <DocumentLead
        title={title}
        standfirst={standfirst}
        /* The meta line sits under the rule rather than above it, so the lead
           is the same two-part object every direction opens with. */
      />
      <p className="-mt-6 text-micro text-muted-foreground">
        {pluralise(items.length, "step", "steps")} · about {minutes} minutes · {company.name}
      </p>

      {items.map((item) => (
        <CallStep key={item.n} item={item} />
      ))}

      {/* The one instruction that is about the call rather than about a step,
          so it is a closing paragraph rather than a tenth heading. */}
      <p className="reading border-t border-border-strong pt-4 text-small">{close}</p>
    </FullFrame>
  );
}

/**
 * The navigator: this agenda's steps, and where you are in them.
 *
 * Research's `SectionNav` is a three-level tree with a find box over eleven
 * readings; an agenda has one level and eight or nine entries, so this is the
 * same card with the middle level taken out. It keeps what makes that column
 * work — sticky, a card matching the sheet, anchors rather than buttons so a
 * step can be sent to a colleague — and drops the filter, which would be a
 * search box over nine lines already on screen.
 *
 * `hidden lg:block`, like Research's: below `lg` the document is one column and
 * a navigator above it would push the material a screen down. The switch row is
 * the only control that has to survive that width, and it does.
 */
function StepNav({ title, sections }: { title: string; sections: SectionRef[] }) {
  const active = useSectionSpy(sections);

  return (
    <nav
      aria-label={`${title} steps`}
      className="hidden self-start overflow-hidden rounded-lg border border-border bg-card shadow-card lg:sticky lg:top-[7.5rem] lg:block"
    >
      <p className="border-b border-border px-3 py-2.5 text-micro font-normal tracking-[0.16em] uppercase text-muted-foreground">
        {title}
      </p>
      <ol className="scroll-slim max-h-[calc(100vh-14rem)] overflow-y-auto p-1.5">
        {sections.map((sec) => (
          <li key={sec.id} className="toc-link relative">
            <a
              href={`#${sec.id}`}
              aria-current={sec.id === active ? "true" : undefined}
              className={cn(
                "block rounded-md px-2.5 py-2 text-small transition-colors",
                sec.id === active
                  ? "bg-muted font-medium text-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {sec.label}
            </a>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** One id per step, stable across renders and unique on the page. The number
 *  is in it because two agendas could name a step the same thing. */
const stepId = (item: CallItem) => `step-${item.n}`;

/**
 * One step, as a `Section`: the same headed, foldable, saveable block every
 * other Research heading is.
 *
 * **Two registers on purpose.** `why` is about the call and goes in the
 * section's own summary line, where every direction puts the sentence that
 * says what a section is; `say` is the thing read seconds before it comes out
 * of a mouth, so it sits in the body at reading size behind an accent rule.
 * An agenda where the reasoning and the speech look the same is one a
 * consultant has to parse while somebody is talking to him.
 *
 * **The link keeps `BriefFooter`'s pill**, which is the element every Brief
 * ends on. Inside a section it is the way down to the material the step is
 * summarising, and a drawn box is what distinguishes it from the prose above.
 */
function CallStep({ item }: { item: CallItem }) {
  return (
    <Section id={stepId(item)} title={`${item.n}. ${item.title}`} summary={item.why}>
      <p className="reading border-l-2 border-accent/40 pl-3 text-small">{item.say}</p>
      <div className="mt-3">
        <Link
          href={item.href}
          className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card px-3 py-1.5 text-small font-medium text-evidence shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground"
        >
          {item.hrefLabel}
          <ArrowIcon />
        </Link>
      </div>
    </Section>
  );
}

"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import {
  company,
  gapById,
  systemSplit,
  systemsByState,
  techSystems,
  valueForSystem,
  valueForSystemState,
  type SystemState,
  type TechSystem,
} from "@/lib/suvarna";
import { BriefFrame, DocumentLead, FullFrame, Section, type SectionRef } from "./Frames";
import { ConfidenceBadge } from "@/components/meridian/Confidence";
import { Eyebrow } from "@/components/meridian/Primitives";
import { SourceChip } from "@/components/meridian/Evidence";
import { ArrowIcon } from "@/components/meridian/Icons";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";
import { usePanel } from "@/components/meridian/EvidencePanel";

/* -------------------------------------------------------------------------- */
/* Direction 3 — Tech stack                                                    */
/*                                                                             */
/* The axis is the machine underneath. Every other direction sorts the same     */
/* finding set by something about the *deal* — its money, its timing, its       */
/* exposure, its people. This one sorts it by what the work runs on, which is   */
/* the question nothing else answers and the first one a vendor selling         */
/* automation onto SAP has to answer before it can scope anything.              */
/*                                                                             */
/* THE SHAPE IS THE FINDING. Three modules live, three processes running        */
/* outside any system, three systems never bought. Six of the twelve gaps sit   */
/* inside software they already own; the other six sit in the space between and */
/* are worth nearly twice as much. Both halves are derived from the data rather */
/* than written down, because a sentence claiming "half and half" goes stale    */
/* the first time a gap moves.                                                  */
/*                                                                             */
/* **State is a mark and a word, never a hue.** live / worked around / missing  */
/* is a statement about the software estate and not about how well the company  */
/* is running, and Operations already owns colour for the second thing. A red   */
/* row here would be read as "this process is failing" on a screen whose whole  */
/* subject is something else. Same reasoning as Risk's severity badge.          */
/* -------------------------------------------------------------------------- */

const LIVE = systemsByState("live");
const WORKAROUND = systemsByState("workaround");
const MISSING = systemsByState("missing");

const STATE_LABEL: Record<SystemState, string> = {
  live: "Live",
  workaround: "Worked around",
  missing: "Never bought",
};

const BRIEF_STANDFIRST = `${systemSplit.insideGaps} of the ${systemSplit.insideGaps + systemSplit.outsideGaps} findings sit inside SAP. The other ${systemSplit.outsideGaps} are worth ${money(systemSplit.outsideValue)}, and there is no system to put them in.`;

const BRIEF_HEADLINE = (
  <p className="font-display text-h2 leading-[1.15]">
    They run three SAP modules. The money is mostly in the gaps between them.
  </p>
);

/**
 * State as a mark, not a colour. Filled, half, hollow — so it survives
 * greyscale and a projector that eats saturation, and so it cannot be confused
 * with Operations' health hues.
 */
function StateBadge({ state }: { state: SystemState }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-micro font-medium text-muted-foreground">
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          state === "live"
            ? "bg-foreground"
            : state === "workaround"
              ? "border border-foreground bg-transparent"
              : "border border-dashed border-border-strong bg-transparent",
        )}
      />
      {STATE_LABEL[state]}
    </span>
  );
}

export function TechBrief() {
  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      hero={
        <SurfaceHero
          tight
          collapseAtRoomy
          title="Research"
          titleNode={
            <div className="roomy:hidden">
              {BRIEF_HEADLINE}
              <p className="reading measure mt-1 text-small text-muted-foreground">
                {BRIEF_STANDFIRST}
              </p>
            </div>
          }
        />
      }
      lead={
        <DocumentLead
          bordered={false}
          titleNode={BRIEF_HEADLINE}
          standfirst={BRIEF_STANDFIRST}
        />
      }
    >
      {/* The three that have no system at all. Not the live modules: what a
          consultant needs out loud is the absence, because that is the thing
          the client cannot argue with and the thing Heizen sells into. */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <Eyebrow>Nothing runs these</Eyebrow>
        <ul className="mt-1.5 space-y-2">
          {MISSING.map((sys) => (
            <li key={sys.id}>
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-base font-medium leading-snug">{sys.name}</span>
                <span className="tabular shrink-0 text-base font-medium">
                  {money(valueForSystem(sys.id))}
                </span>
              </div>
              <p className="reading mt-0.5 text-small text-muted-foreground">{sys.fallsTo}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* What they do have, as one line rather than three rows. On a screen
          that may not scroll, the live estate is context and the absence is the
          point — so the modules get named and nothing more. */}
      <div className="shrink-0 rounded-md border border-dashed border-border-strong px-4 py-2 sm:py-3">
        <div className="text-micro font-medium text-muted-foreground">
          What is already live
        </div>
        <p className="mt-1 text-small measure">
          {LIVE.map((s) => s.name).join(", ")} on {company.facts[2].value}. Everything you
          would build sits on top of these, not instead of them.
        </p>
      </div>

      <div className="shrink-0 pt-1">
        <div className="flex items-end justify-between gap-4">
          <ConfidenceBadge level={company.confidence} showReason={false} />
          <Link
            href="/research/tech/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small transition-colors hover:text-muted-foreground"
          >
            All {techSystems.length} systems
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

const SECTIONS: SectionRef[] = [
  { id: "split", label: "Where the money sits", meta: "2 lines" },
  { id: "missing", label: "Never bought", meta: `${MISSING.length} systems` },
  { id: "workaround", label: "Worked around", meta: `${WORKAROUND.length} systems` },
  { id: "live", label: "Already live", meta: `${LIVE.length} modules` },
  {
    id: "integration",
    label: "What you would be building on",
    defaultCollapsed: true,
  },
];

export function TechFull() {
  return (
    <FullFrame
      sections={SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="What they run, and what it does not do"
        standfirst={`${company.facts[2].value}, with ${LIVE.length} modules live. Every finding below is filed under the one system where the work actually lands on a person, so the subtotals add to the same ${money(company.grossLeakageCr)} every other direction ties to.`}
      />


      {/* The whole argument, before any of the rows. Two lines, because the
          split is the finding and a reader who stops here has still had it. */}
      <Section
        id="split"
        title="Where the money sits"
        summary="Both lines are counted from the findings themselves. Nothing here is a claim about the estate that the list below does not also make."
      >
        <dl className="divide-y divide-border">
          <SplitRow
            label="Inside software they already own"
            detail={`${LIVE.map((s) => s.name).join(", ")} — configured, live, and carrying ${systemSplit.insideGaps} of the findings.`}
            count={systemSplit.insideGaps}
            value={systemSplit.insideValue}
          />
          <SplitRow
            label="In the space between"
            detail={`${WORKAROUND.length} processes running on email, phone and a spreadsheet, and ${MISSING.length} systems that were never bought.`}
            count={systemSplit.outsideGaps}
            value={systemSplit.outsideValue}
          />
        </dl>
        <p className="reading mt-3 text-small text-muted-foreground measure">
          Same number of findings on each side, and nearly twice the money on the second. That
          is the argument for buying software rather than more people, and it is the one line
          on this screen worth saying out loud.
        </p>
      </Section>

      <Section
        id="missing"
        title="Never bought"
        summary="No system does this, so a person does. Each row names who."
        right={
          <span className="tabular text-small text-muted-foreground">
            {money(valueForSystemState("missing"))}
          </span>
        }
      >
        <div className="divide-y divide-border">
          {MISSING.map((sys) => (
            <SystemBlock key={sys.id} system={sys} />
          ))}
        </div>
      </Section>

      <Section
        id="workaround"
        title="Worked around"
        summary="The process exists and runs. It just does not run anywhere that leaves a record."
        right={
          <span className="tabular text-small text-muted-foreground">
            {money(valueForSystemState("workaround"))}
          </span>
        }
      >
        <div className="divide-y divide-border">
          {WORKAROUND.map((sys) => (
            <SystemBlock key={sys.id} system={sys} />
          ))}
        </div>
      </Section>

      <Section
        id="live"
        title="Already live"
        summary="What is configured and in use. These are not problems; they are the ground anything new would stand on."
        right={
          <span className="tabular text-small text-muted-foreground">
            {money(valueForSystemState("live"))}
          </span>
        }
      >
        <div className="divide-y divide-border">
          {LIVE.map((sys) => (
            <SystemBlock key={sys.id} system={sys} />
          ))}
        </div>
      </Section>

      <Section
        id="integration"
        title="What you would be building on"
        summary="The scoping answer, in the form an engineer asks for it."
      >
        <p className="reading text-small measure">
          {company.facts[2].value} with {LIVE.map((s) => s.name).join(", ")} live and no
          warehouse module. That is an old release, on premise, and it decides the shape of
          everything: integration is against a stable, well documented interface, and nothing
          proposed here needs the client to upgrade first.
        </p>
        <p className="reading mt-2.5 text-small text-muted-foreground measure">
          It also decides what not to propose. Replacing a live module is a different
          conversation from putting a layer in front of one, and every finding above is the
          second kind.
        </p>
      </Section>
    </FullFrame>
  );
}

/** One line of the split. The count and the money share a row, because the
 *  comparison the section exists to make is between two pairs of numbers. */
function SplitRow({
  label,
  detail,
  count,
  value,
}: {
  label: string;
  detail: string;
  count: number;
  value: number;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <dt className="text-base font-medium">{label}</dt>
        <dd className="reading mt-0.5 text-small text-muted-foreground measure">{detail}</dd>
      </div>
      <dd className="flex shrink-0 items-baseline gap-3">
        <span className="tabular text-small text-muted-foreground">{count} findings</span>
        <span className="tabular text-lead font-medium">{money(value)}</span>
      </dd>
    </div>
  );
}

/**
 * One system, and what sits on it.
 *
 * `fallsTo` is set apart with a rule and the accent on the two states that have
 * one, the same treatment Risk gives a counter — it is the half of the row that
 * names a person, and on a screen that is otherwise a module list that is the
 * only part anybody acts on.
 */
function SystemBlock({ system }: { system: TechSystem }) {
  const { open } = usePanel();

  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="flex flex-wrap items-baseline gap-2.5">
          <StateBadge state={system.state} />
          <span className="text-base font-medium">{system.name}</span>
        </span>
        <span className="tabular shrink-0 text-small text-muted-foreground">
          {money(valueForSystem(system.id))}
        </span>
      </div>

      <p className="reading mt-2 text-small measure">{system.does}</p>

      {system.fallsTo && (
        <div className="mt-2.5 border-l-2 border-evidence pl-3">
          <p className="text-micro font-medium text-muted-foreground">
            So it falls to
          </p>
          <p className="reading mt-1 text-small measure">{system.fallsTo}</p>
        </div>
      )}

      {/* The findings on this system, as rows you can open rather than a count.
          A number here would be the third statement of something the section
          heading and the subtotal already make. */}
      <ul className="mt-2.5 space-y-1">
        {system.gapIds.map((id) => {
          const gap = gapById(id);
          return (
            <li key={id}>
              <button
                type="button"
                onClick={() => open({ kind: "gap", id })}
                className="group flex w-full items-baseline justify-between gap-3 text-left"
              >
                <span className="min-w-0 text-small transition-colors group-hover:text-muted-foreground">
                  {gap.title}
                </span>
                <span className="tabular shrink-0 text-small text-muted-foreground">
                  {gap.amountCr == null ? "Not priced" : money(gap.amountCr)}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      <div className="mt-2.5 flex flex-wrap items-baseline gap-1.5 text-micro text-muted-foreground">
        {system.sourceIds.map((id) => (
          <SourceChip key={id} sourceId={id} />
        ))}
      </div>
    </div>
  );
}

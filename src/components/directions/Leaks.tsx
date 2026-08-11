"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  buckets,
  company,
  coverage,
  gapById,
  gaps,
  type Gap,
} from "@/lib/suvarna";

import { BriefFrame, DocumentLead, FullFrame, Section, type SectionRef } from "./Frames";
import { ConfidenceBadge, EffortChip } from "@/components/meridian/Confidence";
import { Eyebrow } from "@/components/meridian/Primitives";
import { ArrowIcon } from "@/components/meridian/Icons";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";
import { usePanel } from "@/components/meridian/EvidencePanel";

/** The gaps in one bucket, in the order the bucket lists them. */
const gapsIn = (bucketId: string) =>
  (buckets.find((b) => b.id === bucketId)?.gapIds ?? []).map(gapById);

/* -------------------------------------------------------------------------- */
/* Operation leaks — the same findings, read as failures of the operation      */
/*                                                                             */
/* Financial reads them as slices of ₹9.1 Cr. This reads them as things that   */
/* keep going wrong, grouped by the stage they happen in, with no rupee figure  */
/* anywhere. The operator in the room does not think in leakage; they think in  */
/* the step that breaks, and this is the only view that puts the step first.    */
/* -------------------------------------------------------------------------- */

const STAGES = coverage.map((c) => c.stage);
const inStage = (stage: string) => gaps.filter((g) => g.scor === stage);

/** The three that go wrong most visibly, not the three worth most. */
const WORST = ["g11", "g2", "g5"].map(gapById);

export function LeaksBrief() {
  const { open } = usePanel();

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
              <p className="font-display text-h2 leading-[1.15]">
                Twelve places the operation loses time
              </p>
              <p className="reading measure mt-1 text-small text-muted-foreground">
                Nine of them sit in buying. Nobody has looked at the plants.
              </p>
            </div>
          }
        />
      }
      lead={
        <DocumentLead
          bordered={false}
          titleNode={
            <p className="font-display text-h2 leading-[1.15]">
              Twelve places the operation loses time
            </p>
          }
          standfirst="The same findings as Financial, with the money taken off. What breaks, where it breaks, and how sure we are."
        />
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <Eyebrow>The three that break most visibly</Eyebrow>
        <ul className="mt-1.5 space-y-2.5">
          {WORST.map((gap, i) => (
            <li key={gap.id} className={cn(i === 2 && "hidden sm:block")}>
              <button
                type="button"
                onClick={() => open({ kind: "gap", id: gap.id })}
                className="group w-full text-left"
              >
                <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                  <EffortChip level={gap.effort} />
                  <span className="text-base font-medium leading-snug transition-colors group-hover:text-muted-foreground">
                    {gap.title}
                  </span>
                </span>
                <span className="reading mt-0.5 block text-small text-muted-foreground">
                  {gap.plainLine}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 rounded-md border border-dashed border-border-strong px-4 py-2 sm:py-3">
        <Eyebrow>Where they sit</Eyebrow>
        <p className="mt-1 text-small measure">
          {STAGES.map((s) => `${s} ${inStage(s).length}`).join(" · ")}. Nine of twelve are in
          one stage, which is where the work has been done rather than where the problems are.
        </p>
      </div>

      <div className="shrink-0 pt-1">
        <div className="flex items-end justify-between gap-4">
          <ConfidenceBadge level={company.confidence} showReason={false} />
          <Link
            href="/research/leaks/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small transition-colors hover:text-muted-foreground"
          >
            All {gaps.length}
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

const SECTIONS: SectionRef[] = buckets.map((b) => ({
  id: `l-${b.id}`,
  label: b.name,
  meta: `${b.gapIds.length} leaks`,
}));

export function LeaksFull() {
  return (
    <FullFrame
      sections={SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="Where the operation loses time and control"
        standfirst={`The same ${gaps.length} findings Financial prices, read as failures of the operation instead. Grouped by the part of the business they happen in, with no rupee figure on any of them: what breaks, and how sure we are it is real.`}
      />

      {buckets.map((b) => (
        <Section key={b.id} id={`l-${b.id}`} title={b.name} summary={b.plainLine}>
          <ul className="divide-y divide-border">
            {gapsIn(b.id).map((gap) => (
              <LeakRow key={gap.id} gap={gap} />
            ))}
          </ul>
        </Section>
      ))}
    </FullFrame>
  );
}

function LeakRow({ gap }: { gap: Gap }) {
  const { open } = usePanel();

  return (
    <li>
      <button
        type="button"
        onClick={() => open({ kind: "gap", id: gap.id })}
        className="group -mx-2 w-full rounded-md px-2 py-3 text-left transition-colors hover:bg-muted"
      >
        <span className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <EffortChip level={gap.effort} />
          <span className="text-base font-medium transition-colors group-hover:text-muted-foreground">
            {gap.title}
          </span>
        </span>
        <span className="reading mt-1 block text-small text-muted-foreground">
          {gap.hypothesis}
        </span>
      </button>
    </li>
  );
}

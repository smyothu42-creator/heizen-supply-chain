"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { buckets, company, gapById, gaps } from "@/lib/suvarna";

import { BriefFrame, DocumentLead, FullFrame, Section, type SectionRef } from "./Frames";
import { ConfidenceBadge } from "@/components/meridian/Confidence";
import { ArrowIcon } from "@/components/meridian/Icons";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";
import { usePanel } from "@/components/meridian/EvidencePanel";

/** The gaps in one bucket, in the order the bucket lists them. */
const gapsIn = (bucketId: string) =>
  (buckets.find((b) => b.id === bucketId)?.gapIds ?? []).map(gapById);

/* -------------------------------------------------------------------------- */
/* What should build — the proposal                                            */
/*                                                                             */
/* One workflow per area of the operation, each naming the findings it covers.  */
/* **Written in the one-pager's voice**: we monitor, we connect, we give. Second */
/* person, present tense, no conditionals — it is read seconds before being said */
/* out loud, and "an opportunity exists to consolidate" has to be translated     */
/* under pressure, which is when it will not be.                                */
/*                                                                             */
/* The workflow copy is the one thing on this screen not derived from the gap    */
/* set, because a proposal is a judgement rather than a reading. Everything else */
/* — which findings each one covers, how many, how long — comes off the data.    */
/* -------------------------------------------------------------------------- */

interface Workflow {
  bucketId: string;
  /** What it is called on a proposal. */
  name: string;
  /** What it does, in the voice above. */
  does: string;
  /** What changes once it is running. */
  changes: string;
}

const WORKFLOWS: Workflow[] = [
  {
    bucketId: "b-pay",
    name: "Invoice capture and matching",
    does: "We read every supplier invoice as it arrives and match it against the order and the receipt before anyone touches it, routing only the exceptions to your team.",
    changes:
      "Nine people stop keying 96,000 invoices a year, the first-time match rate moves off 58%, and the early-payment window stops closing while paperwork moves.",
  },
  {
    bucketId: "b-buy",
    name: "Supplier master and contract routing",
    does: "We clean the vendor master against tax number and bank account, then route indirect buying to a contracted rate by default so off-contract purchases become the exception rather than the norm.",
    changes:
      "Duplicate records stop splitting your spend, onboarding drops from three weeks, and category managers negotiate against a volume that is actually visible.",
  },
  {
    bucketId: "b-move",
    name: "Stock and freight visibility",
    does: "We put demand planning and freight tendering into one view, with rates compared against the last award and cover tracked by product and location rather than in a spreadsheet.",
    changes:
      "Thirty-eight days of finished-goods cover comes down, lanes stop running on a single hauler, and goods receipts stop reaching the system days after the goods.",
  },
  {
    bucketId: "b-recover",
    name: "Claims and deduction recovery",
    does: "We reconcile distributor claims and scheme deductions automatically, flagging the ones that do not match what was agreed.",
    changes: "What is owed back stops depending on somebody having time to check it.",
  },
];

const bucketName = (id: string) => buckets.find((b) => b.id === id)?.name ?? id;
const weeksFor = (id: string) =>
  Math.max(...gapsIn(id).map((g) => g.weeks), 0);

export function BuildBrief() {
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
                Four workflows, on top of the SAP they already run
              </p>
              <p className="reading measure mt-1 text-small text-muted-foreground">
                One per part of the operation. No new ERP, no plant downtime.
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
              Four workflows, on top of the SAP they already run
            </p>
          }
          standfirst={`What Heizen would deploy at ${company.name}, one workflow per part of the operation, each covering findings that already have evidence behind them.`}
        />
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <ol className="space-y-3">
          {WORKFLOWS.map((w, i) => (
            /* The fourth drops at 375: Brief may not scroll, and the claims
               workflow is the smallest of the four by every measure. */
            <li key={w.bucketId} className={cn("flex gap-3", i === 3 && "hidden sm:flex")}>
              <span className="tabular w-6 shrink-0 pt-0.5 text-small font-medium text-muted-foreground">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="min-w-0">
                <span className="block text-base font-medium leading-snug">{w.name}</span>
                <span className="reading mt-0.5 block text-small text-muted-foreground">
                  {w.does}
                </span>
              </span>
            </li>
          ))}
        </ol>
      </div>

      <div className="shrink-0 pt-1">
        <div className="flex items-end justify-between gap-4">
          <ConfidenceBadge level={company.confidence} showReason={false} />
          <Link
            href="/research/build/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small transition-colors hover:text-muted-foreground"
          >
            What each one covers
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

const SECTIONS: SectionRef[] = WORKFLOWS.map((w, i) => ({
  id: `w-${w.bucketId}`,
  label: w.name,
  meta: `${String(i + 1).padStart(2, "0")}`,
}));

export function BuildFull() {
  const { open } = usePanel();

  return (
    <FullFrame
      sections={SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="What Heizen would build"
        standfirst={`Four workflows, one per part of the operation, covering ${gaps.length} findings between them. Everything sits on top of ${company.facts[2].value}: no new ERP, no module to license, no plant downtime.`}
      />

      {WORKFLOWS.map((w, i) => (
        <Section
          key={w.bucketId}
          id={`w-${w.bucketId}`}
          title={w.name}
          summary={`Covers ${bucketName(w.bucketId).toLowerCase()}.`}
          right={
            <span className="tabular text-small text-muted-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
          }
        >
          <p className="reading text-base">{w.does}</p>

          <div className="mt-3 border-l-2 border-evidence pl-3">
            <p className="text-micro font-medium text-muted-foreground">What changes</p>
            <p className="reading mt-1 text-small">{w.changes}</p>
          </div>

          <p className="mt-4 text-micro font-medium text-muted-foreground">
            The findings it covers
          </p>
          <ul className="mt-1.5 divide-y divide-border">
            {gapsIn(w.bucketId).map((g) => (
              <li key={g.id}>
                <button
                  type="button"
                  onClick={() => open({ kind: "gap", id: g.id })}
                  className="group flex w-full items-baseline justify-between gap-3 py-2 text-left"
                >
                  <span className="min-w-0 text-small transition-colors group-hover:text-muted-foreground">
                    {g.title}
                  </span>
                  <span className="tabular shrink-0 text-small text-muted-foreground">
                    {g.weeks} weeks
                  </span>
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-small text-muted-foreground">
            Longest job in this workflow: {weeksFor(w.bucketId)} weeks. The order they run in is
            on Gaps, where the prerequisites are.
          </p>
        </Section>
      ))}
    </FullFrame>
  );
}

export const _gapById = gapById;

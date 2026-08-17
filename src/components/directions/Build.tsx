"use client";

import { buckets, company, gapById, gaps } from "@/lib/suvarna";

import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section , type SectionRef } from "./Frames";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

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

/* -------------------------------------------------------------------------- */
/* The four workflows, as a table                                              */
/*                                                                             */
/* On request, and it is the right shape for what this direction is: four       */
/* things that answer the same two questions. As four stacked blocks of prose   */
/* the reader had to hold *what it does* from workflow one in their head to     */
/* compare it with workflow two, which is precisely the work a column does for  */
/* free. A proposal is read across as often as it is read down.                 */
/*                                                                             */
/* The row is the anchor, not a `Section` per workflow. Full's navigator still  */
/* lists all four by name and still jumps to them; what it lands on is a `<tr>` */
/* rather than an `<h2>`. `scanSheet` in `Frames.tsx` knows about that shape,   */
/* so a find hit inside a cell is still reported against the right entry.       */
/*                                                                             */
/* It scrolls sideways rather than wrapping to a second table, the same trade   */
/* Certainty's and Stakeholder's tables make: three columns of sentences will   */
/* not fold into 319px, and a "responsive" table that restacks into cards is    */
/* two layouts to keep in step for one set of facts.                            */
/* -------------------------------------------------------------------------- */

function WorkflowTable({ anchored = false }: { anchored?: boolean }) {
  return (
    <div className="scroll-slim -mx-4 mt-2 overflow-x-auto px-4 sm:-mx-6 sm:px-6">
      <table className="w-full min-w-[46rem] text-small">
        <caption className="sr-only">
          The four workflows, what each one does and what changes once it is running
        </caption>
        <thead>
          <tr className="text-micro tracking-[0.12em] text-muted-foreground uppercase">
            <th scope="col" className="w-[15rem] pr-5 pb-2 text-left font-medium">
              Workflow
            </th>
            <th scope="col" className="pr-5 pb-2 text-left font-medium">
              What it does
            </th>
            <th scope="col" className="pb-2 text-left font-medium">
              What changes
            </th>
          </tr>
        </thead>
        <tbody>
          {WORKFLOWS.map((w) => (
            <tr
              key={w.bucketId}
              /* Only Full puts ids here. Brief's navigator lists no headings,
                 so an anchor on the row would be an id nothing points at. */
              id={anchored ? `w-${w.bucketId}` : undefined}
              className="scroll-mt-[8.25rem] border-t border-border align-top"
            >
              <th scope="row" className="py-3 pr-5 text-left align-top">
                <span className="block text-base font-medium">{w.name}</span>
                {/* Which part of the operation it covers, under the name rather
                    than in a fourth column: it is how the row is filed, not a
                    fact to be compared down the page. */}
                <span className="mt-0.5 block text-micro font-normal text-muted-foreground">
                  {bucketName(w.bucketId)}
                </span>
              </th>
              <td className="reading py-3 pr-5 text-muted-foreground">{w.does}</td>
              <td className="reading py-3 text-muted-foreground">{w.changes}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function BuildBrief() {
  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      hero={<SurfaceHero title="Research" />}
      lead={
        <DocumentLead
          title="What Heizen would build"
          standfirst={`What Heizen would deploy at ${company.name}, one workflow per part of the operation, each covering findings that already have evidence behind them.`}
        />
      }
    >
      {/* The paragraph that used to be this whole Brief said the four workflow
          names in a run-on sentence, then their effects in another. That is a
          table read out loud. What is left in the summary is the part the table
          cannot carry: that nothing here replaces anything, which is the answer
          to the three objections that arrive before any of the detail does. */}
      <Section
        id="b-brief"
        title="Four workflows, and nothing to replace"
        summary={`Four workflows, one per part of the operation, covering ${gaps.length} findings between them. Everything sits on top of ${company.erp}: no new ERP, no module to license, no plant downtime.`}
      >
        <WorkflowTable />
      </Section>
      <BriefFooter
        href="/research/build/full"
      >
        All four workflows
      </BriefFooter>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

/* Built from the same array the sections are, so the navigator cannot list a
   workflow the page does not render. */
const SECTIONS: SectionRef[] = WORKFLOWS.map((w) => ({
  id: `w-${w.bucketId}`,
  label: w.name,
}));

export function BuildFull() {
  return (
    <FullFrame
      sections={SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="What Heizen would build"
        standfirst={`Four workflows, one per part of the operation, covering ${gaps.length} findings between them. Everything sits on top of ${company.erp}: no new ERP, no module to license, no plant downtime.`}
      />

      {/* One section holding one table, rather than a section per workflow.
          Four headings whose bodies each answered the same two questions were
          four copies of a table with the columns thrown away, and the reader
          had to scroll between them to compare. The navigator still lists all
          four names: `SECTIONS` points at the row ids, which is why the table
          is `anchored` here and not on Brief. */}
      <Section
        id="w-all"
        title="The four workflows"
        summary={`One per part of the operation, in the order the money is in them. Each covers findings that already have evidence behind them, and each runs on top of ${company.erp}.`}
      >
        <WorkflowTable anchored />
      </Section>
    </FullFrame>
  );
}

export const _gapById = gapById;

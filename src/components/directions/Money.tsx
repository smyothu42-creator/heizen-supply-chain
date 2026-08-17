"use client";

import { money, moneyParts, share } from "@/lib/format";
import {
  bucketTotal,
  buckets,
  company,
  coverage,
  gapById,
  gaps,
  gapsByStage,
  spendBase,
} from "@/lib/suvarna";
import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section , type SectionRef } from "./Frames";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Direction 1 — Money-first                                                   */
/* The dossier is a decomposition of one number. Everything on screen exists    */
/* because it explains a slice of the leakage figure — and the reconciliation    */
/* sits above the slices, because they add to more than the headline.           */
/* -------------------------------------------------------------------------- */



/* Neutral weights, not health hues — this bar shows proportion, not severity. */

export function MoneyBrief() {
  const parts = moneyParts(company.netLeakageCr);

  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      hero={<SurfaceHero title="Research" />}
      lead={
        <DocumentLead
          titleNode={
            <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
              <span className="flex items-end gap-1.5">
                <span className="font-display text-display tabular">{parts.value}</span>
                <span className="font-display text-h2 leading-none pb-0.5">{parts.unit}</span>
              </span>
              <span className="pb-1.5 text-small text-muted-foreground">
                a year + {money(company.workingCapitalReleaseCr)} released once
              </span>
            </div>
          }
          standfirst={company.thesis}
        />
      }
    >
      <Section
        id="m-brief"
        title="What the total is made of, and what it rests on"
        summary={`Every finding added up is ${money(company.grossLeakageCr)}. The claimable figure is ${money(company.netLeakageCr)}, because ${money(company.overlapCr)} is one saving counted twice where several findings move the same invoice through the same process. Separately, ${money(company.workingCapitalReleaseCr)} of cash sits in stock that is not needed, and that is a one-off release rather than an annual saving, so it never joins the line above. Most of it sits in two places: paying for what they buy, and buying it in the first place. None of it is measured from their own data. Every price is modelled from a base in their filings, which is defensible line by line and is not the same thing as being right.`}
      />
      <BriefFooter
        href="/research/money/full"
      >
        Full breakdown
      </BriefFooter>
    </BriefFrame>
  );
}
/* -------------------------------------------------------------------------- */

/* Small counts are spelled out: a paragraph that opens on a digit reads as a
   table cell that escaped into prose. */
const WORDS = ["No","One","Two","Three","Four","Five","Six","Seven","Eight","Nine","Ten","Eleven","Twelve"];
const Spell = (n: number) => WORDS[n] ?? String(n);
const lowerFirst = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);

/** The biggest finding in a bucket, which is the one worth naming out loud. */
const topGap = (b: { gapIds: string[] }) =>
  b.gapIds.map(gapById).sort((a, z) => (z.amountCr ?? 0) - (a.amountCr ?? 0))[0];

/* One line per bucket saying what a reader should take from it, rather than a
   fifth restatement of the name. These are judgements about the finding set,
   which is why they are written rather than derived. */
const BUCKET_NOTE: Record<string, string> = {
  "b-pay":
    "It is the bucket with the most findings and the most confirmed ones, so it is the safest place to open a conversation. It is also where the overlap sits: these four move one invoice through one process, so their savings cannot all be banked.",
  "b-buy":
    "This is the bucket a plant manager feels rather than a finance team, which makes it the easiest to get agreement on and the hardest to price from their own data.",
  "b-move":
    "The weakest evidence on the page. Both of the large findings here are inferred from the FY25 report rather than observed, because nobody in logistics or planning has been spoken to.",
  "b-recover":
    "One finding, and the only one in this bucket. Money owed to Suvarna rather than money Suvarna is losing, which makes it the easiest to raise and the least urgent to fix.",
};
const bucketNote = (id: string) => BUCKET_NOTE[id] ?? "";

/** What Make is worth if it were researched, from coverage's own range. */
const MAKE_RANGE = "₹3.6 to ₹10.7 Cr";

/* The headings this view renders, for the navigator beside it. Built from the
   same ids the sections carry, so a heading cannot be missing from the list. */
const MONEY_SECTIONS: SectionRef[] = [
  { id: "reconcile", label: "How the total is built" },
  ...buckets.map((b) => ({ id: b.id, label: b.name })),
  { id: "coverage", label: "What this covers" },
  { id: "not-priced", label: "Not priced" },
  { id: "context", label: "Business context" },
];

export function MoneyFull() {
  const total = company.grossLeakageCr;
  const unpriced = gaps.filter((g) => g.amountCr == null);
  const researched = coverage.filter((c) => c.state !== "not-researched");
  const notLooked = coverage.filter((c) => c.state === "not-researched");
  const parts = moneyParts(company.netLeakageCr);

  return (
    <FullFrame
      sections={MONEY_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        titleNode={
          <div className="flex flex-wrap items-end gap-x-3 gap-y-1">
            <span className="flex items-end gap-1.5">
              <span className="font-display text-display tabular">{parts.value}</span>
              <span className="font-display text-h2 leading-none pb-0.5">{parts.unit}</span>
            </span>
            <span className="pb-1.5 text-small text-muted-foreground">
              a year + {money(company.workingCapitalReleaseCr)} released once
            </span>
          </div>
        }
        standfirst={company.thesis}
      />

      <Section
        id="reconcile"
        title="How the total is built"
        summary={`Every finding added up comes to ${money(company.grossLeakageCr)}, but the claimable figure is ${money(company.netLeakageCr)}. The difference is ${money(company.overlapCr)} of saving counted twice: capture, matching, receiving and discount capture all move one invoice through one process, so fixing any of them takes some of the same money the others were promising. Separately from both, ${money(company.workingCapitalReleaseCr)} of cash sits in stock that is not needed. That is a one-off release rather than an annual saving, so it never joins the line above, and a CFO who hears the two added together stops trusting the rest. Nothing on this page is measured from the client's own data.`}
        right={<span className="tabular text-base font-medium">{money(company.netLeakageCr)}</span>}
      />

      {buckets.map((bucket) => {
        const value = bucketTotal(bucket.id);
        return (
          <Section
            key={bucket.id}
            id={bucket.id}
            title={bucket.name}
            summary={`${bucket.plainLine} ${Spell(bucket.gapIds.length)} findings sit here, worth ${money(value)} a year, which is ${share(value, total)} of everything found. The biggest single one${topGap(bucket).amountCr ? ` is worth ${money(topGap(bucket).amountCr)}` : " carries no price"}: ${lowerFirst(topGap(bucket).title)}. ${bucketNote(bucket.id)}`}
            right={
              <span className="tabular text-base font-medium text-foreground">
                {money(value)}{" "}
                <span className="text-small font-normal text-muted-foreground">
                  {share(value, total)}
                </span>
              </span>
            }
          />
        );
      })}

      <Section
        id="coverage"
        title="What this covers"
        summary={`A total is only a total of what was looked at, and this one covers ${researched.length} of the ${coverage.length} stages of the operation. ${coverage.filter((c) => c.state === "researched").map((c) => c.stage).join(" and ")} is where the work has been done: ${gapsByStage("Source").length} of the ${gaps.length} findings sit in it. ${notLooked.map((c) => c.stage).join(" and ")} have not been researched at all, and Make is the one that should worry you: three plants, and not one question asked about them. Yield and giveaway on ${money(spendBase.directCr)} of material is normally the largest line on an agri-processor's board, and it is worth ${MAKE_RANGE} a year on a sector range of 0.5 to 1.5%. None of that is in the number above.`}
        right={<span className="tabular text-small text-muted-foreground">2 of 5 stages</span>}
      />

      <Section
        id="not-priced"
        title="Not priced"
        summary={`${Spell(unpriced.length)} of the ${gaps.length} findings carries no rupee figure, and that is a result rather than a hole. ${lowerFirst(unpriced[0]?.title ?? "")} is real and worth raising, but nothing behind it supports a number: there is no rejection data, so any figure would be a guess wearing a decimal point. Two more areas were looked at and produced nothing. Returns and reverse logistics has not been researched, and export documentation was checked and came back clean. A finding with no price is more honest than a price with no base.`}
      />

      <Section
        id="context"
        title="Business context"
        summary={`Last on purpose, because none of it is a finding. ${money(company.revenueCr)} of revenue in FY25, up 18% on the year before, on a procurement process that has not changed since 2019: that is the sentence the whole argument rests on, because it says the volume grew and the machine did not. Every price above is a percentage of one of these numbers rather than of a guess, which is what makes the total challengeable in the right way. The full version, with what each figure should be measured against and where it came from, is on Business context.`}
      />
    </FullFrame>
  );
}

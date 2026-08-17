"use client";

import { money } from "@/lib/format";

import { businessContext, businessFactById, businessFacts, company, coverage, headlineFacts, sources } from "@/lib/suvarna";
import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section , type SectionRef } from "./Frames";
import { Eyebrow } from "@/components/meridian/Primitives";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Direction 7 — About company                                                 */
/*                                                                             */
/* The facts about the business, and an honest account of how much of it has    */
/* been looked at. It makes no argument, which is why it sits last — nothing    */
/* here is a finding.                                                          */
/*                                                                             */
/* **Coverage is the point of it, not the facts.** §7.14: a total is only a     */
/* total of what was researched, and this is the one screen where that is the   */
/* subject rather than a footnote under somebody else's number. Make is         */
/* untouched at a company with three plants, and saying so is worth more than   */
/* the total is.                                                               */
/* -------------------------------------------------------------------------- */

const covered = coverage.filter((c) => c.state === "researched").length;

export function AboutBrief() {
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
                {company.name}
              </p>
              {/* The revenue string comes off the fact rather than out of
                  `money()`, which has no thousands separator: "₹1150 Cr" here
                  sat two lines above "₹1,150 Cr" in the list below it. And the
                  dash is gone, per §6a: it was a second sentence in disguise. */}
              <p className="reading measure mt-1 text-small text-muted-foreground">
                {company.sector}. {businessFactById("bf-revenue").value} of revenue is not
                the number here. {covered} of {coverage.length} stages of their operation
                have been looked at.
              </p>
            </div>
          }
        />
      }
      lead={
        <DocumentLead
          bordered={false}
          titleNode={<p className="font-display text-h2 leading-[1.15]">{company.name}</p>}
          standfirst={`${company.sector}. What they earn, who they sell to, who they buy from, and an honest account of how much of it has been researched.`}
        />
      }
    >
      {/* Four facts, one from each group, so the short version is still the
          shape of the business rather than the top of one list. The detail line
          is what makes each of them a reading rather than a number, and it is
          the first thing to cut if this screen ever stops fitting. */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <dl className="divide-y divide-border">
          {headlineFacts.map((f) => (
            <div key={f.id} className="flex items-baseline justify-between gap-3 py-2">
              <dt className="min-w-0 text-small">
                {f.label}
                <span className="block text-micro text-muted-foreground">{f.detail}</span>
              </dt>
              <dd className="tabular shrink-0 text-base font-medium">{f.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {/* The coverage line, which is the honest half of the screen. */}
      <div className="shrink-0 rounded-md border border-dashed border-border-strong px-4 py-3">
        <Eyebrow>What has not been looked at</Eyebrow>
        <p className="mt-1 text-small measure">
          {coverage
            .filter((c) => c.state === "not-researched")
            .map((c) => c.stage)
            .join(" and ")}
          . Three plants, and not one question asked about them.
        </p>
      </div>

      <BriefFooter
        href="/research/about/full"
      >
        All the facts
      </BriefFooter>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

/* The headings this view renders, for the navigator beside it. Built from the
   same ids the sections carry, so a heading cannot be missing from the list. */
const ABOUT_SECTIONS: SectionRef[] = [
  { id: "b-facts", label: "Business context" },
  { id: "b-coverage", label: "What has been looked at" },
  { id: "b-sources", label: "What we read" },
];

export function AboutFull() {
  return (
    <FullFrame
      sections={ABOUT_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title={company.name}
        standfirst={`${company.sector}. ${businessFacts.length} facts about the business, each with what it should be measured against, and an account of how much of the operation has actually been researched. That last part is what every total on the other screens is a total of.`}
      />

      <Section
        id="b-facts"
        title="Business context"
        summary={`How big they are, what they keep, who they sell to and who they buy from, in ${businessContext.length} groups. Nothing here is a finding, and that is the point: it is the base every price on every other screen is a percentage of. ${money(company.revenueCr)} of revenue in FY25, up 18% on the year before, with EBITDA at 9.0% against a sector that runs 11 to 13%. Two points of margin is \u20b923 Cr, which is more than everything on the findings list put together. Read it before the money screens rather than after, because a rupee figure with no visible base is the number a client challenges first.`}
        right={
          <span className="tabular text-small text-muted-foreground">
            {businessContext.length} groups
          </span>
        }
      />

      <Section
        id="b-coverage"
        title="What has been looked at"
        summary={`A total is only a total of what was researched, and this one covers ${covered} of the ${coverage.length} stages of the operation. Source is where the work has been done: nine of the twelve findings sit in it, backed by two calls and an email thread. Plan and Deliver are thin, one and two findings each, both inferred from the FY25 report because nobody in planning or logistics has been spoken to. Make and Return have not been looked at at all. Make is the one that should worry you: three plants, and not a single question asked about any of them, on a business where yield and giveaway is normally the largest line on the board. That is worth \u20b93.6 to \u20b910.7 Cr a year and none of it is in the total.`}
        right={
          <span className="tabular text-small text-muted-foreground">
            {covered} of {coverage.length} stages
          </span>
        }
      />

      <Section
        id="b-sources"
        title="What we read"
        summary={`Everything on every other screen traces back to one of these ${sources.length}: one annual report, two discovery calls, an email thread from the Head of Procurement, filings, and the public web for anything about who joined when. Four of them carry no finding of their own, which is normal rather than a hole. Most documents corroborate rather than produce. What is missing is the thing worth naming out loud on the call: no ERP extract, no spend cube, no invoice-level data. That is the difference between a number that is modelled and a number that is measured, and it is why every price in this dossier is the first kind.`}
      />
    </FullFrame>
  );
}

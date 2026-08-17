"use client";

import { company, coverage, sources } from "@/lib/suvarna";
import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section , type SectionRef } from "./Frames";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Direction 1 — Company                                                 */
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

export function CompanyBrief() {
  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      hero={<SurfaceHero title="Research" />}
      lead={
        <DocumentLead
          title="What has been looked at"
          standfirst={`${company.sector}. An honest account of how much of this operation has been looked at, and what that leaves out.`}
        />
      }
    >
      <Section id="c-brief" title="Source is covered, Make is blank" summary={`Nine of the twelve findings sit in one stage of the operation, and two of the five stages have not been looked at at all. That is the sentence to say before any total, because a total is only a total of what was researched. Source is where the work has been done, backed by two calls and an email thread. Plan and Deliver are thin and inferred from the FY25 report. Make and Return are blank, and Make is the one that matters: three plants, not a question asked, on a business where yield and giveaway is normally the largest line on the board.`} />
      <BriefFooter
        href="/research/company/full"
      >
        The full account
      </BriefFooter>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

/* The headings this view renders, for the navigator beside it. Built from the
   same ids the sections carry, so a heading cannot be missing from the list. */
const COMPANY_SECTIONS: SectionRef[] = [
  { id: "b-coverage", label: "What has been looked at" },
  { id: "b-sources", label: "What we read" },
];

export function CompanyFull() {
  return (
    <FullFrame
      sections={COMPANY_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title={company.name}
        standfirst={`${company.sector}. How much of this company's operation has actually been researched, and everything we read to do it. The numbers about the business are one tab across, under Business context.`}
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

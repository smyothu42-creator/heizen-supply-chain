"use client";

import { money } from "@/lib/format";

import { businessContext, businessFacts, company } from "@/lib/suvarna";
import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section , type SectionRef } from "./Frames";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Direction 2 — Business context                                              */
/*                                                                             */
/* The numbers about the business, split off from Company on request. The two   */
/* were one direction and answered two questions: *who are they* and *how big   */
/* is this*. A consultant asks the second one far more often, and it was three  */
/* screens down inside the first.                                              */
/*                                                                             */
/* Everything here is the same component Research renders inside Money's folded */
/* reference section, so the two cannot drift: seventeen facts in four groups,  */
/* each with a comparator, a chip when the figure is ours rather than theirs,   */
/* and its source one click away.                                              */
/* -------------------------------------------------------------------------- */

export function ContextBrief() {
  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      hero={<SurfaceHero title="Research" />}
      lead={
        <DocumentLead
          title="Business context"
          standfirst={`${company.sector}. What they earn, who they sell to, who they buy from, and how much operation there is.`}
        />
      }
    >
      <Section id="x-brief" title="The base every price is a percentage of" summary={`${money(company.revenueCr)} of revenue in FY25, up 18% on the year before, with EBITDA at 9.0% against a sector that runs 11 to 13%. Two points of margin is about ₹23 Cr, which is more than every finding on the list added together. None of this is a finding in itself. It is the base every price on every other screen is a percentage of, which is what makes those prices challengeable in the right way rather than dismissible. ${businessFacts.length} facts in ${businessContext.length} groups, each carrying what it should be measured against and whether the number is theirs or ours.`} />
      <BriefFooter
        href="/research/context/full"
      >
        All the facts
      </BriefFooter>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

/* The headings this view renders, for the navigator beside it. Built from the
   same ids the sections carry, so a heading cannot be missing from the list. */
const CONTEXT_SECTIONS: SectionRef[] = [
  { id: "bc", label: "Business context" },
];

export function ContextFull() {
  return (
    <FullFrame
      sections={CONTEXT_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title={company.name}
        standfirst={`${company.sector}. ${businessFacts.length} facts about the business, each with what it should be measured against and whose figure it is. A number off a filing and one we modelled from sector structure look identical on a slide, so this screen says which is which.`}
      />

      <Section
        id="bc"
        title="Business context"
        summary={`How big they are, what they keep, who they sell to and who they buy from, in ${businessContext.length} groups. Nothing here is a finding, and that is the point: it is the base every price on every other screen is a percentage of. ${money(company.revenueCr)} of revenue in FY25, up 18% on the year before, with EBITDA at 9.0% against a sector that runs 11 to 13%. Two points of margin is \u20b923 Cr, which is more than everything on the findings list put together. Read it before the money screens rather than after, because a rupee figure with no visible base is the number a client challenges first.`}
        right={
          <span className="tabular text-small text-muted-foreground">
            {businessContext.length} groups
          </span>
        }
      />
    </FullFrame>
  );
}

"use client";

import { money } from "@/lib/format";
import { company, systemSplit, valueForSystem } from "@/lib/suvarna";
import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section , type SectionRef } from "./Frames";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Likely spend areas                                                          */
/*                                                                             */
/* Where the money would go, ordered by how much of it is there.               */
/*                                                                             */
/* **It is not Tech stack and it is not Idea build**, and the three are easy to */
/* confuse. Tech stack cuts the estate by state — live, worked around, never    */
/* bought — and answers *what would we be building on*. Idea build is the four  */
/* workflows we would put on top of it, which is *what would get built*. This   */
/* one is the question in between and the one a budget holder asks: **where is  */
/* the money, and is any of it inside software they have already paid for**.    */
/*                                                                             */
/* Every figure is the same subtotal Tech stack reconciles, read in a different */
/* order. Nothing here is authored: the split is derived, so it cannot drift.   */
/* -------------------------------------------------------------------------- */

/** Biggest first, which is the only ordering a spend conversation has. */
export function SpendBrief() {
  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      hero={<SurfaceHero title="Research" />}
      lead={
        <DocumentLead
          title="Where the money would go"
          standfirst={`Of the ${money(company.grossLeakageCr)} on the findings list. Everything Heizen would build goes on top of ${company.erp}, so there is no new ERP in this conversation.`}
        />
      }
    >
      <Section id="s-brief" title="The same money, sorted by what it runs on" summary={`The same ${money(company.grossLeakageCr)} as every other screen, sorted by what the work would run on rather than by what it is worth. ${money(systemSplit.outsideValue)} of it sits on processes no software does today, which is the part that needs building and the part with the most room: no incumbent product to displace, nothing to migrate off. The remaining ${money(systemSplit.insideValue)} is inside software already paid for, which is configuration and process. The largest single line is spend analytics, and it falls to nobody at all, which is exactly why no price on this page is measured from their own data.`} />
      <BriefFooter
        href="/research/spend/full"
      >
        The full split
      </BriefFooter>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

/* The headings this view renders, for the navigator beside it. Built from the
   same ids the sections carry, so a heading cannot be missing from the list. */
const SPEND_SECTIONS: SectionRef[] = [
  { id: "s-split", label: "Inside the ERP, or outside it" },
  { id: "s-outside", label: "Where no system exists" },
  { id: "s-inside", label: "Inside SAP already" },
];

export function SpendFull() {
  return (
    <FullFrame
      sections={SPEND_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="Where the money would go"
        standfirst={`The same ${money(company.grossLeakageCr)} as every other screen, sorted by the system the work sits on rather than by the finding. ${money(systemSplit.outsideValue)} of it is on processes no software does today, which is the part that needs building; the rest is inside software they have already paid for, which is configuration and process.`}
      />

      <Section
        id="s-split"
        title="Inside the ERP, or outside it"
        summary={`The one split that decides what a first phase costs. ${systemSplit.insideGaps} of the twelve findings sit in software the client already owns and are worth ${money(systemSplit.insideValue)} a year: cheaper to fix, harder to sell, because nothing new arrives and the work reads as configuration. The other ${systemSplit.outsideGaps} sit in the space between systems and are worth ${money(systemSplit.outsideValue)}, close to twice as much. That is where a build goes and where the money is. Read the two figures against each other rather than adding them: together they are the same ${money(company.grossLeakageCr)} every other direction ties to, sorted by what the work would run on instead of by what it costs.`}
      />

      <Section
        id="s-outside"
        title="Where no system exists"
        summary={`${money(systemSplit.outsideValue)} a year on work no software touches, biggest first. Spend analytics is the largest at ${money(valueForSystem("sys-spend"))} and falls to nobody at all, which is precisely why no price on this page is measured from the client's own data. Demand planning falls to one spreadsheet, and it is why stock cover runs at 38 days against a sector best of 22. Invoice capture falls to nine people keying about 96,000 invoices a year from PDF and paper. Naming who absorbs the work matters more than naming the system, because the person doing it by hand is the one who feels the case and the one who will say so on the call.`}
        right={
          <span className="tabular text-small text-muted-foreground">
            {money(systemSplit.outsideValue)}
          </span>
        }
      />

      <Section
        id="s-inside"
        title="Inside SAP already"
        summary={`The three SAP modules already running, and what the findings on each are worth. Nothing in this section needs buying: ${money(systemSplit.insideValue)} of the total sits inside software that has already been paid for, so the work is configuration and process rather than a purchase. That makes it the easier half to get agreement on and the harder half to sell, because the client cannot see anything arrive. It also sets the integration boundary, which is the first thing an engineer asks: anything built for the section above has to read from and write back to these.`}
        right={
          <span className="tabular text-small text-muted-foreground">
            {money(systemSplit.insideValue)}
          </span>
        }
      />
    </FullFrame>
  );
}

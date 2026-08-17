"use client";

import { money } from "@/lib/format";
import { company, dealRisks, techSystems, valueForSystem } from "@/lib/suvarna";
import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section , type SectionRef } from "./Frames";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Direction 7 — Relevant vendors                                              */
/*                                                                             */
/* Who supplies each system, who runs it for them, and where nobody is behind   */
/* it at all. Tech stack answers *what would we be building on*; this answers   */
/* the question that follows it within a sentence, which is *who else has a say  */
/* in that*.                                                                    */
/*                                                                             */
/* **Nothing here is invented.** The vendor is a field on the system, the       */
/* incumbent and its counter are the deal risk that already existed, and the    */
/* money under each name is the same subtotal Tech stack reconciles. What is    */
/* new is only the cut: by who is behind it rather than by what it does.       */
/* -------------------------------------------------------------------------- */

/** Everything with a supplier, and everything with none. The second list is the
 *  more useful one: a process nobody sells them is a process nobody defends. */
const SUPPLIED = techSystems.filter((s) => s.state === "live");
const UNSUPPLIED = techSystems.filter((s) => s.state !== "live");

const INCUMBENT = dealRisks.find((r) => r.id === "r-incumbent");

const openValue = UNSUPPLIED.reduce((sum, s) => sum + valueForSystem(s.id), 0);

export function VendorsBrief() {
  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      hero={<SurfaceHero title="Research" />}
      lead={
        <DocumentLead
          title="Who supplies what"
          standfirst="Who is already inside this estate, and what to say when they hear about us."
        />
      }
    >
      <Section id="v-brief" title="The incumbent, and the ground nobody holds" summary={`${company.erp} is the estate and one partner runs it, so anybody selling in here is arriving in a room that already has an incumbent. Say the answer before it is asked: nothing replaces them, and everything lands as configuration and process inside the estate they already hold. Beyond that, ${money(openValue)} of the findings sit on parts of the operation nobody sells them anything for. That is the cleanest ground in the deal, with no renewal to work around and nobody to displace, and it is the weakest evidence on the page for exactly the same reason.`} />
      <BriefFooter
        href="/research/vendors/full"
      >
        The full list
      </BriefFooter>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

/* The headings this view renders, for the navigator beside it. Built from the
   same ids the sections carry, so a heading cannot be missing from the list. */
const VENDORS_SECTIONS: SectionRef[] = [
  { id: "v-incumbent", label: "Who is already in" },
  { id: "v-supplied", label: "Supplied today" },
  { id: "v-open", label: "Nobody behind it" },
];

export function VendorsFull() {

  return (
    <FullFrame
      sections={VENDORS_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="Who supplies what"
        standfirst={`${company.erp} is the estate, and one partner runs it. Everything else on this list is either a spreadsheet with a person behind it or a system nobody has been asked to sell them, which is ${money(openValue)} of the findings sitting where no vendor has a relationship to defend.`}
      />

      {INCUMBENT && (
        <Section
          id="v-incumbent"
          title="Who is already in"
          summary={`Named, with the sentence that answers them, because a vendor raised on a call with nothing to say back is a subject a consultant will quietly avoid. The estate is SAP and somebody manages it, so anybody selling into it is arriving in a room that already has an incumbent in it. The answer is the same one that runs through the whole pitch: nothing here replaces them. Everything lands as configuration and process inside the estate they already hold, which makes this an addition to their footprint rather than a threat to it. Say that first, before it is asked.`}
          right={
            <span className="text-small text-muted-foreground">{INCUMBENT.value}</span>
          }
      />
      )}

      <Section
        id="v-supplied"
        title="Supplied today"
        summary={`The parts of the operation somebody already sells them, and what the findings sitting on those parts are worth. These are the harder conversations, not because the findings are weaker but because there is a relationship in the way and a renewal date somebody is thinking about. Worth knowing before the call rather than during it: a finding raised on a process with a vendor behind it is a finding that vendor will be asked about afterwards.`}
        right={<span className="tabular text-small text-muted-foreground">{SUPPLIED.length}</span>}
      />

      <Section
        id="v-open"
        title="Nobody behind it"
        summary={`${money(openValue)} of the total sits on parts of the operation nobody sells them anything for. That is the majority of the findings and the majority of the money, and it is the cleanest ground in the deal: a process nobody supplies is a process nobody defends, there is no renewal to work around and no incumbent to displace. It is also the weakest evidence on the page, and for the same reason. Nothing is measuring these processes, because the systems that would measure them were never bought.`}
        right={<span className="tabular text-small text-muted-foreground">{money(openValue)}</span>}
      />
    </FullFrame>
  );
}


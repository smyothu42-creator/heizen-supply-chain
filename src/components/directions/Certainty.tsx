"use client";

import { money } from "@/lib/format";
import {
  claims,
  claimsByTier,
  company,
  gapById,
  sourceById,
  sources,
  tierCounts,
  tierValue,
  type Tier } from "@/lib/suvarna";
import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section , type SectionRef } from "./Frames";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";
import { TIER_MEANING } from "@/components/meridian/Confidence";
import { Eyebrow } from "@/components/meridian/Primitives";
import { TierMark } from "@/components/meridian/Icons";
import { usePanel } from "@/components/meridian/EvidencePanel";

/* -------------------------------------------------------------------------- */
/* Direction 3 — Certainty-first                                               */
/* The axis is confidence. Confirmed / inferred / unverified, with the basis    */
/* always attached, because a tier without its reason is just a badge.          */
/*                                                                             */
/* This direction now carries a second axis it was missing: a confirmed         */
/* observation can still sit under a modelled price. Every claim below was      */
/* tiered on whether it is TRUE; none was tiered on whether its NUMBER is       */
/* right, and eight of them wore a "Confirmed" badge over a price nobody had    */
/* measured. See AUDIT.md B3.                                                   */
/* -------------------------------------------------------------------------- */

const SAY_THESE = ["c3", "c4", "c14"];
const CHECK_FIRST = "c11";

const BRIEF_HEADLINE = (
  <p className="font-display text-h2 leading-[1.15]">
    {tierCounts.confirmed} things you can say. {tierCounts.unverified} you should not.
  </p>
);
/* Two sentences, not three. It ended "The observations are theirs, the numbers
   ours", which is the second sentence said a second way — and it was the third
   line of prose at the top of the one screen in this product that may not
   scroll. The cut is what pays for the larger type on the claims below it. */
const BRIEF_STANDFIRST = `${money(tierValue("confirmed"))} of ${money(company.grossLeakageCr)} rests on what they told us. No price here is measured from their data.`;

export function CertaintyBrief() {
  const { open } = usePanel();
  const checkFirst = claims.find((c) => c.id === CHECK_FIRST)!;
  const checkGap = gapById(checkFirst.linkedGapId!);

  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      hero={
        <SurfaceHero
          tight
          title="Research"
          titleNode={
            /* Phone: this direction's own opening is the band. From `roomy`
                  the band says "Research" like every other surface and the
                  opening moves into the sheet, where Full puts it. */
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
        <DocumentLead bordered={false} titleNode={BRIEF_HEADLINE} standfirst={BRIEF_STANDFIRST} />
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <Eyebrow className="flex items-center gap-1.5">
          <TierMark tier="confirmed" />
          Safe to assert
        </Eyebrow>
        <ul className="mt-1.5 space-y-2">
          {SAY_THESE.map((id) => {
            const claim = claims.find((c) => c.id === id)!;
            return (
              <li key={id}>
                <button
                  type="button"
                  onClick={() => open({ kind: "claim", id })}
                  className="group w-full text-left"
                >
                  <span className="measure block text-base leading-snug transition-colors group-hover:text-muted-foreground">
                    {claim.statement}
                  </span>
                  <span className="mt-0.5 block truncate text-small text-muted-foreground">
                    {claim.sourceIds.map((s) => sourceById(s).name).join(", ")}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="shrink-0 rounded-md border border-dashed border-border-strong px-4 py-3">
        <div className="flex items-center gap-1.5 text-micro font-medium text-muted-foreground">
          <TierMark tier="inferred" />
          Check before you say it
        </div>
        <p className="mt-1 text-small measure">{checkFirst.statement}</p>
        <p className="mt-1 text-micro text-muted-foreground">
          Our largest estimate at {money(checkGap.amountCr)} and the least verified. If he pushes on
          it and it does not hold, your other figures lose credibility too.
        </p>
      </div>

      <BriefFooter
        href="/research/certainty/full"
      >
        The whole ledger
      </BriefFooter>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

/* The headings this view renders, for the navigator beside it. Built from the
   same ids the sections carry, so a heading cannot be missing from the list. */
const CERTAINTY_SECTIONS: SectionRef[] = [
  { id: "by-basis", label: "The money by how it was priced" },
  { id: "gaps-by-tier", label: "The money by tier" },
  { id: "sources", label: "Sources" },
];

/* What each tier means for what a consultant may say out loud, which is the
   question the tier actually answers. */
const TIER_NOTE: Record<string,string> = {
  confirmed: "These can be said flatly, in the client's own words, because they came from the client. They are the sentences to open on.",
  inferred: "These need a qualifier in front of them. Say what they are inferred from and the room will usually confirm or correct it on the spot, which is worth more than the claim was.",
  unverified: "Raise these as questions rather than as findings. Stated as fact and then contradicted, one of these costs the credibility of the eleven above it.",
};

export function CertaintyFull() {
  return (
    <FullFrame
      sections={CERTAINTY_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="What you can say, and what to check"
        standfirst={`Sorted by how sure we are, not by what it is worth. Overall: ${company.confidence.toLowerCase()}.`}
      />


      {(["confirmed", "inferred", "unverified"] as Tier[]).map((tier) => (
        <Section
          key={tier}
          id={tier}
          title={
            tier === "confirmed" ? "Confirmed" : tier === "inferred" ? "Inferred" : "Unverified"
          }
          summary={`${TIER_MEANING[tier]} ${claimsByTier(tier).length} of the ${claims.length} claims sit here${tier === "unverified" ? ", and none of them carries a price, which is the honest result rather than a gap in the work" : `, carrying ${money(tierValue(tier))} of the total`}. ${TIER_NOTE[tier]}`}
          right={
            <span className="tabular">
              {claimsByTier(tier).length} ·{" "}
              {tier === "unverified" ? "None" : money(tierValue(tier))}
            </span>
          }
      />
      ))}

      {/* The second axis. A tier says the observation is true; it says nothing
          about whether the number attached to it is. */}
      <Section
        id="by-basis"
        title="The money by how it was priced"
        summary={`The tiers above ask whether something is true. This asks whether the number is, and they are separate questions: a fact confirmed on two calls routinely carries a price nobody has measured. Treating them as one is how a wrong price ends up wearing a Confirmed badge. Nothing on this page is measured from the client's systems, because no ERP data has been shared. Every figure is either modelled from a base in their filings or taken from a sector default, and the difference between those two matters: a modelled number can be defended line by line, and a sector default is a placeholder waiting for the spend cube.`}
        right={<span className="tabular">{money(company.grossLeakageCr)}</span>}
      />

      {/* The direction's own weakness, stated rather than hidden. */}
      <Section
        id="gaps-by-tier"
        title="The money by tier"
        summary={`The same ${money(company.grossLeakageCr)}, sorted by how sure we are rather than by what it is worth. Read it as a warning rather than as a ranking: sorting by certainty puts a ${money(0.4)} confirmed finding above a ${money(2.1)} inferred one, which is backwards commercially and would have you open a call with the smallest thing on the page. What the sort is for is knowing which sentences may be said flatly and which need a qualifier in front of them. The commercial order is on Financial, and the delivery order is on Gaps.`}
        right={<span className="tabular">{money(company.grossLeakageCr)}</span>}
      />

      <Section
        id="sources"
        title="Sources"
        summary={`Every claim above traces back to one of these ${sources.length}, or is marked as having nothing behind it at all. Four of them carry no finding of their own and show zero, and that is a true state rather than a hole in the fixture: a consultant drops a folder in, the pipeline reads all of it, and most documents corroborate rather than produce. What is not here is the thing worth saying out loud. No ERP extract, no spend cube, no invoice-level data. One filing, two calls and an email thread is enough to model a number and not enough to measure one, which is why the data request at the end of the call matters more than any answer given during it.`}
        right={<span className="tabular">{sources.length}</span>}
      />
    </FullFrame>
  );
}

/* -------------------------------------------------------------------------- */


"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import {
  VALUATION_BASIS_MEANING,
  basisCounts,
  basisValue,
  claims,
  claimsByTier,
  company,
  gapById,
  gaps,
  sourceById,
  sources,
  tierCounts,
  tierValue,
  type Claim,
  type Tier,
  type ValuationBasis,
} from "@/lib/suvarna";
import { BriefFrame, DocumentLead, FullFrame, Section, type SectionRef } from "./Frames";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";
import { ConfidenceBadge, TIER_MEANING, TierBadge } from "@/components/meridian/Confidence";
import { Eyebrow } from "@/components/meridian/Primitives";
import { EmptyState } from "@/components/meridian/EmptyState";
import { SourceChip } from "@/components/meridian/Evidence";
import { ArrowIcon, TierMark } from "@/components/meridian/Icons";
import { ValuationBasisBadge } from "@/components/meridian/ValuationBridge";
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

      <div className="shrink-0 pt-1">
        <div className="flex items-end justify-between gap-4">
          <ConfidenceBadge level={company.confidence} showReason={false} />
          <Link
            href="/research/certainty/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small transition-colors hover:text-muted-foreground"
          >
            The whole ledger
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

/* No "How this is sorted" entry any more. It pointed at a header whose only
   content was the About-this-view disclosure, and the three tiers it defined
   are glossed by `TIER_MEANING` on each tier section's own summary line — read
   without being opened, and beside the claims they apply to. That gloss was on
   the hero tiles for a revision and went with them; the summary line is the
   better home for it anyway, because a definition three inches above the list
   it defines is a definition nobody re-reads.

   The two ledger sections start folded. They are the same money a third and a
   fourth time, cut by how it was priced and by tier — reference, not argument,
   and this page is read by someone deciding what they may say out loud. */
const SECTIONS: SectionRef[] = [
  { id: "confirmed", label: "Confirmed", meta: String(tierCounts.confirmed) },
  { id: "inferred", label: "Inferred", meta: String(tierCounts.inferred) },
  {
    id: "unverified",
    label: "Unverified",
    meta: String(tierCounts.unverified),
  },
  {
    id: "by-basis",
    label: "The money by how it was priced",
    meta: "0 measured",
    defaultCollapsed: true,
  },
  {
    id: "gaps-by-tier",
    label: "The money by tier",
    meta: `${gaps.length} gaps`,
    defaultCollapsed: true,
  },
  { id: "sources", label: "Sources", meta: String(sources.length) },
];

const BASES: ValuationBasis[] = ["measured", "modelled", "sector-default"];

export function CertaintyFull() {
  return (
    <FullFrame
      sections={SECTIONS}
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
          summary={TIER_MEANING[tier]}
          right={
            <span className="tabular">
              {claimsByTier(tier).length} ·{" "}
              {tier === "unverified" ? "None" : money(tierValue(tier))}
            </span>
          }
        >
          <ul className="divide-y divide-border">
            {claimsByTier(tier).map((claim) => (
              <ClaimRow key={claim.id} claim={claim} />
            ))}
          </ul>
          {tier === "unverified" && (
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <EmptyState kind="no-sources" scope="Two claims with nothing attached" compact />
              <EmptyState kind="not-researched" scope="Returns and reverse logistics" compact />
            </div>
          )}
        </Section>
      ))}

      {/* The second axis. A tier says the observation is true; it says nothing
          about whether the number attached to it is. */}
      <Section
        id="by-basis"
        title="The money by how it was priced"
        summary="The tiers above ask whether something is true. This asks whether the number is. Treating them as one question is how a wrong price wears a Confirmed badge."
        right={<span className="tabular">{money(company.grossLeakageCr)}</span>}
      >
        <ul className="divide-y divide-border">
          {BASES.map((basis) => {
            const count = basisCounts[basis];
            return (
              <li key={basis} className="py-3">
                <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                  <span className="flex items-baseline gap-2">
                    <ValuationBasisBadge basis={basis} />
                    <span className="text-small text-muted-foreground">
                      {count} gap{count === 1 ? "" : "s"}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "tabular shrink-0 text-base font-medium",
                      count === 0 && "text-muted-foreground",
                    )}
                  >
                    {count === 0 ? "None" : money(basisValue(basis))}
                  </span>
                </div>
                <p className="reading mt-1 text-small text-muted-foreground measure">
                  {VALUATION_BASIS_MEANING[basis]}
                  {count === 0 && basis === "measured" && (
                    <span className="text-foreground"> One spend extract would fill this row.</span>
                  )}
                </p>
              </li>
            );
          })}
        </ul>
      </Section>

      {/* The direction's own weakness, stated rather than hidden. */}
      <Section
        id="gaps-by-tier"
        title="The money by tier"
        summary="Sorting by certainty puts a ₹40 L confirmed gap above a ₹2.1 Cr inferred one. Backwards, commercially. This is the part that needs a second sort."
        right={<span className="tabular">{money(company.grossLeakageCr)}</span>}
      >
        <div className="scroll-slim overflow-x-auto">
          <table className="w-full min-w-[620px] text-small">
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Gap
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Observation
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Price
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Value
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Rank
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {[...gaps]
                .sort((a, b) => {
                  const order: Tier[] = ["confirmed", "inferred", "unverified"];
                  const d = order.indexOf(a.tier) - order.indexOf(b.tier);
                  return d !== 0 ? d : (b.amountCr ?? 0) - (a.amountCr ?? 0);
                })
                .map((gap) => (
                  <tr key={gap.id}>
                    <td className="py-2 pr-3 align-top">{gap.title}</td>
                    <td className="py-2 pr-3 align-top">
                      <TierBadge tier={gap.tier} />
                    </td>
                    <td className="py-2 pr-3 align-top">
                      {gap.valuation ? (
                        <ValuationBasisBadge basis={gap.valuation.basis} />
                      ) : (
                        <span className="text-micro text-muted-foreground">Not priced</span>
                      )}
                    </td>
                    <td className="tabular py-2 pr-3 text-right align-top font-medium">
                      {money(gap.amountCr)}
                    </td>
                    <td className="tabular py-2 text-right align-top text-muted-foreground">
                      {gap.rank}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section
        id="sources"
        title="Sources"
        summary="Every claim above traces to one of these, or is marked as having nothing behind it. Some were read and corroborated without carrying a finding of their own, and those show zero."
        right={<span className="tabular">{sources.length}</span>}
      >
        <ul className="space-y-2">
          {sources.map((s) => {
            const supports = claims.filter((c) => c.sourceIds.includes(s.id));
            return (
              <li key={s.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <SourceChip sourceId={s.id} />
                <span className="tabular text-small text-muted-foreground">
                  {supports.length} claims
                </span>
              </li>
            );
          })}
        </ul>
      </Section>
    </FullFrame>
  );
}

/* -------------------------------------------------------------------------- */

function ClaimRow({ claim }: { claim: Claim }) {
  const { open } = usePanel();
  const gap = claim.linkedGapId ? gapById(claim.linkedGapId) : null;

  return (
    <li className="py-2.5">
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "mt-1 shrink-0",
            claim.tier === "confirmed" ? "text-foreground" : "text-muted-foreground",
          )}
        >
          <TierMark tier={claim.tier} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <button
              type="button"
              onClick={() => open({ kind: "claim", id: claim.id })}
              className="measure text-left text-base transition-colors hover:text-muted-foreground"
            >
              {claim.statement}
            </button>
            {gap && (
              <span
                className={cn(
                  "shrink-0 text-small font-medium",
                  gap.amountCr == null ? "text-muted-foreground" : "tabular",
                )}
              >
                {/* §6a again: a dash here said "no number" and nothing about
                    why. The gap is real and researched, it just has no price. */}
                {gap.amountCr == null ? "Not priced" : money(gap.amountCr)}
              </span>
            )}
          </div>
          {/* What the claim rests on, in the form that fits one line: where it
              came from. The full reasoning used to sit here clamped to a single
              line — nineteen claims' worth of text in the page, two thirds of it
              behind an ellipsis nobody can read. Cost with no benefit. The
              reasoning is one click away in the panel, which is where a third
              read belongs.
              Sources are named, not chipped: nineteen rows of chips is thirty
              more controls to skip past, and the row already opens them. */}
          <p className="mt-0.5 truncate text-small text-muted-foreground">
            {claim.sourceIds.length > 0 ? (
              claim.sourceIds.map((s) => sourceById(s).name).join(", ")
            ) : (
              <span className="italic">Nothing attached, reasoning only</span>
            )}
          </p>
        </div>
      </div>
    </li>
  );
}

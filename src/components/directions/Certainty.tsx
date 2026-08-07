"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import {
  claims,
  claimsByTier,
  company,
  gapById,
  gaps,
  sourceById,
  sources,
  tierCounts,
  type Claim,
  type Tier,
} from "@/lib/suvarna";
import { BriefFrame, FullFrame, SummaryStrip, type SectionRef } from "./Frames";
import { ConfidenceBadge, TIER_MEANING, TierBadge } from "@/components/meridian/Confidence";
import { Eyebrow, SectionHeading } from "@/components/meridian/Primitives";
import { EmptyState } from "@/components/meridian/EmptyState";
import { SourceChip } from "@/components/meridian/Evidence";
import { ArrowIcon, TierMark } from "@/components/meridian/Icons";
import { usePanel } from "@/components/meridian/EvidencePanel";

/* -------------------------------------------------------------------------- */
/* Direction 3 — Certainty-first                                               */
/* The axis is confidence. Confirmed / inferred / unverified, with the basis    */
/* always attached, because a tier without its reason is just a badge.          */
/* -------------------------------------------------------------------------- */

/** Value of the leakage number that rests on each tier of evidence. */
const tierValue = (tier: Tier) =>
  gaps.filter((g) => g.tier === tier).reduce((sum, g) => sum + (g.amountCr ?? 0), 0);

const SAY_THESE = ["c3", "c4", "c5"];
const CHECK_FIRST = "c11";

export function CertaintyBrief() {
  const { open } = usePanel();
  const checkFirst = claims.find((c) => c.id === CHECK_FIRST)!;
  const checkGap = gapById(checkFirst.linkedGapId!);

  return (
    <BriefFrame>
      <div className="shrink-0">
        <Eyebrow>
          {company.name} · {tierCounts.confirmed + tierCounts.inferred + tierCounts.unverified}{" "}
          claims on file
        </Eyebrow>
        <p className="mt-2 font-display text-h2 leading-[1.15] measure">
          {tierCounts.confirmed} things you can say. {tierCounts.unverified} you should not.
        </p>
        <p className="mt-1.5 text-small text-muted-foreground measure">
          ₹{tierValue("confirmed").toFixed(1)} Cr of the ₹14.7 Cr rests on things they told us. The
          rest is inference.
        </p>
      </div>

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
                  <span className="block text-base leading-snug group-hover:underline underline-offset-4 measure">
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

      <div className="shrink-0 rounded-md border border-dashed border-border-strong px-3 py-2.5">
        <div className="flex items-center gap-1.5 text-micro font-medium uppercase tracking-[0.08em] text-muted-foreground">
          <TierMark tier="inferred" />
          Check before you say it
        </div>
        <p className="mt-1 text-small measure">{checkFirst.statement}</p>
        <p className="mt-1 text-micro text-muted-foreground">
          Our largest estimate at {money(checkGap.amountCr)} and the least verified. If he pushes on
          it and it does not hold, your other figures lose credibility too.
        </p>
      </div>

      <div className="shrink-0 border-t border-border pt-2.5">
        <div className="flex items-end justify-between gap-4">
          <ConfidenceBadge level={company.confidence} showReason={false} />
          <Link
            href="/research/certainty/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small underline-offset-4 hover:underline"
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

const SECTIONS: SectionRef[] = [
  { id: "ledger", label: "How this is sorted", meta: "18 claims" },
  { id: "confirmed", label: "Confirmed", meta: `${tierCounts.confirmed} · ₹10.8 Cr` },
  { id: "inferred", label: "Inferred", meta: `${tierCounts.inferred} · ₹3.9 Cr` },
  { id: "unverified", label: "Unverified", meta: `${tierCounts.unverified} · —` },
  { id: "gaps-by-tier", label: "The money by tier", meta: "₹14.7 Cr" },
  { id: "sources", label: "Sources", meta: "4" },
];

export function CertaintyFull() {
  return (
    <FullFrame sections={SECTIONS}>
      <section>
        <Eyebrow>{company.name} · claim ledger</Eyebrow>
        <h1 id="ledger" className="mt-1.5 scroll-mt-6 font-display text-h1 leading-tight measure">
          What you can say, and what to check
        </h1>
        <p className="mt-2 text-base text-muted-foreground measure">
          Everything Meridian believes about Suvarna, sorted by how sure it is rather than by how
          much it is worth. Nothing is hidden to make the output look stronger — the moment a
          consultant is contradicted by a client on a claim presented as certain, the whole tool
          loses credibility.
        </p>

        <div className="mt-4">
          <SummaryStrip
            items={[
              { label: "Claims", value: "18" },
              { label: "Confirmed", value: String(tierCounts.confirmed) },
              { label: "Inferred", value: String(tierCounts.inferred) },
              { label: "Unverified", value: String(tierCounts.unverified) },
              { label: "Sources", value: "4" },
              { label: "Overall", value: company.confidence },
            ]}
          />
        </div>

        <dl className="mt-5 grid gap-4 sm:grid-cols-3">
          {(["confirmed", "inferred", "unverified"] as Tier[]).map((tier) => (
            <div key={tier} className="rounded-lg border border-border bg-card px-3.5 py-3">
              <dt>
                <TierBadge tier={tier} />
              </dt>
              <dd className="mt-1.5 text-small text-muted-foreground measure">
                {TIER_MEANING[tier]}
              </dd>
              <dd className="mt-2 tabular text-lead font-medium">
                {tier === "unverified" ? "—" : money(tierValue(tier))}
                <span className="ml-1.5 text-small font-normal text-muted-foreground">
                  {tier === "unverified" ? "not priced" : "of the total"}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </section>

      {(["confirmed", "inferred", "unverified"] as Tier[]).map((tier) => (
        <section key={tier}>
          <SectionHeading
            id={tier}
            title={
              tier === "confirmed"
                ? "Confirmed"
                : tier === "inferred"
                  ? "Inferred"
                  : "Unverified"
            }
            summary={TIER_MEANING[tier]}
            right={
              <span className="tabular">
                {claimsByTier(tier).length} claims ·{" "}
                {tier === "unverified" ? "—" : money(tierValue(tier))}
              </span>
            }
          />
          <ul className="mt-1 divide-y divide-border">
            {claimsByTier(tier).map((claim) => (
              <ClaimRow key={claim.id} claim={claim} />
            ))}
          </ul>

          {tier === "unverified" && (
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <EmptyState kind="no-sources" scope="Two claims with nothing attached" compact />
              <EmptyState kind="not-researched" scope="Returns and reverse logistics" compact />
            </div>
          )}
        </section>
      ))}

      {/* The direction's own weakness, stated rather than hidden. */}
      <section>
        <SectionHeading
          id="gaps-by-tier"
          title="The money by tier"
          summary="Sorting by certainty puts a ₹42 L confirmed gap above a ₹2.1 Cr inferred one. That is backwards commercially, so the value is shown here explicitly — this is the part of the direction that needs a second sort."
          right={<span className="tabular">₹14.7 Cr</span>}
        />
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[520px] text-small">
            <thead>
              <tr className="border-b border-border text-left">
                <th scope="col" className="py-2 pr-3 font-medium">
                  Gap
                </th>
                <th scope="col" className="py-2 pr-3 font-medium">
                  Basis
                </th>
                <th scope="col" className="py-2 pr-3 text-right font-medium">
                  Value
                </th>
                <th scope="col" className="py-2 text-right font-medium">
                  Rank by value
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
      </section>

      <section>
        <SectionHeading
          id="sources"
          title="Sources"
          summary="Four. Every claim above traces to one of these, or is marked as having nothing behind it."
          right={<span className="tabular">4</span>}
        />
        <ul className="mt-3 space-y-3">
          {sources.map((s) => {
            const supports = claims.filter((c) => c.sourceIds.includes(s.id));
            return (
              <li key={s.id} className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <SourceChip sourceId={s.id} />
                <span className="text-small text-muted-foreground">{s.detail}</span>
                <span className="tabular text-small text-muted-foreground">
                  · {supports.length} claims
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </FullFrame>
  );
}

/* -------------------------------------------------------------------------- */

function ClaimRow({ claim }: { claim: Claim }) {
  const { open } = usePanel();
  const gap = claim.linkedGapId ? gapById(claim.linkedGapId) : null;

  return (
    <li className="py-3">
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
            <p className="text-base measure">{claim.statement}</p>
            {gap && (
              <span
                className={cn(
                  "tabular shrink-0 text-small font-medium",
                  gap.amountCr == null && "text-muted-foreground",
                )}
              >
                {money(gap.amountCr)}
              </span>
            )}
          </div>
          {/* The basis is never collapsed. A tier without its reason is a badge. */}
          <p className="mt-1 text-small text-muted-foreground measure">{claim.basis}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
              {claim.category}
            </span>
            {claim.sourceIds.length > 0 ? (
              claim.sourceIds.map((sid) => <SourceChip key={sid} sourceId={sid} />)
            ) : (
              <span className="text-micro italic text-muted-foreground">
                Nothing attached — treat as a question, not a statement
              </span>
            )}
            <button
              type="button"
              onClick={() => open({ kind: "claim", id: claim.id })}
              className="text-micro text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              Open detail
            </button>
          </div>
        </div>
      </div>
    </li>
  );
}

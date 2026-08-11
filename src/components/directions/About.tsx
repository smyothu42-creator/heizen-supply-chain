"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { company, coverage, gaps, sources, type Coverage } from "@/lib/suvarna";
import { BriefFrame, DocumentLead, FullFrame, Section, type SectionRef } from "./Frames";
import { ConfidenceBadge } from "@/components/meridian/Confidence";
import { Eyebrow } from "@/components/meridian/Primitives";
import { SourceChip } from "@/components/meridian/Evidence";
import { ArrowIcon } from "@/components/meridian/Icons";
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

const STATE_LABEL: Record<Coverage["state"], string> = {
  researched: "Researched",
  thin: "Thin",
  "not-researched": "Not looked at",
};

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
              <p className="reading measure mt-1 text-small text-muted-foreground">
                {company.sector}. {money(company.revenueCr * 1)} revenue is not the number
                here — {covered} of {coverage.length} stages of their operation have been
                looked at.
              </p>
            </div>
          }
        />
      }
      lead={
        <DocumentLead
          bordered={false}
          titleNode={<p className="font-display text-h2 leading-[1.15]">{company.name}</p>}
          standfirst={`${company.sector}. Six facts, and an honest account of how much of the operation has been researched.`}
        />
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <dl className="divide-y divide-border">
          {company.facts.slice(0, 4).map((f) => (
            <div key={f.label} className="flex items-baseline justify-between gap-3 py-2">
              <dt className="min-w-0 text-small text-muted-foreground">{f.label}</dt>
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

      <div className="shrink-0 pt-1">
        <div className="flex items-end justify-between gap-4">
          <ConfidenceBadge level={company.confidence} showReason={false} />
          <Link
            href="/research/about/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small transition-colors hover:text-muted-foreground"
          >
            All the facts
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

const SECTIONS: SectionRef[] = [
  { id: "b-facts", label: "The company", meta: `${company.facts.length} facts` },
  { id: "b-coverage", label: "What has been looked at", meta: `${covered} of ${coverage.length}` },
  { id: "b-sources", label: "What we read", meta: String(sources.length) },
];

export function AboutFull() {
  return (
    <FullFrame
      sections={SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title={company.name}
        standfirst={`${company.sector}. ${company.facts.length} facts about the business, and an account of how much of its operation has actually been researched — which is what every total on the other screens is a total of.`}
      />

      <Section id="b-facts" title="The company" summary="Read off the filing and the two calls.">
        <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2 lg:grid-cols-3">
          {company.facts.map((f) => (
            <div key={f.label}>
              <dt className="text-small text-muted-foreground">{f.label}</dt>
              <dd className="tabular mt-0.5 text-lead font-medium">{f.value}</dd>
              <dd className="reading mt-0.5 text-small text-muted-foreground">{f.detail}</dd>
            </div>
          ))}
        </dl>
      </Section>

      <Section
        id="b-coverage"
        title="What has been looked at"
        summary="A total is only a total of what was researched. This is the rest of that sentence."
        right={
          <span className="tabular text-small text-muted-foreground">
            {covered} of {coverage.length} stages
          </span>
        }
      >
        <ul className="divide-y divide-border">
          {coverage.map((c) => (
            <li key={c.stage} className="py-3 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="flex items-baseline gap-2.5">
                  <span className="text-base font-medium">{c.stage}</span>
                  {/* State as a word, never a hue: colour on this platform is a
                      reading about the client's process, and this is a reading
                      about our own research. */}
                  <span
                    className={cn(
                      "text-small",
                      c.state === "not-researched"
                        ? "text-health-watch"
                        : "text-muted-foreground",
                    )}
                  >
                    {STATE_LABEL[c.state]}
                  </span>
                </span>
                <span className="tabular shrink-0 text-small text-muted-foreground">
                  {gaps.filter((g) => g.scor === c.stage).length} findings
                </span>
              </div>
              <p className="reading mt-1 text-small text-muted-foreground">{c.line}</p>
              {c.unclaimedRange && (
                <p className="reading mt-1.5 border-l-2 border-health-watch pl-3 text-small">
                  <span className="font-medium">Not in the total. </span>
                  {c.unclaimedRange}
                </p>
              )}
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="b-sources"
        title="What we read"
        summary="Everything on every other screen traces back to one of these."
      >
        <ul className="flex flex-wrap gap-2">
          {sources.map((s) => (
            <li key={s.id}>
              <SourceChip sourceId={s.id} />
            </li>
          ))}
        </ul>
        <p className="reading mt-3 text-small text-muted-foreground measure">
          {company.confidenceReason}
        </p>
      </Section>
    </FullFrame>
  );
}

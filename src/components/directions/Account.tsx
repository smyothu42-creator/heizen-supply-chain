"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import { lanes, stages } from "@/lib/compare";
import { company, dealRisks, stakeholders, systemsByState } from "@/lib/suvarna";
import { BriefFrame, DocumentLead, FullFrame, Section, type SectionRef } from "./Frames";
import { ConfidenceBadge } from "@/components/meridian/Confidence";
import { Eyebrow } from "@/components/meridian/Primitives";
import { ArrowIcon } from "@/components/meridian/Icons";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Already inside · Solved before                                              */
/*                                                                             */
/* Two directions about the account rather than about the operation, kept in    */
/* one file because they are the same question asked twice: what is already     */
/* true here, and what is already true elsewhere.                              */
/*                                                                             */
/* **Already inside** is what exists before Heizen arrives — live modules, the  */
/* vendor already holding the support contract, the project tried in 2019, the  */
/* people already met. The most expensive thing a consultant can do on a first  */
/* call is propose replacing something the room has already paid for.           */
/*                                                                             */
/* **Solved before** is the only direction built from Heizen's own record       */
/* rather than the client's, so it needs no research to be true.                */
/* -------------------------------------------------------------------------- */

const LIVE = systemsByState("live");
const MET = stakeholders.filter((s) => s.met);
const INCUMBENT = dealRisks.find((r) => r.id === "r-incumbent");
const PAST = dealRisks.find((r) => r.label.toLowerCase().includes("failed"));

export function InsideBrief() {
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
                What is already in this account
              </p>
              <p className="reading measure mt-1 text-small text-muted-foreground">
                Everything proposed lands on top of these, not instead of them.
              </p>
            </div>
          }
        />
      }
      lead={
        <DocumentLead
          bordered={false}
          titleNode={
            <p className="font-display text-h2 leading-[1.15]">What is already in this account</p>
          }
          standfirst="The modules that are live, the vendor already holding the contract, and the project that stopped in 2019."
        />
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <Eyebrow>Live and configured</Eyebrow>
        <p className="mt-1 text-base">
          {LIVE.map((s) => s.name).join(", ")} on {company.facts[2].value}
        </p>

        {INCUMBENT && (
          <>
            <Eyebrow className="mt-3">Already holding the contract</Eyebrow>
            <p className="mt-1 text-base">{INCUMBENT.value}</p>
            <p className="reading mt-0.5 text-small text-muted-foreground">
              <span className="text-evidence" aria-hidden>
                →{" "}
              </span>
              {INCUMBENT.counter}
            </p>
          </>
        )}
      </div>

      <div className="shrink-0 rounded-md border border-dashed border-border-strong px-4 py-3">
        <Eyebrow>Already met</Eyebrow>
        <p className="mt-1 text-small measure">
          {MET.map((s) => s.name).join(", ")}. The other{" "}
          {stakeholders.length - MET.length} have not been spoken to.
        </p>
      </div>

      <div className="shrink-0 pt-1">
        <div className="flex items-end justify-between gap-4">
          <ConfidenceBadge level={company.confidence} showReason={false} />
          <Link
            href="/research/inside/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small transition-colors hover:text-muted-foreground"
          >
            Everything already here
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </BriefFrame>
  );
}

const INSIDE_SECTIONS: SectionRef[] = [
  { id: "i-systems", label: "Live and configured", meta: `${LIVE.length} modules` },
  { id: "i-vendors", label: "Who is already here", meta: "2" },
  { id: "i-people", label: "Who has been met", meta: `${MET.length} of ${stakeholders.length}` },
];

export function InsideFull() {
  return (
    <FullFrame
      sections={INSIDE_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="What is already in this account"
        standfirst="Software that is live, a vendor already holding the support contract, a project that was tried and stopped, and the two people who have been spoken to. Everything on What should build lands on top of this list."
      />

      <Section
        id="i-systems"
        title="Live and configured"
        summary="Not problems. The ground anything new would stand on."
      >
        <ul className="divide-y divide-border">
          {LIVE.map((s) => (
            <li key={s.id} className="flex flex-wrap items-baseline justify-between gap-x-4 py-2.5">
              <span className="min-w-0">
                <span className="text-base font-medium">{s.name}</span>
                <span className="reading mt-0.5 block text-small text-muted-foreground">
                  {s.does}
                </span>
              </span>
              <span className="tabular shrink-0 text-small text-muted-foreground">
                {s.gapIds.length} findings
              </span>
            </li>
          ))}
        </ul>
      </Section>

      <Section
        id="i-vendors"
        title="Who is already here"
        summary="Both of these decide the deal rather than delay it, and neither is going to be raised by us first."
      >
        <div className="divide-y divide-border">
          {[INCUMBENT, PAST].filter(Boolean).map((r) => (
            <div key={r!.id} className="py-3.5 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <span className="text-base font-medium">{r!.label}</span>
                <span className="shrink-0 text-small text-muted-foreground">{r!.value}</span>
              </div>
              <p className="reading mt-1.5 text-small">{r!.risk}</p>
              <div className="mt-2.5 border-l-2 border-evidence pl-3">
                <p className="text-micro font-medium text-muted-foreground">Say this</p>
                <p className="reading mt-1 text-small">{r!.counter}</p>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        id="i-people"
        title="Who has been met"
        summary="Two of four. Everything about the other two is inference."
      >
        <ul className="divide-y divide-border">
          {stakeholders.map((s) => (
            <li key={s.id} className="flex items-baseline justify-between gap-4 py-2.5">
              <span className="min-w-0 text-small">
                <span className="font-medium">{s.name}</span>
                <span className="ml-2 text-muted-foreground">{s.role}</span>
              </span>
              <span
                className={cn(
                  "shrink-0 text-small",
                  s.met ? "text-muted-foreground" : "text-health-watch",
                )}
              >
                {s.met ? "Met" : "Not met"}
              </span>
            </li>
          ))}
        </ul>
      </Section>
    </FullFrame>
  );
}

/* -------------------------------------------------------------------------- */
/* Solved before                                                               */
/* -------------------------------------------------------------------------- */

const PRIOR = lanes.filter((l) => !l.isCurrent && !l.isBenchmark);
const HERE = lanes.find((l) => l.isCurrent)!;
const BIC = lanes.find((l) => l.isBenchmark)!;

/** Days saved on a stage, this client against a delivered project. */
const delta = (stageId: string, laneId: string) => {
  const a = HERE.values[stageId];
  const b = lanes.find((l) => l.id === laneId)?.values[stageId];
  if (!a || !b) return null;
  return Math.round((a.days - b.days) * 10) / 10;
};

export function SolvedBrief() {
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
                The same problem, at two other food companies
              </p>
              <p className="reading measure mt-1 text-small text-muted-foreground">
                One delivered, one in flight. Both bought for these reasons.
              </p>
            </div>
          }
        />
      }
      lead={
        <DocumentLead
          bordered={false}
          titleNode={
            <p className="font-display text-h2 leading-[1.15]">
              The same problem, at two other food companies
            </p>
          }
          standfirst="Heizen's own record, not this client's research. It needs nothing shared to be true."
        />
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <ul className="space-y-3">
          {PRIOR.map((l) => (
            <li key={l.id}>
              <p className="text-base font-medium leading-snug">{l.company}</p>
              <p className="text-small text-muted-foreground">{l.sector}</p>
              <p className="reading mt-0.5 text-small">{l.note}</p>
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 rounded-md border border-dashed border-border-strong px-4 py-3">
        <Eyebrow>What it moved</Eyebrow>
        <p className="mt-1 text-small measure">
          Kesarwani now clears an invoice in 3.4 days against this client&apos;s 9.5, on the same
          ERP and the same sector.
        </p>
      </div>

      <div className="shrink-0 pt-1">
        <div className="flex items-end justify-between gap-4">
          <ConfidenceBadge level={company.confidence} showReason={false} />
          <Link
            href="/research/solved/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small transition-colors hover:text-muted-foreground"
          >
            Stage by stage
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </BriefFrame>
  );
}

const SOLVED_SECTIONS: SectionRef[] = [
  ...PRIOR.map((l) => ({ id: `s-${l.id}`, label: l.company, meta: l.sector.split(" · ")[0] })),
  { id: "s-stages", label: "Stage by stage", meta: `${stages.length} stages` },
];

export function SolvedFull() {
  return (
    <FullFrame
      sections={SOLVED_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="Solved before"
        standfirst={`Two comparable engagements in food and beverage, both bought for the reasons this one would be. This is the only direction built from Heizen's own record rather than from ${company.name}'s, so nothing here depends on data being shared.`}
      />

      {PRIOR.map((l) => (
        <Section key={l.id} id={`s-${l.id}`} title={l.company} summary={l.note}>
          <p className="text-small text-muted-foreground">{l.sector}</p>
          <ul className="mt-3 divide-y divide-border">
            {stages.map((st) => {
              const d = delta(st.id, l.id);
              const theirs = l.values[st.id];
              return (
                <li key={st.id} className="flex items-baseline justify-between gap-4 py-2">
                  <span className="min-w-0 text-small">{st.name}</span>
                  <span className="tabular shrink-0 text-small">
                    {theirs ? (
                      <>
                        <span className="font-medium">{theirs.days} d</span>
                        {d != null && d > 0 && (
                          <span className="ml-2 text-metric-delta-good">
                            {d} d faster than here
                          </span>
                        )}
                      </>
                    ) : (
                      <span className="text-muted-foreground italic">Not mapped</span>
                    )}
                  </span>
                </li>
              );
            })}
          </ul>
        </Section>
      ))}

      <Section
        id="s-stages"
        title="Stage by stage"
        summary={`This client against ${BIC.company.toLowerCase()}, on the same six steps.`}
      >
        <ul className="divide-y divide-border">
          {stages.map((st) => {
            const here = HERE.values[st.id];
            const best = BIC.values[st.id];
            return (
              <li key={st.id} className="flex items-baseline justify-between gap-4 py-2">
                <span className="min-w-0 text-small">{st.name}</span>
                <span className="tabular shrink-0 text-small">
                  <span className="font-medium">{here?.days} d</span>
                  <span className="text-metric-best-in-class"> vs {best?.days} d</span>
                </span>
              </li>
            );
          })}
        </ul>
        <p className="mt-3 text-small text-muted-foreground">
          Compare has the same six stages with every lane stacked, and the workflow view beside
          it.
        </p>
      </Section>
    </FullFrame>
  );
}

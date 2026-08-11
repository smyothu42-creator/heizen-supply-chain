"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import {
  company,
  dealRisks,
  riskCounts,
  type DealRisk,
  type RiskSeverity,
} from "@/lib/suvarna";
import { BriefFrame, DocumentLead, FullFrame, Section, type SectionRef } from "./Frames";
import { ConfidenceBadge } from "@/components/meridian/Confidence";
import { Eyebrow } from "@/components/meridian/Primitives";
import { SourceChip } from "@/components/meridian/Evidence";
import { ArrowIcon } from "@/components/meridian/Icons";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Direction 4 — Risk                                                          */
/*                                                                             */
/* ONE RULE, AND IT IS THE WHOLE DIRECTION: every risk carries a counter.      */
/* `DealRisk.counter` is not optional in the type and `check:data` fails the    */
/* build on an empty one, so this cannot rot quietly.                           */
/*                                                                             */
/* The reason is Aryan. He is minutes from a call and not a domain expert. Six  */
/* things that could go wrong, with no line to say when any of them is raised,  */
/* does not prepare him — it frightens him, and a frightened consultant avoids  */
/* the subject. Which is exactly how an incumbent vendor or a dead 2019 project */
/* ends up deciding the deal off-screen. A risk with a counter is ammunition. A */
/* risk without one is a reason to stay quiet.                                  */
/*                                                                             */
/* It follows that the counter cannot be progressive disclosure. It is not the  */
/* detail behind the risk; it is the other half of the same object, and the     */
/* screen never renders one without the other.                                  */
/* -------------------------------------------------------------------------- */

const HIGH = dealRisks.filter((r) => r.severity === "high");
const REST = dealRisks.filter((r) => r.severity !== "high");

const BRIEF_STANDFIRST = `Six things that could stop this, and the line to say for each. ${riskCounts.high} of them decide the deal rather than delay it.`;

/**
 * Severity as weight, not as a hue.
 *
 * Red on this surface would collide with Operations' health colours, where red
 * means the client's process is failing. Here the subject is the *pitch*, not
 * the company, and a consultant reading a red badge would be looking at the
 * wrong thing. Severity is a filled or hollow mark and a word.
 */
const SEVERITY_LABEL: Record<RiskSeverity, string> = {
  high: "Decides it",
  medium: "Slows it",
  low: "Noise",
};

function SeverityBadge({ severity }: { severity: RiskSeverity }) {
  return (
    <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-muted px-2 py-0.5 text-micro font-medium text-muted-foreground">
      <span
        aria-hidden
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          severity === "high"
            ? "bg-foreground"
            : severity === "medium"
              ? "border border-foreground bg-transparent"
              : "border border-border-strong bg-transparent",
        )}
      />
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

export function RiskBrief() {
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
                {dealRisks.length} things could kill this. All {dealRisks.length} have an answer.
              </p>
              <p className="reading measure mt-1 text-small text-muted-foreground">
                {BRIEF_STANDFIRST}
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
              {dealRisks.length} things could kill this. All {dealRisks.length} have an answer.
            </p>
          }
          standfirst={BRIEF_STANDFIRST}
        />
      }
    >
      <div className="min-h-0 flex-1 overflow-hidden">
        <Eyebrow>The three that decide it</Eyebrow>
        <ul className="mt-1.5 space-y-2">
          {HIGH.map((r) => (
            <li key={r.id}>
              <p className="text-base leading-snug">
                <span className="font-medium">{r.label}.</span> {r.value}
              </p>
              {/* The counter, on the phone screen, under every one of them.
                  Cutting it here to save four lines would leave exactly the
                  screen this direction exists not to be. */}
              <p className="reading mt-0.5 text-small text-muted-foreground">
                <span className="text-evidence" aria-hidden>
                  →{" "}
                </span>
                <span className="sr-only">Say: </span>
                {r.counter}
              </p>
            </li>
          ))}
        </ul>
      </div>

      <div className="shrink-0 pt-1">
        <div className="flex items-end justify-between gap-4">
          <ConfidenceBadge level={company.confidence} showReason={false} />
          <Link
            href="/research/risk/full"
            className="inline-flex shrink-0 items-center gap-1.5 text-small transition-colors hover:text-muted-foreground"
          >
            All {dealRisks.length}
            <ArrowIcon />
          </Link>
        </div>
      </div>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

const SECTIONS: SectionRef[] = [
  { id: "decides", label: "What decides it", meta: `${HIGH.length} risks` },
  { id: "slows", label: "What slows it down", meta: `${REST.length} risks` },
  { id: "rule", label: "Why every one has a counter", defaultCollapsed: true },
];

export function RiskFull() {
  return (
    <FullFrame
      sections={SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="What could kill this"
        standfirst={`Six things that could stop the work at ${company.name}, ordered by whether they decide the deal or merely delay it. Each one is paired with the line to say when it is raised, and the pair is one object: this screen never shows half of it.`}
      />


      <Section
        id="decides"
        title="What decides it"
        summary="Raise these yourself rather than waiting for them. All three are things the room already knows and is not going to say first."
        right={
          <span className="tabular text-small text-muted-foreground">
            {HIGH.length} of {dealRisks.length}
          </span>
        }
      >
        <div className="divide-y divide-border">
          {HIGH.map((r) => (
            <RiskBlock key={r.id} risk={r} />
          ))}
        </div>
      </Section>

      <Section
        id="slows"
        title="What slows it down"
        summary="None of these stops the work. All three change when it starts, which on a March year end is nearly the same thing."
        right={
          <span className="tabular text-small text-muted-foreground">
            {REST.length} of {dealRisks.length}
          </span>
        }
      >
        <div className="divide-y divide-border">
          {REST.map((r) => (
            <RiskBlock key={r.id} risk={r} />
          ))}
        </div>
      </Section>

      <Section
        id="rule"
        title="Why every one has a counter"
        summary="The rule this direction is built on, kept on the page because it is the thing that would quietly stop being true."
      >
        <p className="reading text-small measure">
          A risk without an answer does not prepare a consultant. It frightens him, and a frightened
          consultant avoids the subject, which is how an incumbent vendor or a dead project ends up
          deciding the deal without ever being discussed. So a counter is not the detail behind a
          risk here. It is the other half of the same object.
        </p>
        <p className="reading mt-2.5 text-small text-muted-foreground measure">
          It is enforced rather than remembered: <code>counter</code> is required on the type, and{" "}
          <code>check:data</code> fails the build if any of them is empty.
        </p>
      </Section>
    </FullFrame>
  );
}

/**
 * One risk and its counter, as one block.
 *
 * The counter is set apart with a rule and the accent, and worded as speech in
 * the second person, because it is read seconds before it is said out loud. A
 * counter phrased as advice — "position the offering as complementary" — has
 * to be translated under pressure, which is exactly when it will not be.
 */
function RiskBlock({ risk }: { risk: DealRisk }) {
  return (
    <div className="py-4 first:pt-0 last:pb-0">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <span className="flex flex-wrap items-baseline gap-2.5">
          <SeverityBadge severity={risk.severity} />
          <span className="text-base font-medium">{risk.label}</span>
        </span>
        <span className="shrink-0 text-small text-muted-foreground">{risk.value}</span>
      </div>

      <p className="reading mt-2 text-small measure">{risk.risk}</p>

      <div className="mt-2.5 border-l-2 border-evidence pl-3">
        <p className="text-micro font-medium text-muted-foreground">
          Say this
        </p>
        <p className="reading mt-1 text-small measure">{risk.counter}</p>
      </div>

      <div className="mt-2.5 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-micro text-muted-foreground">
        <span>Raised by {risk.raisedBy}</span>
        <span className="flex flex-wrap items-baseline gap-1.5">
          {risk.sourceIds.map((id) => (
            <SourceChip key={id} sourceId={id} />
          ))}
        </span>
      </div>
    </div>
  );
}

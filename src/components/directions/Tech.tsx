"use client";

import { money } from "@/lib/format";
import {
  company,
  systemSplit,
  systemsByState,
  valueForSystemState } from "@/lib/suvarna";
import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section , type SectionRef } from "./Frames";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Direction 3 — Tech stack                                                    */
/*                                                                             */
/* The axis is the machine underneath. Every other direction sorts the same     */
/* finding set by something about the *deal* — its money, its timing, its       */
/* exposure, its people. This one sorts it by what the work runs on, which is   */
/* the question nothing else answers and the first one a vendor selling         */
/* automation onto SAP has to answer before it can scope anything.              */
/*                                                                             */
/* THE SHAPE IS THE FINDING. Three modules live, three processes running        */
/* outside any system, three systems never bought. Six of the twelve gaps sit   */
/* inside software they already own; the other six sit in the space between and */
/* are worth nearly twice as much. Both halves are derived from the data rather */
/* than written down, because a sentence claiming "half and half" goes stale    */
/* the first time a gap moves.                                                  */
/*                                                                             */
/* **State is a mark and a word, never a hue.** live / worked around / missing  */
/* is a statement about the software estate and not about how well the company  */
/* is running, and Operations already owns colour for the second thing. A red   */
/* row here would be read as "this process is failing" on a screen whose whole  */
/* subject is something else. Same reasoning as Risk's severity badge.          */
/* -------------------------------------------------------------------------- */

const LIVE = systemsByState("live");
const WORKAROUND = systemsByState("workaround");
const MISSING = systemsByState("missing");

/** "SAP MM, SAP FI and SAP SD" — an Oxford-free list for running prose. */
const nameList = (list: { name: string }[]) =>
  list.length < 2
    ? (list[0]?.name ?? "")
    : `${list.slice(0, -1).map((s) => s.name).join(", ")} and ${list[list.length - 1].name}`;

/** How many findings sit on a set of systems. */
const gapsIn = (list: { gapIds: string[] }[]) => list.reduce((n, s) => n + s.gapIds.length, 0);

/* Small counts are spelled out, because these are derived from the data and
   land mid-prose. "3 systems the client has never bought" opens a sentence on
   a digit, which reads as a table cell that escaped into a paragraph. */
const WORDS = [
  "no", "one", "two", "three", "four", "five", "six",
  "seven", "eight", "nine", "ten", "eleven", "twelve",
];
const spell = (n: number) => WORDS[n] ?? String(n);
const Spell = (n: number) => {
  const w = spell(n);
  return w.charAt(0).toUpperCase() + w.slice(1);
};

/* Each row's own `fallsTo`, joined into a sentence. The section paragraph is
   the only thing on screen now, so where the work goes has to be said in it
   rather than left to a column that no longer exists.

   The first letter is lowered: `fallsTo` is authored as a standalone sentence
   ("Paper, at all three plants.") and arrives here in the middle of one. */
const lower = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);
const fallsList = (list: { name: string; fallsTo?: string }[]) =>
  list
    .map((s) => `${s.name} falls to ${s.fallsTo ? lower(s.fallsTo).replace(/\.$/, "") : "nobody"}`)
    .join(". ");

const BRIEF_STANDFIRST = `${Spell(systemSplit.insideGaps)} of the ${spell(systemSplit.insideGaps + systemSplit.outsideGaps)} findings sit inside SAP. The other ${spell(systemSplit.outsideGaps)} are worth ${money(systemSplit.outsideValue)}, and there is no system to put them in.`;


export function TechBrief() {
  return (
    <BriefFrame
      actions={<RunButton label="Run research" tight />}
      hero={<SurfaceHero title="Research" />}
      lead={
        <DocumentLead
          title="What they run, and what it does not do"
          standfirst={BRIEF_STANDFIRST}
        />
      }
    >
      <Section id="h-brief" title="What the work would run on" summary={`${company.erp}, with ${spell(LIVE.length)} modules live and ${spell(WORKAROUND.length + MISSING.length)} processes running outside all of them. ${Spell(systemSplit.insideGaps)} of the twelve findings sit inside software already paid for and are worth ${money(systemSplit.insideValue)} a year: configuration and process, cheaper to fix and harder to sell. The other ${spell(systemSplit.outsideGaps)} sit where no software touches them and are worth ${money(systemSplit.outsideValue)}, close to twice as much, and that is where a build goes. Nothing here needs the ERP replaced, which is the sentence to say early because it is the fear the room brings to the meeting.`} />
      <BriefFooter
        href="/research/tech/full"
      >
        All nine systems
      </BriefFooter>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

/* The headings this view renders, for the navigator beside it. Built from the
   same ids the sections carry, so a heading cannot be missing from the list. */
const TECH_SECTIONS: SectionRef[] = [
  { id: "split", label: "Where the money sits" },
  { id: "missing", label: "Never bought" },
  { id: "workaround", label: "Worked around" },
  { id: "live", label: "Already live" },
  { id: "integration", label: "What you would be building on" },
];

export function TechFull() {
  return (
    <FullFrame
      sections={TECH_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="What they run, and what it does not do"
        standfirst={`${company.erp}, with ${LIVE.length} modules live. Every finding below is filed under the one system where the work actually lands on a person, so the subtotals add to the same ${money(company.grossLeakageCr)} every other direction ties to.`}
      />


      {/* The whole argument, before any of the rows. Two lines, because the
          split is the finding and a reader who stops here has still had it. */}
      <Section
        id="split"
        title="Where the money sits"
        summary={`Every finding is filed under one system, and the split is the scoping answer. ${Spell(systemSplit.insideGaps)} of them sit inside the ${spell(LIVE.length)} SAP modules already running and are worth ${money(systemSplit.insideValue)} a year: that half is configuration and process inside software the client has paid for, so it is cheaper to fix and harder to sell, because nothing new arrives. The other ${spell(systemSplit.outsideGaps)} sit on work no software touches at all and are worth ${money(systemSplit.outsideValue)}, close to twice as much. That is where a build goes, and it is why the first phase is worth scoping outside the ERP rather than inside it. Both figures are counted from the findings themselves, so they move when a finding moves.`}
      />

      <Section
        id="missing"
        title="Never bought"
        summary={`${Spell(MISSING.length)} systems the client has never bought: ${nameList(MISSING)}. The work still happens, so a person is doing it. ${fallsList(MISSING)}. ${Spell(gapsIn(MISSING))} findings sit here, worth ${money(valueForSystemState("missing"))} a year, and this is where a first phase has the most room: there is no incumbent product to displace and nothing to migrate off. It is also the weakest evidence on the page, because the one system that would measure any of it is the one nobody bought.`}
        right={
          <span className="tabular text-small text-muted-foreground">
            {money(valueForSystemState("missing"))}
          </span>
        }
      />

      <Section
        id="workaround"
        title="Worked around"
        summary={`${Spell(WORKAROUND.length)} processes that exist and run, but not anywhere that leaves a record. ${fallsList(WORKAROUND)}. ${Spell(gapsIn(WORKAROUND))} findings sit here, worth ${money(valueForSystemState("workaround"))} a year. These are the hardest to raise on a call, because nobody experiences them as broken: the purchase gets approved, the lorry turns up, the plan gets made. What is missing is the trail, which is why none of it can be measured and why the fix reads as a control rather than as a saving.`}
        right={
          <span className="tabular text-small text-muted-foreground">
            {money(valueForSystemState("workaround"))}
          </span>
        }
      />

      <Section
        id="live"
        title="Already live"
        summary={`${nameList(LIVE)}, all on ${company.erp} and all supplied by SAP. ${LIVE.map((s) => `${s.name} handles ${s.does.replace(/^[^:]+:\s*/, "").replace(/\.$/, "")}`).join(". ")}. ${Spell(gapsIn(LIVE))} findings sit on them, worth ${money(valueForSystemState("live"))} a year. None of these is a problem in itself. They are the ground anything new would stand on, and the reason to read the section is that an integration touching a live module is a conversation with SAP and whoever manages the estate, not just with the client.`}
        right={
          <span className="tabular text-small text-muted-foreground">
            {money(valueForSystemState("live"))}
          </span>
        }
      />

      <Section
        id="integration"
        title="What you would be building on"
        summary={`${company.erp}, with ${spell(LIVE.length)} modules live and ${spell(WORKAROUND.length + MISSING.length)} processes running outside all of them. Anything built here reads from and writes back to ${nameList(LIVE)}, which is the answer to the first question an engineer asks and the first one a client asks after it. The work splits cleanly: ${money(systemSplit.outsideValue)} of it needs something new that stands beside SAP and feeds it, and ${money(systemSplit.insideValue)} of it is configuration and process inside modules that are already paid for. Nothing here needs the ERP replaced, which is the sentence worth saying early, because it is the fear the room brings to the meeting.`}
      />
    </FullFrame>
  );
}


"use client";

import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import {
  company,
  gaps,
  sources,
  systemSplit,
  type Gap } from "@/lib/suvarna";
import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section , type SectionRef } from "./Frames";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";

/* -------------------------------------------------------------------------- */
/* Direction 1 — All                                                           */
/*                                                                             */
/* The default, and the only direction with no axis. Picking an axis is itself  */
/* a decision, and arriving at Research from the masthead with no particular    */
/* errand should not require making one before you can read anything.           */
/*                                                                             */
/* **Its Brief is the summary that leaves the tool**, in the shape of the       */
/* Heizen one-pager: a thesis, a line naming the tension, then numbered pairs   */
/* — the problem in the client's own terms, and what we would do about it. That */
/* pairing is the whole format. A problem with no answer beside it is the deck  */
/* a consultant cannot send, which is the same argument the counter rule makes  */
/* on Risk.                                                                     */
/* -------------------------------------------------------------------------- */

/** The three the deck would lead on: biggest first, priced. */
const HEADLINE_GAPS = gaps
  .filter((g) => g.amountCr != null)
  .sort((a, b) => (b.amountCr ?? 0) - (a.amountCr ?? 0))
  .slice(0, 3);

const TENSION = "Where scale meets a process that has not changed since 2019";

export function AllBrief() {
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
              <p className="font-display text-h2 leading-[1.15]">{TENSION}</p>
              <p className="reading measure mt-1 text-small text-muted-foreground">
                {HEADLINE_GAPS.length} things to fix, each with what we would do about it.
              </p>
            </div>
          }
        />
      }
      lead={
        <DocumentLead
          bordered={false}
          titleNode={<p className="font-display text-h2 leading-[1.15]">{TENSION}</p>}
          standfirst={`Heizen would put workflows across ${company.name}'s buying, matching and stock, building the visibility ${money(company.netLeakageCr)} a year of leakage needs. No new ERP.`}
        />
      }
    >
      {/* The deck's shape: numbered, problem then answer. Three of them, because
          three is what fits on the screen and what a consultant can hold. */}
      <div className="min-h-0 flex-1 overflow-hidden">
        <ol className="space-y-2">
          {HEADLINE_GAPS.map((gap, i) => (
            /* The third drops at 375. The leading and the size step above are
               worth more on a screen read in a corridor than a third card
               nobody gets to. */
            <FindingCard
              key={gap.id}
              gap={gap}
              n={i + 1}
              className={cn(i === 2 && "hidden sm:block")}
            />
          ))}
        </ol>
      </div>

      <BriefFooter
        href="/research/all/full"
      >
        {/* **"Every topic" named the destination; a button wants a verb.** As a
            link a noun phrase reads as a label on where you land. In a drawn box
            the same words read as a heading somebody has boxed. This says what
            pressing it does. */}
        See the full view
      </BriefFooter>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Every topic at once.
 *
 * Each section is that direction's headline and a way into it, not a copy of
 * it. A page that reproduced six directions in full would be six directions
 * with a seventh name, and the one thing this view is for — arriving with no
 * errand — is exactly the case where you do not want all of it.
 */
/* The headings this view renders, for the navigator beside it. Built from the
   same ids the sections carry, so a heading cannot be missing from the list. */
const ALL_SECTIONS: SectionRef[] = [
  { id: "a-money", label: "The money" },
  { id: "a-gaps", label: "What is wrong" },
  { id: "a-tech", label: "What they run" },
  { id: "a-risk", label: "What could stop it" },
  { id: "a-people", label: "Who is in the room" },
  { id: "a-ask", label: "What to ask" },
];

export function AllFull() {
  return (
    <FullFrame
      sections={ALL_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead title={TENSION} standfirst={company.thesis} />

      <Section
        id="a-money"
        title="The money"
        summary={`Every finding added up is ${money(company.grossLeakageCr)}; the claimable figure is ${money(company.netLeakageCr)}, because ${money(company.overlapCr)} is one saving counted twice where several findings move the same invoice through the same process. Separately, ${money(company.workingCapitalReleaseCr)} of cash sits in stock that is not needed, which is a one-off release rather than an annual saving and must never be added to the line above. None of it is measured from the client's own data. Every price is modelled from a base in their filings, which is defensible line by line and is not the same thing as being right.`}
        right={<span className="tabular">{money(company.netLeakageCr)} claimable</span>}
      />

      <Section
        id="a-gaps"
        title="What is wrong"
        summary={`Twelve findings, of which three are worth opening a call with: onboarding a supplier takes 21 days, three-way match fails on 42% of invoices, and indirect spend is bought outside negotiated rates. The first is felt by a plant, the second by finance, and between them they name both halves of the room. The other nine are on the page for when they are asked for rather than to be read out. Eleven of the twelve carry a price; the twelfth does not, and that is the honest result rather than an omission.`}
      />

      <Section
        id="a-tech"
        title="What they run"
        summary={`${systemSplit.insideGaps} findings sit inside software they own. The other ${systemSplit.outsideGaps} are worth ${money(systemSplit.outsideValue)}.`}
      />

      <Section
        id="a-risk"
        title="What could stop it"
        summary={`Six things that could stop the deal, each with the line to say when it is raised. Three decide it rather than delay it: the incumbent managing the SAP estate, a project that was tried in 2019 and stopped, and the fact that the process belongs to somebody who inherited it. Every one carries a counter, and that is enforced rather than encouraged. A risk with no answer beside it does not prepare a consultant, it makes them avoid the subject, and avoiding it is how the risk ends up deciding the deal after the call rather than during it.`}
      />

      <Section id="a-people" title="Who is in the room" summary={`Four people, of whom two have been met. The Head of Procurement and the Accounts Payable Lead were on both calls. The Chief Financial Officer and the VP Supply Chain have not been spoken to at all, so everything here about either of them is inference from filings and public signal. That matters commercially rather than academically: between them those two own most of the money on the page, and the strongest outcome from the next call is a meeting with one of them rather than an answer from the people already met.`}
      />

      <Section
        id="a-ask"
        title="What to ask"
        summary={`Eleven questions, of which four can be answered by the people who will be in the room. The other seven need the CFO, the VP Supply Chain or the AP lead, which is itself the finding: a call that produces a meeting with one of them has gone better than a call that produces seven half-answers. One of the four is a data request rather than a question, and it changes the register of the conversation, so it belongs at the end. It is also the most valuable thing to leave with, because every price in this dossier is modelled and the first one measured from their own data is the one that settles whether any of it is real.`}
      />

      <p className="text-small text-muted-foreground">
        Everything above traces back to {sources.length} sources.
      </p>
    </FullFrame>
  );
}

/**
 * One finding as a card, the same shape the gap detail uses: a hairline box, a
 * sentence-case label over a rule that bleeds to both edges, the body inside.
 *
 * Three numbered blocks running down one ground read as a wall of small grey
 * text with headings in it. Three boxes read as three answers, which is what
 * they are — and a consultant scanning them is looking for one, not reading all
 * three. Same argument the Gaps detail makes; one component so the two cannot
 * drift.
 */
function FindingCard({
  gap,
  n,
  showPrice = false,
  className,
}: {
  gap: Gap;
  n: number;
  showPrice?: boolean;
  className?: string;
}) {
  return (
    <li
      className={cn(
        "rounded-lg border border-border bg-card px-3 py-2 shadow-card sm:px-4 sm:py-2.5",
        className,
      )}
    >
      {/* **The title is a size above the body, not the same size in bold.**
          At `text-small` for both, the card had a heavier line and a lighter
          one rather than a heading and a paragraph — the eye had to read to
          find out which was which. `text-base` at 600 is one clear step, and
          the number drops to `text-micro` so it marks the card rather than
          competing with the thing it numbers. */}
      <div className="-mx-3 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-border px-3 pb-2.5 sm:-mx-4 sm:px-4 sm:pb-3">
        <span className="flex min-w-0 items-baseline gap-2.5">
          <span className="tabular shrink-0 text-micro text-muted-foreground">
            {String(n).padStart(2, "0")}
          </span>
          <span className="text-base font-semibold leading-snug text-foreground">
            {gap.title}
          </span>
        </span>
        {showPrice && gap.amountCr != null && (
          <span className="tabular shrink-0 text-small font-medium">{money(gap.amountCr)}</span>
        )}
      </div>
      {/* The restatement is what goes at 375, not a whole card. The title is
          already the problem in the client's words; this says it a second way,
          which is worth a line on a desk and is the first thing to lose on a
          screen that may not scroll. */}
      {/* 1.75, not `.reading`'s 1.6. These are three or four wrapped lines read
          in a corridor, and the leading is what carries them; Brief pays for it
          by dropping the restatement below `sm`. */}
      <p className="mt-3.5 hidden text-small leading-[1.75] text-muted-foreground sm:block">
        {gap.plainLine}
      </p>
      <p className="mt-3.5 text-small leading-[1.75] sm:mt-2">
        <span className="text-evidence" aria-hidden>
          →{" "}
        </span>
        <span className="sr-only">What we would do: </span>
        {gap.nextSteps[0]}
      </p>
    </li>
  );
}

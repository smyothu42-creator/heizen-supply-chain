"use client";

import { money } from "@/lib/format";
import {
  callBeats,
  company,
  gapById,
  stakeholders } from "@/lib/suvarna";
import { BriefFooter, BriefFrame, DocumentLead, FullFrame, Section , type SectionRef } from "./Frames";
import { Eyebrow } from "@/components/meridian/Primitives";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";
import { usePanel } from "@/components/meridian/EvidencePanel";

/* -------------------------------------------------------------------------- */
/* Direction 2 — Call-first                                                    */
/* The axis is the conversation, in order. Facts sit inside the moment of the   */
/* call where you would use them, not in sections of their own.                 */
/* -------------------------------------------------------------------------- */

/** The three things worth saying out loud, in the order you would say them. */
const RAISE = [
  {
    gapId: "g6",
    say: "Three weeks to onboard a supplier. What does the plant do while it waits?",
    who: "sh-rohan",
  },
  {
    gapId: "g2",
    say: "Fifty-eight percent first-time match. Who picks up the other forty-two?",
    who: "sh-anand",
  },
  {
    gapId: "g4",
    // "That is cash, not process" was exactly backwards — capturing the discount
    // gains margin and SPENDS cash. Said to a CFO it ends the meeting.
    say: "You have early-payment terms you almost never hit. Margin, but it costs cash to take.",
    who: "sh-meera",
  },
] as const;

const BRIEF_HEADLINE = (
  <p className="font-display text-h2 leading-[1.15]">
    They have grown 18% to ₹1,150 Cr on a procurement process that has not changed since 2019.
  </p>
);
const BRIEF_STANDFIRST = "Open with that. It is their own sentence, from Rohan's April email.";

export function CallBrief() {
  const { open } = usePanel();
  const met = stakeholders.filter((s) => s.met);
  const notMet = stakeholders.filter((s) => !s.met);

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
      <div className="flex shrink-0 items-center justify-between gap-4 rounded-md bg-muted px-3 py-1.5">
        <div>
          <div className="text-micro text-muted-foreground">
            Worth, if you are right
          </div>
          {/* Net, not the sum of the rows — and no one-off figure here. The
              beat below says explicitly that nothing with a rupee sign on it is
              said before minute 20; this chip is orientation, not a script. */}
          <div className="tabular text-lead font-medium">{money(company.netLeakageCr)} a year</div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-hidden">
        <Eyebrow>Raise these three, in this order</Eyebrow>
        <ol className="mt-1.5 space-y-2">
          {RAISE.map((item, i) => {
            const gap = gapById(item.gapId);
            const who = stakeholders.find((s) => s.id === item.who)!;
            return (
              <li key={item.gapId}>
                <button
                  type="button"
                  onClick={() => open({ kind: "gap", id: gap.id })}
                  className="group flex w-full items-start gap-2.5 text-left"
                >
                  <span className="tabular mt-[3px] text-small font-medium text-muted-foreground">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-base leading-snug transition-colors group-hover:text-muted-foreground">
                      {item.say}
                    </span>
                    <span className="mt-0.5 flex items-baseline justify-between gap-3">
                      <span className="truncate text-small text-muted-foreground">
                        {who.name} · {who.role}
                        {!who.met && " · not met"}
                      </span>
                      <span className="tabular shrink-0 text-small text-muted-foreground">
                        {money(gap.amountCr)}
                      </span>
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Call's left end is who is in the room: the one thing you check last
          before dialling. */}
      <BriefFooter
        href="/research/call/full"
        left={
          <p className="text-small text-muted-foreground">
            <span className="text-foreground">Met:</span> {met.map((s) => s.name).join(", ")}.{" "}
            <span className="text-foreground">Not met:</span> {notMet.map((s) => s.name).join(", ")}
            .
          </p>
        }
      >
        Full call plan
      </BriefFooter>
    </BriefFrame>
  );
}

/* -------------------------------------------------------------------------- */

/* The headings this view renders, for the navigator beside it. Built from the
   same ids the sections carry, so a heading cannot be missing from the list. */
const CALL_SECTIONS: SectionRef[] = [
  { id: "if-asked", label: "If they ask" },
];

/* One line per beat saying what actually happens in it, beyond the intent.
   The beat's questions and gaps used to sit under the heading; with the body
   gone the paragraph has to carry what the consultant is meant to do. */
const BEAT_NOTE: Record<string, string> = {
  "beat-open":
    "Say their own sentence back to them: they have grown 18% to \u20b91,150 Cr on a process that has not changed since 2019. It came from Rohan's April email, so it cannot be argued with, and it frames everything after it without presenting anything.",
  "beat-establish":
    "Two specifics, not a summary. Onboarding a supplier takes about three weeks, and three-way match fails on 42% of invoices. Both are theirs rather than ours, and both are the kind of number a room only hears from somebody who did the reading.",
  "beat-probe":
    "Four questions can be answered by the people in this room. The other seven need Meera, Vikram or Anand, and getting a meeting with one of them is a better outcome from today than any answer Rohan can give you. One of the four is a data request rather than a question, which changes the register of the call, so leave it until the end of the beat.",
  "beat-land":
    "Two gaps out loud, priced, and not twelve. Vendor onboarding at three weeks and the match failure at 42% are the pair: one is felt by the plant, the other by finance, and between them they name both halves of the room. Everything else is on the page for when it is asked for.",
  "beat-next":
    "One commitment and one data request. The commitment is a second meeting with somebody who is not in this room. The request is the spend cube, because every price on this page is modelled and the first one measured from their own data is the one that ends the argument about whether any of it is real.",
};
const beatNote = (id: string) => BEAT_NOTE[id] ?? "";

export function CallFull() {
  return (
    <FullFrame
      sections={CALL_SECTIONS}
      actions={<RunButton label="Run research" />}
      hero={<SurfaceHero title="Research" />}
    >
      <DocumentLead
        title="The next 30 minutes"
        standfirst="Arranged by when you would use it, not by what kind of thing it is."
      />


      {callBeats.map((beat) => (
        <Section
          key={beat.id}
          id={beat.id}
          title={beat.phase}
          summary={`${beat.intent} ${beatNote(beat.id)}`}
          right={<span className="tabular">{beat.minutes}</span>}
      />
      ))}

      <Section
        id="if-asked"
        title="If they ask"
        summary={`Facts that belong to no moment in the call, kept findable for when somebody asks out of order. ${money(company.revenueCr)} of revenue in FY25, up 18%, on a procurement process that has not changed since 2019. Nine people in accounts payable clearing about 96,000 invoices a year, which is benchmark headcount rather than overstaffing. Three plants, and not one question asked about any of them. If the room goes somewhere the plan did not, these are the numbers that keep you in the conversation rather than promising to come back with them.`}
      />
    </FullFrame>
  );
}

"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { money, pluralise } from "@/lib/format";
import {
  DOMAIN_LABEL,
  LENS_LABEL,
  TIER_NAME,
  businessContext,
  businessFactById,
  company,
  coverage,
  gaps,
  gapsForStakeholder,
  headlineFacts,
  pricedGaps,
  questionChildren,
  questions,
  stakeholderById,
  dealRisks,
  focusScope,
  questionDomains,
  sequenceWaves,
  systemSplit,
  systemsByState,
  techSystems,
  timingSignals,
  urgency,
  valueForStakeholder,
  valueForSystem,
  type Gap,
  type Question,
  type FocusScope,
  type QuestionDomain,
} from "@/lib/suvarna";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { StickyBar } from "@/components/shell/StickyBar";
import { SelectField } from "@/components/shell/SelectField";
import { SwitchTrack, switchItemClass } from "@/components/shell/SwitchTrack";
import { Panel } from "@/components/meridian/Primitives";
import { ConfidenceBadge } from "@/components/meridian/Confidence";
import { ArrowIcon, ChevronIcon } from "@/components/meridian/Icons";
import { nodes } from "@/lib/canvas";
import { reusedGaps, reusedValueCr } from "@/lib/compare";

/**
 * Prep — everything you need before a first discovery call, in about fifteen
 * minutes, without opening the dossier.
 *
 * **The problem this fixes.** Every one of these facts already exists in the
 * product, and every one of them is on a different screen: the company on
 * Research › About, the person on Research › Stakeholder, the estate on
 * Research › Tech stack, the findings on Gaps, the openers on Questions. A
 * consultant with four minutes and a call about to start does not assemble a
 * briefing out of five surfaces. He reads the first thing he lands on and goes
 * in with that.
 *
 * So this is not a tenth direction and not a summary of the dossier. It is the
 * **order in which those five screens answer one question**, which is *what do
 * I say on this call*, with each one cut down to the two or three lines that
 * change what he says.
 *
 * **Three reads, and the whole surface is built on them (§7.1).**
 *
 * 1. Six headings and the opening card. About three minutes, and it is enough
 *    to walk into the room with.
 * 2. The three or four lines every block shows at rest. About fifteen minutes
 *    for all six, which is the budget this screen was asked for.
 * 3. The drill-down inside each block, and then the surface that owns it. No
 *    limit, and nobody does it before a call.
 *
 * **The minute marks are the contract, not decoration.** A time-poor reader's
 * first question is not "what does this say", it is "can I finish it". Saying
 * so per block is what lets him skip the two he does not need rather than
 * abandoning the screen at block three.
 *
 * **Nothing here is authored twice.** Every line is read off the same data the
 * owning surface renders, so a prep card cannot go stale against the dossier it
 * summarises. Where a block needs a judgement the data does not carry, the
 * judgement is a sort rather than a sentence.
 */

/** Who a first discovery call is with. Same convention as Stakeholder Brief:
 *  the Head of Procurement, because that is who takes this meeting. */
const PERSON = stakeholderById("sh-rohan");

/**
 * The findings most likely to be true, not the largest.
 *
 * "Probable" is the word that matters on a first call: saying a ₹2.1 Cr number
 * that rests on one remark in one call is how a consultant loses the room.
 * Confirmed first, then inferred, then by value inside each. It is a sort and
 * not a filter, so nothing is hidden, and the tier word travels with every row
 * so the ordering is legible rather than mysterious.
 */
const TIER_RANK = { confirmed: 0, inferred: 1, unverified: 2 } as const;
const LIKELY = [...pricedGaps].sort(
  (a, b) => TIER_RANK[a.tier] - TIER_RANK[b.tier] || (b.amountCr ?? 0) - (a.amountCr ?? 0),
);

/** Everything the client does not have software for, biggest first. This is the
 *  shape of the spend: a workaround or a missing system is a thing to build. */
const OUTSIDE = [...systemsByState("workaround"), ...systemsByState("missing")].sort(
  (a, b) => valueForSystem(b.id) - valueForSystem(a.id),
);

/** Today's call, in tree order. The openers come first by construction. */
const TODAY = questions
  .filter((q) => q.askWhen !== "after-this-call")
  .sort((a, b) => a.askOrder - b.askOrder);

const HEADLINE_IDS = new Set(headlineFacts.map((f) => f.id));
const REST_FACTS = businessContext
  .flatMap((g) => g.facts)
  .filter((f) => !HEADLINE_IDS.has(f.id));

const MINUTES = [2, 3, 4, 3, 3, 2, 2];
const TOTAL_MINUTES = MINUTES.reduce((a, b) => a + b, 0);

/**
 * The three stages, and they are deliberately not the same screen.
 *
 * An introductory call and a second discovery call are different jobs. The
 * first is a fifteen-minute skim by somebody who has never spoken to this
 * company: broad, scannable, one line per subject. The second is a working
 * session with a person who has already answered the openers: fewer subjects,
 * far more depth on each, and questions that go where the first call's answers
 * pointed. Account expansion is a third thing again, months later, and is about
 * what nobody has looked at rather than about the call at all.
 *
 * Giving all three the same six cards would make two of them wrong. So the
 * stage changes the *structure*, not just the contents: first call is a grid of
 * short blocks, second call is a working sheet with a verify list and a split
 * question set, expansion is a map of what is left.
 */
type Stage = "first" | "second" | "expansion";

const STAGE_LABEL: Record<Stage, string> = {
  first: "First call",
  second: "Second call",
  expansion: "Expansion",
};

export function PrepView() {
  const [stage, setStage] = useState<Stage>("first");
  /**
   * Restructure the whole surface around one part of the business.
   *
   * The ask was "let me look at just procurement", and it has to hold across
   * every stage rather than being a filter on one list: with a focus set, the
   * findings, the systems and the questions on screen are all the ones that
   * part of the business owns. `focusScope` walks questions to gaps to systems
   * off links that already exist, so nothing here needs a taxonomy of its own.
   */
  const [focus, setFocus] = useState<QuestionDomain | null>(null);
  const scope = focus ? focusScope(focus) : null;

  return (
    <>
      <SurfaceHero title="Prep" />

      <StickyBar className="pt-5 pb-3">
        <div className="flex flex-wrap items-stretch gap-x-6 gap-y-3">
          <SwitchTrack label="Stage" className="self-end">
            {(["first", "second", "expansion"] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={stage === v}
                onClick={() => setStage(v)}
                className={switchItemClass(stage === v)}
              >
                {STAGE_LABEL[v]}
              </button>
            ))}
          </SwitchTrack>
          <span className="hidden w-px shrink-0 self-stretch bg-border sm:block" aria-hidden />
          <SelectField
            label="Focus"
            value={focus ?? "all"}
            onChange={(v) => setFocus(v === "all" ? null : (v as QuestionDomain))}
            options={[
              ["all", "Whole business"],
              ...questionDomains().map((d) => [d, DOMAIN_LABEL[d]] as [string, string]),
            ]}
          />
        </div>
      </StickyBar>

      <div className="surface-frame under-bar pb-5">
        {stage === "first" ? (
          <FirstCall scope={scope} />
        ) : stage === "second" ? (
          <SecondCall scope={scope} />
        ) : (
          <Expansion scope={scope} />
        )}
      </div>
    </>
  );
}

/* ------------------------------------------------------------- first call */

function FirstCall({ scope }: { scope: FocusScope | null }) {
  const likely = scope ? LIKELY.filter((g) => scope.gapIds.includes(g.id)) : LIKELY;
  const outside = scope ? OUTSIDE.filter((s) => scope.systemIds.includes(s.id)) : OUTSIDE;
  const today = scope ? TODAY.filter((q) => scope.questionIds.includes(q.id)) : TODAY;
  const stateNames = (state: Parameters<typeof systemsByState>[0]) =>
    systemsByState(state)
      .filter((s) => !scope || scope.systemIds.includes(s.id))
      .map((s) => s.name)
      .join(", ") || "None in this focus";

  return (
    <>
        {/* ------------------------------------------------ the opening card */}
        {/* The first read, and the only thing on this surface that is not a
            block: who the call is with, the one sentence to open on, and what
            the rest of the screen costs in minutes. */}
        <Panel>
          <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
            <h2 className="text-lead font-medium">
              {PERSON.name}
              <span className="ml-2 text-small font-normal text-muted-foreground">
                {PERSON.role} · {company.name}
              </span>
            </h2>
            <span className="tabular shrink-0 text-small text-muted-foreground">
              {TOTAL_MINUTES} minutes, all {MINUTES.length}
            </span>
          </div>

          {/* The sentence he says first. It is the most decision-useful string
              in the product and it was two clicks into one direction. */}
          <p className="reading measure-lead mt-2.5 text-lead leading-snug">
            {PERSON.openingLine}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2">
            <ConfidenceBadge level={company.confidence} showReason={false} />
            <span className="text-small text-muted-foreground">
              Researched {company.researchedOn}
            </span>
            {/* Stated once, at the top, because it is the sentence that decides
                how the six blocks below may be used out loud (§7.5). */}
            <span className="text-small text-muted-foreground">
              No ERP data yet, so every figure here is modelled
            </span>
          </div>
        </Panel>

        {/* ------------------------------------------------------ the blocks */}
        {/* Two columns from `lg`, `items-start` so opening one block grows its
            own column rather than the row it is in. The order is the order of
            the call: who they are, who you are meeting, what is wrong, what it
            runs on, what we would build, what to ask. */}
        <div className="mt-4 grid items-start gap-4 lg:grid-cols-2">
          <PrepCard
            n={1}
            minutes={MINUTES[0]}
            title="The company"
            /* "The other N", not "All N". The four above stay on screen when
               this opens, so a drill-down repeating them would show the same
               fact twice a hand's width apart. Same phrasing as the findings
               block, which had the problem first. */
            more={`The other ${REST_FACTS.length} facts`}
            href="/research/context/full"
            hrefLabel="Business context"
          >
            <p className="reading text-small text-muted-foreground">{company.sector}.</p>
            <FactList facts={headlineFacts} />
            <Detail>
              {businessContext.map((group) => {
                const rest = group.facts.filter((f) => !HEADLINE_IDS.has(f.id));
                if (rest.length === 0) return null;
                return (
                  <div key={group.id} className="mt-3 first:mt-0">
                    <p className="text-micro font-medium text-muted-foreground">{group.title}</p>
                    <FactList facts={rest} />
                  </div>
                );
              })}
            </Detail>
          </PrepCard>

          <PrepCard
            n={2}
            minutes={MINUTES[1]}
            title="Who you are meeting"
            more="What he is measured on"
            href="/research/stakeholder/full"
            hrefLabel="Stakeholder"
          >
            <p className="reading text-small">
              <span className="font-medium text-health-watch">Do not: </span>
              <span className="text-muted-foreground">{PERSON.avoid}</span>
            </p>
            <dl className="mt-2.5 divide-y divide-border border-t border-border">
              <Row label="Owns">{PERSON.owns.join(", ")}</Row>
              <Row label="His share of the findings">
                {money(valueForStakeholder(PERSON.id))} across{" "}
                {pluralise(gapsForStakeholder(PERSON.id).length, "finding", "findings")}
              </Row>
              <Row label="Met">{PERSON.met ? "Twice, on both discovery calls" : "Not yet"}</Row>
            </dl>
            <Detail>
              <p className="text-micro font-medium text-muted-foreground">Measured on</p>
              <ul className="reading mt-1 list-disc space-y-0.5 pl-4 text-small text-muted-foreground">
                {PERSON.measuredOn.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
            </Detail>
          </PrepCard>

          <PrepCard
            n={3}
            minutes={MINUTES[2]}
            title="What is probably wrong"
            more={`The other ${Math.max(0, likely.length - 3)} findings`}
            href="/gaps"
            hrefLabel="Gaps"
          >
            <p className="reading text-small text-muted-foreground">
              Confirmed first, then inferred. The order is how sure we are, not how big it
              is.
            </p>
            <ul className="mt-2.5 divide-y divide-border border-t border-border">
              {likely.slice(0, 3).map((g) => (
                <GapLine key={g.id} gap={g} />
              ))}
            </ul>
            <Detail>
              <ul className="divide-y divide-border border-t border-border">
                {likely.slice(3).map((g) => (
                  <GapLine key={g.id} gap={g} />
                ))}
              </ul>
              {/* §7.14. A list of what is wrong is only a list of what was
                  looked at, and on a first call the thing not looked at is
                  usually the thing they will ask about. */}
              <p className="reading mt-3 text-small text-muted-foreground">
                Not looked at:{" "}
                {coverage
                  .filter((c) => c.state === "not-researched")
                  .map((c) => c.stage)
                  .join(" and ")}
                . They run three plants and nobody has asked about them.
                {/* The list above is the priced findings. Saying how many are
                    not priced is cheaper than explaining later why the count
                    here and the count on Gaps disagree. */}
                {gaps.length > LIKELY.length &&
                  ` ${pluralise(gaps.length - LIKELY.length, "finding is", "findings are")} not priced yet.`}
              </p>
            </Detail>
          </PrepCard>

          <PrepCard
            n={4}
            minutes={MINUTES[3]}
            title="What they run on"
            more="All nine systems"
            href="/research/tech/full"
            hrefLabel="Tech stack"
          >
            <p className="reading text-small">
              {company.erp}. {businessFactById("bf-erp").detail}
            </p>
            <dl className="mt-2.5 divide-y divide-border border-t border-border">
              <Row label="Live">{stateNames("live")}</Row>
              <Row label="Worked around">{stateNames("workaround")}</Row>
              <Row label="Not bought at all">{stateNames("missing")}</Row>
            </dl>
            <Detail>
              <ul className="space-y-2.5">
                {outside.map((s) => (
                  <li key={s.id}>
                    <p className="text-small font-medium">{s.name}</p>
                    <p className="reading text-small text-muted-foreground">{s.fallsTo}</p>
                  </li>
                ))}
              </ul>
            </Detail>
          </PrepCard>

          <PrepCard
            n={5}
            minutes={MINUTES[4]}
            title="Where they would spend"
            more="What sits behind each"
            href="/research/spend/full"
            hrefLabel="Idea Build"
          >
            {/* The spend question, answered the only honest way it can be from
                this data: the money is where the software is not. */}
            <p className="reading text-small text-muted-foreground">
              {money(systemSplit.outsideValue)} of the {money(company.grossLeakageCr)} sits
              on work no system does today. Everything Heizen would build goes on top of{" "}
              {company.erp}, so there is no new ERP in this conversation.
            </p>
            <ul className="mt-2.5 divide-y divide-border border-t border-border">
              {outside.slice(0, 3).map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2"
                >
                  <span className="min-w-0 flex-1 text-small">
                    {s.name}
                    <span className="block text-micro text-muted-foreground">{s.does}</span>
                  </span>
                  <span className="tabular shrink-0 text-small font-medium">
                    {money(valueForSystem(s.id))}
                  </span>
                </li>
              ))}
            </ul>
            <Detail>
              <ul className="divide-y divide-border border-t border-border">
                {outside.slice(3).map((s) => (
                  <li
                    key={s.id}
                    className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2"
                  >
                    <span className="min-w-0 flex-1 text-small">
                      {s.name}
                      <span className="block text-micro text-muted-foreground">{s.does}</span>
                    </span>
                    <span className="tabular shrink-0 text-small font-medium">
                      {money(valueForSystem(s.id))}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="reading mt-3 text-small text-muted-foreground">
                The other {money(systemSplit.insideValue)} is inside SAP already, which is
                configuration and process rather than a build.
              </p>
            </Detail>
          </PrepCard>

          <PrepCard
            n={6}
            minutes={MINUTES[5]}
            title="What to ask first"
            more={`The other ${Math.max(0, today.length - 2)} for today`}
            href="/questions"
            hrefLabel="Questions"
          >
            <p className="reading text-small text-muted-foreground">
              Open broad and let his answer choose the next one.
            </p>
            <ol className="mt-2.5 divide-y divide-border border-t border-border">
              {today.slice(0, 2).map((q) => (
                <QuestionLine key={q.id} question={q} />
              ))}
            </ol>
            <Detail>
              <ol className="divide-y divide-border border-t border-border">
                {today.slice(2).map((q) => (
                  <QuestionLine key={q.id} question={q} />
                ))}
              </ol>
            </Detail>
          </PrepCard>

          {/* Seventh block, and the only one that is not about the client's
              operation: it is about whether this is worth doing now. The
              signals are read off the company rather than off the findings, so
              this is the one block that survives a first call where nothing has
              been shared. It carries no rupee figure: the money is Money's, and
              a total here would be the fourth place ₹9.7 Cr appears. */}
          <PrepCard
            n={7}
            minutes={MINUTES[6]}
            title="Why now, and what they are buying"
            more="All six signals"
            href="/gaps"
            hrefLabel="Gaps"
          >
            <p className="reading text-small">
              <span className="font-medium">{urgency.verdict}. </span>
              <span className="text-muted-foreground">{urgency.window}.</span>
            </p>
            <ul className="mt-2.5 divide-y divide-border border-t border-border">
              {timingSignals
                .filter((t) => t.push === "accelerates")
                .slice(0, 3)
                .map((t) => (
                  <li key={t.id} className="py-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                      <span className="text-small font-medium">{t.label}</span>
                      <span className="tabular shrink-0 text-micro text-muted-foreground">
                        {t.value}
                      </span>
                    </div>
                    <p className="reading text-small text-muted-foreground">{t.soWhat}</p>
                  </li>
                ))}
            </ul>
            <Detail>
              <ul className="divide-y divide-border border-t border-border">
                {timingSignals
                  .filter((t) => t.push !== "accelerates")
                  .map((t) => (
                    <li key={t.id} className="py-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                        <span className="text-small font-medium">{t.label}</span>
                        <span className="tabular shrink-0 text-micro text-health-watch">
                          pushes it out
                        </span>
                      </div>
                      <p className="reading text-small text-muted-foreground">{t.soWhat}</p>
                    </li>
                  ))}
              </ul>
              <p className="reading mt-3 text-small text-muted-foreground">{urgency.against}</p>
            </Detail>
          </PrepCard>
        </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * One block: a numbered heading, a minute mark, three or four lines at rest,
 * and two ways deeper.
 *
 * **The drill-down is inside the card and the link is out of it**, and the two
 * are different reads rather than two routes to the same place. The disclosure
 * holds the rest of *this* block, which is what a consultant wants when one
 * block turns out to matter. The link goes to the surface that owns the
 * subject, which is where he goes when the whole call turns out to be about it.
 *
 * `children` carries both: everything before the `<Detail>` is the resting
 * state, and `<Detail>` is what the button opens. That keeps each block's
 * content in one place in the source rather than split across two props, which
 * is where the two would drift out of order.
 */
function PrepCard({
  n,
  minutes,
  title,
  more,
  href,
  hrefLabel,
  children,
}: {
  /** The reading order, on the stage that has one. The second call and the
   *  expansion view are not a sequence, so their blocks carry no number and no
   *  minute mark: both would be claiming a pace those stages do not have. */
  n?: number;
  minutes?: number;
  title: string;
  /** Names what is behind the disclosure. "More" tells the reader nothing about
   *  whether it is worth the click, which is the whole decision he is making. */
  more: string;
  href: string;
  hrefLabel: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();

  return (
    // No `h-full` on the card. A percentage height on a grid item resolves
    // against the grid *area*, which is as tall as the tallest card in the row,
    // so `h-full` stretched the short ones and parked their footers 120px below
    // their last line even with `items-start` on the grid. Content height, and
    // the two columns are allowed to disagree.
    <Panel>
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 className="flex items-baseline gap-2.5 text-base font-medium">
          {/* The number is the reading order, and it is what makes the seven a
              sequence rather than a dashboard of tiles. */}
          {n != null && <span className="tabular text-small text-muted-foreground">{n}</span>}
          {title}
        </h2>
        {minutes != null && (
          <span className="tabular shrink-0 text-micro text-muted-foreground">{minutes} min</span>
        )}
      </div>

      <div className="mt-2">
        <PrepBody open={open} id={id}>
          {children}
        </PrepBody>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border pt-2.5">
        <button
          type="button"
          aria-expanded={open}
          /* Only while it exists. The detail is mounted rather than hidden, so
             pointing `aria-controls` at it when shut names an element that is
             not in the document. */
          aria-controls={open ? id : undefined}
          onClick={() => setOpen((v) => !v)}
          className="group flex items-center gap-1.5 text-small text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronIcon className={cn("transition-transform", open && "rotate-90")} />
          {open ? "Less" : more}
        </button>
        <Link
          href={href}
          className="flex items-center gap-1.5 text-small text-evidence transition-colors hover:text-foreground"
        >
          {hrefLabel}
          <ArrowIcon />
        </Link>
      </div>
    </Panel>
  );
}

/**
 * Splits a block's children into what shows at rest and what the button opens.
 *
 * `<Detail>` is a marker rather than a wrapper that renders anything of its
 * own: the card walks its children, keeps everything before it, and puts
 * whatever is inside it behind the disclosure. The alternative is a second prop
 * holding the deep half, and two props whose contents have to stay in the same
 * order as each other is exactly how a block ends up with its summary
 * describing last week's detail.
 */
function Detail({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

function PrepBody({ open, id, children }: { open: boolean; id: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children : [children];
  const rest = items.filter(
    (c) => !(c && typeof c === "object" && "type" in c && c.type === Detail),
  );
  const deep = items.filter(
    (c) => c && typeof c === "object" && "type" in c && c.type === Detail,
  );

  return (
    <>
      {rest}
      {/* Mounted only when open. A `hidden` block would keep its links in the
          tab order and its text in the accessibility tree, which is the thing
          `check:density` cannot see and a screen-reader user cannot escape. */}
      {open && (
        <div id={id} className="mt-3 border-t border-border pt-3">
          {deep}
        </div>
      )}
    </>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2">
      <dt className="shrink-0 text-small text-muted-foreground">{label}</dt>
      <dd className="reading min-w-0 text-right text-small">{children}</dd>
    </div>
  );
}

function FactList({ facts }: { facts: { id: string; label: string; value: string }[] }) {
  return (
    <dl className="mt-2.5 divide-y divide-border border-t border-border">
      {facts.map((f) => (
        <div key={f.id} className="flex items-baseline justify-between gap-3 py-2">
          <dt className="min-w-0 text-small text-muted-foreground">{f.label}</dt>
          <dd className="tabular shrink-0 text-small font-medium">{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A finding, as one line: what it is in plain words, how sure we are, and what
 * it is worth. The tier word rather than a chip, because three chips down a
 * card this size read as a second column of furniture.
 */
function GapLine({ gap }: { gap: Gap }) {
  return (
    <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5 py-2">
      <span className="min-w-0 flex-1 text-small">
        {gap.plainLine}
        <span className="block text-micro text-muted-foreground capitalize">{gap.tier}</span>
      </span>
      <span className="tabular shrink-0 text-small font-medium">{money(gap.amountCr)}</span>
    </li>
  );
}

/**
 * A question, with the tier word or the condition that leads to it. The
 * follow-up logic travels with the question here for the same reason it does on
 * Questions: an opener with no "and then what" is half a plan.
 */
function QuestionLine({ question }: { question: Question }) {
  const next = questionChildren(question.id).length;
  return (
    <li className="py-2">
      <p className="text-micro text-muted-foreground">
        {question.tier === 1 ? (
          TIER_NAME[1]
        ) : (
          <>
            <span className="font-medium">If</span> {question.askIf}
          </>
        )}
      </p>
      <p className="reading mt-0.5 text-small">{question.text}</p>
      {next > 0 && (
        <p className="mt-0.5 text-micro text-muted-foreground">
          {pluralise(next, "follow-up", "follow-ups")} behind it
        </p>
      )}
    </li>
  );
}

/* ------------------------------------------------------------ second call */

/**
 * A second discovery call is not a longer first call.
 *
 * By the time this one is booked the openers have been answered, so the job has
 * changed from *learn who they are* to *test what we think we heard*. That is a
 * different shape: fewer subjects, much more on each, and a question set split
 * by what kind of answer it is after rather than by when to ask it.
 *
 * **No minute marks here.** A second call is in the diary for an hour and this
 * screen is read while it runs, so a budget on each block would be measuring
 * the wrong thing.
 */
function SecondCall({ scope }: { scope: FocusScope | null }) {
  const later = questions
    .filter((q) => q.askWhen === "after-this-call")
    .filter((q) => !scope || scope.questionIds.includes(q.id))
    .sort((a, b) => a.askOrder - b.askOrder);
  const business = later.filter((q) => q.lens === "business");
  const technical = later.filter((q) => q.lens === "technical");

  /* What we think is happening, and what would prove it. Sorted like the first
     call's list, but showing the whole of each finding rather than one line:
     this is the stage where the hypothesis and the open question matter more
     than the price. */
  const toTest = (scope ? LIKELY.filter((g) => scope.gapIds.includes(g.id)) : LIKELY).slice(0, 4);

  const systems = techSystems.filter((s) => !scope || scope.systemIds.includes(s.id));
  const incumbent = dealRisks.find((r) => r.id === "r-incumbent");

  return (
    <div className="space-y-4">
      <Panel>
        <h2 className="text-lead font-medium">The second conversation</h2>
        <p className="reading measure mt-1.5 text-small text-muted-foreground">
          The openers have been answered. This call is for testing what we think we heard
          and getting the two or three numbers that turn a modelled figure into theirs.
          Everything below is one level deeper than the first-call view on purpose.
        </p>
      </Panel>

      {/* ---------------------------------------------- what we are testing */}
      <PrepCard
        title="What we think is happening, and what would settle it"
        more="Where each one came from"
        href="/gaps"
        hrefLabel="Gaps"
      >
        <ul className="divide-y divide-border">
          {toTest.map((g) => (
            <li key={g.id} className="py-3 first:pt-0">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-0.5">
                <h3 className="min-w-0 flex-1 text-base font-medium">{g.plainLine}</h3>
                <span className="tabular shrink-0 text-small text-muted-foreground capitalize">
                  {g.tier}
                </span>
              </div>
              {/* The hypothesis is the sentence a consultant has to be able to
                  say when asked "how come?", and it is the whole difference
                  between a finding read off a list and a finding understood. */}
              <p className="reading mt-1 text-small">
                <span className="text-muted-foreground">Why it happens: </span>
                {g.hypothesis}
              </p>
              <p className="reading mt-1 text-small">
                <span className="font-medium text-health-watch">Still unknown: </span>
                <span className="text-muted-foreground">{g.stillUnknown.join(" ")}</span>
              </p>
            </li>
          ))}
        </ul>
        <Detail>
          <ul className="space-y-2">
            {toTest.map((g) => (
              <li key={g.id} className="reading text-small text-muted-foreground">
                <span className="text-foreground">{g.plainLine}</span> rests on{" "}
                {pluralise(g.evidence.length, "source", "sources")}. Next:{" "}
                {g.nextSteps[0]}
              </li>
            ))}
          </ul>
        </Detail>
      </PrepCard>

      {/* ------------------------------------------- questions, split by lens */}
      {/* Two columns, because the two kinds of question are asked differently
          and often of different people. Three technical questions in a row is
          how a discovery call turns into a systems interview and the business
          owner stops recognising it as being about his problem. */}
      <div className="grid items-start gap-4 lg:grid-cols-2">
        <PrepCard
          title={LENS_LABEL.business}
          more="What a weak answer sounds like"
          href="/questions"
          hrefLabel="Questions"
        >
          <p className="reading text-small text-muted-foreground">
            What it costs them, in their words. Ask these of whoever owns the number.
          </p>
          <QuestionGroups list={business} />
          <Detail>
            <ul className="space-y-2">
              {business.slice(0, 3).map((q) => (
                <li key={q.id} className="reading text-small">
                  <span className="text-muted-foreground">Weak answer: </span>
                  {q.badAnswer}
                </li>
              ))}
            </ul>
          </Detail>
        </PrepCard>

        <PrepCard
          title={LENS_LABEL.technical}
          more="What a weak answer sounds like"
          href="/questions"
          hrefLabel="Questions"
        >
          <p className="reading text-small text-muted-foreground">
            How it actually works. These need somebody who touches the system, not the
            person who owns the budget.
          </p>
          <QuestionGroups list={technical} />
          <Detail>
            <ul className="space-y-2">
              {technical.slice(0, 3).map((q) => (
                <li key={q.id} className="reading text-small">
                  <span className="text-muted-foreground">Weak answer: </span>
                  {q.badAnswer}
                </li>
              ))}
            </ul>
          </Detail>
        </PrepCard>
      </div>

      {/* ------------------------------------- the estate and who else is in it */}
      <PrepCard
        title="The estate, and who else is in the room"
        more="What every system falls to"
        href="/research/tech/full"
        hrefLabel="Tech stack"
      >
        <table className="w-full text-small">
          <caption className="sr-only">Systems, who supplies them, and their state</caption>
          <thead>
            <tr className="text-micro text-muted-foreground">
              <th scope="col" className="pb-1 text-left font-medium">System</th>
              <th scope="col" className="pb-1 text-left font-medium">Supplied by</th>
              <th scope="col" className="pb-1 text-right font-medium">State</th>
            </tr>
          </thead>
          <tbody>
            {systems.map((s) => (
              <tr key={s.id} className="border-t border-border">
                <th scope="row" className="py-1.5 pr-3 text-left font-normal">{s.name}</th>
                <td className="py-1.5 pr-3 text-muted-foreground">{s.vendor}</td>
                <td className="py-1.5 text-right text-muted-foreground">
                  {s.state === "live" ? "Live" : s.state === "workaround" ? "Worked around" : "Not bought"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {incumbent && (
          <div className="mt-3 rounded-lg border border-border bg-muted px-3.5 py-3">
            <p className="text-small font-medium">
              {incumbent.label}: {incumbent.value}
            </p>
            <p className="reading mt-1 text-small text-muted-foreground">{incumbent.risk}</p>
            <p className="reading mt-1.5 text-small">
              <span className="font-medium">Say: </span>
              {incumbent.counter}
            </p>
          </div>
        )}
        <Detail>
          <ul className="space-y-2">
            {systems
              .filter((s) => s.fallsTo)
              .map((s) => (
                <li key={s.id} className="reading text-small text-muted-foreground">
                  <span className="text-foreground">{s.name}: </span>
                  {s.fallsTo}
                </li>
              ))}
          </ul>
        </Detail>
      </PrepCard>
    </div>
  );
}

/** Questions grouped under their domain, with the follow-up condition on each.
 *  Grouping is what stops eleven rows reading as one undifferentiated list. */
function QuestionGroups({ list }: { list: Question[] }) {
  const domains = [...new Set(list.map((q) => q.domain))];
  if (list.length === 0) {
    return <p className="mt-2.5 text-small text-muted-foreground italic">None in this focus.</p>;
  }
  return (
    <div className="mt-2.5 space-y-3">
      {domains.map((d) => (
        <div key={d}>
          <p className="text-micro font-medium text-muted-foreground">{DOMAIN_LABEL[d]}</p>
          <ol className="divide-y divide-border border-t border-border">
            {list
              .filter((q) => q.domain === d)
              .map((q) => (
                <QuestionLine key={q.id} question={q} />
              ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

/* -------------------------------------------------------------- expansion */

/**
 * Months later, and a different question again: not what to say on a call but
 * where the next piece of work is.
 *
 * Everything here is an argument from *absence*, which is why it is its own
 * stage rather than a longer findings list. The three things that grow an
 * account are the parts of the operation nobody has looked at, the findings
 * that were never in the first plan, and the work we have already delivered
 * elsewhere that they have not bought yet.
 */
function Expansion({ scope }: { scope: FocusScope | null }) {
  const thin = coverage.filter((c) => c.state !== "researched");
  const waves = sequenceWaves(gaps.map((g) => g.id));
  const laterWaves = waves.slice(1).flat();
  const later = gaps
    .filter((g) => laterWaves.includes(g.id))
    .filter((g) => !scope || scope.gapIds.includes(g.id));
  const blank = nodes.filter((n) => n.level === 2 && n.completeness === "none");
  const reused = reusedGaps();

  return (
    <div className="space-y-4">
      <Panel>
        <h2 className="text-lead font-medium">Where the next piece of work is</h2>
        <p className="reading measure mt-1.5 text-small text-muted-foreground">
          Everything on this stage is an argument from absence: the stages nobody has
          researched, the findings that never made the first plan, and the processes on the
          map with nothing behind them. It is read months after the first two, and none of
          it needs a call to be true.
        </p>
      </Panel>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <PrepCard
          title="What nobody has looked at"
          more="Every stage and its state"
          href="/research/company/full"
          hrefLabel="Coverage"
        >
          <p className="reading text-small text-muted-foreground">
            A total is only a total of what was researched. This is the rest of that
            sentence, and it is the whole expansion argument.
          </p>
          <ul className="mt-2.5 divide-y divide-border border-t border-border">
            {thin.map((c) => (
              <li key={c.stage} className="py-2">
                <div className="flex flex-wrap items-baseline justify-between gap-x-4">
                  <span className="text-small font-medium">{c.stage}</span>
                  <span className="shrink-0 text-micro text-health-watch">
                    {c.state === "not-researched" ? "Not looked at" : "Thin"}
                  </span>
                </div>
                {c.unclaimedRange && (
                  <p className="reading text-small text-muted-foreground">{c.unclaimedRange}</p>
                )}
              </li>
            ))}
          </ul>
          <Detail>
            <ul className="space-y-2">
              {thin.map((c) => (
                <li key={c.stage} className="reading text-small text-muted-foreground">
                  <span className="text-foreground">{c.stage}: </span>
                  {c.line}
                </li>
              ))}
            </ul>
          </Detail>
        </PrepCard>

        <PrepCard
          title="Blank on the map"
          more="Which processes"
          href="/operations"
          hrefLabel="Operations"
        >
          {/* The canvas earns its place here rather than on a call screen: a
              level-2 process with no evidence is a place to send the next
              piece of research, which is exactly what an expansion
              conversation is short of. */}
          <p className="reading text-small text-muted-foreground">
            {pluralise(blank.length, "process has", "processes have")} nothing behind
            {blank.length === 1 ? " it" : " them"} on the map. Each one is a place the next
            engagement could start, and none of them is a finding yet.
          </p>
          <ul className="mt-2.5 divide-y divide-border border-t border-border">
            {blank.slice(0, 5).map((n) => (
              <li key={n.id} className="py-2 text-small">
                {n.name}
                <span className="block text-micro text-muted-foreground">{n.plainLine}</span>
              </li>
            ))}
          </ul>
          <Detail>
            <ul className="divide-y divide-border border-t border-border">
              {blank.slice(5).map((n) => (
                <li key={n.id} className="py-2 text-small">
                  {n.name}
                  <span className="block text-micro text-muted-foreground">{n.plainLine}</span>
                </li>
              ))}
            </ul>
          </Detail>
        </PrepCard>
      </div>

      <PrepCard
        title="Findings that were never in the first plan"
        more="What each one needs first"
        href="/gaps"
        hrefLabel="Gaps"
      >
        <p className="reading text-small text-muted-foreground">
          Everything after the first wave of the sequence. These were not dropped, they
          were waiting on something, and by expansion time that something has usually
          landed.
        </p>
        <ul className="mt-2.5 divide-y divide-border border-t border-border">
          {later.slice(0, 4).map((g) => (
            <GapLine key={g.id} gap={g} />
          ))}
        </ul>
        <Detail>
          <ul className="space-y-2">
            {later.map((g) => (
              <li key={g.id} className="reading text-small text-muted-foreground">
                <span className="text-foreground">{g.plainLine}</span>{" "}
                {g.requires.length > 0
                  ? `waits on ${pluralise(g.requires.length, "other finding", "other findings")}.`
                  : "has nothing in front of it."}{" "}
                {g.weeks} weeks.
              </li>
            ))}
          </ul>
        </Detail>
      </PrepCard>

      {/* The social proof, summarised rather than rebuilt: Compare owns it. */}
      <PrepCard
        title="What we have already built elsewhere"
        more="Why it matters here"
        href="/compare"
        hrefLabel="Built before"
      >
        <p className="reading text-small">
          We have built something like {reused.length} of these {gaps.length} at another
          food or beverage client, worth {money(reusedValueCr())} of the{" "}
          {money(company.grossLeakageCr)} on the list.
        </p>
        <Detail>
          <p className="reading text-small text-muted-foreground">
            On an expansion conversation this is the strongest thing available: the client
            is being asked to buy a second phase, and the argument that the first one
            landed is worth more than any new estimate. Compare shows which project each
            piece came from and what was different there.
          </p>
        </Detail>
      </PrepCard>
    </div>
  );
}

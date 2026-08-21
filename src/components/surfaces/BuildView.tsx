"use client";

import Link from "next/link";
import { money, pluralise } from "@/lib/format";
import {
  company,
  gaps,
  questions,
  sources,
  type Gap,
} from "@/lib/suvarna";
import { lanes } from "@/lib/compare";
import { FIRST_COUNT, buildOrder, unpriced, valueOf, type Recommendation } from "@/lib/recommend";
import { nextCall } from "@/lib/calls";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { Panel } from "@/components/meridian/Primitives";
import { EffortChip } from "@/components/meridian/Confidence";
import { PrecedentBadge } from "@/components/meridian/Precedent";
import { GapRow } from "@/components/meridian/GapRow";
import { ArrowIcon, InfoIcon } from "@/components/meridian/Icons";
import { usePanel } from "@/components/meridian/EvidencePanel";
import { useWorkspace } from "@/components/shell/WorkspaceProvider";

/**
 * What to build — the project's own front page, and the only surface that
 * answers a question about *us* rather than about the client.
 *
 * **The problem it fixes.** Opening a project landed on the dossier, which is
 * where the research is rather than where the answer is. A consultant who has
 * four minutes and a call starting does not read six directions, twelve
 * findings and a workflow comparison and then decide what to pitch. He decides
 * what to pitch, and reads exactly as far back down the chain as the first
 * challenge takes him.
 *
 * So the page is one shape, top to bottom, and the shape is the argument:
 *
 * 1. **What the platform holds**, as four numbers: the sources ingested, the
 *    dossier written, the workflows to compare against, the findings made.
 *    One strip, and every tile is a way into the surface that owns it.
 * 2. **The answer.** Three builds, ranked, with the plain-language line under
 *    each. This is what he says out loud.
 * 3. **The rest of the list**, at row density, because "what else is there" is
 *    the second question and never the first.
 *
 * Nothing here is authored twice. The order comes from `recommend.ts` and the
 * rationale is composed from the same fields the chips beside it read, so a
 * front page cannot drift from the findings list it is the front of.
 *
 * **The money rule, and why this surface is not Gaps.** *Gaps has no money on
 * it* in `DECISIONS.md`: twelve prices down a list with the working two clicks
 * away is the number a client challenges first. Here there are three, each one
 * stating all four things §7.11 asks for — a named base, the rate, the range
 * and whose numbers they are — on the card rather than behind a control. The
 * rest of the list carries no price at all, for exactly the reason Gaps
 * carries none.
 */

const ORDER = buildOrder();
const FIRST = ORDER.slice(0, FIRST_COUNT);
const REST = ORDER.slice(FIRST_COUNT);
const UNPRICED = unpriced();

/** Weeks to the first thing delivered, which is the question a client asks
 *  straight after "what would you build". The shortest of the three, not the
 *  sum: they do not run end to end. */
const FIRST_WEEKS = Math.min(...FIRST.map((r) => r.gap.weeks));
const PROVEN = FIRST.filter((r) => r.precedent).length;

const TRANSCRIPTS = sources.filter((s) => s.kind === "transcript").length;
const NEXT_CALL = nextCall();

export function BuildView() {
  /* The signed-in person, for the greeting.
     **`Member.name` is optional on purpose**, and the greeting has to respect
     the reason: `workspace.ts` refuses to invent a display name from an email
     address, because a prototype that guesses one shows a real person
     something untrue about themselves. So a member with no name gets the line
     without the greeting rather than "Hi sai@heizen.work" — the address is an
     identity, not a way to address somebody.

     First name only where there is one. It is split here rather than at the
     point it is written so the line cannot grow a surname when somebody edits
     their profile. */
  const { me } = useWorkspace();
  const firstName = me.name?.trim().split(" ")[0];

  return (
    <>
      <SurfaceHero title="What to build" />

      <div className="surface-frame under-bar pb-5">
        {/* ------------------------------------------- the answer, and its scale */}
        {/* **The brand colour is the dark ink, not the cyan.** This box was
            `--evidence-muted`, a pale blue tint, which was a reasonable read of
            "brand colour" and the wrong one: Heizen's colour is the near-black
            the masthead is painted in. So the band takes the masthead's own
            family — ground, foreground, muted, border, accent — rather than a
            one-off dark defined here. Two consequences worth having: the box
            reads as an extension of the bar above it rather than as a second
            idea, and it is theme-correct in all three modes for free, because
            those five tokens are already defined per mode for the chrome.

            It is the only filled object on the surface. Everything else is
            `bg-card` on the page ground, so the one thing carrying the answer
            is the one thing that cannot be missed. A second filled box
            anywhere on this page would make this one a category. */}
        {/* **`overflow-hidden`, because the tiles are full-bleed.** The panel is
            `rounded-lg` and its padding is stripped so the metric strip can run
            edge to edge, which means the bottom two tiles' own hover fill is a
            square painted into a rounded corner: hovering the first tile
            squared off the panel's bottom-left. A child cannot round a corner
            it does not know about, so the parent clips instead.

            Safe here specifically because nothing inside this panel escapes
            its box — the tiles are links, not popovers. On a panel containing
            a dropdown this would clip the menu, which is why it is not on
            `Panel` itself. */}
        <Panel className="overflow-hidden border-masthead bg-masthead px-0 py-0 text-masthead-foreground sm:px-0 sm:py-0">
          <div className="px-4 py-4 sm:px-5 sm:py-5">
            {/* **It greets the reader by name**, on request. Everything else in
                the product is written about the client; this one line is
                written to the consultant, and it is the right place for it
                because this is the first screen he sees when he opens a
                project and the only one whose subject is what *he* should do
                next.

                First name only, from the workspace rather than typed: "Hi Sai"
                is a colleague, "Hi Sai Myo Thu" is a mail merge. */}
            {/* **Set up, not down**, on request. It was `text-small` in
                `--masthead-muted`, which is the eyebrow treatment — the size
                the product uses for a label above a heading, and it made the
                one line addressed to the reader the quietest thing in the box.
                At body size in the full foreground it reads as somebody
                talking, which is what it is. */}
            <p className="text-base font-medium text-masthead-foreground">
              {firstName ? `Hi ${firstName}, here` : "Here"} is what we would build for{" "}
              {company.name}.
            </p>
            {/* The one sentence. It is a claim with a number in it rather than a
                heading, because a heading that says "Recommendations" is the
                screen naming itself and §7.2 rules that out. */}
            <h2 className="accent-heading mt-1.5 text-h2 text-masthead-foreground">
              {pluralise(FIRST.length, "build", "builds")}, worth {money(valueOf(FIRST))} a year
              between them.
            </h2>
            {/* **One line, on request, and the cut is the point.** It ran to
                three sentences: the ranking method, then the precedent count,
                then the timeline. The method is the page's business rather than
                the reader's — he wants the order, not how it was arrived at —
                and the two facts worth keeping are the two he will say out
                loud. Full width rather than `measure`: at one line there is
                nothing to cap. */}

            {/* ------------------------------------------------ the primary action */}
            {/* **The one control this page is laid out around.** The premise is
                that four sessions in five are the same session: a call is about
                to start and the consultant needs to walk in knowing what to
                say. Research runs once per project; the pitch is read before
                every call, and that ratio is the whole argument for giving one
                control this much weight.

                **It is cream on graphite, which is the strongest thing the
                palette can do.** Everywhere else in the product the single
                filled control is `AiButton` on the chrome strip; here the band
                is the chrome's own colour, so the inversion — the page's ink as
                a ground — is available and is spent exactly once.

                **The destination is chosen and the choice is explained.**
                `nextCall()` reads whether anybody has been spoken to yet, and
                the line under the button says which call that makes it and why.
                A control that picks a destination on the reader's behalf and
                does not say so is one he has to press to understand. */}
            {/* **The button is the whole control, with nothing beside it.** It
                arrived as *Prep for the call* plus sixteen words of
                disclosure — the call's name, its length and why that call was
                chosen. Two cuts took all of it: the label absorbed the
                destination, then the step count and the minutes went too.

                What each cut cost, so the trade stays visible. The reasoning
                (`NEXT_CALL.why`) and the length are both still computed and
                still true, and the agenda this opens states both in its own
                standfirst — which is one press away and is where somebody
                querying the choice would actually look. A reader deciding
                whether it fits the gap before a call now finds that out on
                arrival rather than before pressing. On the page whose whole
                job is one action, one object is worth more than one object
                explained. */}
            <div className="mt-5">
              <Link
                href={NEXT_CALL.href}
                className="inline-flex items-center gap-2 rounded-md bg-masthead-foreground px-5 py-3 text-base font-medium text-masthead shadow-card transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-masthead-accent focus-visible:ring-offset-2 focus-visible:ring-offset-masthead"
              >
                Prep for the {NEXT_CALL.name}
                <ArrowIcon />
              </Link>
            </div>
          </div>

          {/* **The figures are in `--masthead-accent`**, which is the accent
              built for this ground and the one the bar above already uses. The
              page-level `--accent` is a cyan chosen against ivory and does not
              have the contrast to sit on near-black.

              The dividers are `--masthead-border` for the same reason
              `--border` was wrong on the old tint: a hairline drawn in the
              page's neutral across a filled ground reads as a seam where the
              fill failed. */}
          <ul className="grid grid-cols-2 divide-y divide-masthead-border border-t border-masthead-border lg:grid-cols-4 lg:divide-x lg:divide-y-0">
            {/* **The label is the bare noun, and the tile prints the count
                itself.** `pluralise` returns "9 sources", number included, so
                passing it as the label beside the value rendered "9 9
                sources". The tile is the one place in the product where the
                figure is deliberately separated from its noun — it is set
                larger and in `tabular` so four of them line up — which is
                exactly the case that helper cannot serve. */}
            <MetricTile
              value={String(sources.length)}
              label={sources.length === 1 ? "source" : "sources"}
              detail={`${TRANSCRIPTS} of them call transcripts`}
              href="/sources"
            />
            <MetricTile
              value="6"
              label="research directions"
              detail="Brief or Full on each"
              href="/research/company/brief"
            />
            <MetricTile
              value={String(lanes.length)}
              label={lanes.length === 1 ? "workflow lane" : "workflow lanes"}
              detail="Theirs, ours and best-in-class"
              href="/compare"
            />
            <MetricTile
              value={String(gaps.length)}
              label={gaps.length === 1 ? "finding" : "findings"}
              detail={`${pluralise(questions.length, "question", "questions")} to test them`}
              href="/gaps"
            />
          </ul>
        </Panel>

        {/* ------------------------------------------- everything below the fold */}
        {/* **A heading, which this section did not have and now needs.** While
            the three builds were the first thing under the band they were the
            page and needed no label. Under a primary control they are the
            second thing on the page, and a section that starts with no heading
            reads as a continuation of the one above it rather than as the
            evidence behind it. */}
        <h2 className="mt-8 text-h3 font-semibold">What we would build</h2>
        {/* The band's old standfirst, moved down to the thing it was about. It
            described the three builds while sitting above a button that goes
            somewhere else, which is a line of the wrong subject in the most
            expensive place on the page. */}
        <p className="reading mt-1 text-small text-muted-foreground">
          Take them in this order. {PROVEN} of the {FIRST.length} we have built before, and the
          first could be live in {FIRST_WEEKS} weeks.
        </p>

        <ol className="mt-4 space-y-4">
          {FIRST.map((item, i) => (
            <BuildCard key={item.gap.id} n={i + 1} item={item} />
          ))}
        </ol>

        {/* ------------------------------------------------- the rest, at rows */}
        {/* **Gaps' own list shape**, on request: a drawn card per finding,
            10px apart, hovering its border rather than its fill, inside a
            `Panel` whose padding has been taken off so the cards sit against
            the sheet the way they do over there. Twelve rows under hairlines
            read as a printed table, which is the register a list of separate
            things a consultant picks one of is least well served by — the
            argument `SelectableGapRow` records, applying here for the same
            reason. A reader who has learnt the list on Gaps has learnt it
            here, which is the whole point of taking the shape rather than
            inventing a second one. */}
        {REST.length > 0 && (
          <Panel className="mt-4 px-0 py-0 sm:px-0 sm:py-0">
            <div className="px-3 py-3 sm:px-4">
              <h2 className="text-lead font-medium">
                {pluralise(REST.length, "other finding", "other findings")} we would build later
              </h2>
              <p className="reading mt-1.5 text-small text-muted-foreground">
                Smaller, less certain, or waiting on one of the three above. Open one for the
                money and the evidence.
              </p>
              <ul className="mt-3 space-y-2.5">
                {REST.map((item) => (
                  <li
                    key={item.gap.id}
                    className="rounded-lg border border-border bg-card px-3.5 py-2 shadow-card transition-colors hover:border-border-strong"
                  >
                    <GapRow gap={item.gap} mode="delivery" showRank={false} as="div" />
                    {/* The ranking rationale stays, which is the one thing this
                        list has that Gaps' does not: over there the order is
                        whatever the reader sorted by, here it is ours and it
                        has to say why. */}
                    <p className="reading text-micro text-muted-foreground">{item.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          </Panel>
        )}

        {UNPRICED.length > 0 && (
          <Panel className="mt-4 px-0 py-0 sm:px-0 sm:py-0">
            <div className="px-3 py-3 sm:px-4">
              <h2 className="text-lead font-medium">
                {pluralise(UNPRICED.length, "finding", "findings")} with no number yet
              </h2>
              {/* The distinction still has to be made — out of the ranking is
                  not the bottom of it — but it took three clauses to say and
                  takes one. */}
              <p className="reading mt-1.5 text-small text-muted-foreground">
                Real findings we have not costed yet. Not ranked, because a blank is not a zero.
              </p>
              <ul className="mt-3 space-y-2.5">
                {UNPRICED.map((gap) => (
                  <UnpricedRow key={gap.id} gap={gap} />
                ))}
              </ul>
            </div>
          </Panel>
        )}

      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * One recommendation, at full weight.
 *
 * The numeral is the ranking and it is the only thing on the card set in
 * display size: on three cards down a page, position is the priority signal
 * and a reader who scrolls past the band has to be able to pick the order back
 * up without it.
 *
 * **Two ways down, and they are different questions.** *How this is priced*
 * opens in place, because the base and the rate are the thing being challenged
 * while you are looking at the price. *Evidence* opens the shared panel, which
 * is where every other surface examines a finding, so a consultant who has
 * learned it on Gaps has learned it here.
 */
function BuildCard({ n, item }: { n: number; item: Recommendation }) {
  const { gap } = item;
  const { open } = usePanel();
  const v = gap.valuation;

  return (
    <li>
      {/* **The whole card opens the panel**, on request, and the footer that
          used to carry two controls is gone with the change. What it cost:
          the *How this is priced* disclosure, which held `ValuationBridge`.
          The base, the rate and the claim are still on the card, and the range
          and whose-numbers line joined them below rather than going behind a
          click, so §7.11 is met in full without a control on a card whose
          whole surface is now one.

          Nothing inside may be interactive. A button inside a button is
          invalid markup, which is why the mark in the corner is an icon and
          not a control — see the note on it. */}
      <button
        type="button"
        onClick={() => open({ kind: "gap", id: gap.id })}
        className="group w-full rounded-lg border border-border bg-card px-4 py-4 text-left shadow-card transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5 sm:py-5"
      >
        {/* **Two columns from `lg`, and the second one is the money.** The
            price sits in a rail so the three figures line up down one edge and
            the recommendations can be compared as a column. Below `lg` it is a
            block under the text, where they still line up because there is
            only one of them on screen.

            **The prose is full width, not `measure`**, on request. `measure`
            is for a column of body text in a document; here the text column is
            already bounded by the price rail beside it, so capping it again
            left a second stripe of blank inside the first. */}
        <div className="flex items-start gap-3 sm:gap-4 lg:gap-6">
          <span
            aria-hidden
            className="tabular shrink-0 text-h2 font-semibold leading-none text-muted-foreground"
          >
            {n}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-3">
              <h3 className="min-w-0 text-lead font-medium">
                <span className="sr-only">Number {n}. </span>
                {gap.title}
              </h3>
              {/* **A mark, not a control**, and that is forced rather than
                  chosen: the card itself is the button, and a button inside a
                  button is invalid markup. So this is drawn in the shape the
                  info control has on a question row — a 28px box, border,
                  ground, shadow — and says *there is more behind this*, which
                  is what the two footer links used to say in words.

                  It shifts with the card rather than on its own hover, because
                  a mark that lights up under the cursor while not being
                  pressable is a control that lies. `group-hover` on the card
                  moves both together. */}
              <span
                aria-hidden
                className="flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground shadow-card transition-colors group-hover:border-border-strong group-hover:text-foreground"
              >
                <InfoIcon />
              </span>
            </div>
            {/* The one line. Plain language, because Aryan is not a domain
                expert and this is the sentence he repeats. */}
            <p className="reading mt-1 text-small text-muted-foreground">{gap.plainLine}</p>

            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <EffortChip level={gap.effort} />
              <PrecedentBadge gap={gap} />
            </div>

            {/* **The composed rationale line and the blocker line are both
                gone from these three**, on request. What they said is still
                said: the tier and the precedent are the two chips directly
                above, the weeks are on the precedent badge, and the
                prerequisite is in the panel's *Next steps* a click away. Three
                greyed lines under two chips restating the two chips is the
                overwhelm §7.1 names, on the one screen in the product that
                cannot afford it. The `reason` string is unchanged and still
                carries the list below, where the rows have no chips of their
                own to restate. */}
          </div>

          {/* base × rate = claim, on the card rather than behind the click.
              §7.11: a rupee figure whose base is one interaction away is the
              figure an error hides behind longest. */}
          {v && gap.amountCr != null && (
            <div className="hidden lg:block lg:w-80 lg:shrink-0 lg:border-l lg:border-border lg:pl-5">
              <PriceBlock gap={gap} />
            </div>
          )}
        </div>

        {v && gap.amountCr != null && (
          <div className="mt-3 border-t border-border pt-2.5 lg:hidden">
            <PriceBlock gap={gap} />
          </div>
        )}

        {!v && <p className="mt-3 text-small text-muted-foreground">Not priced</p>}
      </button>
    </li>
  );
}

/**
 * The claim and what it rests on, in two lines.
 *
 * **Rendered twice, once per breakpoint, and that is the trade taken
 * knowingly.** The rail and the block are different enough in position that
 * one element with responsive classes on it would have to be both a bordered
 * side column and a bordered top block, and the repo has already recorded the
 * cost of the alternative on `GapRow`: a `sm:hidden` duplicate is two elements
 * a screen reader has to be trusted to hide one of. Here the two copies are
 * `hidden lg:block` and `lg:hidden`, which is display and not visibility, so
 * exactly one is in the tree at any width.
 */
function PriceBlock({ gap }: { gap: Gap }) {
  const v = gap.valuation;
  if (!v || gap.amountCr == null) return null;
  return (
    <>
      <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <span className="tabular text-h3 font-semibold">{money(gap.amountCr)}</span>
        <span className="text-small text-muted-foreground">a year</span>
        {v.oneOffCr != null && (
          <span className="text-small font-medium">
            + {money(v.oneOffCr)} {v.oneOffLabel ?? "released once"}
          </span>
        )}
      </p>
      <p className="reading mt-1 text-micro text-muted-foreground">
        {v.rateLabel}
        {/* The base label as authored. Lowercasing it to join the sentence
            spelled one of them "₹53 cr", which is the product getting a rupee
            unit wrong in the line whose whole job is defending a rupee
            figure. */}
        {v.baseCr != null && ` on ${money(v.baseCr)}: ${v.baseLabel}`}.
      </p>
      {/* **The range and the basis badge came off this card**, on request. What
          is left is the figure, what it is a percentage of, and the base it is
          taken on — which is §7.11's first half, the half a client challenges
          first.

          The other half is not lost, it is one surface away: the full range,
          the basis and the whole provenance sentence all render on Research ›
          Money, where there is room to argue with them, and the panel this
          card opens carries the same. What this card is for is deciding which
          three builds to talk about, and a low-to-high band under every one of
          them is a second number to weigh per card before the first one has
          landed. */}
    </>
  );
}

/** A finding with no number. The reason is the row: without it the entry reads
 *  as an oversight rather than as a decision not to guess. */
function UnpricedRow({ gap }: { gap: Gap }) {
  const { open } = usePanel();
  return (
    /* The same card the list above uses, so the two blocks read as one list in
       two parts rather than as two designs. The whole card opens the panel,
       which is what the priced cards do too. */
    <li>
      <button
        type="button"
        onClick={() => open({ kind: "gap", id: gap.id })}
        className="w-full rounded-lg border border-border bg-card px-3.5 py-2.5 text-left shadow-card transition-colors hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="text-small font-medium">{gap.title}</span>
        <span className="reading block text-micro text-muted-foreground">
          {gap.unpricedReason ?? "No basis for a number yet."}
        </span>
      </button>
    </li>
  );
}

/**
 * One of the platform's four numbers, and a way into the surface that owns it.
 *
 * **The number leads and the label follows**, which is the `SummaryStrip`
 * idiom this borrows: a tile whose first word is "Sources" is a link with a
 * count on it, and a tile whose first mark is `9` is a measurement. The page
 * opens on measurements.
 *
 * The whole tile is the link, not a word at the bottom of it. Four cards each
 * ending in a small cyan verb was four separate decisions to make before
 * reaching the recommendation; a tile that is entirely pressable is one.
 */
function MetricTile({
  value,
  label,
  detail,
  href,
}: {
  value: string;
  label: string;
  detail: string;
  href: string;
}) {
  return (
    <li className="min-w-0">
      <Link
        href={href}
        className="group flex h-full flex-col justify-start gap-0.5 px-4 py-3.5 transition-colors hover:bg-masthead-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-masthead-accent sm:px-5"
      >
        <span className="flex items-baseline gap-2">
          <span className="tabular text-h2 font-semibold leading-none text-masthead-accent">{value}</span>
          <span className="min-w-0 text-small text-masthead-foreground">{label}</span>
          {/* The arrow appears on hover rather than sitting on every tile:
              four static arrows read as four things to do, which is the
              opposite of what a measurement is for. */}
          <ArrowIcon className="shrink-0 text-masthead-accent opacity-0 transition-opacity group-hover:opacity-100" />
        </span>
        <span className="reading text-micro text-masthead-muted">{detail}</span>
      </Link>
    </li>
  );
}

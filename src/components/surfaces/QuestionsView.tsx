"use client";

import { useMemo, useState } from "react";
import {
  DOMAIN_LABEL,
  LENS_LABEL,
  TAG_LABEL,
  questionChildren,
  questionDomains,
  questionPath,
  questionTags,
  questionThreads,
  questions,
  stakeholderById,
  stakeholders,
  type Question,
  type QuestionDomain,
  type QuestionLens,
  type QuestionTag,
} from "@/lib/suvarna";
import { QuestionRow } from "@/components/meridian/QuestionRow";
import { Panel } from "@/components/meridian/Primitives";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";
import { SwitchScroller, SwitchTrack, switchItemClass } from "@/components/shell/SwitchTrack";
import { SelectField } from "@/components/shell/SelectField";
import { StickyBar } from "@/components/shell/StickyBar";
import { SaveButton } from "@/components/shell/SavedProvider";

/**
 * Questions — actions, not findings.
 *
 * Same component family as Gaps, opposite register: no money anywhere, future
 * tense throughout, and the ask order carried as structure rather than a sort.
 *
 * The default arrangement is now by conversation, not by a single 1-to-11 run.
 * Eleven questions addressed to four people, two of whom have never been met, is
 * not one call — and printing them as one ordered list said it was. What Aryan
 * needs on the way in is the four he can actually ask today. See AUDIT.md D.
 */

const byAskOrder = (a: Question, b: Question) => a.askOrder - b.askOrder;

/**
 * One branch of the conversation, and everything under it.
 *
 * The row draws its own spine, and a nested `<ol>` inside a row's content
 * column starts to the right of that spine — so the tree indents itself and no
 * level needs a padding value of its own. Below `sm` each level is pulled back
 * by half the spine, because two full indents out of 319px would leave a
 * drill-down about 150px of line to set in.
 *
 * `last` is false whenever a row has children, so the spine runs down through
 * its own branch rather than stopping at the chip. That line is the only thing
 * on screen saying the questions underneath belong to the one above.
 */
function Branch({
  question,
  list,
  last,
  linked = false,
}: {
  question: Question;
  list: Question[];
  last: boolean;
  linked?: boolean;
}) {
  const kids = questionChildren(question.id, list);

  return (
    <QuestionRow
      question={question}
      last={last && kids.length === 0}
      linked={linked}
      showTarget={false}
      showTags
      saveSlot={
        <SaveButton
          item={{
            kind: "question",
            id: question.id,
            label: question.text,
            href: "/questions",
          }}
        />
      }
    >
      {/* One step of indent per level, and a small one: the row's own gutter is
          already 32px, so the nested list is pulled most of the way back to
          leave a 20px step. Three tiers then cost 40px of line rather than 92,
          which is what makes a drill-down readable on a phone. Below that the
          step stops reading as a step at all: 12px was tried and the two lower
          tiers looked like one. */}
      {/* `ml-5` is the elbow's own column: the connector is drawn into the
          20px this list is indented by, so the indent is not decoration any
          more, it is the space the line lives in. */}
      {kids.length > 0 && (
        <ol className="mt-2 ml-5">
          {kids.map((k, i) => (
            <Branch key={k.id} question={k} list={list} last={i === kids.length - 1} linked />
          ))}
        </ol>
      )}
    </QuestionRow>
  );
}

/**
 * Two arrangements of one set of rows, and both are built out of the same parts:
 * a `Panel`, a heading, `QuestionRow`.
 *
 * **By thread is the default.** It is the answer to the thing that was actually
 * wrong here: a flat list says nothing about which question to ask first, and
 * nothing at all about what to ask once the first one has been answered. A
 * consultant reading twenty-three questions in a column picks whichever looks
 * sharpest, which is how a call opens on "what is your first-time match rate?"
 * before the other person has said what they care about. A thread is one topic:
 * an opener, the follow-up that splits whatever came back, and the drill-downs
 * that hang off each branch.
 *
 * **By stakeholders** is the other question worth asking of this set: *what do
 * I owe this person*, which is how a follow-up meeting gets booked. It is a
 * panel each, including the two people with nothing to ask them yet. The value
 * behind it is `stakeholder`, matching what the data calls these people and what
 * Research's own direction is named, so the label and the model agree.
 *
 * Two tabs have been removed, both on request, and the reasons are worth
 * keeping because they are the same reason twice.
 *
 * **By domain** went when By thread arrived: a thread is already one domain, so
 * two tabs cutting the same way is one tab with a worse name.
 *
 * **By call** has gone now. It split the set by occasion, *ask today* against
 * *needs another meeting*, and that cut has moved to where it is acted on
 * rather than merely read: Prep's first-call stage carries today's questions
 * and its second-call stage carries the rest, each beside the material for that
 * conversation. What was left here was a third arrangement of rows whose
 * occasion is already stated on every one of them, on a surface that opens on
 * the thread the questions actually run in. The `askWhen` field is untouched and
 * still drives both Prep stages; restoring the tab is a branch and two panels.
 *
 * **There was a fourth, By text**, all eleven in one panel with a Copy all
 * button on it. The argument for it was that a question retyped into notes is a
 * question shortened; that argument was about *taking a question out of the
 * tool*, not about another cut of the same rows, and the copy control on every
 * row answers it at the granularity a consultant actually uses.
 */
type Arrange = "thread" | "stakeholder";

export function QuestionsView() {
  const [arrange, setArrange] = useState<Arrange>("thread");
  /* Two filters that cross: a domain is where a question sits, a tag is what it
     touches, and SAP runs through three domains. Both are `null` for "all"
     rather than a sentinel string, so the arrangement code never has to know
     which value means unfiltered. */
  const [domain, setDomain] = useState<QuestionDomain | null>(null);
  const [tag, setTag] = useState<QuestionTag | null>(null);
  /**
   * Business impact against technical, and it is a third axis rather than
   * another tag.
   *
   * The two are asked differently and usually of different people: what it
   * costs them is a question for whoever owns the number, how it works is a
   * question for whoever touches the system. Running them together is how a
   * discovery call turns into a systems interview, and the person who owns the
   * problem stops recognising it as being about him.
   */
  const [lens, setLens] = useState<QuestionLens | null>(null);
  const filtered = domain !== null || tag !== null || lens !== null;

  const shown = useMemo(
    () =>
      questions.filter(
        (q) =>
          (!domain || q.domain === domain) &&
          (!tag || q.tags.includes(tag)) &&
          (!lens || q.lens === lens),
      ),
    [domain, tag, lens],
  );

  /**
   * The tree keeps the route to every match, whether or not the route matches.
   *
   * Filter to SAP and four of the five hits are drill-downs, whose openers carry
   * no tags at all. Dropping those openers would leave the branch hanging off
   * nothing and show a consultant the third question with the two that earn it
   * removed, which is the exact failure this arrangement exists to fix. So a
   * match pulls its ancestors in with it, and the count on the Clear button
   * still counts matches, because that is what was asked for.
   */
  const inTree = useMemo(() => {
    const keep = new Set<string>();
    for (const q of shown) for (const step of questionPath(q.id)) keep.add(step.id);
    return questions.filter((q) => keep.has(q.id));
  }, [shown]);

  /* Someone with nothing to ask them yet is a statement about the research, and
     it is only true of the unfiltered set: with a filter on, an empty panel
     under their name would say the research is thinner than it is when all it
     means is that their questions are about something else. So the empty
     panels appear only when nothing is filtered. */
  const withQuestions = stakeholders.filter((s) => shown.some((q) => q.targetId === s.id));
  const without = filtered
    ? []
    : stakeholders.filter((s) => !questions.some((q) => q.targetId === s.id));

  return (
    <>
      <SurfaceHero title="Questions" />

      {/* Pinned while the questions scroll, on request. Eleven rows over two
          panels is longer than a screen, and Arrange is the control that says
          which two panels they are. See `StickyBar`. */}
      <StickyBar className="pt-5 pb-3">
        {/* On the page, not on the band. It was in the band's `actions` slot,
          which is for what you *do* on a surface — and rearranging eleven
          questions is not something you do to the surface, it is a reading of
          the body directly below it. Research's two switches sit on the page
          above their document for exactly this reason.

          Coming off the indigo also puts it back in page tokens: the band copy
          needed `--masthead-*` throughout, because `text-muted-foreground` up
          there is 2.32:1. Here it is the same track every other surface uses. */}
        {/* **`RunButton` shares this row**, on request, the same move Research
            made with its switches and Gaps with its two dropdowns: once the
            surface name and its description came off the header, what was left
            was a row holding one button and a great deal of ivory.

            `items-end` so the button's baseline lands on the rule the tabs sit
            on rather than floating above it. */}
        {/* `items-stretch`, as on Gaps, so the `w-px` rules between the settings
            run the height of the boxes rather than measuring zero. The scroller
            takes `self-end` to keep its rule on the row's baseline and the
            buttons `self-center`, because a stretched button is a 40px slab. */}
        {/* 16px, matching Gaps. Two surfaces that both put their settings on
            the page should not disagree about how far apart they sit. */}
        <div className="flex flex-wrap items-stretch gap-x-4 gap-y-3">
          {/* `w-full sm:w-auto`, not `flex-1` — see `ResearchSwitches`. At 375
              the bare `flex-1` squeezed the track to ~180px and scrolled its
              last tab out of sight instead of wrapping the button below. It is
              `w-auto` rather than `flex-1` above `sm` so the two filters sit
              beside it rather than being pushed to the far end of the row. */}
          <SwitchScroller className="w-full self-end sm:w-auto sm:max-w-full">
            <SwitchTrack label="Arrange">
              {(
                [
                  ["thread", "By thread"],
                  ["stakeholder", "By stakeholders"],
                ] as const
              ).map(([v, label]) => (
                <button
                  key={label}
                  type="button"
                  aria-pressed={arrange === v}
                  onClick={() => setArrange(v)}
                  className={switchItemClass(arrange === v)}
                >
                  {label}
                </button>
              ))}
            </SwitchTrack>
          </SwitchScroller>

          {/* The same rule Gaps puts between Order and Area, and for the same
              reason: three settings side by side read as one strip otherwise.
              This first one is doing the heavier job of the two, because it
              separates a control that rearranges the rows from two that decide
              which rows there are. */}
          <span className="hidden w-px shrink-0 self-stretch bg-border sm:block" aria-hidden />
          {/* Dropdowns rather than tabs, for Gaps' reason: six domain names and
              eight tags is far past what a track can hold on one line, and a
              native `<select>` opens the platform's own picker on the phone this
              surface is read on. Both offer only what is actually in the set, so
              the filter can never land on an empty list. */}
          <SelectField
            label="Domain"
            value={domain ?? "all"}
            onChange={(v) => setDomain(v === "all" ? null : (v as QuestionDomain))}
            options={[
              ["all", "All"],
              ...questionDomains().map((d) => [d, DOMAIN_LABEL[d]] as [string, string]),
            ]}
          />
          <span className="hidden w-px shrink-0 self-stretch bg-border sm:block" aria-hidden />
          <SelectField
            label="Tag"
            value={tag ?? "all"}
            onChange={(v) => setTag(v === "all" ? null : (v as QuestionTag))}
            options={[
              ["all", "All"],
              ...questionTags().map((t) => [t, TAG_LABEL[t]] as [string, string]),
            ]}
          />

          <span className="hidden w-px shrink-0 self-stretch bg-border sm:block" aria-hidden />
          <SelectField
            label="Kind"
            value={lens ?? "all"}
            onChange={(v) => setLens(v === "all" ? null : (v as QuestionLens))}
            options={[
              ["all", "All"],
              ["business", LENS_LABEL.business],
              ["technical", LENS_LABEL.technical],
            ]}
          />

          <div className="ml-auto flex shrink-0 items-center gap-2 self-center">
            {/* Only while a filter is on, and it says how many of the eleven
                survived it. A filtered list that does not say it is filtered is
                how a consultant walks into a call believing there are four
                questions. */}
            {filtered && (
              <button
                type="button"
                onClick={() => {
                  setDomain(null);
                  setTag(null);
                  setLens(null);
                }}
                className="whitespace-nowrap rounded-md border border-border bg-card px-2.5 py-1.5 text-micro font-medium text-muted-foreground shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground"
              >
                {shown.length} of {questions.length} · Clear
              </button>
            )}
            <RunButton label="Refresh Questions" />
          </div>
        </div>
      </StickyBar>

      <div className="surface-frame under-bar pb-5">

        {/* Nothing survived the two filters. It is a real state rather than an
            error, and the way out is the control that caused it. */}
        {shown.length === 0 ? (
          <Panel>
            <p className="text-base font-medium">No questions about that</p>
            <p className="mt-1 text-small text-muted-foreground">
              {domain && tag
                ? `Nothing in ${DOMAIN_LABEL[domain]} is tagged ${TAG_LABEL[tag]}.`
                : "That combination has nothing behind it yet."}{" "}
              Widen one of the two, or clear both.
            </p>
            <button
              type="button"
              onClick={() => {
                setDomain(null);
                setTag(null);
                setLens(null);
              }}
              className="mt-3 rounded-md border border-border bg-card px-2.5 py-1.5 text-micro font-medium text-muted-foreground shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground"
            >
              Show all {questions.length}
            </button>
          </Panel>
        ) : arrange === "thread" ? (
          /* One panel per thread, in the order you would run them: today's
             conversation first, then the three that need a meeting booked.
             The heading names the topic and the person, because a thread is a
             conversation with somebody rather than a category. */
          <div className="space-y-4">
            {questionThreads(inTree).map((opener) => {
              const person = stakeholderById(opener.targetId);
              const inThread = inTree.filter((q) => q.domain === opener.domain);
              return (
                <Panel key={opener.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h2 className="accent-heading text-h3">{DOMAIN_LABEL[opener.domain]}</h2>
                    <span className="text-small text-muted-foreground">
                      {person.name} · {person.role}
                      {!person.met && " · not met"}
                    </span>
                  </div>
                  <ol className="mt-3">
                    <Branch question={opener} list={inThread} last />
                  </ol>
                </Panel>
              );
            })}
          </div>
        ) : (
          <div className="space-y-4">
            {withQuestions.map((person) => {
              const theirs = shown.filter((q) => q.targetId === person.id).sort(byAskOrder);
              return (
                <Panel key={person.id}>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h2 className="accent-heading text-h3">
                      {person.name}
                      <span className="ml-2 font-sans text-small font-normal not-italic text-muted-foreground">
                        {person.role}
                        {!person.met && " · not met"}
                      </span>
                    </h2>
                    <span className="tabular text-small text-muted-foreground">
                      {person.met ? "in the room" : "needs a meeting first"}
                    </span>
                  </div>
                  <p className="mt-1 text-small">
                    <span className="font-medium text-health-watch">Do not: </span>
                    <span className="text-muted-foreground">{person.avoid}</span>
                  </p>
                  <ol className="mt-3">
                    {theirs.map((q, i) => (
                      <QuestionRow
                        key={q.id}
                        question={q}
                        last={i === theirs.length - 1}
                        showTarget={false}
                        showTags
                        saveSlot={
                          <SaveButton
                            item={{
                              kind: "question",
                              id: q.id,
                              label: q.text,
                              href: "/questions",
                            }}
                          />
                        }
                      />
                    ))}
                  </ol>
                </Panel>
              );
            })}

            {without.map((person) => (
              <Panel key={person.id}>
                <h2 className="accent-heading text-h3">
                  {person.name}
                  <span className="ml-2 font-sans text-small font-normal not-italic text-muted-foreground">
                    {person.role}
                  </span>
                </h2>
                <div className="mt-2 rounded-lg border border-dashed border-border-strong bg-muted px-4 py-3.5">
                  <p className="text-small font-medium">Nothing to ask them yet</p>
                  <p className="mt-0.5 text-small text-muted-foreground">
                    They have not come up in either call. That is missing research, not a judgement
                    — they own {person.owns[0].toLowerCase()}.
                  </p>
                </div>
              </Panel>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

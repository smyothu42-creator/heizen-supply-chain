"use client";

import { useState } from "react";
import { ASK_WHEN_LABEL, questions, questionsWhen, stakeholders } from "@/lib/suvarna";
import { QuestionRow } from "@/components/meridian/QuestionRow";
import { Panel } from "@/components/meridian/Primitives";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { RunButton } from "@/components/shell/RunButton";
import { SwitchScroller, SwitchTrack, switchItemClass } from "@/components/shell/SwitchTrack";

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

/* Two groups, not three. The data request is asked at the end of the same call,
   so splitting it into a section of its own broke the run of ask-numbers into
   1, 2, 3 … 5–11 … 4 — the one thing an ordered list has to get right. It now
   sits last inside "Ask today", marked. */
const TODAY = [...questionsWhen("this-call"), ...questionsWhen("data-request")];
const LATER = questionsWhen("after-this-call");

/**
 * Whoever the later questions belong to, each named once — and the groups
 * themselves in ask order, not in the order the stakeholder list happens to be
 * written. Grouping by person is worthless if it makes the numbers run 8, 9,
 * 10, 11, 5, 6, 7 down the page.
 */
const LATER_BY_PERSON = stakeholders
  .map((person) => ({
    person,
    theirs: LATER.filter((q) => q.targetId === person.id),
  }))
  .filter((g) => g.theirs.length > 0)
  .sort((a, b) => a.theirs[0].askOrder - b.theirs[0].askOrder);

/**
 * Two arrangements of one set of rows, and both are built out of the same parts:
 * a `Panel`, a person heading, `QuestionRow`.
 *
 * They differ in how the eleven are cut. By call is two panels split by
 * occasion. By person is a panel each, including the two people with nothing to
 * ask them yet.
 *
 * **There was a third, By text**, all eleven in one panel with a Copy all
 * button on it, and it is gone on request. The argument for it was that a
 * question retyped into notes is a question shortened; that argument was about
 * *taking a question out of the tool*, not about a third cut of the same rows,
 * and a copy control on every row answers it at the granularity a consultant
 * actually uses. He takes the two or three he means to ask, not all eleven.
 * `QuestionScript.tsx` is deleted rather than left unimported.
 */
type Arrange = "call" | "person";

export function QuestionsView() {
  const [arrange, setArrange] = useState<Arrange>("call");

  const withQuestions = stakeholders.filter((s) => questions.some((q) => q.targetId === s.id));
  const without = stakeholders.filter((s) => !questions.some((q) => q.targetId === s.id));

  return (
    <>
      <SurfaceHero title="Questions" />

      <div className="surface-frame py-5">
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
        <div className="mb-3 flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
          {/* `w-full sm:flex-1`, not `flex-1` — see `ResearchSwitches`. At 375
              the bare `flex-1` squeezed the track to ~180px and scrolled its
              last tab out of sight instead of wrapping the button below. */}
          <SwitchScroller className="w-full sm:flex-1">
            <SwitchTrack label="Arrange">
              {(
                [
                  ["call", "By call"],
                  ["person", "By person"],
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
          <div className="ml-auto flex shrink-0 items-center gap-2">
            <RunButton label="Refresh Questions" />
          </div>
        </div>

        {arrange === "call" ? (
          <div className="space-y-4">
            <Panel>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="accent-heading text-h3">{ASK_WHEN_LABEL["this-call"]}</h2>
                <span className="tabular text-small text-muted-foreground">
                  Rohan Deshpande · {TODAY.length}
                </span>
              </div>
              <ol className="mt-3">
                {TODAY.map((q, i) => (
                  <QuestionRow
                    key={q.id}
                    question={q}
                    last={i === TODAY.length - 1}
                    showTarget={false}
                    boxed
                  />
                ))}
              </ol>
            </Panel>

            <Panel>
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="accent-heading text-h3">{ASK_WHEN_LABEL["after-this-call"]}</h2>
                <span className="tabular text-small text-muted-foreground">{LATER.length}</span>
              </div>
              <p className="mt-1 text-small text-muted-foreground">
                Getting one of these meetings is a better outcome from today than any answer Rohan
                can give you.
              </p>
              {/* Grouped by who, because seven questions across three people read as
                a wall otherwise — and it lets each name be said once. */}
              <div className="mt-3 space-y-5">
                {LATER_BY_PERSON.map(({ person, theirs }) => (
                  <div key={person.id}>
                    <h3 className="text-small font-medium">
                      {person.name}
                      <span className="ml-2 font-normal text-muted-foreground">
                        {person.role}
                        {!person.met && " · not met"}
                      </span>
                    </h3>
                    <ol className="mt-2">
                      {theirs.map((q, i) => (
                        <QuestionRow
                          key={q.id}
                          question={q}
                          last={i === theirs.length - 1}
                          showTarget={false}
                          boxed
                        />
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </Panel>
          </div>
        ) : (
          <div className="space-y-4">
            {withQuestions.map((person) => {
              const theirs = questions
                .filter((q) => q.targetId === person.id)
                .sort((a, b) => a.askOrder - b.askOrder);
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
                        boxed
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

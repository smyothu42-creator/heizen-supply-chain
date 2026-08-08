"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { company, questions, stakeholders } from "@/lib/suvarna";
import { QuestionRow } from "@/components/meridian/QuestionRow";
import { PageHeader } from "@/components/meridian/PageHeader";

/**
 * Questions — actions, not findings.
 *
 * Same component family as Gaps, opposite register: no money anywhere, future
 * tense throughout, and the ask order carried as structure rather than a sort.
 */
export function QuestionsView() {
  const [byPerson, setByPerson] = useState(false);

  const ordered = [...questions].sort((a, b) => a.askOrder - b.askOrder);
  const withQuestions = stakeholders.filter((s) => questions.some((q) => q.targetId === s.id));
  const without = stakeholders.filter((s) => !questions.some((q) => q.targetId === s.id));

  return (
    <div className="mx-auto w-full max-w-3xl px-3 py-5 sm:px-4">
      <PageHeader
        eyebrow={company.name}
        title="Questions"
        line="Ask in this order. Each answer sets up the next."
        stats={[
          { label: "questions", value: String(questions.length) },
          { label: "people", value: String(withQuestions.length) },
          { label: "gaps they test", value: "8 of 12" },
        ]}
        about={
          <>
            <p>
              Every question either tests a gap we have priced or unlocks one we cannot. None carry
              a price — a question is something you do, not something you have found.
            </p>
            <p>
              The last one is a data request rather than a discovery question. It changes the
              register of the call, and there is no way back from it.
            </p>
          </>
        }
        actions={
          <div className="flex gap-0.5" role="group" aria-label="Arrange by">
            {(
              [
                [false, "By order"],
                [true, "By person"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={label}
                type="button"
                aria-pressed={byPerson === v}
                onClick={() => setByPerson(v)}
                className={cn(
                  "rounded-md px-2 py-0.5 text-small transition-colors",
                  byPerson === v
                    ? "bg-foreground font-medium text-background"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        }
      />

      {!byPerson ? (
        <ol className="border-t border-border pt-4">
          {ordered.map((q, i) => (
            <QuestionRow key={q.id} question={q} last={i === ordered.length - 1} />
          ))}
        </ol>
      ) : (
        <div className="space-y-7 border-t border-border pt-4">
          {withQuestions.map((person) => {
            const theirs = ordered.filter((q) => q.targetId === person.id);
            return (
              <section key={person.id}>
                <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                  <h2 className="text-h3 font-medium tracking-tight">
                    {person.name}
                    <span className="ml-2 text-small font-normal text-muted-foreground">
                      {person.role}
                      {!person.met && " · not met"}
                    </span>
                  </h2>
                  <span className="tabular text-small text-muted-foreground">
                    asks {theirs.map((q) => q.askOrder).join(", ")}
                  </span>
                </div>
                <p className="mt-1 text-small measure">
                  <span className="font-medium text-health-watch">Do not: </span>
                  <span className="text-muted-foreground">{person.avoid}</span>
                </p>
                <ol className="mt-3">
                  {theirs.map((q, i) => (
                    <QuestionRow key={q.id} question={q} last={i === theirs.length - 1} />
                  ))}
                </ol>
              </section>
            );
          })}

          {without.map((person) => (
            <section key={person.id}>
              <h2 className="text-h3 font-medium tracking-tight">
                {person.name}
                <span className="ml-2 text-small font-normal text-muted-foreground">
                  {person.role}
                </span>
              </h2>
              <div className="mt-2 rounded-lg border border-dashed border-border-strong bg-muted px-3.5 py-3">
                <p className="text-small font-medium">Nothing to ask them yet</p>
                <p className="mt-0.5 text-small text-muted-foreground measure">
                  They have not come up in either call. That is missing research, not a judgement —
                  they own {person.owns[0].toLowerCase()}.
                </p>
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

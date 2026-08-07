"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";
import { company, questions, stakeholderById, stakeholders } from "@/lib/suvarna";
import { Eyebrow } from "@/components/meridian/Primitives";
import { QuestionRow } from "@/components/meridian/QuestionRow";
import { SummaryStrip } from "@/components/directions/Frames";

/**
 * Questions — actions, not findings.
 *
 * Same component family as Gaps and deliberately the opposite register:
 * no money anywhere, future tense throughout, and the ask order carried as
 * structure rather than as a sort key. "Ask this first, then this" is the part
 * that saves three calls. See data-display-patterns.
 */

type Group = "order" | "person";

export function QuestionsView() {
  const [group, setGroup] = useState<Group>("order");

  const ordered = [...questions].sort((a, b) => a.askOrder - b.askOrder);
  const peopleWithQuestions = stakeholders.filter((s) =>
    questions.some((q) => q.targetId === s.id),
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-3 py-5 sm:px-4">
      <Eyebrow>{company.name} · what to ask on the next call</Eyebrow>
      <h1 className="mt-1.5 font-display text-h1 leading-tight">Eight questions, in this order</h1>
      <p className="mt-2 text-base text-muted-foreground measure">
        Not a checklist. The order is the point — each answer sets up the next question, and asking
        them out of sequence costs you the one that matters. None of these carry a price, because a
        question is something you do, not something you have found.
      </p>

      <div className="mt-4">
        <SummaryStrip
          items={[
            { label: "Questions", value: String(questions.length) },
            { label: "People to ask", value: String(peopleWithQuestions.length) },
            { label: "Already met", value: `${peopleWithQuestions.filter((p) => p.met).length}` },
            { label: "Gaps they test", value: "8 of 12" },
            { label: "Calls this saves", value: "~3" },
          ]}
        />
      </div>

      <div className="mt-5 flex items-center gap-2">
        <span className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
          Arrange by
        </span>
        <div className="flex rounded-md border border-border p-0.5" role="group" aria-label="Arrange by">
          {(
            [
              ["order", "Ask order"],
              ["person", "Who you are asking"],
            ] as const
          ).map(([key, label]) => (
            <button
              key={key}
              type="button"
              aria-pressed={group === key}
              onClick={() => setGroup(key)}
              className={cn(
                "rounded-[5px] px-2.5 py-0.5 text-small",
                group === key ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {group === "order" ? (
        <>
          <p className="mt-5 text-small text-muted-foreground measure">
            Straight through, start to finish. Questions 1 and 2 open on Rohan&apos;s own ground
            before anything moves to Finance — that sequencing is deliberate.
          </p>
          <ol className="mt-4">
            {ordered.map((q, i) => (
              <QuestionRow key={q.id} question={q} last={i === ordered.length - 1} />
            ))}
          </ol>
        </>
      ) : (
        <div className="mt-5 space-y-8">
          {peopleWithQuestions.map((person) => {
            const theirs = ordered.filter((q) => q.targetId === person.id);
            return (
              <section key={person.id}>
                <div className="flex items-baseline justify-between gap-3 border-b border-border pb-2">
                  <div>
                    <h2 className="text-h3 font-medium tracking-tight">{person.name}</h2>
                    <p className="mt-0.5 text-small text-muted-foreground">
                      {person.role}
                      {person.met ? " · met on both calls" : " · not met yet"}
                    </p>
                  </div>
                  <span className="tabular shrink-0 text-small text-muted-foreground">
                    asks {theirs.map((q) => q.askOrder).join(", ")}
                  </span>
                </div>
                <p className="mt-2 text-small text-muted-foreground measure">
                  <span className="font-medium text-health-watch">Do not: </span>
                  {person.avoid}
                </p>
                <ol className="mt-4">
                  {theirs.map((q, i) => (
                    <QuestionRow key={q.id} question={q} last={i === theirs.length - 1} />
                  ))}
                </ol>
              </section>
            );
          })}

          {stakeholders
            .filter((s) => !questions.some((q) => q.targetId === s.id))
            .map((person) => (
              <section key={person.id}>
                <div className="border-b border-border pb-2">
                  <h2 className="text-h3 font-medium tracking-tight">{person.name}</h2>
                  <p className="mt-0.5 text-small text-muted-foreground">{person.role}</p>
                </div>
                <div className="mt-3 rounded-lg border border-dashed border-border-strong bg-muted px-4 py-4">
                  <p className="text-base font-medium">Nothing to ask them yet</p>
                  <p className="mt-1 text-small text-muted-foreground measure">
                    {stakeholderById(person.id).role} has not come up in either call, so there is
                    nothing here. That is an absence of research, not a judgement that they do not
                    matter — {person.name.split(" ")[0]} owns{" "}
                    {person.owns[0].toLowerCase()}, which is worth reaching.
                  </p>
                </div>
              </section>
            ))}
        </div>
      )}

      <section className="mt-10 border-t border-border pt-5">
        <h2 className="text-base font-medium">Why these and not others</h2>
        <p className="mt-1 text-small text-muted-foreground measure">
          Every question here either tests a gap we have priced or unlocks one we cannot price yet.
          Question 8 is a data request rather than a discovery question, which is why it is last —
          it changes the register of the call and there is no way back from it.
        </p>
      </section>
    </div>
  );
}

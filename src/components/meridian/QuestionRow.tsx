"use client";

import { cn } from "@/lib/cn";
import { gapById, stakeholderById, type Question } from "@/lib/suvarna";
import { Disclosure } from "./Primitives";
import { usePanel } from "./EvidencePanel";
import { money } from "@/lib/format";

/**
 * A question is an action, not a finding. Future-tense, sequenced, never priced.
 * It shares FindingCard's structure with GapRow and deliberately shares none of
 * its visual register: no money column, and the ask order is a structural
 * element rather than a sort key, because "ask this first, then this" is the
 * part that saves three calls.
 */

function ordinal(n: number): string {
  const suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
  return `${n}${suffix}`;
}

export function QuestionRow({ question, last = false }: { question: Question; last?: boolean }) {
  const target = stakeholderById(question.targetId);
  const { open } = usePanel();

  return (
    <li className="relative flex gap-4 pb-5 last:pb-0">
      {/* The spine. Order is visible as structure, not inferred from position. */}
      <div className="relative flex w-14 shrink-0 flex-col items-center">
        <span className="z-10 rounded-full border border-border-strong bg-card px-2 py-0.5 text-micro font-medium tabular whitespace-nowrap">
          Ask {ordinal(question.askOrder)}
        </span>
        {!last && <span className="absolute top-6 bottom-[-4px] w-px bg-border" aria-hidden />}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-base font-medium measure">{question.text}</h3>

        {question.gloss && (
          <p className="mt-1 text-small text-muted-foreground measure">{question.gloss}</p>
        )}

        <p className="mt-1.5 text-small">
          <span className="text-muted-foreground">Ask </span>
          <span className="font-medium">{target.name}</span>
          <span className="text-muted-foreground">
            {" "}
            — {target.role}
            {!target.met && " · not met yet"}
          </span>
        </p>

        <div className="mt-2 flex flex-wrap items-center gap-x-5">
          <Disclosure label="Why this matters">
            <p className="text-small measure">{question.whyItMatters}</p>
          </Disclosure>

          <Disclosure label="What the answers tell you">
            <dl className="space-y-2 text-small measure">
              <div>
                <dt className="font-medium">If the answer is weak</dt>
                <dd className="text-muted-foreground">{question.badAnswer}</dd>
              </div>
              <div>
                <dt className="font-medium">If the answer is good</dt>
                <dd className="text-muted-foreground">{question.goodAnswer}</dd>
              </div>
            </dl>
          </Disclosure>
        </div>

        {question.linkedGapIds.length > 0 && (
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-micro text-muted-foreground">Tests:</span>
            {question.linkedGapIds.map((gid) => {
              const gap = gapById(gid);
              return (
                <button
                  key={gid}
                  type="button"
                  onClick={() => open({ kind: "gap", id: gid })}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border border-border bg-card",
                    "px-2 py-0.5 text-micro text-muted-foreground",
                    "hover:border-border-strong hover:text-foreground transition-colors",
                  )}
                >
                  <span className="max-w-[26ch] truncate">{gap.title}</span>
                  <span className="tabular">{money(gap.amountCr)}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </li>
  );
}

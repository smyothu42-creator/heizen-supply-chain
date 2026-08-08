"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/cn";
import { gapById, stakeholderById, type Question } from "@/lib/suvarna";
import { usePanel } from "./EvidencePanel";
import { money } from "@/lib/format";

/**
 * A question is an action, not a finding. Future-tense, sequenced, never priced.
 *
 * Shares FindingCard's structure with GapRow and none of its visual register:
 * no money column, and the ask order is a structural element rather than a
 * sort key, because "ask this first, then this" is the part that saves three
 * calls.
 *
 * Collapsed it is the question and who to ask. Everything about why, and what
 * the answers mean, is one interaction away.
 */

function ordinal(n: number): string {
  const suffix = n === 1 ? "st" : n === 2 ? "nd" : n === 3 ? "rd" : "th";
  return `${n}${suffix}`;
}

export function QuestionRow({ question, last = false }: { question: Question; last?: boolean }) {
  const [open, setOpen] = useState(false);
  const target = stakeholderById(question.targetId);
  const { open: openPanel } = usePanel();
  const id = useId();

  return (
    <li className="relative flex gap-3.5">
      {/* The spine. Order is visible as structure, not inferred from position. */}
      <div className="relative flex w-12 shrink-0 flex-col items-center pt-1.5">
        <span className="z-10 rounded-full border border-border-strong bg-card px-1.5 py-0.5 text-micro font-medium tabular whitespace-nowrap">
          {ordinal(question.askOrder)}
        </span>
        {!last && <span className="absolute bottom-0 top-7 w-px bg-border" aria-hidden />}
      </div>

      <div className="min-w-0 flex-1 pb-4">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((v) => !v)}
          className="group flex w-full items-baseline gap-3 py-1 text-left"
        >
          <span className="min-w-0 flex-1">
            <span className="block text-base group-hover:underline underline-offset-4">
              {question.text}
            </span>
            <span className="mt-0.5 block truncate text-small text-muted-foreground">
              {target.name} · {target.role}
              {!target.met && " · not met"}
            </span>
          </span>
          <span
            aria-hidden
            className={cn(
              "shrink-0 text-muted-foreground transition-transform",
              open && "rotate-90",
            )}
          >
            ›
          </span>
        </button>

        {open && (
          <div id={id} className="mt-1.5 space-y-2.5">
            {question.gloss && (
              <p className="text-small text-muted-foreground measure">{question.gloss}</p>
            )}

            <div>
              <p className="text-micro font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Why this matters
              </p>
              <p className="mt-0.5 text-small measure">{question.whyItMatters}</p>
            </div>

            <dl className="space-y-1.5 text-small measure">
              <div>
                <dt className="inline font-medium">Weak answer — </dt>
                <dd className="inline text-muted-foreground">{question.badAnswer}</dd>
              </div>
              <div>
                <dt className="inline font-medium">Good answer — </dt>
                <dd className="inline text-muted-foreground">{question.goodAnswer}</dd>
              </div>
            </dl>

            {question.linkedGapIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-micro text-muted-foreground">Tests:</span>
                {question.linkedGapIds.map((gid) => {
                  const gap = gapById(gid);
                  return (
                    <button
                      key={gid}
                      type="button"
                      onClick={() => openPanel({ kind: "gap", id: gid })}
                      className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2 py-0.5 text-micro text-muted-foreground hover:border-border-strong hover:text-foreground"
                    >
                      <span className="max-w-[26ch] truncate">{gap.title}</span>
                      <span className="tabular">{money(gap.amountCr)}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

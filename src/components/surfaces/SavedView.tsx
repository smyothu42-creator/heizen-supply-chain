"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { SwitchTrack, switchItemClass } from "@/components/shell/SwitchTrack";
import { StickyBar } from "@/components/shell/StickyBar";
import { Panel } from "@/components/meridian/Primitives";
import { ArrowIcon, CheckIcon, CloseIcon, CopyIcon } from "@/components/meridian/Icons";
import { SAVED_KIND_LABEL, useSaved, type SavedKind } from "@/components/shell/SavedProvider";

/**
 * Saved — everything a consultant has put aside, in one place.
 *
 * **Three tabs, one per kind**, because the three are not interchangeable: a
 * question is something to ask, a finding is something to raise, a section is
 * something to re-read. Merged into one list they would need a badge each to say
 * which, and a badge per row is the thing a tab does once.
 *
 * **The count is on the tab, and a kind with nothing in it still shows.** A tab
 * that appears and disappears as you save things is a row that moves under the
 * pointer; and *0* is a real answer to "what have I saved from Gaps".
 *
 * Every row is a link back to where it came from. This page is a way back, not a
 * copy: the question's follow-ups, the finding's evidence and the section's
 * argument all live on their own surface and none of it is duplicated here.
 */
const TABS: SavedKind[] = ["question", "gap", "research"];

export function SavedView() {
  const { items, countOf, remove, clear } = useSaved();
  const [kind, setKind] = useState<SavedKind>("question");
  const shown = items.filter((i) => i.kind === kind);

  const copyAll = async (): Promise<void> => {
    await navigator.clipboard.writeText(shown.map((i) => i.label).join("\n\n"));
  };

  return (
    <>
      <SurfaceHero title="Saved" />

      <StickyBar className="pt-5 pb-3">
        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-3">
          <SwitchTrack label="Kind">
            {TABS.map((k) => (
              <button
                key={k}
                type="button"
                aria-pressed={kind === k}
                onClick={() => setKind(k)}
                className={switchItemClass(kind === k)}
              >
                {SAVED_KIND_LABEL[k]}
                <span className="ml-1.5 tabular text-muted-foreground">{countOf(k)}</span>
              </button>
            ))}
          </SwitchTrack>

          {shown.length > 0 && (
            <div className="ml-auto flex shrink-0 items-center gap-2 self-center">
              <CopyAll onCopy={copyAll} />
              <button
                type="button"
                onClick={() => clear(kind)}
                className="whitespace-nowrap rounded-md border border-border bg-card px-2.5 py-1.5 text-micro font-medium text-muted-foreground shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground"
              >
                Clear {SAVED_KIND_LABEL[kind].toLowerCase()}
              </button>
            </div>
          )}
        </div>
      </StickyBar>

      <div className="surface-frame under-bar pb-5">
        <Panel>
          {shown.length === 0 ? (
            /* Empty is normal (§7.7), and the line says how to fill it rather
               than apologising for it being empty. */
            <div className="py-2">
              <p className="text-base font-medium">Nothing saved from {SAVED_KIND_LABEL[kind]}</p>
              <p className="reading measure mt-1 text-small text-muted-foreground">
                {kind === "question"
                  ? "Press the bookmark on a question to put it on the list for the call."
                  : kind === "gap"
                    ? "Press the bookmark on a finding to keep it for the conversation you are preparing."
                    : "Press the bookmark on a section heading in Research to come back to it."}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {shown.map((item) => (
                <li
                  key={`${item.kind}:${item.id}`}
                  className="group flex items-start gap-2 py-2.5 first:pt-0 last:pb-0"
                >
                  {/* The label is the link. The row is not: a whole row that
                      navigates would swallow the remove control beside it, and a
                      button inside a link is invalid markup. */}
                  <Link
                    href={item.href}
                    className="reading min-w-0 flex-1 text-small transition-colors hover:text-muted-foreground"
                  >
                    {item.label}
                  </Link>
                  <Link
                    href={item.href}
                    aria-label="Go to it"
                    className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <ArrowIcon />
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(item.kind, item.id)}
                    aria-label="Take off the list"
                    className="mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <CloseIcon />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}

/**
 * The list as text, for the notes app or the meeting invite.
 *
 * It reports its own failure, like every other copy control in the product:
 * `navigator.clipboard` needs a secure context and is absent over plain http, so
 * a button that swallows the press is worse than one that admits what happened.
 */
function CopyAll({ onCopy }: { onCopy: () => Promise<void> }) {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");

  return (
    <button
      type="button"
      onClick={async () => {
        try {
          await onCopy();
          setState("copied");
        } catch {
          setState("failed");
        }
        setTimeout(() => setState("idle"), 2400);
      }}
      className={cn(
        "flex items-center gap-1.5 whitespace-nowrap rounded-md border border-border bg-card px-2.5 py-1.5 text-micro font-medium text-muted-foreground shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground",
        state === "failed" && "text-health-watch",
      )}
    >
      {state === "copied" ? <CheckIcon /> : <CopyIcon />}
      {state === "copied" ? "Copied" : state === "failed" ? "Copy failed" : "Copy all"}
    </button>
  );
}

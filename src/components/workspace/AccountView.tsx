"use client";

import Link from "next/link";
import { useState } from "react";
import { formatDay } from "@/lib/plan";
import { initialsOf } from "@/lib/projects";
import { ROLE_LABEL, ROLE_MEANING } from "@/lib/workspace";
import { useWorkspace } from "@/components/shell/WorkspaceProvider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Field, PageHead, Said } from "./Form";

/**
 * The signed-in person, as their own page.
 *
 * Team is the list of everybody and Settings is the workspace; neither answers
 * *who am I signed in as, and what can I open*. That used to be a two-line row
 * at the foot of a column that no longer exists, which is the wrong place for
 * it twice over: it was the smallest thing in the panel, and the panel was the
 * one piece of chrome a reader could shut.
 *
 * **Designed as real, labelled honestly**, the same rule as the connectors and
 * `RunButton`. Nothing here reaches a server: the name edits in the tab and
 * goes when the tab does, and the page says so once rather than implying a
 * save. There is no sign-out, because there is nothing to sign out of, and a
 * button that admits that in its own disabled tooltip is worse than no button.
 */
export function AccountView() {
  const { me, projects, members, updateMember } = useWorkspace();
  const [name, setName] = useState(me.name ?? "");
  const [said, setSaid] = useState("");

  /* Owners and admins can open everything, so the honest count for them is the
     whole list rather than the ids on their own row. Same rule `TeamView` reads
     assignment by. */
  const mine =
    me.role === "member"
      ? projects.filter((p) => me.projectIds.includes(p.id))
      : projects;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    updateMember(me.id, { name: name.trim() || undefined });
    setSaid("Saved to this tab. There is no server behind it yet, so it goes when the tab does.");
  };

  return (
    <div className="surface-frame py-8">
      <PageHead
        title="Account"
        line="Who you are signed in as, what that lets you open, and which companies you are on."
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section
          aria-labelledby="who-heading"
          className="rounded-lg border border-border bg-card p-5 shadow-card"
        >
          <h2 id="who-heading" className="text-base font-semibold">
            You
          </h2>

          <div className="mt-4 flex items-center gap-3">
            <span
              aria-hidden
              className="grid size-12 shrink-0 place-items-center rounded-full border border-border bg-muted text-base font-semibold uppercase"
            >
              {initialsOf(me.name ?? me.email)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-medium">{me.name ?? me.email}</p>
              <p className="truncate text-small text-muted-foreground">{me.email}</p>
            </div>
          </div>

          {/* The name is the one editable thing. The address is the identity and
              the role is somebody else's decision, so both are stated rather
              than offered — an owner demoting themselves from their own account
              page is a workspace with nobody who can undo it. */}
          <form onSubmit={save} className="mt-5">
            <Field
              label="Display name"
              hint="What the team list and the assistant call you. The address stays what it is."
            >
              {(id) => (
                <Input
                  id={id}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={me.email}
                />
              )}
            </Field>
            <div className="mt-3 flex items-center gap-3">
              <Button type="submit" size="sm" disabled={(me.name ?? "") === name.trim()}>
                Save name
              </Button>
              <Said>{said}</Said>
            </div>
          </form>

          <dl className="mt-5 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
            <div>
              <dt className="text-micro font-medium uppercase tracking-[0.12em] text-muted-foreground">
                Role
              </dt>
              <dd className="mt-0.5 text-small">{ROLE_LABEL[me.role]}</dd>
              <dd className="reading mt-0.5 text-micro text-muted-foreground">
                {ROLE_MEANING[me.role]}
              </dd>
            </div>
            <div>
              <dt className="text-micro font-medium uppercase tracking-[0.12em] text-muted-foreground">
                What you do
              </dt>
              <dd className="mt-0.5 text-small">{me.title}</dd>
              <dd className="mt-0.5 text-micro text-muted-foreground">
                Joined {formatDay(me.joinedOn)}
              </dd>
            </div>
          </dl>
        </section>

        <section
          aria-labelledby="access-heading"
          className="rounded-lg border border-border bg-card p-5 shadow-card"
        >
          <h2 id="access-heading" className="text-base font-semibold">
            What you can open
          </h2>
          <p className="reading mt-1 text-small text-muted-foreground">
            {me.role === "member"
              ? "The projects you have been put on. An admin adds you to the rest."
              : `Everything in the workspace, because you are ${ROLE_LABEL[me.role].toLowerCase()}. ${members.length} people are here.`}
          </p>

          <ul className="mt-4 divide-y divide-border border-t border-border">
            {mine.map((p) => (
              <li key={p.id} className="flex items-center gap-3 py-2.5">
                <span
                  aria-hidden
                  className="grid size-8 shrink-0 place-items-center rounded-md border border-border bg-muted text-micro font-semibold"
                >
                  {initialsOf(p.name)}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-small font-medium">{p.name}</span>
                  <span className="block truncate text-micro text-muted-foreground">
                    {p.sector}
                  </span>
                </span>
                {/* Every one opens, the same as the cards and the switcher. The
                    honest label sits beside the link rather than in place of
                    it. */}
                {!p.researched && (
                  <span className="shrink-0 text-micro text-muted-foreground">
                    No research yet
                  </span>
                )}
                <Link
                  href="/operations"
                  className="shrink-0 text-micro text-evidence transition-colors hover:text-foreground"
                >
                  View
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}

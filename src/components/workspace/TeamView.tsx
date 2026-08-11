"use client";

import { useState } from "react";
import { FolderKanban, Mail, RotateCw, Trash2, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { pluralise } from "@/lib/format";
import { formatDay } from "@/lib/plan";
import { initialsOf } from "@/lib/projects";
import {
  canManage,
  INVITE_EXPIRY_DAYS,
  ROLE_LABEL,
  ROLE_MEANING,
  ROLES,
  type Invitation,
  type Member,
  type Role,
} from "@/lib/workspace";
import { TODAY, useWorkspace } from "@/components/shell/WorkspaceProvider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Checkbox } from "@/components/shell/Checkbox";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog, Field, PageHead, Said } from "./Form";

/**
 * Who is in the workspace, what they may do, and what they can open.
 *
 * Three questions, and the surface keeps them apart because they answer to
 * different people: the *role* is what an admin decides, the *projects* are
 * what a project lead decides, and the *invitation* is a thing in flight that
 * neither has yet.
 *
 * **The role is a dropdown and the projects are a dialog**, which is the split
 * the production app makes and it is the right one. A role is one value out of
 * three and belongs on the row; project access is a tick-list that can run to
 * thirty and would bury the person it is about.
 */
export function TeamView() {
  const { members, invitations, me } = useWorkspace();
  const [said, setSaid] = useState("");
  const [inviting, setInviting] = useState(false);

  const manage = canManage(me.role);

  return (
    <div className="surface-frame py-8">
      <PageHead
        title="Team"
        line="Who is here, and what they can open."
      >
        {manage && (
          <Button onClick={() => setInviting(true)}>
            <Mail className="size-4" />
            Invite someone
          </Button>
        )}
      </PageHead>

      {said && (
        <div className="mt-3">
          <Said>{said}</Said>
        </div>
      )}

      {/* Invitations first, and only when there are any. They are the thing in
          flight: a list of people who are already here does not need chasing
          and a list of people who have not answered does. */}
      {invitations.length > 0 && (
        <section className="mt-6" aria-labelledby="invites-heading">
          {/* No standfirst. It explained the {INVITE_EXPIRY_DAYS}-day window in
              two sentences, and the only row it applies to says *past its week*
              on itself. A rule stated in prose above a list that states it per
              row is the same read twice. */}
          <h2 id="invites-heading" className="text-base font-semibold">
            Waiting on an answer
          </h2>
          <ul className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-card">
            {invitations.map((invitation) => (
              <li key={invitation.id}>
                <InvitationRow
                  invitation={invitation}
                  manage={manage}
                  onSaid={setSaid}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6" aria-labelledby="members-heading">
        {/* The three-sentence role gloss came off. Settings has a section that
            does nothing but set the roles out in full, and repeating it above
            the list where roles are *changed* made this page carry the
            explanation twice. */}
        <h2 id="members-heading" className="text-base font-semibold">
          {members.length} people
        </h2>
        <ul className="mt-3 divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-card">
          {members.map((member) => (
            <li key={member.id}>
              <MemberRow member={member} manage={manage} onSaid={setSaid} />
            </li>
          ))}
        </ul>
      </section>

      <InviteDialog
        open={inviting}
        onOpenChange={setInviting}
        onSent={(email) =>
          setSaid(`Invitation listed for ${email}. No mail was sent.`)
        }
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function MemberRow({
  member,
  manage,
  onSaid,
}: {
  member: Member;
  manage: boolean;
  onSaid: (s: string) => void;
}) {
  const { me, projects, updateMemberRole, removeMember } = useWorkspace();
  const [projectsOpen, setProjectsOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const isMe = member.id === me.id;
  const isOwner = member.role === "owner";
  /* An owner is not demoted or removed from a list. It is the one role that can
     lock everybody out of the workspace by mistake, and the last owner leaving
     is a workspace nobody can administer. */
  const editable = manage && !isOwner && !isMe;
  const seesEverything = canManage(member.role);
  const count = seesEverything ? projects.length : member.projectIds.length;

  return (
    <div className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-muted text-small font-medium uppercase"
        >
          {initialsOf(member.name ?? member.email)}
        </span>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2">
            {/* The name where there is one, the address where there is not. No
                display name is invented from an email: that is the rule the
                project menu's account row already keeps. */}
            <span className="truncate text-small font-medium">
              {member.name ?? member.email}
            </span>
            {isMe && (
              <Badge variant="secondary" className="shrink-0">
                You
              </Badge>
            )}
            {isOwner && (
              <Badge variant="outline" className="shrink-0">
                Owner
              </Badge>
            )}
          </p>
          {/* Address and job, and not the join date. On a list of five people
              it is a third fact nobody scans for, and it is on the person's own
              Account page. */}
          <p className="truncate text-micro text-muted-foreground">
            {member.name ? `${member.email} · ` : ""}
            {member.title}
          </p>
        </div>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => setProjectsOpen(true)}>
          <FolderKanban className="size-4" />
          {seesEverything ? `All ${count}` : pluralise(count, "project", "projects")}
        </Button>

        {editable ? (
          <div className="w-[8.5rem]">
            <label htmlFor={`role-${member.id}`} className="sr-only">
              Role for {member.name ?? member.email}
            </label>
            <SelectNative
              id={`role-${member.id}`}
              value={member.role}
              onChange={(e) => {
                const role = e.target.value as Role;
                updateMemberRole(member.id, role);
                onSaid(
                  `${member.name ?? member.email} is now ${ROLE_LABEL[role].toLowerCase()}. ${ROLE_MEANING[role]}`,
                );
              }}
            >
              {ROLES.filter((r) => r !== "owner").map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABEL[r]}
                </option>
              ))}
            </SelectNative>
          </div>
        ) : (
          <span className="px-1 text-micro text-muted-foreground">
            {ROLE_LABEL[member.role]}
          </span>
        )}

        {editable && (
          <button
            type="button"
            onClick={() => setConfirmRemove(true)}
            aria-label={`Remove ${member.name ?? member.email}`}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-health-critical"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <MemberProjectsDialog
        member={member}
        open={projectsOpen}
        onOpenChange={setProjectsOpen}
      />

      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={`Remove ${member.name ?? member.email}?`}
        description="They lose every project they are on. Anything they wrote stays."
        confirmLabel="Remove"
        onConfirm={() => {
          removeMember(member.id);
          onSaid(`${member.name ?? member.email} removed from the workspace.`);
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Which projects one person can open.
 *
 * **An owner or an admin sees the whole list and the boxes are not offered**,
 * because ticking one would say something untrue: their access does not come
 * from this list. Saying so beats a row of ticked boxes nobody may untick.
 */
function MemberProjectsDialog({
  member,
  open,
  onOpenChange,
}: {
  member: Member;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { projects, toggleMemberProject } = useWorkspace();
  const everything = canManage(member.role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>What {member.name ?? member.email} can open</DialogTitle>
          <DialogDescription>
            {everything
              ? `${ROLE_LABEL[member.role]}s see every project in the workspace.`
              : "Tick a project and it appears in their switcher."}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <ul className="space-y-2">
            {projects.map((project) => {
              const on = everything || member.projectIds.includes(project.id);
              return (
                <li key={project.id}>
                  <label
                    className={cn(
                      "flex items-center gap-3 rounded-lg border border-border px-3 py-2.5 transition-colors",
                      everything ? "opacity-70" : "cursor-pointer hover:bg-muted",
                    )}
                  >
                    {everything ? (
                      <span
                        aria-hidden
                        className="size-[1.125rem] shrink-0 rounded-[5px] border border-border-strong bg-muted"
                      />
                    ) : (
                      <Checkbox
                        checked={on}
                        onChange={() => toggleMemberProject(member.id, project.id)}
                        label={`${project.name} for ${member.name ?? member.email}`}
                      />
                    )}
                    <span className="min-w-0">
                      <span className="block truncate text-small font-medium">
                        {project.name}
                      </span>
                      <span className="block truncate text-micro text-muted-foreground">
                        {project.sector}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          {projects.length === 0 && (
            <p className="py-6 text-center text-small text-muted-foreground">
              Create a project before deciding who can open it.
            </p>
          )}
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */

function InvitationRow({
  invitation,
  manage,
  onSaid,
}: {
  invitation: Invitation;
  manage: boolean;
  onSaid: (s: string) => void;
}) {
  const { cancelInvitation, resendInvitation } = useWorkspace();
  const days = daysBetween(invitation.sentOn, TODAY);
  const stale = days > INVITE_EXPIRY_DAYS;

  return (
    <div className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-small font-medium">{invitation.email}</p>
        <p className="text-micro text-muted-foreground">
          {ROLE_LABEL[invitation.role]} · sent {formatDay(invitation.sentOn)}
          {stale && " · past its week"}
        </p>
      </div>
      {manage && (
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              resendInvitation(invitation.id);
              onSaid(`Invitation to ${invitation.email} dated today. Still no mail sent.`);
            }}
          >
            <RotateCw className="size-4" />
            Send again
          </Button>
          <button
            type="button"
            onClick={() => {
              cancelInvitation(invitation.id);
              onSaid(`Invitation to ${invitation.email} cancelled.`);
            }}
            aria-label={`Cancel the invitation to ${invitation.email}`}
            className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-health-critical"
          >
            <X className="size-4" />
          </button>
        </div>
      )}
    </div>
  );
}

/** Whole days between two ISO dates, in UTC. Same reckoning as the plan. */
function daysBetween(from: string, to: string): number {
  const a = new Date(`${from}T00:00:00Z`).getTime();
  const b = new Date(`${to}T00:00:00Z`).getTime();
  return Math.round((b - a) / 86_400_000);
}

/* -------------------------------------------------------------------------- */

function InviteDialog({
  open,
  onOpenChange,
  onSent,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSent: (email: string) => void;
}) {
  const { invite, members, invitations } = useWorkspace();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const address = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setError("That is not an address anyone could answer.");
      return;
    }
    if (members.some((m) => m.email === address)) {
      setError("They are already in the workspace.");
      return;
    }
    if (invitations.some((i) => i.email === address)) {
      setError("An invitation is already out to them. Send it again from the list.");
      return;
    }
    invite(address, role);
    onSent(address);
    setEmail("");
    setRole("member");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Invite someone</DialogTitle>
          <DialogDescription>
            Which projects they can open is set on their row afterwards.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="contents">
          <DialogBody className="space-y-4">
            <Field label="Email" required error={error}>
              {(id) => (
                <Input
                  id={id}
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@heizen.work"
                  autoFocus
                />
              )}
            </Field>

            <Field label="Role" hint={ROLE_MEANING[role]}>
              {(id) => (
                <SelectNative
                  id={id}
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                >
                  {ROLES.filter((r) => r !== "owner").map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </SelectNative>
              )}
            </Field>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Send invitation</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

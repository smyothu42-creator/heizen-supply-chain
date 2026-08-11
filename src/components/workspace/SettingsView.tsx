"use client";

import { useState } from "react";
import { Upload } from "lucide-react";
import { initialsOf } from "@/lib/projects";
import { canManage, ROLE_LABEL, ROLE_MEANING, ROLES } from "@/lib/workspace";
import { useWorkspace } from "@/components/shell/WorkspaceProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, PageHead, Said } from "./Form";

/**
 * The workspace itself: what it is called, what it looks like, and the one
 * button that ends it.
 *
 * Three blocks, and the order is the argument: the thing everybody sees, the
 * thing that explains who may change it, and then the thing nobody should press
 * by accident. Danger last, in its own frame, is the only arrangement where the
 * dangerous control is never the first one under the cursor.
 */
export function SettingsView() {
  const { organisation, updateOrganisation, me, projects, members } = useWorkspace();
  const [name, setName] = useState(organisation.name);
  const [line, setLine] = useState(organisation.line);
  const [logo, setLogo] = useState<string | undefined>(organisation.logoUrl);
  const [said, setSaid] = useState("");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);

  const manage = canManage(me.role);
  const dirty =
    name !== organisation.name || line !== organisation.line || logo !== organisation.logoUrl;

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("A workspace with no name is one nobody can find.");
      return;
    }
    setError("");
    updateOrganisation({ name: name.trim(), line: line.trim(), logoUrl: logo });
    setSaid("Saved to this tab. There is no server behind it yet, so it goes when the tab does.");
  };

  const pickLogo = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => setLogo(reader.result as string);
    reader.readAsDataURL(file);
  };

  return (
    <div className="surface-frame py-8">
      <PageHead
        title="Settings"
        line="What this workspace is called and who is allowed to change it. One workspace, and everything in the product sits under it."
      />

      {!manage && (
        <p className="mt-5 rounded-lg border border-border bg-muted px-4 py-3 text-small text-muted-foreground">
          You can read this page. Changing it is an owner or admin job.
        </p>
      )}

      <section
        aria-labelledby="identity-heading"
        className="mt-6 rounded-lg border border-border bg-card p-5 shadow-card"
      >
        <h2 id="identity-heading" className="text-base font-semibold">
          Workspace
        </h2>
        <p className="mt-1 text-small text-muted-foreground">
          The name is on the side panel and on anything that leaves the product.
        </p>

        <form onSubmit={save} className="mt-4 space-y-5">
          {/* The mark, and the file that replaces it. A monogram until there is
              a real logo, which is the same rule the project switcher keeps:
              designed as real, one field away from being the real thing. */}
          <div className="flex flex-wrap items-center gap-4">
            {logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logo}
                alt=""
                className="size-14 shrink-0 rounded-lg border border-border object-cover"
              />
            ) : (
              <span
                aria-hidden
                className="grid size-14 shrink-0 place-items-center rounded-lg bg-primary text-lead font-semibold text-primary-foreground"
              >
                {initialsOf(name || organisation.name)}
              </span>
            )}
            <div className="min-w-0">
              <label
                className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-border-strong bg-card px-3 py-2 text-small font-medium shadow-card transition-colors hover:bg-muted"
                htmlFor="workspace-logo"
              >
                <Upload className="size-4" />
                Choose a logo
              </label>
              <input
                id="workspace-logo"
                type="file"
                accept="image/*"
                disabled={!manage}
                onChange={(e) => pickLogo(e.target.files?.[0])}
                className="sr-only"
              />
              <p className="mt-1.5 text-micro text-muted-foreground">
                Square reads best. It is not uploaded anywhere: the file stays in
                this browser.
              </p>
              {logo && (
                <button
                  type="button"
                  onClick={() => setLogo(undefined)}
                  className="mt-1 text-micro text-evidence transition-colors hover:text-foreground"
                >
                  Use the monogram instead
                </button>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required error={error}>
              {(id) => (
                <Input
                  id={id}
                  value={name}
                  disabled={!manage}
                  onChange={(e) => setName(e.target.value)}
                />
              )}
            </Field>

            {/* Read only, and it says why rather than being greyed out with no
                explanation. A disabled box with no reason reads as broken. */}
            <Field
              label="Address"
              hint="Fixed when the workspace was made. Changing it would break every link anybody has saved."
            >
              {/* `readOnly`, not `disabled`. A disabled box is greyed to half
                  strength and reads as a field that failed to load. This one is
                  a fact the reader may want to copy, so it stays legible and
                  stays selectable, and the hint under it says why it is fixed. */}
              {(id) => (
                <Input
                  id={id}
                  value={organisation.slug}
                  readOnly
                  className="bg-muted text-muted-foreground"
                />
              )}
            </Field>

            <Field
              label="What this team does"
              className="sm:col-span-2"
              hint="One line. It sits under the name wherever the workspace is introduced."
            >
              {(id) => (
                <Textarea
                  id={id}
                  rows={2}
                  value={line}
                  disabled={!manage}
                  onChange={(e) => setLine(e.target.value)}
                />
              )}
            </Field>
          </div>

          {manage && (
            <div className="flex flex-wrap items-center gap-3">
              <Button type="submit" disabled={!dirty}>
                Save changes
              </Button>
              {dirty && (
                <button
                  type="button"
                  onClick={() => {
                    setName(organisation.name);
                    setLine(organisation.line);
                    setLogo(organisation.logoUrl);
                    setSaid("");
                  }}
                  className="text-small text-muted-foreground transition-colors hover:text-foreground"
                >
                  Put it back
                </button>
              )}
              <Said>{said}</Said>
            </div>
          )}
        </form>
      </section>

      {/* Who may do what, glossed once, where the roles are actually assigned
          from. §7.6: where a term must appear, gloss it inline rather than in a
          tooltip. Three nouns with no glosses is a guess in a dropdown. */}
      <section
        aria-labelledby="roles-heading"
        className="mt-5 rounded-lg border border-border bg-card p-5 shadow-card"
      >
        <h2 id="roles-heading" className="text-base font-semibold">
          What each role may do
        </h2>
        <dl className="mt-3 space-y-3">
          {ROLES.map((role) => (
            <div key={role} className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
              <dt className="w-24 shrink-0 text-small font-medium">{ROLE_LABEL[role]}</dt>
              <dd className="reading text-small text-muted-foreground">
                {ROLE_MEANING[role]}
              </dd>
            </div>
          ))}
        </dl>
        <p className="mt-3 text-micro text-muted-foreground">
          {members.length} people, {projects.length} projects. Roles are set on the
          Team page.
        </p>
      </section>

      {manage && (
        <section
          aria-labelledby="danger-heading"
          className="mt-5 rounded-lg border border-health-critical bg-health-critical-surface p-5"
        >
          <h2 id="danger-heading" className="text-base font-semibold text-health-critical">
            Delete this workspace
          </h2>
          <p className="reading mt-1 max-w-[46rem] text-small text-muted-foreground">
            Every project goes with it, and every source, map, dossier, gap and
            question inside them. The {members.length} people here lose access the
            moment it happens.
          </p>
          <Button
            variant="destructive"
            className="mt-3"
            onClick={() => setDeleting(true)}
          >
            Delete workspace
          </Button>
        </section>
      )}

      <DeleteWorkspaceDialog
        open={deleting}
        onOpenChange={setDeleting}
        name={organisation.name}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Type the name to confirm, and then it will not do it.
 *
 * **This is the one control in the workspace that is designed as real and
 * refuses to act**, and it says so on the button rather than swallowing the
 * press. The rule the download menu records is that a control which appears to
 * work and does nothing is worse than one that admits what it is; a control
 * that really did delete the only research set in a prototype would be worse
 * than either.
 *
 * The type-to-confirm is not decoration. It is the shape the real thing has to
 * have, and building it now means the day it is wired the only change is what
 * the last button calls.
 */
function DeleteWorkspaceDialog({
  open,
  onOpenChange,
  name,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  name: string;
}) {
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === name;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setTyped("");
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Delete {name}</DialogTitle>
          <DialogDescription>
            This removes the workspace and everything under it. There is no undo and
            no copy kept.
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          <Field
            label={`Type ${name} to confirm`}
            hint="Slow enough to think about, which is the point of it."
          >
            {(id) => (
              <Input
                id={id}
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                placeholder={name}
                autoFocus
              />
            )}
          </Field>

          <p className="mt-4 rounded-md border border-border bg-muted px-3 py-2 text-micro text-muted-foreground">
            Nothing behind this is wired up. The form is here because it is the
            shape the real one has to have, and the day there is a server the only
            change is what the button calls.
          </p>
        </DialogBody>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" disabled={!matches}>
            Delete workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

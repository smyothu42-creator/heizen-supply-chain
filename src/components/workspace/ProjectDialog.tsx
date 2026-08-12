"use client";

import { useState } from "react";
import type { Project } from "@/lib/projects";
import { useWorkspace, type ProjectDraft } from "@/components/shell/WorkspaceProvider";
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
import { Field } from "./Form";

/**
 * The project form, for making one and for correcting one.
 *
 * **One component and one prop, not two dialogs.** `project` present is an
 * edit, absent is a creation: the same six fields in the same order, and only
 * the verb changes. That is the argument `GapPanel` already makes about the
 * add-and-edit drawer on Gaps, and the reason is the same — a
 * `CreateProjectDialog` beside an `EditProjectDialog` is where the two quietly
 * drift apart, and this form is the one place the *research inputs* §5 lists
 * are collected.
 *
 * **What is editable is what a consultant observed, not what the pipeline
 * decided.** The six inputs are all things a person typed and a first call
 * routinely changes: the domain nobody had, the revenue that turned out to be
 * group rather than entity, the stakeholder whose name was spelled from
 * memory. The project's *status* and whether it has been researched are not
 * here at all — they are readings, and §5's rule against hand-editing output is
 * about exactly those. Correcting a reading is the assistant's job.
 *
 * **Mounted and unmounted by the caller rather than held open with a prop.** A
 * half-typed project has to be gone when the dialog reopens, and resetting that
 * on an `open` prop is a `setState` inside an effect, which `pnpm lint`
 * rejects. Editing needs the same trick one level finer: the caller passes
 * `key={project.id}`, or pressing edit on a second card while the first is open
 * keeps the first card's text in the boxes.
 */
export function ProjectDialog({
  open,
  onOpenChange,
  project,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Present for an edit. Absent for a creation. */
  project?: Project;
  onSaved: (name: string) => void;
}) {
  const { createProject, updateProject } = useWorkspace();
  const editing = project !== undefined;

  const [draft, setDraft] = useState<ProjectDraft>({
    name: project?.name ?? "",
    sector: project?.sector ?? "",
    domain: project?.domain ?? "",
    stakeholders: project?.stakeholders ?? "",
    prompt: project?.prompt ?? "",
  });
  /* Revenue is a string in the form and a number on the record. A box that
     holds a number cannot express "typed nothing" and "typed a word" as
     different states, and both have to be told apart before it is saved. */
  const [revenue, setRevenue] = useState(
    project?.revenueCr === undefined ? "" : String(project.revenueCr),
  );
  const [errors, setErrors] = useState<{ name?: string; sector?: string; revenue?: string }>({});

  const set = (patch: Partial<ProjectDraft>) => setDraft((d) => ({ ...d, ...patch }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!draft.name.trim()) next.name = "A project is a company. Name it.";
    if (!draft.sector.trim()) next.sector = "The sector is what the benchmark is drawn from.";
    if (revenue.trim() && !Number.isFinite(Number(revenue)))
      next.revenue = "Digits only. The unit is crores.";
    setErrors(next);
    if (Object.keys(next).length > 0) return;

    const patch: ProjectDraft = {
      ...draft,
      revenueCr: revenue.trim() ? Number(revenue) : undefined,
    };

    if (editing) {
      updateProject(project.id, patch);
      onSaved(patch.name.trim());
    } else {
      onSaved(createProject(patch).name);
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit project" : "New project"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "The inputs the research runs on. What the pipeline found is not edited here."
              : "Sources go in afterwards, on the Sources surface."}
          </DialogDescription>
        </DialogHeader>

        {/* The form is the scrolling middle, so the two buttons stay reachable
            on a phone however long the prompt box gets.

            **Five of the six hints came off, on request, and the reason is not
            only volume.** A hint under every box is a grey paragraph under
            every box, and in a two-column grid it is worse than that: the hints
            were one line, two lines and none, so the two columns stopped lining
            up and the rows read as ragged. Take them off and the grid is a grid
            again. The unit moved into the label — `Annual revenue (₹ crore)` —
            because it is the one piece of hint text a wrong answer depends on,
            and a unit belongs on the label rather than under the box, where it
            is read after the number has been typed. One hint survives, on *What
            to look at*, because it is the only field whose shape is genuinely
            ambiguous: a box that takes a sentence looks exactly like a box that
            takes a search. */}
        <form onSubmit={submit} className="contents">
          <DialogBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Company" required error={errors.name}>
                {(id) => (
                  <Input
                    id={id}
                    value={draft.name}
                    onChange={(e) => set({ name: e.target.value })}
                    placeholder="Suvarna Agro Foods"
                    autoFocus
                  />
                )}
              </Field>

              <Field label="Sector" required error={errors.sector}>
                {(id) => (
                  <Input
                    id={id}
                    value={draft.sector}
                    onChange={(e) => set({ sector: e.target.value })}
                    placeholder="Agri-processing and packaged foods"
                  />
                )}
              </Field>

              <Field label="Website">
                {(id) => (
                  <Input
                    id={id}
                    value={draft.domain ?? ""}
                    onChange={(e) => set({ domain: e.target.value })}
                    placeholder="suvarnaagro.in"
                  />
                )}
              </Field>

              <Field label="Annual revenue (₹ crore)" error={errors.revenue}>
                {(id) => (
                  <Input
                    id={id}
                    inputMode="numeric"
                    value={revenue}
                    onChange={(e) => setRevenue(e.target.value)}
                    placeholder="1150"
                  />
                )}
              </Field>

              <Field label="Stakeholders you know" className="sm:col-span-2">
                {(id) => (
                  <Input
                    id={id}
                    value={draft.stakeholders ?? ""}
                    onChange={(e) => set({ stakeholders: e.target.value })}
                    placeholder="Rohan Deshmukh, Head of Procurement"
                  />
                )}
              </Field>

              <Field
                label="What to look at"
                className="sm:col-span-2"
                hint="Not a search query. A line that biases the research."
              >
                {(id) => (
                  <Textarea
                    id={id}
                    rows={3}
                    value={draft.prompt ?? ""}
                    onChange={(e) => set({ prompt: e.target.value })}
                    placeholder="Procure-to-pay and vendor onboarding. Three plants, one ERP."
                  />
                )}
              </Field>
            </div>
          </DialogBody>

          {/* Two buttons and nothing else. The honesty note this product puts
              beside anything designed-as-real is said one line up in the
              dialog's own description, and again by the card in the list. */}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">{editing ? "Save changes" : "Create project"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

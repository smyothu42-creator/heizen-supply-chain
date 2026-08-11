"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Globe, Plus, Trash2, Users } from "lucide-react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { formatDay } from "@/lib/plan";
import { initialsOf, type Project } from "@/lib/projects";
import { canManage } from "@/lib/workspace";
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
import { ConfirmDialog, Field, PageHead, Said } from "./Form";

/**
 * The projects list, and the form that makes one.
 *
 * **Project-first creation, which CLAUDE.md §5 records as settled**: you create
 * the project and *then* ingest sources into it. That is why this form asks for
 * a company and a sector and not for a file. It survives a failed upload, and a
 * consultant can open a project before there is anything in it.
 *
 * The fields are the research inputs §5 lists, and no others. There is no price
 * box: a rupee figure typed into a form has no base, no rate and no range,
 * which is §7.11 in one sentence. Revenue is here because it is the base the
 * pipeline reports *against*, stated by the client rather than claimed by us.
 */
export function ProjectsView() {
  const { projects, me, currentProjectId, setCurrentProject, deleteProject } = useWorkspace();
  const [creating, setCreating] = useState(false);
  const [said, setSaid] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  const manage = canManage(me.role);

  return (
    <div className="surface-frame py-8">
      <PageHead
        title="Projects"
        line="One project per company. Create it first, then put sources in it. Only the researched one has anything behind it in this prototype."
      >
        {manage && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="size-4" />
            New project
          </Button>
        )}
      </PageHead>

      {said && (
        <div className="mt-3">
          <Said>{said}</Said>
        </div>
      )}

      <ul className="mt-5 grid gap-4 lg:grid-cols-2">
        {projects.map((project) => (
          /* `min-w-0` on the grid item, not only inside the card. A grid track
             is `minmax(auto, 1fr)`, so one nowrap string deep inside the card
             widened the column past the frame and the page scrolled sideways at
             375. Same failure the flex rows in this product keep hitting, one
             layout system across. */
          <li key={project.id} className="min-w-0">
            <ProjectCard
              project={project}
              open={project.id === currentProjectId}
              canDelete={manage && projects.length > 1}
              onOpen={() => setCurrentProject(project.id)}
              onDelete={() => setPendingDelete(project)}
            />
          </li>
        ))}
      </ul>

      {projects.length === 0 && (
        <p className="mt-6 rounded-lg border border-dashed border-border px-4 py-10 text-center text-small text-muted-foreground">
          No projects. Create one and the six surfaces have something to be about.
        </p>
      )}

      <CreateProjectDialog
        open={creating}
        onOpenChange={setCreating}
        onCreated={(name) =>
          setSaid(
            `${name} created. Nothing is saved anywhere: this prototype keeps it in the tab.`,
          )
        }
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(v) => !v && setPendingDelete(null)}
        title={pendingDelete ? `Delete ${pendingDelete.name}?` : "Delete project?"}
        description="Everything ingested under it goes too: the sources, the map, the dossier, the gaps and the questions. Nobody keeps a copy."
        confirmLabel="Delete project"
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteProject(pendingDelete.id);
          setSaid(`${pendingDelete.name} deleted.`);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ProjectCard({
  project,
  open,
  canDelete,
  onOpen,
  onDelete,
}: {
  project: Project;
  open: boolean;
  canDelete: boolean;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const router = useRouter();

  return (
    /* A card, because these are separate things side by side, which is the one
       condition the theme note says a card is for. The left edge carries the
       primary in a 3px rule on the project that is currently loaded: the list
       is short and the switcher in the masthead is far away, so which one you
       are *in* has to be readable from here without counting. */
    <div
      className={cn(
        "flex h-full flex-col rounded-lg border border-border bg-card shadow-card transition-colors hover:border-border-strong",
        open && "border-l-[3px] border-l-primary",
      )}
    >
      <div className="flex items-start gap-3 px-4 pt-4">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-muted text-small font-semibold"
        >
          {initialsOf(project.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold leading-tight">{project.name}</h2>
          <p className="mt-0.5 truncate text-small text-muted-foreground">{project.sector}</p>
        </div>
        {canDelete && (
          <button
            type="button"
            onClick={onDelete}
            aria-label={`Delete ${project.name}`}
            className="-mr-1 -mt-1 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-health-critical"
          >
            <Trash2 className="size-4" />
          </button>
        )}
      </div>

      <p className="reading mt-3 px-4 text-small text-muted-foreground">{project.status}</p>

      {project.prompt && (
        <p className="mt-2 px-4 text-micro text-muted-foreground">
          Research prompt: {project.prompt}
        </p>
      )}

      {/* The three facts a list of projects has to carry to be read by eye:
          how big the company is, where it lives, and when we started. */}
      <dl className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 px-4 text-micro text-muted-foreground">
        <span className="flex max-w-full min-w-0 items-center gap-1.5">
          <dt className="sr-only">Annual revenue</dt>
          <dd className="tabular-nums">
            {project.revenueCr ? `${money(project.revenueCr)} revenue` : "Revenue not stated"}
          </dd>
        </span>
        <span className="flex max-w-full min-w-0 items-center gap-1.5">
          <Globe className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Website</dt>
          <dd className="truncate">{project.domain ?? "No site given"}</dd>
        </span>
        <span className="flex max-w-full min-w-0 items-center gap-1.5">
          <Users className="size-3.5 shrink-0" aria-hidden />
          <dt className="sr-only">Known stakeholders</dt>
          <dd className="truncate">{project.stakeholders ?? "Nobody named yet"}</dd>
        </span>
      </dl>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
        <span className="text-micro text-muted-foreground">
          Created {formatDay(project.createdOn)}
        </span>
        {/* **Every project opens**, on request, and the label is the same on all
            of them: one verb, so the list has one action rather than a button
            on some rows and a grey excuse on the others.

            The honest label has moved rather than gone. It used to be an
            unpressable *No research yet* in this corner; it is now a line
            beside the button, so a card still says whether there is anything
            behind it before you press. The page's own standfirst says the same
            thing once for the whole list. */}
        <div className="flex items-center gap-3">
          {!project.researched && (
            <span className="text-micro text-muted-foreground">No research yet</span>
          )}
          {/* Filled on every card, including the one already loaded. It was an
              outline there, on the argument that the current project is a
              different act; but nine cards in a grid with one button in a
              different weight reads as one row being special rather than as one
              row being where you are. The 3px primary rule on the card's left
              edge already says that, and says it without changing the action. */}
          <Button
            size="sm"
            onClick={() => {
              onOpen();
              router.push("/operations");
            }}
          >
            View project
          </Button>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

const EMPTY: ProjectDraft = { name: "", sector: "" };

function CreateProjectDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreated: (name: string) => void;
}) {
  const { createProject } = useWorkspace();
  const [draft, setDraft] = useState<ProjectDraft>(EMPTY);
  const [revenue, setRevenue] = useState("");
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

    const created = createProject({
      ...draft,
      revenueCr: revenue.trim() ? Number(revenue) : undefined,
    });
    onCreated(created.name);
    setDraft(EMPTY);
    setRevenue("");
    setErrors({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
          <DialogDescription>
            The company, the sector, and anything you already know. Sources go in
            afterwards, on the Sources surface.
          </DialogDescription>
        </DialogHeader>

        {/* The form is the scrolling middle, so the two buttons stay reachable
            on a phone however long the prompt box gets. */}
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

              <Field
                label="Sector"
                required
                error={errors.sector}
                hint="What best in class is measured against."
              >
                {(id) => (
                  <Input
                    id={id}
                    value={draft.sector}
                    onChange={(e) => set({ sector: e.target.value })}
                    placeholder="Agri-processing and packaged foods"
                  />
                )}
              </Field>

              <Field label="Website" hint="Read first when there is one.">
                {(id) => (
                  <Input
                    id={id}
                    value={draft.domain ?? ""}
                    onChange={(e) => set({ domain: e.target.value })}
                    placeholder="suvarnaagro.in"
                  />
                )}
              </Field>

              <Field
                label="Annual revenue"
                error={errors.revenue}
                hint="In ₹ crore. The base every leakage figure is a share of."
              >
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

              <Field
                label="Stakeholders you know"
                className="sm:col-span-2"
                hint="Names and roles, as loosely as you have them. A first call is loose."
              >
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
                hint="A line that biases the research. Not a search query."
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

            <p className="mt-4 rounded-md border border-border bg-muted px-3 py-2 text-micro text-muted-foreground">
              Creating a project does not run the research. This prototype carries
              one research set and nothing is sent anywhere.
            </p>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Create project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

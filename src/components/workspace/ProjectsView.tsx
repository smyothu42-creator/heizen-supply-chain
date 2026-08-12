"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
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
  const {
    projects,
    me,
    currentProjectId,
    setCurrentProject,
    deleteProject,
    newProjectAsked,
    clearNewProjectAsk,
  } = useWorkspace();
  const [creating, setCreating] = useState(false);
  const [said, setSaid] = useState("");
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);

  const manage = canManage(me.role);

  /* *New project* in the switcher routes here and wants the form open on
     arrival.

     **Derived during render, not set in an effect.** Opening it from the flag
     inside a `useEffect` is a `setState` inside one, which `pnpm lint` rejects
     and which would also paint the page once with the dialog shut. The flag is
     cleared when the dialog closes, which is the only moment it has stopped
     being true. */
  const showCreate = creating || (newProjectAsked && manage);
  const setCreate = (v: boolean) => {
    setCreating(v);
    if (!v) clearNewProjectAsk();
  };

  return (
    <div className="surface-frame py-8">
      <PageHead
        title="Projects"
        /* Three sentences, now one. The prototype caveat went because every
           card without research already says so in its own footer, and a
           standfirst that repeats what the list underneath it states six times
           is the same read twice. */
        line="One project per company. Create it, then add sources."
      >
        {manage && (
          <Button onClick={() => setCreate(true)}>
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
        open={showCreate}
        onOpenChange={setCreate}
        onCreated={(name) => setSaid(`${name} created. It lives in this tab only.`)}
      />

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(v) => !v && setPendingDelete(null)}
        title={pendingDelete ? `Delete ${pendingDelete.name}?` : "Delete project?"}
        description="The sources, the map, the dossier, the gaps and the questions go with it. Nobody keeps a copy."
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
       are *in* has to be readable from here without counting.

       **Every card is the same height, and `h-full` is only half of that.**
       `h-full` equalises a card against its *row*, which is what a grid
       already does; it does nothing across rows, so with a one-line status
       above and a two-line one below the list stepped. Each block on the card
       is now a fixed number of lines — name and sector truncate to one each,
       the status clamps to two — so the height is the same everywhere and
       there is nothing left for `mt-auto` to absorb. If a block is ever added
       that can wrap, it has to be capped the same way or this goes back. */
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

      {/* One line, and it is the only thing on the card that differs by more
          than a name: where this project has got to. The research prompt and
          the stakeholder line used to sit under it and both came off. They are
          the *inputs the consultant typed*, echoed back at him on a screen
          whose whole job is picking which company to open, and between them
          they were half the height of every card. Restoring either is one line
          here; the data is untouched.

          **Two lines, always, which is what makes the cards uniform.** The
          status is the one variable-height thing on the card: "Lead only ·
          sector and name, nothing else yet" sets to one line and Suvarna's
          researched line sets to two, so a grid of them stepped. `line-clamp-2`
          caps the tall ones and the height reserves the second line for the
          short ones. **The height is in `em` and not a pixel**, because
          `.reading` sets line-height 1.55 and 2 × 1.55 is the whole
          calculation: change that class and this number is wrong.

          **It is `h-`, not `min-h-`, and the difference is one pixel that was
          visible.** Under a floor, a one-line status takes the floor's 43.4px
          and a two-line one takes whatever its two line boxes round to, which
          at 375 came out 43 — so the cards were 232 and 233. A fixed height is
          the same computed value on every card, so there is nothing left to
          round differently.

          **`mb-5` and not `pb-5`, which is the trap this hit first.** The space
          above the divider is a margin because `min-h` is border-box here, so
          padding inside the element is *subtracted* from the two lines it is
          meant to reserve: the short statuses floored at 43px, which is one
          line plus the padding, and the list stepped again at 375 where the
          long ones wrap. A margin sits outside the box the floor applies to.

          **The margin above the divider is 4px, and that is deliberately
          almost nothing.** It went 20 → 12 → 4 across two requests to reduce
          it, and the reason it kept looking like too much is that the margin
          was never most of the gap: the status box reserves two lines so the
          cards stay uniform, so on every project whose status fits one line
          there is another ~22px of blank line above the rule that no spacing
          value here can reach. Cutting the margin to 4 leaves the reserved
          line doing the separating on its own. **If it is still too much, the
          lever is the reserve, not this number** — clamping the status to one
          line closes it entirely and costs the second line at 375, where
          several statuses genuinely wrap. */}
      <p className="reading mt-3 mb-1 line-clamp-2 h-[3.1em] px-4 text-small text-muted-foreground">
        {project.status}
      </p>

      {/* Two facts, no icons, on the footer's own line rather than a block of
          their own. A globe beside a domain and a person beside a name are
          decoration: the string already says which it is, and three icons on
          six cards is eighteen marks carrying nothing. `Created` went with
          them, because the status line above already dates the project and two
          dates on one card is one date too many.

          **The footer does not wrap, and that is the other half of making the
          cards uniform.** It was `flex-wrap`, so a card whose meta line and
          button did not quite fit put the button on a second row and grew 30px
          — and whether it fitted depended on how many digits the revenue had
          and whether the card carried *No research yet*. Two cards side by side
          in the same grid came out different heights at 1024. Now the shape is
          decided by the breakpoint rather than by the content: stacked below
          `sm`, one row above it, the same on every card. What pays for it is
          the domain, which truncates instead. */}
      <div className="mt-auto flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <dl className="flex min-w-0 items-center gap-x-1.5 text-micro text-muted-foreground">
          <span className="flex shrink-0 items-center whitespace-nowrap">
            <dt className="sr-only">Annual revenue</dt>
            <dd className="tabular-nums">
              {project.revenueCr ? `${money(project.revenueCr)} revenue` : "Revenue not stated"}
            </dd>
          </span>
          {/* The same middot the status lines above use, at the same weight. It
              was `--border-strong` with 12px either side and read as a stray
              mark between two facts rather than as the join between them. */}
          <span aria-hidden className="shrink-0">
            ·
          </span>
          <span className="flex min-w-0 items-center">
            <dt className="sr-only">Website</dt>
            {/* **The domain is a link, on request, and it is the one place on
                this card where cyan is correct**: it is the only thing here
                that goes somewhere, and somewhere outside the product. The
                page's rule is that a coloured word means somewhere to go, so
                spending it on the one string that leaves is spending it
                exactly once.

                `target="_blank"` because a consultant reading the list is
                choosing between companies, not leaving to browse one; losing
                the list to a supplier's homepage is the wrong trade.
                `rel="noreferrer"` comes with it — `noopener` is implied by
                modern browsers but stated anyway, since the whole point of the
                pair is that a target page cannot reach back.

                **`block` on the anchor, not just `truncate`.** An inline
                element has no width to truncate against, so the ellipsis
                silently does nothing and a long domain pushes the grid column
                past the frame — the same failure the `min-w-0` note on the
                list item above records. */}
            {project.domain ? (
              <dd className="min-w-0">
                <a
                  href={`https://${project.domain}`}
                  target="_blank"
                  rel="noreferrer"
                  className="block truncate text-evidence transition-colors hover:text-foreground"
                >
                  {project.domain}
                </a>
              </dd>
            ) : (
              <dd className="truncate">No site given</dd>
            )}
          </span>
        </dl>
        {/* **Every project opens**, on request, and the label is the same on all
            of them: one verb, so the list has one action rather than a button
            on some rows and a grey excuse on the others.

            The honest label has moved rather than gone. It used to be an
            unpressable *No research yet* in this corner; it is now a line
            beside the button, so a card still says whether there is anything
            behind it before you press. The page's own standfirst says the same
            thing once for the whole list. */}
        <div className="flex shrink-0 items-center justify-end gap-3">
          {!project.researched && (
            <span className="whitespace-nowrap text-micro text-muted-foreground">
              No research yet
            </span>
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
            Sources go in afterwards, on the Sources surface.
          </DialogDescription>
        </DialogHeader>

        {/* The form is the scrolling middle, so the two buttons stay reachable
            on a phone however long the prompt box gets.

            **Five of the six hints came off, on request, and the reason is not
            only volume.** A hint under every box is a grey paragraph under
            every box, and in a two-column grid it is worse than that: the hints
            were one line, two lines and none, so the two columns stopped
            lining up and the rows read as ragged. Take them off and the grid is
            a grid again.

            What they said, and where it went:

            - *"What best in class is measured against"* and *"Read first when
              there is one"* are the **reason** the field exists, not
              instructions for filling it in. Nobody hesitates over Sector or
              Website.
            - *"Names and roles, as loosely as you have them"* is what the
              placeholder demonstrates. A worked example beats a description of
              one.
            - **The unit moved into the label**: `Annual revenue (₹ crore)`. That
              is the one piece of hint text a wrong answer depends on, and a
              unit belongs on the label rather than under the box, where it is
              read after the number has been typed.
            - **One hint survives**, on *What to look at*, because it is the
              only field whose shape is genuinely ambiguous: a box that takes a
              sentence looks exactly like a box that takes a search. */}
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

          {/* **The footer is two buttons and nothing else, on request.** It
              carried *"Creating a project does not run the research."* at the
              reading edge, which was the honesty note this product puts beside
              anything designed-as-real. What it says is already said one line
              up: the dialog's own description is *"Sources go in afterwards, on
              the Sources surface"*, and a project with nothing behind it says
              *No research yet* on its own card the moment it appears in the
              list. Three statements of one fact on one screen. */}
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

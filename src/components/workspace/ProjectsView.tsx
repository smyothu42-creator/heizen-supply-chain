"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Archive,
  ArchiveRestore,
  LayoutGrid,
  Pencil,
  Plus,
  Rows3,
  Search,
  Trash2,
} from "lucide-react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import { formatDay } from "@/lib/plan";
import { initialsOf, type Project } from "@/lib/projects";
import { canManage } from "@/lib/workspace";
import { TODAY, useWorkspace } from "@/components/shell/WorkspaceProvider";
import { SelectField } from "@/components/shell/SelectField";
import { SwitchScroller, SwitchTrack, switchItemClass } from "@/components/shell/SwitchTrack";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ConfirmDialog, PageHead } from "./Form";
import { useToast } from "@/components/shell/Toast";
import { ProjectDialog } from "./ProjectDialog";

/* --------------------------------------------------------------------------
   The list's controls, as data.

   At several new projects a day the list stops being nine cards you can hold
   in one look, so the page grows the working set's controls: a filter (which
   projects), a search (which one), an order (what first) and a layout (how
   dense). Defaults are the consultant's common case: the working list, newest
   first, in the dense rows.
   ----------------------------------------------------------------------- */

type Bucket = "active" | "recent" | "archived";
type SortKey = "recency" | "priority";
type Layout = "list" | "cards";

const BUCKETS: [Bucket, string][] = [
  ["active", "Active"],
  ["recent", "Recent"],
  ["archived", "Archived"],
];

/* Recent is a subset of Active — the leads that arrived in the last two
   weeks, which at the current intake is the pile worth triaging first. An
   archived project is never "recent": it has been filed. */
const RECENT_DAYS = 14;
const isRecent = (p: Project) =>
  Date.parse(TODAY) - Date.parse(p.createdOn) < RECENT_DAYS * 86_400_000;

const inBucket = (p: Project, bucket: Bucket) =>
  bucket === "archived" ? Boolean(p.archived) : !p.archived && (bucket === "active" || isRecent(p));

/* Search reads what a consultant remembers about a lead: the company, the
   sector, the person they met, the site. Not the status line — matching on
   words the pipeline wrote makes rows appear for reasons nobody typed. */
const matches = (p: Project, q: string) =>
  [p.name, p.sector, p.domain, p.stakeholders]
    .filter(Boolean)
    .some((s) => (s as string).toLowerCase().includes(q));

/* Untriaged sorts after triaged (rank 3): a priority sort shows the projects
   somebody has judged before the ones nobody has looked at. Ties break on
   recency, so the order is total and stable to the eye. */
const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;
const PRIORITY_TEXT = { high: "High priority", medium: "Medium priority", low: "Low priority" } as const;
const rankOf = (p: Project) => (p.priority ? PRIORITY_RANK[p.priority] : 3);

const sortProjects = (ps: Project[], key: SortKey) =>
  [...ps].sort((a, b) =>
    key === "priority" && rankOf(a) !== rankOf(b)
      ? rankOf(a) - rankOf(b)
      : b.createdOn.localeCompare(a.createdOn),
  );

/**
 * Priority as a chip, same shape as `EffortChip` on Gaps: a coloured pill, a
 * dot filled to the level, the noun stated rather than left implicit. Two
 * different three-word scales in two different parts of the product, but the
 * same read — a level has to be readable before the row it sits on is, and a
 * bare "Low" next to a revenue figure could be misread as a number.
 *
 * **The direction matches effort's, not health's.** High effort is red because
 * expensive is bad news; high *priority* is red for a different reason, an
 * urgent lead is the one to look at first, but the visual result is the same
 * scale reused rather than a fourth colour family invented for one page.
 *
 * **Untriaged gets the neutral chip**, `ConfidenceChip`'s own shape, so a fresh
 * lead reads as *not yet judged* rather than as the bottom of the coloured
 * scale — "Low priority" is a decision, and nobody has made one yet.
 */
const PRIORITY_STEPS = { high: 3, medium: 2, low: 1 } as const;
const PRIORITY_TONE = {
  high: "border-effort-high/30 bg-effort-high-surface text-effort-high",
  medium: "border-effort-medium/30 bg-effort-medium-surface text-effort-medium",
  low: "border-effort-low/30 bg-effort-low-surface text-effort-low",
} as const;
const PRIORITY_DOT = {
  high: "bg-effort-high",
  medium: "bg-effort-medium",
  low: "bg-effort-low",
} as const;

function PriorityChip({
  priority,
  className,
}: {
  priority?: "high" | "medium" | "low";
  className?: string;
}) {
  if (!priority) {
    return (
      <span
        className={cn(
          "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-muted px-2 py-0.5 text-micro font-medium text-muted-foreground",
          className,
        )}
      >
        Not triaged
      </span>
    );
  }
  const filled = PRIORITY_STEPS[priority];
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-micro font-medium",
        PRIORITY_TONE[priority],
        className,
      )}
    >
      <span className="flex items-center gap-[2px]" aria-hidden>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-[5px] w-[5px] rounded-full",
              i <= filled ? PRIORITY_DOT[priority] : "bg-current opacity-25",
            )}
          />
        ))}
      </span>
      {PRIORITY_TEXT[priority]}
    </span>
  );
}

/**
 * The projects list. The form that makes one, and the form that corrects one,
 * are the same dialog and live in `ProjectDialog`.
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
    setCurrentProject,
    setProjectArchived,
    deleteProject,
    newProjectAsked,
    clearNewProjectAsk,
    askForUpdates,
  } = useWorkspace();
  const [creating, setCreating] = useState(false);
  const [bucket, setBucket] = useState<Bucket>("active");
  const [layout, setLayout] = useState<Layout>("list");
  const [sortKey, setSortKey] = useState<SortKey>("recency");
  const [query, setQuery] = useState("");
  const { notify } = useToast();
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [editing, setEditing] = useState<Project | null>(null);
  /* **Focus goes back to the pencil that opened the dialog**, and it has to be
     done by hand here. Radix restores focus to its trigger on close, and this
     dialog is *unmounted* on close rather than held open by a prop — so by the
     time it would restore, there is nothing to restore from and the caret lands
     on `<body>`. Found by driving it, which is the only way: nothing about the
     markup looks wrong.

     The button hands its own element up through the click rather than taking a
     `ref`, because there is one of these per card and a ref per row is a map
     kept in step with a list that filters and re-sorts under it. Same shape
     `GapRow`'s edit control needs on Gaps. */
  const lastEditTrigger = useRef<HTMLElement | null>(null);

  const manage = canManage(me.role);

  /* Reversible, so no confirm dialog: archiving moves the row behind the
     Archived filter and restore brings it straight back. The toast says where
     it went, because the row disappears from under the pointer. */
  const toggleArchive = (project: Project) => {
    const next = !project.archived;
    setProjectArchived(project.id, next);
    notify(
      next ? `${project.name} archived` : `${project.name} restored`,
      { detail: next ? "Find it under the Archived filter." : "It is back in the working list." },
    );
  };

  const q = query.trim().toLowerCase();
  const bucketed = projects.filter((p) => inBucket(p, bucket));
  const shown = sortProjects(q ? bucketed.filter((p) => matches(p, q)) : bucketed, sortKey);

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

      {/* The toolbar: filter, search, order, layout, on one wrapping row. The
          filter is the product's own underline tabs — it changes *which
          projects*, same species of control as Gaps' Area filter — and each
          tab carries its count, so the size of the working set is readable
          without changing filters. Counts ignore the search on purpose: they
          describe the buckets, not the query. */}
      <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
        <SwitchScroller className="w-full sm:w-auto">
          <SwitchTrack label="Show">
            {BUCKETS.map(([b, label]) => (
              <button
                key={b}
                type="button"
                aria-pressed={b === bucket}
                onClick={() => setBucket(b)}
                className={switchItemClass(b === bucket)}
              >
                {label} ({projects.filter((p) => inBucket(p, b)).length})
              </button>
            ))}
          </SwitchTrack>
        </SwitchScroller>
        {/* `w-full sm:flex-1` and not `flex-1` alone — the trap this repo has
            now hit six times; see `ResearchSwitches`. */}
        <div className="relative w-full min-w-0 sm:max-w-xs sm:flex-1">
          <Search
            aria-hidden
            className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Find a project"
            placeholder="Find by company, sector or person"
            className="pl-8"
          />
        </div>
        <SelectField
          label="Order"
          value={sortKey}
          onChange={(v) => setSortKey(v as SortKey)}
          options={[
            ["recency", "Newest first"],
            ["priority", "Priority"],
          ]}
        />
        <LayoutToggle layout={layout} onChange={setLayout} />
      </div>

      {shown.length === 0 ? (
        <p className="mt-5 rounded-lg border border-dashed border-border px-4 py-10 text-center text-small text-muted-foreground">
          {q
            ? `Nothing here matches "${query.trim()}". Clear the search, or look in another filter.`
            : bucket === "archived"
              ? "Nothing archived. Archiving keeps a delivered or cold project on file without deleting it."
              : bucket === "recent"
                ? "Nothing created in the last two weeks."
                : "No active projects. Create one and the seven surfaces have something to be about."}
        </p>
      ) : layout === "cards" ? (
        <ul className="mt-5 grid gap-4 lg:grid-cols-2">
          {shown.map((project) => (
            /* `min-w-0` on the grid item, not only inside the card. A grid track
               is `minmax(auto, 1fr)`, so one nowrap string deep inside the card
               widened the column past the frame and the page scrolled sideways at
               375. Same failure the flex rows in this product keep hitting, one
               layout system across. */
            <li key={project.id} className="min-w-0">
              <ProjectCard
                project={project}
                canEdit={manage}
                canDelete={manage && projects.length > 1}
                /* Opening a project is one of the two moments the shell asks
                   whether anything has changed since last time. See
                   `UpdateAsk`. */
                onOpen={() => {
                  setCurrentProject(project.id);
                  askForUpdates();
                }}
                onEdit={(trigger) => {
                  lastEditTrigger.current = trigger;
                  setEditing(project);
                }}
                onArchive={manage ? () => toggleArchive(project) : undefined}
                onDelete={() => setPendingDelete(project)}
              />
            </li>
          ))}
        </ul>
      ) : (
        /* The dense layout, and the default: one bordered list, one row per
           project, the same facts the card carries at a third of the height.
           Wide-screen-only columns (revenue, created) drop before anything
           truncates harder — density is for scanning many, not for cramming
           everything at 375. */
        <ul className="mt-5 divide-y divide-border rounded-lg border border-border bg-card shadow-card">
          {shown.map((project) => (
            <ProjectRow
              key={project.id}
              project={project}
              canEdit={manage}
              canDelete={manage && projects.length > 1}
              onOpen={() => {
                setCurrentProject(project.id);
                askForUpdates();
              }}
              onEdit={(trigger) => {
                lastEditTrigger.current = trigger;
                setEditing(project);
              }}
              onArchive={manage ? () => toggleArchive(project) : undefined}
              onDelete={() => setPendingDelete(project)}
            />
          ))}
        </ul>
      )}

      {/* Mounted and unmounted rather than held open with a prop, so a
          half-typed project is gone when the dialog reopens. The edit copy
          takes `key={editing.id}`: without it, pressing edit on a second card
          while the first is still mounted would keep the first card's text in
          the boxes. Same shape `GapPanel` needs on Gaps. */}
      {showCreate && (
        <ProjectDialog
          open
          onOpenChange={setCreate}
          onSaved={(name) => notify(`${name} created`, { detail: "It lives in this tab only." })}
        />
      )}

      {editing && (
        <ProjectDialog
          key={editing.id}
          open
          project={editing}
          onOpenChange={(v) => {
            if (v) return;
            setEditing(null);
            lastEditTrigger.current?.focus();
          }}
          onSaved={(name) => notify(`${name} saved`, { detail: "The change lives in this tab only." })}
        />
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        onOpenChange={(v) => !v && setPendingDelete(null)}
        title={pendingDelete ? `Delete ${pendingDelete.name}?` : "Delete project?"}
        description="The sources, the map, the dossier, the gaps and the questions go with it. Nobody keeps a copy."
        confirmLabel="Delete project"
        onConfirm={() => {
          if (!pendingDelete) return;
          deleteProject(pendingDelete.id);
          notify(`${pendingDelete.name} deleted`);
          setPendingDelete(null);
        }}
      />
    </div>
  );
}

/* -------------------------------------------------------------------------- */

interface ProjectItemProps {
  project: Project;
  canEdit: boolean;
  canDelete: boolean;
  onOpen: () => void;
  /** Takes its own button, so focus can be put back on it when the dialog
      closes. See the note beside `lastEditTrigger`. */
  onEdit: (trigger: HTMLElement) => void;
  /** Archive or restore, whichever the project is not. Absent when the reader
      cannot manage projects, same gate as edit. */
  onArchive?: () => void;
  onDelete: () => void;
}

function ProjectCard({ project, canEdit, canDelete, onOpen, onEdit, onArchive, onDelete }: ProjectItemProps) {
  const router = useRouter();

  return (
    /* A card, because these are separate things side by side, which is the one
       condition the theme note says a card is for.

       **No mark on the project that is currently loaded**, on request. The left
       edge used to carry the primary in a 3px rule on it. The argument for it
       was that the switcher in the masthead is far away, so which project you
       are *in* should be readable from here — but this page is where you choose
       what to open next, and "the one you had open last" is a fact about the
       past rather than a difference between the cards. One card in nine drawn
       differently reads as that card being special, and the list is a list of
       equals. The masthead names the loaded project on every other screen in
       the product.

       **Every card is the same height, and `h-full` is only half of that.**
       `h-full` equalises a card against its *row*, which is what a grid
       already does; it does nothing across rows, so with a one-line status
       above and a two-line one below the list stepped. Each block on the card
       is now a fixed number of lines — name and sector truncate to one each,
       the status clamps to two — so the height is the same everywhere and
       there is nothing left for `mt-auto` to absorb. If a block is ever added
       that can wrap, it has to be capped the same way or this goes back. */
    <div className="flex h-full flex-col rounded-lg border border-border bg-card shadow-card transition-colors hover:border-border-strong">
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
        {/* Two ghosts in the corner, edit before delete. **Always visible, not
            revealed on hover**: a hover-reveal is the quieter card and puts
            both controls out of reach of every touch device, which is the same
            trade `GapRow`'s edit control and the source rows record, with the
            same mitigation — a 24px mark in `--muted-foreground` rather than a
            labelled button, so the card's one *action* is still the filled
            button on the footer.

            Edit is ink on hover and delete goes red, because one of them
            reverses and the other does not. Colour is doing the same job it
            does everywhere else in the product: red is the destructive end,
            and nothing else on the card may borrow it. */}
        {(canEdit || canDelete || onArchive) && (
          <div className="-mr-1 -mt-1 flex shrink-0 items-center">
            {/* Archive leads the ghosts: it is the one of the three a list this
                size uses daily, and the only one that reverses cleanly. */}
            {onArchive && <ArchiveButton project={project} onArchive={onArchive} />}
            {canEdit && (
              <button
                type="button"
                onClick={(e) => onEdit(e.currentTarget)}
                aria-label={`Edit ${project.name}`}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Pencil className="size-4" />
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={onDelete}
                aria-label={`Delete ${project.name}`}
                className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-health-critical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
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

      {/* Two facts and the priority chip, no icons, on the footer's own line
          rather than a block of their own. A globe beside a domain and a
          person beside a name are decoration: the string already says which
          it is, and three icons on six cards is eighteen marks carrying
          nothing. `Created` went with them, because the status line above
          already dates the project and two dates on one card is one date too
          many.

          **The footer's own top level does not wrap, and that is the other
          half of making the cards uniform.** It was `flex-wrap` on this
          element once, so a card whose meta line and button did not quite fit
          put the button on a second row and grew 30px — and whether it fitted
          depended on how many digits the revenue had. Two cards side by side
          in the same grid came out different heights at 1024. Now the shape is
          decided by the breakpoint rather than by the content: stacked below
          `sm`, one row above it with the facts group and the button at the
          two ends, the same on every card. **The wrap the chip needed moved
          one level in**, onto the facts group alone, so a long domain or a
          narrow card wraps the facts against themselves and never touches the
          button's position. What pays for it beyond that is the domain, which
          truncates instead. */}
      <div className="mt-auto flex flex-col gap-3 border-t border-border px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        {/* Facts and chip in one group, so the footer's top-level row stays
            two things (this group, the button) and `justify-between` puts
            them at the two ends rather than spreading three items unevenly.
            `flex-wrap` here, not on the footer itself: the chip is taller
            than the micro text either side of it, and wrapping *inside* the
            group keeps the button pinned to the row's far end instead of
            dropping with it. */}
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1.5">
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
          {/* The sort key, as its own chip rather than folded into the `dl`'s
              line — a coloured pill sits taller than the micro text either
              side of it, so joining the line would make that line's height
              depend on whether a project happens to carry a priority. **It
              renders on every card, `PriorityChip`'s own neutral state
              standing in for "not set"**, same fix the list row uses: a slot
              that is sometimes there is a slot the eye has to check for, and a
              slot that is always there is a column. */}
          <PriorityChip priority={project.priority} />
        </div>
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
          {/* Outline and fully rounded, on request, and the same on every card
              including the one already loaded — nine cards with one button in a
              different weight would read as one row being special rather than
              as one row being where you are, same argument this made when the
              button was filled. */}
          {/* **Opening a project lands on What to build**, at the same route
              the masthead's leading tab points at so the two ways in agree. It
              went to Operations first, then to Research. Both were a screen of
              material with the answer somewhere inside it: the map is a picture
              of how the company runs, and the dossier is what we found out. The
              first thing a consultant needs from a client he has just opened is
              what we would sell them, and everything that argues for it is a
              link at the foot of that page. */}
          <Button
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={() => {
              onOpen();
              router.push("/build");
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

/**
 * One row of the dense list: the same project, a third of the height.
 *
 * Name and sector always; priority joins from `md`, revenue from `lg`, the
 * created date from `xl`. The wide columns take fixed slots so twelve rows
 * line up on both edges rather than reading as a ragged column — the lesson
 * the delivery-mode chip slot records in CLAUDE.md, applied here from the
 * start.
 *
 * **`text-small`/`text-base`, not `text-micro`.** Density comes from the row
 * height and the fixed columns, not from setting the type small enough that
 * "dense" reads as "hard to read" — a list this wide at caption size looked
 * like fine print rather than the row's own record.
 */
function ProjectRow({ project, canEdit, canDelete, onOpen, onEdit, onArchive, onDelete }: ProjectItemProps) {
  const router = useRouter();

  return (
    /* `py-4`, not the `py-3` the card's own footer uses: that row sits under a
       border it shares with three other blocks on the same card, and this one
       is the whole row. At `py-3` twelve of these read as one dense slab with
       no air between rows; four more pixels top and bottom is the difference
       between a list and a table. */
    <li className="flex min-w-0 items-center gap-4 px-4 py-4">
      <span
        aria-hidden
        className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-muted text-small font-semibold"
      >
        {initialsOf(project.name)}
      </span>
      {/* Name, then sector, and nothing else — on request. Status used to sit
          under the sector, but a row already carries priority, revenue and
          the created date as their own columns; the name and what the company
          does is what this block is for, and a third line of prose that
          duplicates part of what the status columns already say was one read
          too many in the densest part of the row. */}
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-base font-semibold leading-tight">{project.name}</h2>
        <p className="mt-0.5 truncate text-small text-muted-foreground">{project.sector}</p>
      </div>
      {/* "Not triaged", not a blank: the no-value rule (§6a) — the slot says
          what the absence means, and under a priority sort it is why the row
          is at the bottom. `w-36`, not `w-28` — the chip is `whitespace-nowrap`
          now, and "Medium priority" plus its dots needs more than the plain-text
          column did or it overflows the slot instead of wrapping inside it. */}
      <span className="hidden w-36 shrink-0 md:block">
        <PriorityChip priority={project.priority} />
      </span>
      <span className="hidden w-24 shrink-0 text-right text-small tabular-nums text-muted-foreground lg:block">
        <span className="sr-only">Annual revenue </span>
        {project.revenueCr ? money(project.revenueCr) : "Not stated"}
      </span>
      <span className="hidden w-28 shrink-0 text-right text-small text-muted-foreground xl:block">
        <span className="sr-only">Created </span>
        {formatDay(project.createdOn)}
      </span>
      {/* The ghosts hide below `sm`: at 375 the row is a name, a status and the
          one action, and the same controls are on every card one toggle away.
          Density is the layout's whole offer, and three icon targets per row is
          where it stopped being one. */}
      {(canEdit || canDelete || onArchive) && (
        <div className="hidden shrink-0 items-center sm:flex">
          {onArchive && <ArchiveButton project={project} onArchive={onArchive} />}
          {canEdit && (
            <button
              type="button"
              onClick={(e) => onEdit(e.currentTarget)}
              aria-label={`Edit ${project.name}`}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Pencil className="size-4" />
            </button>
          )}
          {canDelete && (
            <button
              type="button"
              onClick={onDelete}
              aria-label={`Delete ${project.name}`}
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-health-critical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Trash2 className="size-4" />
            </button>
          )}
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 rounded-full"
        onClick={() => {
          onOpen();
          router.push("/build");
        }}
      >
        View project
      </Button>
    </li>
  );
}

/**
 * Archive or restore, one ghost. The icon flips with the state, and the label
 * says the act rather than the state — "Restore", not "Archived" — because a
 * button names what pressing it does.
 */
function ArchiveButton({ project, onArchive }: { project: Project; onArchive: () => void }) {
  const Icon = project.archived ? ArchiveRestore : Archive;
  return (
    <button
      type="button"
      onClick={onArchive}
      aria-label={project.archived ? `Restore ${project.name}` : `Archive ${project.name}`}
      className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="size-4" />
    </button>
  );
}

/**
 * List or cards. Two icon buttons in one bordered box, `aria-pressed` carrying
 * the state — a display preference, not a filter, which is why it is not a
 * third underline track: it changes how the same rows are drawn, never which
 * rows there are.
 */
function LayoutToggle({ layout, onChange }: { layout: Layout; onChange: (l: Layout) => void }) {
  return (
    <div
      role="group"
      aria-label="Layout"
      className="flex shrink-0 items-center overflow-hidden rounded-md border border-border bg-card shadow-card"
    >
      {(
        [
          ["list", "List layout", Rows3],
          ["cards", "Card layout", LayoutGrid],
        ] as const
      ).map(([value, label, Icon]) => (
        <button
          key={value}
          type="button"
          aria-pressed={layout === value}
          aria-label={label}
          onClick={() => onChange(value)}
          className={cn(
            "flex size-9 items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring",
            layout === value
              ? "bg-muted text-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Icon className="size-4" />
        </button>
      ))}
    </div>
  );
}


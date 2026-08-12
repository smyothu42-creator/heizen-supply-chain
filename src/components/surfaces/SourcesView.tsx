"use client";

import { useRef, useState } from "react";
import { FileText, Inbox, Pencil, Trash2, Upload, X } from "lucide-react";
import {
  claims,
  dealRisks,
  gaps,
  sources,
  timingSignals,
  type Source,
  type SourceKind,
} from "@/lib/suvarna";
import { FILE_ACCEPT, REPLACE_ACCEPT, fileSize } from "@/lib/files";
import { money } from "@/lib/format";
import { initialsOf } from "@/lib/projects";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { useWorkspace } from "@/components/shell/WorkspaceProvider";
import { StickyBar } from "@/components/shell/StickyBar";
import { Panel } from "@/components/meridian/Primitives";
import { usePanel } from "@/components/meridian/EvidencePanel";
import { EmailIcon, FilingIcon, TranscriptIcon, WebIcon } from "@/components/meridian/Icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SelectNative } from "@/components/ui/select-native";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ConfirmDialog, Field, Said } from "@/components/workspace/Form";
import { ProjectDialog } from "@/components/workspace/ProjectDialog";

/**
 * Sources — the bottom of every evidence chain.
 *
 * **Rebuilt to the shape the production app uses**, on request, and it is now
 * two blocks and nothing else: an ingestion card, and the list of what is
 * already in. The reference is `supply-chain-brain-main`'s
 * `/project/[id]/sources` — a *Prepare sources for ingestion* card with Files /
 * Paste text tabs and a right-aligned commit button, over an *Uploaded sources*
 * section whose rows are an icon tile, a name, a meta line, a state chip and a
 * remove control.
 *
 * **The order is the reference's and it is a real change.** This surface used
 * to open with the nine sources and put the drop zone underneath them. Sources
 * is where you *add* the input rather than re-read it — it is the one surface
 * with no `RunButton` for that reason — so the work goes at the top and the
 * receipt goes under it.
 *
 * What is genuinely wired, because the doctrine here is designed as real and
 * labelled honestly:
 *
 * - **Picking files works.** They land in a list, they can be removed one at a
 *   time, and the count is real. That is all local state and costs nothing to
 *   make true.
 * - **Removing an ingested source works, for this view.** It confirms, it names
 *   what goes and what it would cost, and the count above the list moves. A
 *   reload brings the nine back, because they are a fixture rather than a
 *   store; nothing in the UI would change the day there is one behind it.
 * - **Ingesting does not**, and the button says so when pressed rather than
 *   swallowing the press. Same rule as `RunButton`, the connectors and
 *   `SaveMenu`'s download before it was wired.
 */

const KIND_ICON = {
  filing: FilingIcon,
  transcript: TranscriptIcon,
  email: EmailIcon,
  web: WebIcon,
};

/* **Two sections came off this surface, on request**, and both were long-lived
   enough to be worth a note.

   *Connect a system* was six dashed tiles — SAP, Oracle, Coupa, Drive, Gmail,
   Snowflake — under a *Not built yet* chip. §5 records the connectors as UI
   only, designed as real and labelled honestly, and that doctrine is unchanged:
   what went is the *display*, not the decision. Restoring it is a `CONNECTORS`
   array and one `Panel`.

   *Nothing behind them* listed the three claims with no source at all. That is
   §7.14's rule made visible, and it survives where it is argued: Certainty's
   source ledger reports the same claims with their tiers, and `check:data`
   still fails the build on anything cited to a source that does not exist. This
   surface was the second place it was said. */

/**
 * How many times a source is cited, across **every** place that cites one.
 *
 * All four have to be counted or the badge lies. Counting gap evidence and
 * claims alone reported *Nothing cited yet* on the web source, which carries
 * Timing's hiring and leadership readings and one of Risk's — five rows saying
 * nothing was drawn from them when the true number is four. Those four are
 * `src-inv`, `src-mca`, `src-call3` and `src-email2`, and that is a real
 * state: the pipeline reads everything a consultant drops in, and most
 * documents corroborate rather than carry a finding of their own.
 *
 * **If a fifth kind of thing ever cites a source, it belongs in this list**, or
 * the badge quietly goes stale in the direction that reads as a fault.
 */
function citations(id: string) {
  return (
    gaps.flatMap((g) => g.evidence).filter((e) => e.sourceId === id).length +
    claims.filter((c) => c.sourceIds.includes(id)).length +
    timingSignals.flatMap((s) => s.items).filter((i) => i.sourceId === id).length +
    dealRisks.filter((r) => r.sourceIds.includes(id)).length
  );
}

export function SourcesView() {
  const { open } = usePanel();
  /* Removal is local to this view, and that is the honest shape of it here:
     the nine sources are a static fixture, so nothing is deleted from a store
     and a reload brings them back. Everything else about the control is real —
     it confirms, it names what goes, and it says what taking a source out would
     cost. `Set` rather than a filtered copy of `sources`, so the fixture stays
     the single source of truth. */
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState<Source | null>(null);
  /* An overlay on the fixture, keyed by id, for the same reason removal is a
     `Set`: the edited record wins where there is one and `sources` stays the
     single source of truth underneath. */
  const [edits, setEdits] = useState<Record<string, Source>>({});
  const [editing, setEditing] = useState<Source | null>(null);
  const [said, setSaid] = useState("");
  /* Focus goes back to the pencil that opened the dialog, by hand. Radix
     restores focus to its own trigger, and this dialog is unmounted on close
     rather than held open by a prop — so there is nothing left to restore from
     and the caret lands on `<body>`. The row hands its own button up through
     the click, because there is one per row and a ref per row is a map kept in
     step with a list that filters under it. */
  const lastEditTrigger = useRef<HTMLElement | null>(null);
  const closeEditor = () => {
    setEditing(null);
    lastEditTrigger.current?.focus();
  };

  const shown = sources.filter((s) => !removed.has(s.id)).map((s) => edits[s.id] ?? s);

  return (
    <>
      <SurfaceHero title="Sources" />
      {/* **The project strip and the ingestion card are pinned together**, on
          request, and they are pinned as one block because they are the work
          half of this surface: what the research is about, and how you feed it.
          The list underneath is the receipt, and scrolling a receipt should not
          take the drop zone off the screen with it.

          **From `lg` only.** The card is about 320px tall, which is half of a
          667px phone and most of the room the list has to be read in. On a
          window that cannot afford it the block stays in the flow. */}
      <StickyBar from="lg" className="pt-5 pb-3">
        <ProjectStrip onSaved={(name) => setSaid(`${name} saved. The change lives in this tab only.`)} />

        {said && (
          <div className="mt-3">
            <Said>{said}</Said>
          </div>
        )}

        <div className="mt-5">
          <Ingest />
        </div>
      </StickyBar>

      <div className="surface-frame pb-5">

        <section className="mt-5" aria-labelledby="ingested-heading">
          {/* Heading on the left, count on the right, both on the baseline.
              The count is the length of what is shown rather than a word: a
              number written out is a number that goes stale the first time the
              data changes, which is the rule the source strip already records,
              and it now changes the moment a row is removed. */}
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 id="ingested-heading" className="text-base font-medium">
              Ingested sources
            </h2>
            <span className="tabular text-small text-muted-foreground">{shown.length}</span>
          </div>

          {shown.length === 0 ? (
            <Empty />
          ) : (
            <div className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-card shadow-card">
              {shown.map((source) => {
                const Icon = KIND_ICON[source.kind];
                const cited = citations(source.id);
                return (
                  /* **A row, not a button.** The remove control is a sibling of
                     the thing that opens the panel, because a button inside a
                     button is invalid markup that browsers repair by moving the
                     inner one out of the row. Same shape `GapRow` needed when
                     its edit control arrived. */
                  <div key={source.id} className="group flex items-center transition-colors hover:bg-muted">
                    <button
                      type="button"
                      onClick={() => open({ kind: "source", id: source.id })}
                      className="flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 text-left"
                    >
                      {/* The kind, as a tile rather than a bare glyph. A 36px
                          muted square gives every row the same left edge
                          whatever the icon inside it is, which is what makes
                          nine of them scan as one list. */}
                      <span
                        aria-hidden
                        className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-evidence transition-colors group-hover:bg-card"
                      >
                        <Icon />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium transition-colors group-hover:text-muted-foreground">
                          {source.name}
                        </span>
                        <span className="block truncate text-small text-muted-foreground">
                          {source.detail}
                        </span>
                      </span>
                      {/* The state chip's slot, carrying the one thing that
                          differs row to row. The reference puts a processing
                          status here; every source in this fixture is ingested,
                          so nine identical *Ingested* chips would be nine marks
                          saying nothing. What does differ is whether anything
                          has been drawn from it. */}
                      {cited > 0 ? (
                        <Badge variant="secondary">{cited} citations</Badge>
                      ) : (
                        <Badge variant="neutral">Nothing cited yet</Badge>
                      )}
                    </button>
                    {/* **Always visible, not revealed on hover.** A hover-reveal
                        is the quieter list and puts the control out of reach of
                        every touch device, which is the phone this surface is
                        read on. The same trade `GapRow`'s edit control records,
                        and the same mitigation: ghosts rather than labelled
                        buttons.

                        **Edit is what a row of ingested documents was missing.**
                        A name and a date come off a filename and a header, and
                        both are routinely wrong: *Discovery call 2* is the third
                        call, a scan's date is the day it was scanned. What the
                        row says is what the whole evidence chain shows at its
                        bottom end, so a mis-titled source is a mis-labelled
                        citation on every claim that rests on it. */}
                    <div className="mr-2 ml-1 flex shrink-0 items-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          lastEditTrigger.current = e.currentTarget;
                          setEditing(source);
                        }}
                        aria-label={`Edit ${source.name}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setPending(source)}
                        aria-label={`Remove ${source.name}`}
                        className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-health-critical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Removing a source is the one act on this surface that breaks the
            chain in §4, so it says so rather than confirming with "are you
            sure". The count is what makes the sentence land: this source is
            under N claims elsewhere in the product. */}
        <ConfirmDialog
          open={pending !== null}
          onOpenChange={(v) => !v && setPending(null)}
          title={pending ? `Remove ${pending.name}?` : "Remove source?"}
          description={
            pending && citations(pending.id) > 0
              ? `${citations(pending.id)} things in this research cite it. They keep the claim and lose the document behind it until the research is run again.`
              : "Nothing cites it yet, so nothing else changes. It leaves the list and the research is unaffected."
          }
          confirmLabel="Remove source"
          onConfirm={() => {
            if (!pending) return;
            setRemoved((r) => new Set(r).add(pending.id));
            setSaid(`${pending.name} removed from this view.`);
            setPending(null);
          }}
        />

        {/* Mounted and unmounted, with `key={editing.id}`, so opening a second
            row does not arrive holding the first row's text. Same shape
            `GapPanel` and `ProjectDialog` need, and the same reason: resetting
            a form on an `open` prop is a `setState` inside an effect. */}
        {editing && (
          <SourceDialog
            key={editing.id}
            source={editing}
            onOpenChange={(v) => !v && closeEditor()}
            /* The replacement is named in the status line rather than swallowed.
               A file that is attached and never mentioned again is the shape of
               control this product refuses everywhere else: the consultant has
               to know the quotes below still come from the copy that was read. */
            onSave={(next, replacement) => {
              setEdits((e) => ({ ...e, [next.id]: next }));
              setSaid(
                replacement
                  ? `${next.name} saved, with ${replacement.name} attached. Not ingested: the quotes still come from the document that was read.`
                  : `${next.name} saved. The change lives in this view only.`,
              );
              closeEditor();
            }}
          />
        )}
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * What the research is about, above what it is made of.
 *
 * **This is where a project is edited from inside a project**, and Sources is
 * the surface it belongs on rather than a seventh tab. The six inputs the form
 * collects are the *research inputs* §5 lists — company, sector, website,
 * revenue, the people we know, and the line that biases the run — which is the
 * same kind of thing as a file: material fed in, not a reading taken out. A
 * consultant correcting the prompt after a first call is doing what he is doing
 * on the rest of this screen.
 *
 * **It is one strip and not a card of fields.** Everything on it is already on
 * the project's own card in the list, and a second full display of the same six
 * facts on a surface whose subject is documents would be the same read twice.
 * What is here is the name, the sector, and the two facts that change how the
 * pipeline reads what you are about to drop in.
 */
function ProjectStrip({ onSaved }: { onSaved: (name: string) => void }) {
  const { projects, currentProjectId } = useWorkspace();
  const project = projects.find((p) => p.id === currentProjectId);
  const [editing, setEditing] = useState(false);
  /* One button, so a plain ref. Focus is put back by hand for the reason the
     row pencils are: the dialog unmounts on close and Radix has nothing left to
     restore from. */
  const trigger = useRef<HTMLButtonElement>(null);
  const close = () => {
    setEditing(false);
    trigger.current?.focus();
  };

  /* The masthead always names a project, but the switcher can be pointed at one
     that has since been deleted in another tab of the same session. Nothing to
     say is better than a strip with a blank name in it. */
  if (!project) return null;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 shadow-card">
        <span
          aria-hidden
          className="grid size-9 shrink-0 place-items-center rounded-md border border-border bg-muted text-small font-semibold"
        >
          {initialsOf(project.name)}
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-medium leading-tight">{project.name}</h2>
          {/* Sector, revenue and who we know, on one line with the middot the
              rest of the product uses. Revenue is here rather than on the
              project card alone because it is the base every claim in the
              dossier is a share of: §7.11 in one fact. */}
          <p className="truncate text-small text-muted-foreground">
            {project.sector}
            {project.revenueCr ? ` · ${money(project.revenueCr)} revenue` : ""}
            {project.stakeholders ? ` · ${project.stakeholders}` : ""}
          </p>
        </div>
        {/* An outline, not a filled button. The filled one on this surface is
            *Ingest selected sources*, which is the work you came here to do;
            two filled buttons on one screen make you read both before pressing
            either. */}
        <Button
          ref={trigger}
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={() => setEditing(true)}
        >
          <Pencil className="size-4" />
          Edit project
        </Button>
      </div>

      {editing && (
        <ProjectDialog
          key={project.id}
          open
          project={project}
          onOpenChange={(v) => !v && close()}
          onSaved={(name) => {
            onSaved(name);
            close();
          }}
        />
      )}
    </>
  );
}

/* -------------------------------------------------------------------------- */

const KIND_LABEL: Record<SourceKind, string> = {
  filing: "Filing",
  transcript: "Transcript",
  email: "Email",
  web: "Web",
};

/**
 * A source, corrected — and, now, replaced.
 *
 * **What is editable is what somebody typed about the document, plus the
 * document itself. Never what the document says.** The name, the kind, the date
 * and the meta line are a filename and a header read by a machine, and all four
 * are routinely wrong in ways only a person in the room can fix. The excerpts
 * are the evidence, and §5's rule against hand-editing output is about exactly
 * those: a quote a consultant can retype is a chain that no longer walks
 * backwards.
 *
 * **The document is a third thing, and swapping it is not editing a claim.** A
 * source arrives wrong more often than its label does: the draft filing rather
 * than the signed one, the machine transcript before it was corrected, the
 * forwarded thread without its attachment. Replacing it changes what the
 * pipeline would read, which is the honest way to fix a bad reading — the other
 * way is retyping the excerpt, which is what the rule forbids.
 *
 * **The control follows the kind, which is what makes it usable.** Three kinds
 * are files handed to us and get a picker offering what that kind arrives as
 * (`REPLACE_ACCEPT`); `web` is an address rather than a file and gets a URL
 * box. One control that took anything would be a file picker offered for a web
 * page and an `.eml` filter offered for an annual report.
 */
function SourceDialog({
  source,
  onOpenChange,
  onSave,
}: {
  source: Source;
  onOpenChange: (v: boolean) => void;
  onSave: (next: Source, replacement: File | null) => void;
}) {
  const [draft, setDraft] = useState<Source>(source);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const set = (patch: Partial<Source>) => setDraft((d) => ({ ...d, ...patch }));

  /* Read out as a `const` rather than tested inline, because narrowing a
     *property* does not survive into a closure and the picker's `accept` is
     read inside `Field`'s render callback. A local const does survive, and it
     is also the thing the branch below is actually about: this kind is a file,
     or it is not. */
  const fileKind = draft.kind === "web" ? null : draft.kind;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft.name.trim()) {
      setError("A source is cited by its name. It needs one.");
      return;
    }
    onSave(
      {
        ...draft,
        name: draft.name.trim(),
        date: draft.date.trim(),
        detail: draft.detail.trim(),
        url: draft.url?.trim() || undefined,
      },
      file,
    );
  };

  return (
    <Dialog open onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit source</DialogTitle>
          <DialogDescription>
            How it is filed, and the document behind it. What is quoted from it is not
            edited here.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="contents">
          <DialogBody>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Name" required error={error} className="sm:col-span-2">
                {(id) => (
                  <Input
                    id={id}
                    value={draft.name}
                    onChange={(e) => set({ name: e.target.value })}
                    placeholder="FY25 Annual Report"
                    autoFocus
                  />
                )}
              </Field>

              {/* A native `<select>`, for the reason `SelectField` is one: it is
                  keyboard-operable and screen-reader correct for free, and on a
                  phone it opens the platform's own picker. The kind is not
                  cosmetic — it picks the icon on the row and in every evidence
                  chain that cites this document. */}
              <Field label="Kind">
                {(id) => (
                  <SelectNative
                    id={id}
                    value={draft.kind}
                    /* A picked file is dropped when the kind changes. The
                       picker below offers a different set of extensions per
                       kind, so a `.eml` chosen while this said Email and then
                       carried into Filing is a file the form would not have let
                       you pick in the first place. Clearing it is the only
                       reading that stays true to what is on screen. */
                    onChange={(e) => {
                      set({ kind: e.target.value as SourceKind });
                      setFile(null);
                    }}
                  >
                    {(Object.keys(KIND_LABEL) as SourceKind[]).map((k) => (
                      <option key={k} value={k}>
                        {KIND_LABEL[k]}
                      </option>
                    ))}
                  </SelectNative>
                )}
              </Field>

              {/* Free text and not a date input, which is the honest shape here
                  rather than a shortcut: these dates are written the way the
                  product reads them out — `27 June 2026` — and several sources
                  are a range or a period rather than a day. A date picker would
                  force a precision the document does not have. */}
              <Field label="Date">
                {(id) => (
                  <Input
                    id={id}
                    value={draft.date}
                    onChange={(e) => set({ date: e.target.value })}
                    placeholder="27 June 2026"
                  />
                )}
              </Field>

              <Field
                label="What it is"
                className="sm:col-span-2"
                hint="The line under the name. Kind, size and who it came from."
              >
                {(id) => (
                  <Input
                    id={id}
                    value={draft.detail}
                    onChange={(e) => set({ detail: e.target.value })}
                    placeholder="Public filing · 148 pages · fully ingested"
                  />
                )}
              </Field>

              {/* ------------------------------------------- the source itself

                  **The one field on this form that is the document rather than
                  a fact about it**, and the only one whose control changes with
                  the kind above it. A web source is an address you can open; a
                  filing, a transcript and an email are files somebody handed
                  us, and the picker narrows to what that kind arrives as rather
                  than offering the whole ingestion list. */}
              {fileKind === null ? (
                <Field
                  label="Address"
                  className="sm:col-span-2"
                  hint="Where this reads from. The one kind of source that is a link rather than a file."
                >
                  {(id) => (
                    /* `type="url"`, so a phone keyboard offers a slash and a
                       dot rather than a space bar, and the browser's own
                       validation catches a sentence typed into it. */
                    <Input
                      id={id}
                      type="url"
                      inputMode="url"
                      value={draft.url ?? ""}
                      onChange={(e) => set({ url: e.target.value })}
                      placeholder="https://suvarnaagro.in/careers"
                    />
                  )}
                </Field>
              ) : (
                <Field label="Replace the document" className="sm:col-span-2">
                  {(id) => (
                    <>
                      {/* A real `<input type="file">` wearing the product's
                          field, like the ingestion card's. **Quieter than that
                          one on purpose**: there the dashed cyan box is the
                          work the surface exists for and should pull the eye,
                          here it is one optional field among five and painting
                          it in the accent would make replacing a document look
                          like the point of the dialog.

                          `e.target.value = ""` after a pick is what lets the
                          same file be chosen twice, which matters on the
                          corrected-and-re-exported transcript this is for. */}
                      <input
                        id={id}
                        type="file"
                        accept={REPLACE_ACCEPT[fileKind]}
                        onChange={(e) => {
                          setFile(e.target.files?.[0] ?? null);
                          e.target.value = "";
                        }}
                        className="block w-full cursor-pointer rounded-md border border-border bg-card px-3 py-2 text-small file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-muted file:px-3 file:py-1.5 file:text-small file:font-medium file:text-foreground hover:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      />
                      {/* The hint is written here rather than passed to
                          `Field`, which renders it after everything else: with
                          a file picked it landed *under* the picked row, so the
                          line saying what may be chosen sat below the thing
                          that had been. */}
                      <p className="mt-1.5 text-micro text-muted-foreground">
                        Optional. {KIND_LABEL[fileKind].toLowerCase()} files only.
                      </p>
                      {file && (
                        /* Named, sized and removable. A picked file that shows
                            only in the picker's own grey text is one the reader
                            cannot undo without closing the dialog. */
                        <div className="mt-2 flex items-center gap-3 rounded-md border border-border bg-muted px-3 py-2">
                          <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                          <span className="min-w-0 flex-1 truncate text-small">{file.name}</span>
                          <span className="shrink-0 tabular text-micro text-muted-foreground">
                            {fileSize(file.size)}
                          </span>
                          <button
                            type="button"
                            onClick={() => setFile(null)}
                            aria-label={`Do not replace with ${file.name}`}
                            className="-mr-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                          >
                            <X className="size-4" />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </Field>
              )}
            </div>

            {/* Shown rather than left out. An absence reads as an oversight,
                and the next revision puts a box around it. Same call the gap
                drawer makes about *why we believe it*.

                **It says what replacing does and does not do**, because the
                honest answer changed the moment the document became swappable:
                a new file is attached here and nothing re-reads it, so every
                excerpt still comes from the copy the pipeline saw. Labelled
                honestly, like the connectors and `RunButton`. */}
            <p className="mt-4 rounded-md border border-dashed border-border px-3 py-2 text-micro text-muted-foreground">
              The excerpts quoted from this source are not editable. Swapping the document
              here does not re-read it: the quotes stay as they are until the research is run
              again. To correct what was drawn from it, ask Helix.
            </p>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit">Save changes</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The ingestion card: pick files across several passes, or paste text, then
 * commit the set in one go.
 *
 * **Two tabs and not two cards**, which is the reference's call and the right
 * one: a pasted transcript and a dropped PDF are the same act with two kinds of
 * hand, and they share the one button that commits them.
 */
function Ingest() {
  const [files, setFiles] = useState<File[]>([]);
  const [text, setText] = useState("");
  const [said, setSaid] = useState("");
  const input = useRef<HTMLInputElement>(null);

  const nothingToSend = files.length === 0 && text.trim() === "";

  return (
    <Panel>
      <h2 className="text-base font-medium">Prepare sources for ingestion</h2>
      <p className="mt-1 text-small text-muted-foreground measure">
        Add files across several passes, then ingest the set together.
      </p>

      <Tabs defaultValue="file" className="mt-4">
        <TabsList aria-label="Source input type">
          <TabsTrigger value="file" className="flex items-center gap-1.5">
            <Upload className="size-4" />
            Files
          </TabsTrigger>
          <TabsTrigger value="text" className="flex items-center gap-1.5">
            <FileText className="size-4" />
            Paste text
          </TabsTrigger>
        </TabsList>

        <TabsContent value="file" className="space-y-3">
          <label htmlFor="source-files" className="block text-small font-medium">
            Add files
          </label>
          {/* A real `<input type="file">` wearing the product's field, for the
              reason `SelectField` stays a native `<select>`: it is keyboard
              operable and screen-reader correct for free, and on a phone it
              opens the platform's own picker. `event.target.value = ""` after
              each pick is what lets the same file be chosen twice, and what
              makes *several passes* work at all. */}
          {/* **Painted in the brand colours, on request**, and it is the one
              thing on this surface that should pull the eye: everything else
              here is a receipt, and this is where the work starts.

              Two tokens and no alpha. The field takes `--evidence` dashed on
              `--evidence-muted` — the pair the attachment chip already uses and
              the one the product spends on *act on this* — and the button
              inside it is filled `--primary`, which is the brand and is what
              every other filled button in the product wears. Dashed rather than
              solid because a box you drop into is a box that is waiting for
              something.

              **No `/opacity` anywhere.** A tint that only exists as alpha over
              another ground is invisible to the contrast checker, which reads
              the nearest opaque ancestor — the trap the navigator's header
              records, where `bg-muted/40` reported 3.28:1 on text that is
              really 5.9:1. Both of these are real tokens defined in both
              themes. */}
          <input
            id="source-files"
            ref={input}
            type="file"
            multiple
            accept={FILE_ACCEPT}
            onChange={(e) => {
              const picked = Array.from(e.target.files ?? []);
              if (picked.length) setFiles((f) => [...f, ...picked]);
              e.target.value = "";
              setSaid("");
            }}
            className="block w-full cursor-pointer rounded-lg border border-dashed border-evidence bg-evidence-muted px-3 py-3 text-small file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-primary file:px-3 file:py-1.5 file:text-small file:font-medium file:text-primary-foreground hover:file:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-micro text-muted-foreground">
            PDF, Word, Excel, text, email or image files. Scans need a text layer.
          </p>

          {files.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-small font-medium">Ready to ingest ({files.length})</p>
              <ul className="divide-y divide-border rounded-lg border border-border">
                {files.map((file, i) => (
                  <li
                    key={`${file.name}-${file.size}-${file.lastModified}`}
                    className="flex items-center gap-3 px-3 py-2"
                  >
                    <FileText className="size-4 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="min-w-0 flex-1 truncate text-small">{file.name}</span>
                    <span className="shrink-0 tabular text-micro text-muted-foreground">
                      {fileSize(file.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles((f) => f.filter((_, j) => j !== i))}
                      aria-label={`Remove ${file.name}`}
                      className="-mr-1 shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </TabsContent>

        <TabsContent value="text" className="space-y-3">
          <label htmlFor="source-text" className="block text-small font-medium">
            Text to ingest
          </label>
          <Textarea
            id="source-text"
            rows={8}
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setSaid("");
            }}
            placeholder="Paste notes, a transcript, or an email thread"
          />
          <p className="text-micro text-muted-foreground">
            Added as a plain-text source when you ingest.
          </p>
        </TabsContent>
      </Tabs>

      <div className="mt-4 flex flex-wrap items-center justify-end gap-3">
        {/* `aria-live`, because the button does not change and the only sign
            anything happened is this line. Same reason `SaveMenu` names the file
            it wrote in a `role="status"`. */}
        <p aria-live="polite" className="min-w-0 flex-1 text-small text-muted-foreground">
          {said}
        </p>
        <Button
          type="button"
          disabled={nothingToSend}
          onClick={() =>
            setSaid(
              `${files.length + (text.trim() ? 1 : 0)} ready. Ingestion is not wired up: this prototype reads one research set.`,
            )
          }
        >
          Ingest selected sources
        </Button>
      </div>
    </Panel>
  );
}

/** Whole numbers up to a megabyte, one decimal past it. */

/**
 * No sources at all.
 *
 * Unreachable with this fixture and built anyway: §7.7 says empty is normal and
 * a first-class state, and this is the one a brand-new project opens on.
 */
function Empty() {
  return (
    <div className="rounded-lg border border-dashed border-border-strong px-6 py-12 text-center">
      <span
        aria-hidden
        className="mx-auto grid size-11 place-items-center rounded-full bg-muted text-muted-foreground"
      >
        <Inbox className="size-5" />
      </span>
      <p className="mt-3 text-base font-medium">No sources yet</p>
      <p className="mt-1 text-small text-muted-foreground">
        Add a file or paste text and the six surfaces have something to be about.
      </p>
    </div>
  );
}

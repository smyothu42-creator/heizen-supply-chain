"use client";

import { useRef, useState } from "react";
import { FileText, Inbox, Trash2, Upload, X } from "lucide-react";
import {
  claims,
  dealRisks,
  gaps,
  sources,
  timingSignals,
  type Source,
} from "@/lib/suvarna";
import { FILE_ACCEPT, fileSize } from "@/lib/files";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { Panel } from "@/components/meridian/Primitives";
import { usePanel } from "@/components/meridian/EvidencePanel";
import { EmailIcon, FilingIcon, TranscriptIcon, WebIcon } from "@/components/meridian/Icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ConfirmDialog } from "@/components/workspace/Form";

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

  const shown = sources.filter((s) => !removed.has(s.id));

  return (
    <>
      <SurfaceHero title="Sources" />
      <div className="surface-frame py-5">
        <Ingest />

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
                        and the same mitigation: a ghost rather than a labelled
                        button. */}
                    <button
                      type="button"
                      onClick={() => setPending(source)}
                      aria-label={`Remove ${source.name}`}
                      className="mr-2 ml-1 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-card hover:text-health-critical focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <Trash2 className="size-4" />
                    </button>
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
            setPending(null);
          }}
        />

      </div>
    </>
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

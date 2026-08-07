"use client";

import { cn } from "@/lib/cn";
import { claims, company, gaps, sources } from "@/lib/suvarna";
import { Eyebrow } from "@/components/meridian/Primitives";
import { SummaryStrip } from "@/components/directions/Frames";
import { usePanel } from "@/components/meridian/EvidencePanel";
import { EmailIcon, FilingIcon, TranscriptIcon, WebIcon } from "@/components/meridian/Icons";

/**
 * Sources — the bottom of every evidence chain.
 *
 * Ingestion is real. The connectors are not, and they say so: designed as
 * though they work, labelled honestly as roadmap. See CLAUDE.md section 5.
 */

const KIND_ICON = {
  filing: FilingIcon,
  transcript: TranscriptIcon,
  email: EmailIcon,
  web: WebIcon,
};

const KIND_LABEL = {
  filing: "Public filing",
  transcript: "Call transcript",
  email: "Email thread",
  web: "Web page",
};

/** UI only. Live ingestion is roadmap — do not imply otherwise anywhere here. */
const CONNECTORS = [
  { id: "sap", name: "SAP ECC", detail: "Invoice, PO and vendor master tables", note: "They run this" },
  { id: "oracle", name: "Oracle Fusion", detail: "Alternative ERP", note: null },
  { id: "coupa", name: "Coupa", detail: "Procurement and invoicing", note: null },
  { id: "drive", name: "Google Drive", detail: "Shared folders of filings and decks", note: null },
  { id: "gmail", name: "Gmail", detail: "Threads with the client", note: null },
  { id: "warehouse", name: "Snowflake", detail: "Whatever they already report from", note: null },
];

export function SourcesView() {
  const { open } = usePanel();

  const totalExcerpts = gaps.reduce((s, g) => s + g.evidence.length, 0);
  const unsourcedClaims = claims.filter((c) => c.sourceIds.length === 0);

  return (
    <div className="mx-auto w-full max-w-5xl px-3 py-5 sm:px-4">
      <Eyebrow>{company.name} · what the research is built on</Eyebrow>
      <h1 className="mt-1.5 font-display text-h1 leading-tight">Four sources</h1>
      <p className="mt-2 text-base text-muted-foreground measure">
        Everything Meridian says about Suvarna traces back to one of these. If a claim cannot be
        walked back to something here, it is marked as having nothing behind it rather than quietly
        presented as fact.
      </p>

      <div className="mt-4">
        <SummaryStrip
          items={[
            { label: "Sources", value: String(sources.length) },
            { label: "All ingested", value: "Yes" },
            { label: "Excerpts pulled", value: String(totalExcerpts) },
            { label: "Claims supported", value: String(claims.length - unsourcedClaims.length) },
            { label: "Claims with nothing", value: String(unsourcedClaims.length) },
          ]}
        />
      </div>

      {/* ------------------------------------------------- ingested */}
      <section className="mt-7">
        <h2 className="text-h3 font-medium tracking-tight">In the research</h2>
        <ul className="mt-3 space-y-3">
          {sources.map((source) => {
            const Icon = KIND_ICON[source.kind];
            const excerpts = gaps.flatMap((g) =>
              g.evidence.filter((e) => e.sourceId === source.id),
            );
            const supports = claims.filter((c) => c.sourceIds.includes(source.id));
            return (
              <li key={source.id}>
                <article className="rounded-lg border border-border bg-card p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-2.5">
                      <Icon className="mt-1 text-evidence" />
                      <div className="min-w-0">
                        <h3 className="text-base font-medium">{source.name}</h3>
                        <p className="text-small text-muted-foreground">
                          {KIND_LABEL[source.kind]} · {source.date}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full border border-health-healthy px-2 py-0.5 text-micro font-medium text-health-healthy">
                      Ingested
                    </span>
                  </div>

                  <p className="mt-2 text-small text-muted-foreground">{source.detail}</p>

                  <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-3">
                    <div>
                      <dt className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
                        Excerpts pulled
                      </dt>
                      <dd className="tabular text-small font-medium">{excerpts.length}</dd>
                    </div>
                    <div>
                      <dt className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
                        Claims it supports
                      </dt>
                      <dd className="tabular text-small font-medium">{supports.length}</dd>
                    </div>
                    <div>
                      <dt className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
                        Gaps it evidences
                      </dt>
                      <dd className="tabular text-small font-medium">
                        {new Set(
                          gaps
                            .filter((g) => g.evidence.some((e) => e.sourceId === source.id))
                            .map((g) => g.id),
                        ).size}
                      </dd>
                    </div>
                  </dl>

                  {excerpts[0] && (
                    <blockquote className="mt-3 border-l border-border pl-3 text-small measure">
                      {excerpts[0].excerpt}
                      <span className="mt-1 block text-micro text-muted-foreground">
                        {excerpts[0].locator}
                      </span>
                    </blockquote>
                  )}

                  <button
                    type="button"
                    onClick={() => open({ kind: "source", id: source.id })}
                    className="mt-3 rounded-md border border-border-strong bg-card px-2.5 py-1 text-small hover:border-foreground"
                  >
                    See everything from this source
                  </button>
                </article>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------------- add more */}
      <section className="mt-8">
        <h2 className="text-h3 font-medium tracking-tight">Add sources</h2>
        <p className="mt-1 text-small text-muted-foreground measure">
          The fastest way to firm up the ₹3.9 Cr currently resting on inference is a transcript or a
          data extract. Twelve months of invoice-level data would price the two gaps we cannot.
        </p>
        <div className="mt-3 rounded-lg border border-dashed border-border-strong bg-muted px-4 py-6 text-center">
          <p className="text-base font-medium">Drop a file, or paste a transcript</p>
          <p className="mt-1 text-small text-muted-foreground">
            PDF, DOCX, XLSX, TXT, or a meeting recording. Scans need a text layer.
          </p>
          <button
            type="button"
            className="mt-3 rounded-md bg-foreground px-3 py-1.5 text-small font-medium text-background hover:opacity-90"
          >
            Add sources
          </button>
        </div>
      </section>

      {/* ------------------------------------------------- connectors */}
      <section className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-h3 font-medium tracking-tight">Connect a system</h2>
          <span className="rounded-full border border-border-strong px-2 py-0.5 text-micro text-muted-foreground">
            Not built yet
          </span>
        </div>
        <p className="mt-1 text-small text-muted-foreground measure">
          None of these work today. They are designed as though they do because that is the roadmap,
          and labelled plainly because a consultant who clicks one in front of a client and finds
          nothing happens has a worse problem than a missing feature.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {CONNECTORS.map((c) => (
            <li key={c.id}>
              <div
                className={cn(
                  "flex h-full flex-col rounded-lg border border-dashed border-border-strong",
                  "bg-transparent px-3.5 py-3",
                )}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-small font-medium">{c.name}</span>
                  {c.note && (
                    <span className="shrink-0 text-micro text-muted-foreground">{c.note}</span>
                  )}
                </div>
                <p className="mt-0.5 flex-1 text-micro text-muted-foreground">{c.detail}</p>
                <button
                  type="button"
                  disabled
                  className="mt-2.5 w-full cursor-not-allowed rounded-md border border-border px-2.5 py-1 text-small text-muted-foreground"
                >
                  Not connected
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* ------------------------------------------------- unsourced */}
      <section className="mt-8 border-t border-border pt-5">
        <h2 className="text-base font-medium">
          Claims with nothing behind them
          <span className="ml-2 tabular text-small font-normal text-muted-foreground">
            {unsourcedClaims.length}
          </span>
        </h2>
        <p className="mt-1 text-small text-muted-foreground measure">
          These came from reasoning rather than from a document. They are kept visible on purpose —
          hiding them would make the research look stronger than it is.
        </p>
        <ul className="mt-3 space-y-2">
          {unsourcedClaims.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                onClick={() => open({ kind: "claim", id: c.id })}
                className="w-full rounded-md border border-dashed border-border-strong px-3 py-2 text-left hover:border-foreground"
              >
                <span className="block text-small measure">{c.statement}</span>
                <span className="mt-0.5 block text-micro text-muted-foreground">{c.basis}</span>
              </button>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

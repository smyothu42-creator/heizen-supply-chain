"use client";

import { claims, gaps, sources } from "@/lib/suvarna";
import { SurfaceHero } from "@/components/shell/SurfaceHero";
import { Panel } from "@/components/meridian/Primitives";
import { usePanel } from "@/components/meridian/EvidencePanel";
import { EmailIcon, FilingIcon, TranscriptIcon, WebIcon } from "@/components/meridian/Icons";

/**
 * Sources — the bottom of every evidence chain.
 *
 * Ingestion is real. The connectors are not, and they say so.
 */

const KIND_ICON = {
  filing: FilingIcon,
  transcript: TranscriptIcon,
  email: EmailIcon,
  web: WebIcon,
};

/** UI only. Live ingestion is roadmap — do not imply otherwise anywhere here. */
const CONNECTORS = [
  { id: "sap", name: "SAP ECC", note: "They run this" },
  { id: "oracle", name: "Oracle Fusion", note: null },
  { id: "coupa", name: "Coupa", note: null },
  { id: "drive", name: "Google Drive", note: null },
  { id: "gmail", name: "Gmail", note: null },
  { id: "warehouse", name: "Snowflake", note: null },
];

export function SourcesView() {
  const { open } = usePanel();
  const unsourced = claims.filter((c) => c.sourceIds.length === 0);

  return (
    <>
      <SurfaceHero title="Sources" />
      <div className="surface-frame py-5">
        <Panel className="px-0 py-0 sm:px-0 sm:py-0">
          <ul className="divide-y divide-border px-4 sm:px-5">
            {sources.map((source) => {
              const Icon = KIND_ICON[source.kind];
              const excerpts = gaps.flatMap((g) =>
                g.evidence.filter((e) => e.sourceId === source.id),
              );
              const supports = claims.filter((c) => c.sourceIds.includes(source.id));
              return (
                <li key={source.id}>
                  <button
                    type="button"
                    onClick={() => open({ kind: "source", id: source.id })}
                    className="group flex w-full items-baseline gap-3 py-3 text-left"
                  >
                    <Icon className="translate-y-[2px] text-evidence" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-base transition-colors group-hover:text-muted-foreground">
                        {source.name}
                      </span>
                      <span className="block truncate text-small text-muted-foreground">
                        {source.detail}
                      </span>
                    </span>
                    <span className="tabular shrink-0 text-small text-muted-foreground">
                      {excerpts.length} excerpts · {supports.length} claims
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        <section className="mt-5">
          <div className="rounded-lg border border-dashed border-border-strong bg-muted px-4 py-5 text-center">
            <p className="text-base font-medium">Drop a file, or paste a transcript</p>
            <p className="mt-0.5 text-small text-muted-foreground">
              PDF, DOCX, XLSX, TXT or a recording. Scans need a text layer.
            </p>
            <button
              type="button"
              className="mt-3 rounded-md bg-foreground px-3 py-1.5 text-small font-medium text-background hover:opacity-90"
            >
              Add sources
            </button>
          </div>
        </section>

        <Panel className="mt-5">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <h2 className="text-base font-medium">Connect a system</h2>
            <span className="rounded-full border border-border-strong px-2 py-0.5 text-micro text-muted-foreground">
              Not built yet
            </span>
          </div>
          <p className="mt-1 text-small text-muted-foreground measure">
            Designed as though they work, labelled plainly because they do not.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {CONNECTORS.map((c) => (
              <li key={c.id}>
                <div className="flex items-baseline justify-between gap-2 rounded-lg border border-dashed border-border-strong px-3.5 py-2.5">
                  <span className="text-small">{c.name}</span>
                  <span className="shrink-0 text-micro text-muted-foreground">
                    {c.note ?? "Not connected"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel className="mt-5">
          <h2 className="text-base font-medium">
            Nothing behind them
            <span className="ml-2 tabular text-small font-normal text-muted-foreground">
              {unsourced.length}
            </span>
          </h2>
          <p className="mt-1 text-small text-muted-foreground measure">
            Reasoning, not documents. Kept visible on purpose.
          </p>
          <ul className="mt-2 divide-y divide-border border-t border-border">
            {unsourced.map((c) => (
              <li key={c.id}>
                <button
                  type="button"
                  onClick={() => open({ kind: "claim", id: c.id })}
                  className="measure w-full py-2.5 text-left text-small transition-colors hover:text-muted-foreground"
                >
                  {c.statement}
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}

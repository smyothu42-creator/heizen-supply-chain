"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import {
  claims,
  gapById,
  gaps,
  metricById,
  sourceById,
  stakeholderById,
  type Tier,
} from "@/lib/suvarna";
import { CloseIcon, TierMark } from "./Icons";
import { EvidenceMark, HealthMark } from "./NodeCard";
import {
  COMPLETENESS_LABEL,
  COMPLETENESS_MEANING,
  HEALTH_LABEL,
  HEALTH_MEANING,
  entityById,
  nodeById,
  pathTo,
} from "@/lib/canvas";

/**
 * One right-hand slot, shared by every detail view. Never two panels at once —
 * a consultant with three panels open has lost the thread.
 * Overlays on narrow screens, splits the layout on wide ones.
 * See .claude/skills/layout-and-density.
 */

export type PanelTarget =
  | { kind: "gap"; id: string }
  | { kind: "claim"; id: string }
  | { kind: "source"; id: string }
  | { kind: "node"; id: string }
  | { kind: "entity"; id: string }
  | null;

interface PanelContextValue {
  target: PanelTarget;
  open: (t: NonNullable<PanelTarget>) => void;
  close: () => void;
}

const PanelContext = createContext<PanelContextValue>({
  target: null,
  open: () => {},
  close: () => {},
});

export const usePanel = () => useContext(PanelContext);

export function PanelProvider({ children }: { children: ReactNode }) {
  const [target, setTarget] = useState<PanelTarget>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);

  const open = useCallback((t: NonNullable<PanelTarget>) => {
    if (typeof document !== "undefined") {
      lastTrigger.current = document.activeElement as HTMLElement | null;
    }
    setTarget(t);
  }, []);

  const close = useCallback(() => {
    setTarget(null);
    // Focus goes back where it came from, or the user is stranded at the top
    // of the document with no idea what they just closed.
    lastTrigger.current?.focus?.();
  }, []);

  return (
    <PanelContext.Provider value={{ target, open, close }}>
      <div className={cn("flex-1 min-h-0 flex flex-col", target && "lg:pr-[420px]")}>
        {children}
      </div>
      <EvidencePanel />
    </PanelContext.Provider>
  );
}

function EvidencePanel() {
  const { target, close } = usePanel();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (target) panelRef.current?.focus();
  }, [target]);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [target, close]);

  if (!target) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close detail"
        onClick={close}
        className="fixed inset-0 z-30 bg-foreground/20 lg:hidden"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Detail"
        tabIndex={-1}
        className={cn(
          "fixed inset-y-0 right-0 z-40 w-full max-w-[420px] overflow-y-auto",
          "border-l border-border bg-card shadow-xl outline-none",
        )}
      >
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
          <span className="text-micro font-medium uppercase tracking-[0.09em] text-muted-foreground">
            {target.kind === "gap" && "Gap detail"}
            {target.kind === "claim" && "Claim detail"}
            {target.kind === "source" && "Source"}
            {target.kind === "node" && "Process detail"}
            {target.kind === "entity" && "Entity detail"}
          </span>
          <button
            type="button"
            onClick={close}
            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <CloseIcon />
            <span className="sr-only">Close</span>
          </button>
        </div>

        <div className="px-4 py-4">
          {target.kind === "gap" && <GapDetail id={target.id} />}
          {target.kind === "claim" && <ClaimDetail id={target.id} />}
          {target.kind === "source" && <SourceDetail id={target.id} />}
          {target.kind === "node" && <NodeDetail id={target.id} />}
          {target.kind === "entity" && <EntityDetail id={target.id} />}
        </div>
      </div>
    </>
  );
}

/* -------------------------------------------------------------------------- */

function TierLine({ tier }: { tier: Tier }) {
  const label =
    tier === "confirmed" ? "Confirmed" : tier === "inferred" ? "Inferred" : "Unverified";
  return (
    <span className="inline-flex items-center gap-1.5 text-micro uppercase tracking-[0.07em] text-muted-foreground">
      <TierMark tier={tier} />
      {label}
    </span>
  );
}

function Excerpts({ items }: { items: { excerpt: string; label: string }[] }) {
  return (
    <ul className="space-y-3 border-l border-border pl-3">
      {items.map((it, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[15px] top-[7px] h-1.5 w-1.5 rounded-full bg-evidence" aria-hidden />
          <blockquote className="text-small">{it.excerpt}</blockquote>
          <div className="mt-1 text-micro text-muted-foreground">{it.label}</div>
        </li>
      ))}
    </ul>
  );
}

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-5 first:mt-0">
      <h3 className="text-micro font-medium uppercase tracking-[0.09em] text-muted-foreground">
        {title}
      </h3>
      <div className="mt-1.5">{children}</div>
    </section>
  );
}

function GapDetail({ id }: { id: string }) {
  const gap = gapById(id);
  const owner = stakeholderById(gap.ownerId);

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="tabular text-micro text-muted-foreground">Rank {gap.rank} of 12</span>
        <TierLine tier={gap.tier} />
      </div>
      <h2 className="mt-1.5 text-h3 font-medium tracking-tight">{gap.title}</h2>
      <p className="mt-1.5 text-small text-muted-foreground">{gap.plainLine}</p>

      <div className="mt-3 flex items-baseline gap-3 border-y border-border py-3">
        <span className="font-display text-h2 tabular">{money(gap.amountCr)}</span>
        <span className="text-small text-muted-foreground">
          {gap.amountCr == null ? "not priced" : "a year"}
        </span>
        <span className="ml-auto text-small text-muted-foreground">
          {gap.effort} effort · {gap.weeks} weeks
        </span>
      </div>

      {gap.unpricedReason && (
        <p className="mt-3 rounded-md border border-dashed border-border-strong bg-muted px-3 py-2 text-small">
          {gap.unpricedReason}
        </p>
      )}

      <Block title="Why we believe it">
        <p className="text-small measure">{gap.why}</p>
      </Block>

      <Block title="Expected impact">
        <p className="text-small measure">{gap.impact}</p>
      </Block>

      {gap.metricIds.length > 0 && (
        <Block title="The numbers behind it">
          <ul className="space-y-2">
            {gap.metricIds.map((mid) => {
              const m = metricById(mid);
              return (
                <li key={mid} className="text-small">
                  <div className="flex items-baseline justify-between gap-3">
                    <span>{m.label}</span>
                    <span className="tabular shrink-0">
                      <span className="font-medium">
                        {m.actual == null ? "—" : `${m.actual}${m.unit}`}
                      </span>
                      <span className="text-metric-best-in-class">
                        {" "}
                        vs {m.bestInClass}
                        {m.unit}
                      </span>
                    </span>
                  </div>
                  <p className="text-micro text-muted-foreground">{m.gloss}</p>
                </li>
              );
            })}
          </ul>
        </Block>
      )}

      <Block title={`Evidence · ${gap.evidence.length}`}>
        <Excerpts
          items={gap.evidence.map((e) => ({
            excerpt: e.excerpt,
            label: `${sourceById(e.sourceId).name} · ${e.locator}`,
          }))}
        />
      </Block>

      <Block title="How sure we are">
        <p className="text-small font-medium">{gap.confidence}</p>
        <p className="mt-0.5 text-small text-muted-foreground measure">{gap.confidenceReason}</p>
      </Block>

      <Block title="Whose problem this is">
        <p className="text-small">
          {owner.name} — {owner.role}
          {!owner.met && <span className="text-muted-foreground"> · not met yet</span>}
        </p>
      </Block>

      <div className="mt-6 border-t border-border pt-3">
        <button
          type="button"
          className="rounded-md border border-border-strong bg-card px-2.5 py-1 text-small hover:border-foreground"
        >
          This isn&apos;t right
        </button>
        <p className="mt-1.5 text-micro text-muted-foreground measure">
          Describe the correction in your own words. We&apos;ll update it and keep a record of the
          change.
        </p>
      </div>
    </div>
  );
}

function ClaimDetail({ id }: { id: string }) {
  const claim = claims.find((c) => c.id === id)!;
  const gap = claim.linkedGapId ? gapById(claim.linkedGapId) : null;

  return (
    <div>
      <TierLine tier={claim.tier} />
      <h2 className="mt-2 text-lead font-medium measure">{claim.statement}</h2>

      <Block title="What this rests on">
        <p className="text-small measure">{claim.basis}</p>
      </Block>

      {claim.sourceIds.length > 0 ? (
        <Block title={`Sources · ${claim.sourceIds.length}`}>
          <ul className="space-y-1.5">
            {claim.sourceIds.map((sid) => {
              const s = sourceById(sid);
              return (
                <li key={sid} className="text-small">
                  {s.name}
                  <span className="text-muted-foreground"> · {s.detail}</span>
                </li>
              );
            })}
          </ul>
        </Block>
      ) : (
        <Block title="Sources">
          <p className="text-small text-muted-foreground measure">
            Nothing is attached to this. It came from reasoning, not from a document — treat it as a
            question, not a statement.
          </p>
        </Block>
      )}

      {gap && (
        <Block title="What it is worth">
          <p className="text-small">
            <span className="tabular font-medium">{money(gap.amountCr)}</span>{" "}
            <span className="text-muted-foreground">— {gap.title}</span>
          </p>
        </Block>
      )}
    </div>
  );
}

function NodeDetail({ id }: { id: string }) {
  const node = nodeById(id);
  const trail = pathTo(id);
  const value = node.gapIds.reduce((s, gid) => s + (gapById(gid).amountCr ?? 0), 0);

  return (
    <div>
      <nav aria-label="Level" className="text-micro text-muted-foreground">
        {trail.map((n, i) => (
          <span key={n.id}>
            {i > 0 && <span aria-hidden> → </span>}
            {i === 0 ? `Level 0 · ${n.name}` : n.name}
          </span>
        ))}
      </nav>

      <h2 className="mt-1.5 text-h3 font-medium tracking-tight">{node.name}</h2>
      <p className="mt-1.5 text-small text-muted-foreground measure">{node.plainLine}</p>

      {/* The two axes, stated separately and never merged into one badge. */}
      <dl className="mt-3 grid grid-cols-2 gap-3 border-y border-border py-3">
        <div>
          <dt className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
            How this is running
          </dt>
          <dd className="mt-1 flex items-center gap-1.5 text-small font-medium">
            <HealthMark
              health={node.health}
              className={
                node.health === "critical"
                  ? "text-health-critical"
                  : node.health === "watch"
                    ? "text-health-watch"
                    : "text-health-healthy"
              }
            />
            {HEALTH_LABEL[node.health]}
          </dd>
          <dd className="mt-0.5 text-micro text-muted-foreground">{HEALTH_MEANING[node.health]}</dd>
        </div>
        <div>
          <dt className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
            Evidence we have
          </dt>
          <dd className="mt-1 flex items-center gap-1.5 text-small font-medium">
            <EvidenceMark completeness={node.completeness} />
            {COMPLETENESS_LABEL[node.completeness]}
          </dd>
          <dd className="mt-0.5 text-micro text-muted-foreground">
            {COMPLETENESS_MEANING[node.completeness]}
          </dd>
        </div>
      </dl>

      {node.completeness === "none" && (
        <p className="mt-3 rounded-md border border-dashed border-border-strong bg-muted px-3 py-2 text-small measure">
          <span className="font-medium">Read the colour carefully. </span>
          We have nothing from Suvarna on this. The health above is what this process usually looks
          like in food processing, not something we checked.
        </p>
      )}

      {node.metricIds.length > 0 && (
        <Block title="The numbers here">
          <ul className="space-y-2">
            {node.metricIds.map((mid) => {
              const m = metricById(mid);
              return (
                <li key={mid} className="text-small">
                  <div className="flex items-baseline justify-between gap-3">
                    <span>{m.label}</span>
                    <span className="tabular shrink-0">
                      <span className="font-medium">
                        {m.actual == null ? "—" : `${m.actual}${m.unit}`}
                      </span>
                      <span className="text-metric-best-in-class">
                        {" "}
                        vs {m.bestInClass}
                        {m.unit}
                      </span>
                    </span>
                  </div>
                  <p className="text-micro text-muted-foreground">{m.gloss}</p>
                </li>
              );
            })}
          </ul>
        </Block>
      )}

      <Block title={`Gaps here · ${node.gapIds.length}`}>
        {node.gapIds.length > 0 ? (
          <>
            <p className="mb-2 tabular text-small font-medium">
              {value > 0 ? `${money(value)} a year` : "Not priced"}
            </p>
            <ul className="space-y-1.5">
              {node.gapIds.map((gid) => {
                const g = gapById(gid);
                return (
                  <li key={gid} className="flex items-baseline justify-between gap-3 text-small">
                    <span className="measure">{g.title}</span>
                    <span className="tabular shrink-0 font-medium">{money(g.amountCr)}</span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="text-small text-muted-foreground measure">
            {node.emptyKind === "confirmed-none"
              ? "We looked and found nothing worth raising. This is a good outcome."
              : node.emptyKind === "no-sources"
                ? "We looked, but there is nothing to read. Add a transcript or filing and we'll research this."
                : "Not yet researched. Nothing here is a finding either way."}
          </p>
        )}
      </Block>

      <Block title={`Sources · ${node.sourceIds.length}`}>
        {node.sourceIds.length > 0 ? (
          <ul className="space-y-1.5">
            {node.sourceIds.map((sid) => {
              const s = sourceById(sid);
              return (
                <li key={sid} className="text-small">
                  {s.name}
                  <span className="text-muted-foreground"> · {s.detail}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-small text-muted-foreground">Nothing attached to this process.</p>
        )}
      </Block>
    </div>
  );
}

function EntityDetail({ id }: { id: string }) {
  const entity = entityById(id);
  const value = entity.gapIds.reduce((s, gid) => s + (gapById(gid).amountCr ?? 0), 0);

  return (
    <div>
      <span className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
        Entity · a record that moves through the operation
      </span>
      <h2 className="mt-1.5 text-h3 font-medium tracking-tight">{entity.name}</h2>
      <p className="mt-1.5 text-small text-muted-foreground measure">{entity.plainLine}</p>

      <dl className="mt-3 grid grid-cols-2 gap-3 border-y border-border py-3">
        <div>
          <dt className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
            How this is running
          </dt>
          <dd className="mt-1 flex items-center gap-1.5 text-small font-medium">
            <HealthMark
              health={entity.health}
              className={
                entity.health === "critical"
                  ? "text-health-critical"
                  : entity.health === "watch"
                    ? "text-health-watch"
                    : "text-health-healthy"
              }
            />
            {HEALTH_LABEL[entity.health]}
          </dd>
        </div>
        <div>
          <dt className="text-micro uppercase tracking-[0.08em] text-muted-foreground">
            Evidence we have
          </dt>
          <dd className="mt-1 flex items-center gap-1.5 text-small font-medium">
            <EvidenceMark completeness={entity.completeness} />
            {COMPLETENESS_LABEL[entity.completeness]}
          </dd>
        </div>
      </dl>

      <Block title="Where it lives">
        <p className="text-small">{entity.system}</p>
      </Block>

      <Block title="How much of it">
        <p className="tabular text-small">{entity.volume}</p>
      </Block>

      <Block title={`Gaps involving it · ${entity.gapIds.length}`}>
        {entity.gapIds.length > 0 ? (
          <>
            <p className="mb-2 tabular text-small font-medium">{money(value)} a year</p>
            <ul className="space-y-1.5">
              {entity.gapIds.map((gid) => {
                const g = gapById(gid);
                return (
                  <li key={gid} className="flex items-baseline justify-between gap-3 text-small">
                    <span className="measure">{g.title}</span>
                    <span className="tabular shrink-0 font-medium">{money(g.amountCr)}</span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="text-small text-muted-foreground">Nothing found against this record.</p>
        )}
      </Block>

      <Block title={`Sources · ${entity.sourceIds.length}`}>
        {entity.sourceIds.length > 0 ? (
          <ul className="space-y-1.5">
            {entity.sourceIds.map((sid) => {
              const s = sourceById(sid);
              return (
                <li key={sid} className="text-small">
                  {s.name}
                  <span className="text-muted-foreground"> · {s.detail}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-small text-muted-foreground">Nothing attached.</p>
        )}
      </Block>
    </div>
  );
}

function SourceDetail({ id }: { id: string }) {
  const source = sourceById(id);

  // Walking the chain backwards: everything this source produced.
  const drawnFrom = gaps.flatMap((g) =>
    g.evidence
      .filter((e) => e.sourceId === id)
      .map((e) => ({ excerpt: e.excerpt, label: `${e.locator} → ${g.title}`, gapId: g.id })),
  );
  const supports = claims.filter((c) => c.sourceIds.includes(id));

  return (
    <div>
      <h2 className="text-h3 font-medium tracking-tight">{source.name}</h2>
      <p className="mt-1 text-small text-muted-foreground">{source.detail}</p>
      <p className="mt-0.5 text-small text-muted-foreground">{source.date}</p>

      <Block title={`What we drew from it · ${drawnFrom.length}`}>
        {drawnFrom.length > 0 ? (
          <Excerpts items={drawnFrom} />
        ) : (
          <p className="text-small text-muted-foreground">Nothing yet.</p>
        )}
      </Block>

      <Block title={`Claims it supports · ${supports.length}`}>
        <ul className="space-y-1.5">
          {supports.map((c) => (
            <li key={c.id} className="text-small measure flex gap-2">
              <TierMark tier={c.tier} className="mt-1 shrink-0 text-muted-foreground" />
              <span>{c.statement}</span>
            </li>
          ))}
        </ul>
      </Block>
    </div>
  );
}

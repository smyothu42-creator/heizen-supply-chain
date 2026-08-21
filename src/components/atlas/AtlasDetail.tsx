"use client";

import { cn } from "@/lib/cn";
import { formatDay } from "@/lib/plan";
import {
  atlasDomains,
  atlasSubdomains,
  domainById,
  pastProjectById,
  pastProjects,
  provenCountOf,
  subdomainsOf,
} from "@/lib/atlas";
import { useAi } from "@/components/shell/AiPanel";
import { Button } from "@/components/ui/button";
import { CoverageBar } from "./AtlasGraph";

/**
 * The rail beside the graph. Three states, in order of precedence:
 *
 * 1. **Hovering a domain** — a quick preview, gone the moment the pointer
 *    leaves. This is the fast read: what a domain is, without committing to
 *    it.
 * 2. **A domain selected** (clicked) — the full list: every subdomain, and
 *    which past project (if any) already proves it. This is where "Ask about
 *    this" lives, and where a subdomain's precedent is stated in full rather
 *    than as a name.
 * 3. **Nothing hovered or selected** — the territory's own totals.
 *
 * Hover wins over selection rather than being suppressed by it: moving the
 * pointer to a different domain should always preview it, and the selected
 * domain's detail comes back the moment the pointer leaves. Losing your
 * selection to a stray hover would be worse than the reverse.
 *
 * ---
 *
 * **The resting state is a reading now, not an instruction.** It was a dashed
 * empty box holding "Hover a domain to preview it" — a third of the surface
 * spent, before any interaction, on a sentence that is false on a phone, where
 * there is no hover. So the rail opens on what the whole territory adds up to:
 * five domains, twelve sub-processes, seven of them already built somewhere,
 * and which domains have nothing behind them at all (§7.14 — a total is only a
 * total of what has been walked). The hint survives as one muted line under
 * it, and it says *click*, which is true everywhere.
 *
 * That also collapses two states into one: the summary used to be what hovering
 * the centre node showed, and the centre is now the thing that returns you to
 * it rather than a fourth thing to read.
 *
 * **`--evidence`, not `--effort-low`,** for the same reason the graph changed:
 * a past project behind a sub-process is evidence, and green next door to Gaps
 * reads as low effort. See the header comment on `AtlasGraph`.
 */
export function AtlasDetail({
  hoveredId,
  selectedId,
}: {
  hoveredId: string | null;
  selectedId: string | null;
}) {
  /* **Hovering the domain you already have open shows the detail, not the
     preview.** Straight precedence had a real bug in it: you clicked a node,
     the pointer was still on that node, so the rail kept showing the preview
     and the click appeared to do nothing until you moved the mouse. Hover
     still wins over a *different* selection — moving to another domain must
     always preview it — which is the case the rule was written for. */
  if (hoveredId && hoveredId !== "center" && hoveredId !== selectedId) {
    const domain = domainById(hoveredId);
    if (domain) return <DomainPreview domainId={domain.id} />;
  }

  if (selectedId && hoveredId !== "center") {
    const domain = domainById(selectedId);
    if (domain) return <DomainDetail domainId={domain.id} />;
  }

  return <TerritorySummary />;
}

/* -------------------------------------------------------------------------- */

/** Shared shell, so the three states are one box that changes contents rather
    than three boxes of slightly different width and padding. */
function Rail({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 shadow-card lg:sticky lg:top-24 lg:self-start">
      {children}
    </div>
  );
}

function TerritorySummary() {
  const proven = atlasSubdomains.filter((s) => s.pastProjectId).length;
  const untouched = atlasDomains.filter((d) =>
    subdomainsOf(d.id).every((s) => !s.pastProjectId),
  );

  return (
    <Rail>
      <h2 className="text-base font-semibold leading-tight">The whole territory</h2>
      <dl className="mt-3 divide-y divide-border border-y border-border">
        <Reading
          value={`${proven} of ${atlasSubdomains.length}`}
          label="sub-processes proven"
        />
        <Reading value={String(atlasDomains.length)} label="domains worked in" />
        <Reading value={String(pastProjects.length)} label="past projects behind them" />
      </dl>
      {untouched.length > 0 && (
        <p className="reading mt-3 text-micro text-muted-foreground">
          Nothing built yet in {untouched.map((d) => d.name).join(" or ")}. A gap landing
          there is a first build, not a repeat of one.
        </p>
      )}
      <p className="reading mt-3 text-micro text-muted-foreground">
        Click a domain to see its sub-processes and what proves each.
      </p>
    </Rail>
  );
}

/** One line of the summary. The figure is `tabular` and set larger so three of
    them line up down the rail, the idiom What to build's metric strip uses. */
function Reading({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex items-baseline gap-2 py-2">
      <dd className="tabular text-base font-semibold leading-none">{value}</dd>
      <dt className="min-w-0 text-small text-muted-foreground">{label}</dt>
    </div>
  );
}

function DomainPreview({ domainId }: { domainId: string }) {
  const domain = domainById(domainId)!;
  const { proven, total } = provenCountOf(domainId);
  return (
    <Rail>
      <h2 className="text-base font-semibold leading-tight">{domain.name}</h2>
      <p className="reading mt-1 text-small text-muted-foreground">{domain.plainLine}</p>
      <CoverageBar proven={proven} total={total} className="mt-3" />
      <p className="tabular mt-1.5 text-micro text-muted-foreground">
        {proven} of {total} sub-processes proven
        {proven === total ? ", the whole domain." : proven === 0 ? ". Nothing here yet." : "."}
      </p>
      <p className="mt-2 text-micro text-muted-foreground">Click to see each one.</p>
    </Rail>
  );
}

function DomainDetail({ domainId }: { domainId: string }) {
  const { attach } = useAi();
  const domain = domainById(domainId)!;
  const subs = subdomainsOf(domainId);
  const { proven, total } = provenCountOf(domainId);

  return (
    <Rail>
      <h2 className="text-base font-semibold leading-tight">{domain.name}</h2>
      <p className="reading mt-1 text-small text-muted-foreground">{domain.plainLine}</p>

      {/* The same coverage reading the node carries, so clicking a node does
          not change what the number says — only how much of it you can see. */}
      <CoverageBar proven={proven} total={total} className="mt-3" />
      <p className="tabular mt-1.5 text-micro text-muted-foreground">
        {proven} of {total} sub-processes proven
      </p>

      {/* **Under the heading, full width, not beside it.** Two domain names
          out of five wrap in a 340px rail, and a `shrink-0` button on that
          line took the title down to about half the column and set it three
          lines deep — the same collapse `GapRow` documents for a chip beside a
          `flex-1` title. There is nothing to squeeze here once the button has
          its own line. */}
      <Button
        variant="outline"
        size="sm"
        className="mt-3 w-full rounded-full"
        onClick={() =>
          attach({
            kind: "Atlas domain",
            text: domain.name,
            query: `What has Heizen built in ${domain.name}?`,
          })
        }
      >
        Ask about this domain
      </Button>

      {/* Rules between entries rather than a border round each: these are
          items in one list, and a box per sub-process draws four walls where
          the material has none. Same fix the Operations panel took. */}
      <ul className="mt-3 divide-y divide-border border-t border-border">
        {subs.map((sub) => {
          const project = sub.pastProjectId ? pastProjectById(sub.pastProjectId) : undefined;
          return (
            <li key={sub.id} className="py-2.5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                <p className="text-small font-medium leading-tight">{sub.name}</p>
                <ProvenMark project={project?.name} />
              </div>
              {/* **One prose line per sub-process, never two.** Twelve names,
                  each with a gloss *and* a delivery sentence under it, made
                  the rail a page of small grey text that nobody reads to the
                  bottom — §7.1, and the exact failure Research is still being
                  dug out of.

                  Which line survives depends on what the sub-process has. A
                  proven one gets the past project: what was built and when is
                  the thing you say out loud, and the gloss is guessable from a
                  name you have just been told Heizen has shipped. An unbuilt
                  one has no project to name, so it keeps the plain-language
                  line — which is where §7.6 actually bites, because that is
                  the name with nothing else to explain it. */}
              <p className="reading mt-1 text-micro text-muted-foreground">
                {project
                  ? `${formatDay(project.deliveredOn)}: ${project.built}`
                  : sub.plainLine}
              </p>
            </li>
          );
        })}
      </ul>
    </Rail>
  );
}

/**
 * Whether Heizen has built this before, as a two-state pill.
 *
 * **"Not built yet", not "No precedent yet".** Plain language over the domain
 * word (§7.6), and the absence is the ordinary case rather than a warning
 * (§7.7) — most of a territory is unwalked — so it is neutral ink, never red.
 */
function ProvenMark({ project }: { project?: string }) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-micro font-medium",
        project
          ? "border-transparent bg-evidence-muted text-evidence"
          : "border-border bg-muted text-muted-foreground",
      )}
    >
      {project ? `Proven in ${project}` : "Not built yet"}
    </span>
  );
}

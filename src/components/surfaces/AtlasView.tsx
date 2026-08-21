"use client";

import { useState } from "react";
import { formatDay } from "@/lib/plan";
import { atlasSubdomains, pastProjects } from "@/lib/atlas";
import { AtlasGraph } from "@/components/atlas/AtlasGraph";
import { AtlasDetail } from "@/components/atlas/AtlasDetail";
import { SurfaceHero } from "@/components/shell/SurfaceHero";

/**
 * Atlas — Heizen's own capability map, not this company's.
 *
 * Research and Operations are about the client in front of you. Atlas is
 * about Heizen: every domain it has worked in, and which past engagement
 * proves the fix. Gaps reads it — `Gap.precedentId` in `suvarna.ts` is what a
 * gap's own "What it takes to build" card and Research's meta line say, and
 * this tab is where that claim can be checked rather than taken on faith.
 *
 * Two panes, side by side from `lg`: the graph on the left, always visible;
 * the rail on the right, which is a hover preview, a clicked domain's full
 * detail, or the territory's own totals, in that order — see `AtlasDetail`.
 * Below both, the plain list of past projects a consultant can also just scan
 * directly, because a graph is the fast way in and a list is the reliable one,
 * same split Operations drew when it kept panning-free reading as a
 * requirement rather than a nice-to-have.
 *
 * **The polish pass, and what it changed.** The shape above is the one this
 * surface has always had. Four things were wrong inside it:
 *
 * 1. *It did not look like the product's other graph.* Operations draws on
 *    `--canvas-*` — a warm ground, a dot grid, a named edge stroke. Atlas drew
 *    on `bg-card`, so the two canvases in one product shared nothing. Fixed in
 *    `AtlasGraph`.
 * 2. *"Proven" borrowed the effort chip's green*, which on the surface next
 *    door to Gaps reads as *low effort* rather than *we have built this*. It is
 *    `--evidence` now, the colour this product already uses for a thing that
 *    backs a claim.
 * 3. *The rail opened empty* — a dashed box a third of the screen wide holding
 *    a hover instruction, which is not true on a phone. It opens on the
 *    territory's totals instead.
 * 4. *Coverage was digits only.* "0 of 2" and "4 of 4" are the same shape at a
 *    glance, so the ring could not be read as a map of what is walked. Each
 *    node carries a segment bar now, with the words still on it.
 *
 * The past-project cards below say what each engagement stands behind, which
 * closes the chain the other way: the map says a sub-process is proven, and
 * the card says which sub-processes that project is the proof for. §4's
 * evidence chain runs both directions or it is not a chain.
 */
export function AtlasView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="surface-frame py-8">
      <SurfaceHero title="Atlas" />

      <p className="measure text-small text-muted-foreground">
        Every domain Heizen has worked in, and which past engagement already
        proves the fix. A gap whose sub-process shows up proven here is cheaper
        and safer to promise than one nobody has built before.
      </p>

      <div className="mt-5 grid items-start gap-5 lg:grid-cols-[1fr_340px]">
        <AtlasGraph
          selectedId={selectedId}
          hoveredId={hoveredId}
          onSelect={setSelectedId}
          onHover={setHoveredId}
        />
        <AtlasDetail hoveredId={hoveredId} selectedId={selectedId} />
      </div>

      <div className="mt-8">
        <h2 className="text-small font-semibold text-muted-foreground">
          Past projects · {pastProjects.length}
        </h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pastProjects.map((project) => {
            const backs = atlasSubdomains.filter((s) => s.pastProjectId === project.id);
            return (
              <li
                key={project.id}
                className="flex flex-col rounded-lg border border-border bg-card p-3 shadow-card"
              >
                <p className="text-small font-medium leading-tight">{project.name}</p>
                <p className="text-micro text-muted-foreground">{project.sector}</p>
                <p className="reading mt-2 text-micro text-muted-foreground">
                  {formatDay(project.deliveredOn)}: {project.built}
                </p>
                {/* The way back to the map. Without it a consultant reading
                    "Kesarwani Foods" here cannot tell which claim on the ring
                    above it is the proof for, which is the whole point of
                    having both on one screen. */}
                <p className="mt-2 border-t border-border pt-2 text-micro text-muted-foreground">
                  <span className="font-medium text-evidence">Proves</span>{" "}
                  {backs.length === 0
                    ? "nothing on the map above yet."
                    : backs.map((s) => s.name).join(", ")}
                </p>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { formatDay } from "@/lib/plan";
import { initialsOf } from "@/lib/projects";
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
 * The past-project rows below say what each engagement stands behind, which
 * closes the chain the other way: the map says a sub-process is proven, and
 * the row says which sub-processes that project is the proof for. §4's
 * evidence chain runs both directions or it is not a chain.
 *
 * **Those rows are the Projects list's rows.** They were a three-across card
 * grid, which is the layout for a set you pick one out of; a record you read
 * down is the platform's dense list, and there is now one project-row idiom in
 * the product rather than two. See the comment on the block itself.
 */
export function AtlasView() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="surface-frame py-8">
      <SurfaceHero title="Atlas" />

      {/* One sentence, not three. The second half of the old line explained
          why a proven sub-process is worth knowing about, which the word
          "proven" on every node already carries, and it pushed the graph down
          a further two lines for the privilege. */}
      <p className="measure text-small text-muted-foreground">
        Every domain Heizen has worked in, and which past project already proves
        the fix.
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

      {/* **The same list the platform draws for projects, not a card grid of
          its own.** Three cards to a row is the layout for a set you pick one
          out of; this is a record you scan down, and it was the only list in
          the product that answered "which past engagements are there" in a
          shape nothing else uses. So it takes the Projects list's dense row:
          one bordered list, an initials tile, name over sector.

          `built` comes off the row for the reason the project row dropped its
          status line: a two-line sentence per row is what stops a list of ten
          being scannable, and it is already stated in full in the rail beside
          the graph, against the sub-process it proves.

          **Two things the first pass got wrong, both about the right-hand
          half.** The date had its own right-aligned column, which left a hand's
          width of nothing between the sector and the evidence and made every
          row read as two lists that had drifted apart. It sits on the identity
          line now — `Packaged foods · 4 Nov 2025` — where it belongs, because
          sector and delivery date are both facts about *which engagement this
          is*, and the row then has one gutter instead of three.

          And what a project proves was a sentence starting with the word
          "Proves" in `--evidence`, six times down the list, which at that
          weight and colour reads as six links. It is chips now, the shape this
          product already uses for a proven sub-process in the rail beside the
          graph. The names are the content; the label survives for a screen
          reader, which is the only place it was doing work. */}
      <div className="mt-8">
        <h2 className="text-small font-semibold text-muted-foreground">
          Past projects · {pastProjects.length}
        </h2>
        <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card shadow-card">
          {pastProjects.map((project) => {
            const backs = atlasSubdomains.filter((s) => s.pastProjectId === project.id);
            return (
              <li key={project.id} className="flex min-w-0 items-center gap-4 px-4 py-3.5">
                <span
                  aria-hidden
                  className="grid size-10 shrink-0 place-items-center rounded-md border border-border bg-muted text-small font-semibold"
                >
                  {initialsOf(project.name)}
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold leading-tight">{project.name}</h3>
                  <p className="mt-0.5 truncate text-small text-muted-foreground">
                    {project.sector} · {formatDay(project.deliveredOn)}
                  </p>
                </div>
                {/* The way back to the map: which claim on the ring above this
                    project is the proof for. §4's evidence chain runs both
                    directions or it is not a chain.

                    A fixed slot, chips reading left to right inside it, so
                    the column has one shared left edge down all six rows. It
                    was right-aligned first and that was worse: the chips
                    pinned themselves to the frame, the gutter between name and
                    evidence changed width on every row, and the row read as
                    two lists that had drifted apart. Same reason the
                    delivery-mode effort chip took a fixed width in `GapRow`
                    rather than sitting at the tail of a ragged column. Hidden below `md`, where the row is a name
                    and what the company does, and the map above is the place
                    to read coverage anyway. */}
                <div className="hidden w-[17rem] shrink-0 flex-wrap content-center gap-1.5 md:flex xl:w-[22rem]">
                  <span className="sr-only">Proves</span>
                  {backs.length === 0 ? (
                    <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-micro font-medium text-muted-foreground">
                      Nothing on the map yet
                    </span>
                  ) : (
                    backs.map((sub) => (
                      <span
                        key={sub.id}
                        className="rounded-full bg-evidence-muted px-2 py-0.5 text-micro font-medium text-evidence"
                      >
                        {sub.name}
                      </span>
                    ))
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

import Link from "next/link";
import { directions } from "@/lib/directions";
import { company } from "@/lib/suvarna";
import { ThemeToggle } from "@/components/shell/ThemeToggle";

const SURFACES = [
  {
    name: "Canvas",
    href: "/canvas",
    tag: "three levels",
    line: "The supply chain mapped Level 0 → 1 → 2, with health and evidence encoded separately.",
  },
  {
    name: "Gaps",
    href: "/gaps",
    tag: "₹14.7 Cr",
    line: "Twelve findings, priced and evidenced, with tick-box plan selection and a live total.",
  },
  {
    name: "Questions",
    href: "/questions",
    tag: "8, sequenced",
    line: "The same component as Gaps in the opposite register — ordered, future tense, no prices.",
  },
  {
    name: "Compare",
    href: "/compare",
    tag: "4 lanes",
    line: "Stacked lanes aligned on shared stages, with the delta row given the most weight.",
  },
  {
    name: "Sources",
    href: "/sources",
    tag: "4 ingested",
    line: "What each source produced, plus connectors designed as real and labelled as roadmap.",
  },
] as const;

const CONSTRAINTS = [
  "Brief is a single screen with no scrolling, and works at 375px",
  "Full is navigable by scanning, not reading — persistent section navigator, anchor links, summary strip per section",
  "Every number carries its benchmark",
  "Evidence is always one click away",
  "Empty states distinguish “not researched” from “confirmed none”",
  "Keyboard-operable throughout, visible focus, AA contrast, reduced motion respected",
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 sm:py-16">
      <header className="flex items-start justify-between gap-6">
        <div>
          <p className="text-micro font-medium uppercase tracking-[0.09em] text-muted-foreground">
            Meridian · Research tab
          </p>
          <h1 className="mt-2 font-display text-h1 leading-tight">Four organising principles</h1>
          <p className="mt-3 text-base text-muted-foreground measure">
            The team&apos;s problem with Research is that &ldquo;there&apos;s a lot of information
            being shown everywhere.&rdquo; These four directions differ in what the whole tab is
            sorted by — money, time, certainty, or person — not in colour or spacing. Each is built
            through in both Brief and Full against {company.name}.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className="mt-8 rounded-lg border border-border bg-card px-4 py-3.5">
        <p className="text-small">
          <span className="font-medium">How to review these.</span> Open Brief first and give
          yourself thirty seconds, the way Aryan would. If you cannot say something useful out loud
          at the end of it, that direction has failed regardless of how good Full is.
        </p>
      </div>

      <section className="mt-8">
        <h2 className="text-base font-medium">The other five surfaces</h2>
        <p className="mt-1 text-small text-muted-foreground measure">
          All built and navigable from the tab bar. Research is the only one carrying competing
          directions — the rest have one design each.
        </p>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {SURFACES.map((s) => (
            <li key={s.href}>
              <Link
                href={s.href}
                className="block h-full rounded-lg border border-border bg-card px-3.5 py-3 hover:border-border-strong"
              >
                <span className="flex items-baseline justify-between gap-3">
                  <span className="text-base font-medium">{s.name}</span>
                  <span className="shrink-0 text-micro text-muted-foreground">{s.tag}</span>
                </span>
                <span className="mt-0.5 block text-small text-muted-foreground">{s.line}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <ol className="mt-8 space-y-4">
        {directions.map((d, i) => (
          <li key={d.slug}>
            <article className="rounded-lg border border-border bg-card px-5 py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                <h2 className="text-h3 font-medium tracking-tight">
                  <span className="tabular mr-2 text-muted-foreground">{i + 1}</span>
                  {d.name}
                </h2>
                <span className="text-small text-muted-foreground">
                  Sorted by <span className="text-foreground">{d.axis.toLowerCase()}</span>
                </span>
              </div>
              <p className="mt-0.5 text-base text-muted-foreground">{d.strap}</p>

              <p className="mt-3 text-small measure">{d.principle}</p>

              <dl className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-micro font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Optimises for
                  </dt>
                  <dd className="mt-1 text-small">{d.optimisesFor}</dd>
                </div>
                <div>
                  <dt className="text-micro font-medium uppercase tracking-[0.08em] text-muted-foreground">
                    Deliberately sacrifices
                  </dt>
                  <dd className="mt-1 text-small">{d.sacrifices}</dd>
                </div>
              </dl>

              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href={`/research/${d.slug}/brief`}
                  className="rounded-md bg-foreground px-3 py-1.5 text-small font-medium text-background hover:opacity-90"
                >
                  Open Brief
                </Link>
                <Link
                  href={`/research/${d.slug}/full`}
                  className="rounded-md border border-border-strong px-3 py-1.5 text-small hover:border-foreground"
                >
                  Open Full
                </Link>
              </div>
            </article>
          </li>
        ))}
      </ol>

      <section className="mt-10 border-t border-border pt-6">
        <h2 className="text-base font-medium">What every direction had to hold</h2>
        <ul className="mt-2 space-y-1.5">
          {CONSTRAINTS.map((c) => (
            <li key={c} className="flex gap-2.5 text-small text-muted-foreground measure">
              <span className="mt-[9px] h-1 w-1 shrink-0 rounded-full bg-border-strong" aria-hidden />
              {c}
            </li>
          ))}
        </ul>
        <p className="mt-5 text-small text-muted-foreground measure">
          The data behind all four is the same and lives in one file, so a change to a gap, a price
          or an excerpt shows up identically everywhere. Nothing here is hard-coded into a layout.
        </p>
      </section>
    </div>
  );
}

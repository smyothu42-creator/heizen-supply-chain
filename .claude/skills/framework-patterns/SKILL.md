---
name: framework-patterns
description: Next.js App Router structure, routing, and rendering rules for Meridian. Use when creating routes, choosing server vs client components, structuring folders, handling loading and error states, or deciding where data fetching lives.
---

# Framework Patterns

Next.js App Router. Server Components by default; opt into the client only where interaction demands it.

## Route structure

```
app/
  (auth)/login/
  projects/
    page.tsx                          # project list
    new/page.tsx                      # create project (before ingestion)
    [projectId]/
      layout.tsx                      # tab shell + project header
      canvas/page.tsx
      research/page.tsx
      gaps/page.tsx
      questions/page.tsx
      compare/page.tsx
      sources/page.tsx
```

The tab shell lives in `layout.tsx` so switching tabs never remounts the project header
or refetches project metadata. Tab switching should feel instant; only the panel changes.

Project creation is deliberately a separate route from ingestion. A consultant creates a
project with a name and sector before they have any files. Never gate creation on upload.

## Server vs client

**Server Component** (default) — anything that reads data and renders it. Dossier body,
gap list, question list, comparison tables, source list. All of Research's Full view.

**Client Component** — only for: the canvas graph, filter and sort controls, the
Brief/Full toggle, the chat panel, forms, and anything using a browser API.

Push `"use client"` to the leaf. A page that is 90% static text with one interactive
toggle should be a Server Component rendering a small client toggle, not a client page.

```tsx
// Good — server page, client leaf
export default async function ResearchPage({ params }) {
  const dossier = await getDossier(params.projectId)
  return (
    <article>
      <ViewToggle />                  {/* "use client" */}
      <DossierBody data={dossier} />  {/* server */}
    </article>
  )
}
```

## Brief and Full

Both views render from the same dossier record. Do not fetch twice and do not
round-trip to the server to switch. Fetch once on the server, render both, toggle
client-side. Aryan may be minutes from a call — the toggle must be instant.

If Full is large enough to hurt initial payload, stream it with `<Suspense>` below Brief
rather than deferring it to a second request.

## Loading and error states

Every tab route gets `loading.tsx` and `error.tsx`.

Loading states are **skeletons that match the real layout**, never spinners. Research
takes real time to generate; a consultant should see the shape of what is coming.

`error.tsx` must offer a retry and must not lose the project. A failed research run is
recoverable — the project still exists, sources are still ingested.

## Streaming

Research generation is slow. Stream sections as they resolve:

```tsx
<Suspense fallback={<ThesisSkeleton />}>
  <Thesis projectId={id} />
</Suspense>
<Suspense fallback={<SectionSkeleton />}>
  <Operations projectId={id} />
</Suspense>
```

Order sections by value: thesis, leakage number, and confidence first. If a consultant
only reads the first screen before their call, that first screen must have already
arrived.

## Data fetching

Server Components fetch directly through the data layer — no internal `fetch` to your
own API routes. Route Handlers exist for client mutations and external callers only.

Colocate queries in `lib/queries/` and import them. Never inline SQL or ORM calls in a
component.

## Partial and empty data

Most nodes have no data. This is expected, not an error. Never throw or render an error
boundary for absent data — render the empty state, which is a designed state carrying
its own message. See `data-display-patterns`.

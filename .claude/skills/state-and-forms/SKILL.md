---
name: state-and-forms
description: Client state, server state, URL state, and form handling for Meridian. Use when adding filters, building forms, managing selection state, wiring the correction prompt, or deciding where a piece of state should live.
---

# State and Forms

Four places state can live. Choose deliberately.

| Where | Use for |
|---|---|
| **URL** | Anything shareable or restorable — selected node, tab, filter, sort, Brief/Full, compared project IDs |
| **Server (TanStack Query)** | Everything fetched |
| **React local** | Ephemeral UI — open popover, hover, in-progress text |
| **Context** | Rare. Project shell data only |

No global client store. If you are reaching for Zustand or Redux, the state probably
belongs in the URL.

## URL state is the default for view state

A consultant on a call needs to send a colleague exactly what they are looking at. Every
meaningful view position must be a link.

```
/projects/abc/research?view=full&section=operations
/projects/abc/canvas?node=sourcing&level=2
/projects/abc/gaps?sort=impact&filter=procurement&selected=g1,g4,g7
/projects/abc/compare?process=p2p&with=proj_2,proj_9
```

Use `nuqs` or equivalent for typed search params. Never store a filter in `useState`
where the user might want to share or reload it.

The gap plan selection (`selected=`) belongs in the URL specifically because it is built
live during a client meeting and must survive a reload.

## Server state

TanStack Query. Query keys are structured and include every input:

```ts
["project", projectId, "gaps", { sort, filter }]
["project", projectId, "dossier", view]
["compare", processKey, projectIds.sort().join(",")]
```

Research output is expensive and slow-changing — `staleTime` in minutes, not seconds.
Chat and run progress are not cached.

## Optimistic updates

Apply optimistically only where the server cannot meaningfully disagree: adding a gap to
the plan, confirming a node, reordering.

Never optimistic for anything the AI generates. A correction goes through the model — an
optimistic render would show the user's phrasing and then replace it with the model's
output, which reads as a bug and undermines the trust the correction flow exists to build.

## Forms

React Hook Form + Zod resolver. One schema shared between client and server.

### Project creation

Only the name is required. Sector, revenue band, known stakeholders, and the research
prompt are all optional.

This is deliberate: a consultant creates a project the moment they hear about a lead,
often with nothing but a company name. Do not add required fields.

```ts
export const CreateProjectSchema = z.object({
  name: z.string().min(1, "Add a company name"),
  sector: z.string().optional(),
  revenueBand: z.string().optional(),
  stakeholders: z.array(StakeholderSchema).default([]),
  researchPrompt: z.string().optional(),
})
```

The research prompt biases retrieval — for example `"Vedanta Goa copper"` narrows to one
site rather than the whole group. Label it for what it does, not what it is. See `ux-copy`.

### The correction prompt

Not a text field on a form — a focused composer that opens from "Needs correction".

- Shows the current value it will replace, so the user knows what is being corrected
- Free text, no structure imposed
- On submit: pending state on the affected element, not a global spinner
- On success: the element updates in place with a brief change indicator
- On failure: the instruction is preserved, never cleared

The user is mid-call when they use this. Losing their typed instruction is unacceptable.

### Source upload

Multi-file, drag and drop, per-file progress. Ingestion is per-file and independent —
one failed PDF must not fail the batch. Failed files stay listed with a retry.

Upload is available at any point in a project's life. There is no "setup complete" state.

## Selection in Compare

Comparison selection is multi-select with a visible count and an explicit exit. Selecting
a second company should stack its lane below the first, not replace the view. Keep it in
the URL so a comparison is shareable.

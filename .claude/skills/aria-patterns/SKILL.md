---
name: aria-patterns
description: ARIA roles, states, labels, and live regions for Meridian's specific components. Use when a native element cannot express a component's semantics — canvas, status indicators, streaming updates, comparisons.
---

# ARIA Patterns

First rule: **do not use ARIA if a native element will do.** Bad ARIA is worse than none.
Most of Meridian is documents, lists, tables, and buttons — all of which have native
semantics.

Reach for ARIA only where the pattern genuinely has no HTML equivalent.

## Two-axis node status

A canvas node encodes health and completeness. Both need programmatic exposure, and the
accessible name must not become a wall of text.

```tsx
<g
  role="button"
  tabIndex={0}
  aria-label="Sourcing and Procurement"
  aria-describedby={`${id}-status`}
>
  <title>Sourcing and Procurement</title>
</g>

<span id={`${id}-status`} className="sr-only">
  Critical. Full evidence available. 2 sub-processes. Press Enter to open.
</span>
```

Name is the node. Description carries status. Do not concatenate everything into
`aria-label` — screen reader users hear the name on every focus move and a long name
makes navigation unbearable.

## Canvas as a whole

```tsx
<div
  role="application"
  aria-label="Supply chain map, level 0, value chain"
  aria-describedby="canvas-help"
>
```

`role="application"` suppresses browse mode, so it obliges you to implement every key
yourself — see `keyboard-navigation`. Use it only if you have. Otherwise leave the SVG
as a group of buttons and let browse mode work.

`aria-describedby` points to instructions that are always in the DOM, not only in a
tooltip.

Always ship the list-view alternative and link to it with a visible control. It is a
better experience than any ARIA-decorated graph.

## Streaming research

One polite live region for the run, announcing steps and completion.

```tsx
<div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
  {message}
</div>
```

Announce: run started, each section completed, run complete with a summary count, and
failure. Do not announce token-level progress.

Errors that need attention use `role="alert"` — but sparingly. An alert interrupts.

## Confidence and evidence

Confidence is text with a reason. It needs no ARIA beyond correct association:

```tsx
<span id="conf-1">Medium-high</span>
<p id="conf-1-reason">Based on FY25 annual report, 2 discovery calls, and hiring signals</p>
<div aria-labelledby="conf-1" aria-describedby="conf-1-reason">…</div>
```

Evidence disclosure is a real disclosure pattern:

```tsx
<button aria-expanded={open} aria-controls="ev-1">3 sources</button>
<div id="ev-1" hidden={!open}>…</div>
```

`aria-expanded` on the trigger, `aria-controls` pointing at the region. Do not use a
custom "accordion" role — there isn't one.

## Comparison tables

Real `<table>` with real headers. This is the pattern ARIA is worst at faking and HTML is
best at.

```tsx
<table>
  <caption className="sr-only">
    Procure-to-pay stages, this client compared with best in class
  </caption>
  <thead>
    <tr><th scope="col">Stage</th><th scope="col">This client</th><th scope="col">Best in class</th></tr>
  </thead>
  <tbody>
    <tr><th scope="row">PR &amp; Approvals</th><td>4.4 days</td><td>1.4 days</td></tr>
  </tbody>
</table>
```

The caption carries what the comparison is. Without it a screen reader user hears numbers
with no frame.

## Gap and Question lists

A list of articles, not a grid.

```tsx
<ul>
  <li>
    <article aria-labelledby="gap-1-title">
      <h3 id="gap-1-title">Email and WhatsApp approvals, no audit trail</h3>
      <p>Impact: 50 lakh rupees per year. Effort: low. Duration: 6 weeks.</p>
    </article>
  </li>
</ul>
```

Write monetary values in the accessible text as words where the visual abbreviation would
be misread. `₹50 L` is announced unpredictably; the visible label can stay abbreviated
while an `sr-only` span carries the spoken form.

## Selection for the plan

```tsx
<button aria-pressed={selected} aria-label={`Add ${title} to plan`}>
```

`aria-pressed` for a toggle. Announce the running total through the same live region used
for other status, not a separate one.

## Anti-patterns

- `role="presentation"` on anything interactive
- `aria-label` on a non-interactive `div` — it will often not be announced
- Redundant roles: `<button role="button">`
- `aria-hidden` on a focusable element — this creates an element that is reachable but
  unannounced, the worst possible state
- Live regions that update on every render

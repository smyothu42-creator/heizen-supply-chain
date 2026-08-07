---
name: accessibility-core
description: Baseline accessibility requirements for Meridian — contrast, semantics, focus, forms, and non-colour encoding. Use when building any UI, reviewing a component, or resolving an accessibility question.
---

# Accessibility Core

WCAG 2.1 AA is the floor, not the goal. It is enforced in CI — see `a11y-testing`.

Two reasons this matters more here than in a typical internal tool:

1. Meridian is shown to investors and prospective clients on unknown hardware, in
   unknown lighting, at unknown zoom levels.
2. The product's core encoding is colour-coded status. Getting colour semantics wrong
   breaks the product for a meaningful share of viewers, not just an edge case.

## Colour is never the only signal

Roughly 1 in 12 men has a colour vision deficiency, most commonly on the red/green axis —
exactly the axis Meridian uses for critical/healthy.

Every health state carries at least one of: a shape, an icon, a text label, a position.

```
✗  <span className="bg-health-critical" />
✓  <span className="bg-health-critical"><CriticalIcon /><span className="sr-only">Critical</span></span>
```

The same applies to the completeness axis — dashed vs solid stroke works for everyone,
but it still needs an accessible name.

## Contrast

- Body text: 4.5:1
- Large text (18pt+ or 14pt bold): 3:1
- UI components, borders, focus rings, chart elements: 3:1

Health colours must pass against both light and dark surfaces. The naive light-mode red
almost always fails on a dark background — define dark-mode variants explicitly.

Data visualisation is not exempt. Every lane, bar, and node border in Compare and Canvas
needs 3:1 against its background and against adjacent elements.

## Semantics before ARIA

Use the element that already means what you want. A `div` with a click handler is a bug.

```
Tabs         → real tabs pattern, not styled links
Buttons      → <button>
Navigation   → <nav>
Dossier      → <article> with <section> and real heading levels
Gap list     → <ul>/<li> or a table if it has columns
Metrics      → <table> when there are rows and columns; do not fake it with divs
```

The Research dossier has a genuine document structure. Use `h1` → `h2` → `h3` in order
and never skip a level for visual reasons — a screen reader user navigates by heading,
which is exactly the fast-scanning behaviour the sighted design is also aiming at.

## Focus

Visible focus on everything interactive. Never `outline: none` without a replacement.

```css
:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
```

Focus ring needs 3:1 against both the element and the page background. On the canvas,
where nodes sit on a tinted surface, verify it explicitly.

## Text and zoom

- No text in images. The dossier, gap titles, and metric labels are all real text.
- Layout survives 200% browser zoom without horizontal scrolling or clipped content.
- Respect user font-size settings — size in `rem`, never fixed `px` for text.
- Minimum body size 14px equivalent. Dense does not mean tiny.

## Targets

Minimum 24×24px for any interactive element, 44×44px for anything used on mobile. Canvas
nodes and their expand affordances must meet this — a small chevron on a node is a common
failure.

## Forms

- Every input has a real `<label>`, not a placeholder standing in for one
- Errors reference their field and are announced (`aria-live="polite"`)
- Required fields are marked in text, not by colour or an asterisk alone
- The correction prompt is a labelled textarea with visible help text

## Motion and time

- `prefers-reduced-motion` fully honoured — see `motion`
- No auto-advancing content
- No time limits on reading. Research is slow; the user is never rushed by the interface

## Live regions

Research streams in over minutes. Announce meaningful progress and completion politely.

```tsx
<div aria-live="polite" className="sr-only">
  {status === "complete" ? "Research complete. 12 gaps found." : currentStep}
</div>
```

Announce steps, not every token. A live region firing continuously is worse than silence.

## Non-negotiables

1. Every interactive element reachable and operable by keyboard
2. Every interactive element has a visible focus state
3. Every status colour has a non-colour equivalent
4. Every image and icon has appropriate alt text or is marked decorative
5. Every form control has a programmatic label
6. Heading order is never broken for visual reasons

If a design cannot be built to meet these, the design changes.

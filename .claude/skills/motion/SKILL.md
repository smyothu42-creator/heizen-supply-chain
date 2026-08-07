---
name: motion
description: Animation, transitions, and motion design rules for Meridian. Use when adding any animation, transition, loading state, or interactive feedback.
---

# Motion

Motion in Meridian exists to preserve orientation and confirm causation. It never exists
to impress. A consultant opening this thirty seconds before a call has no patience for
choreography, and an investor watching a demo reads gratuitous animation as immaturity.

## Budget

| Interaction | Duration | Easing |
|---|---|---|
| Hover, focus | 100–150ms | ease-out |
| Panel open/close | 200ms | ease-out |
| Expand in place | 200ms | ease-out |
| Canvas zoom/pan | Follows input directly | — |
| Level transition | 300ms | ease-in-out |
| Value change | 400ms | ease-out |

Nothing exceeds 400ms. Anything blocking interaction exceeds nothing.

## Where motion earns its place

**Descending a level on Canvas.** The one transition worth real design attention. A user
moving Level 0 → 1 → 2 must not lose their bearings. Animate the parent node expanding
into its children so the spatial relationship is preserved. Reverse it on the way back.

**Expanding "why we believe it".** Height animation in place so the list around it does
not jump. The user keeps their scroll position and their place in the list.

**Value changes after a correction.** When the AI updates a figure, transition it briefly
so the user sees *that* it changed and *what* changed. This is the trust payoff of the
correction flow — a silent swap looks like a rendering glitch.

**Adding a gap to the plan.** The ROI total counts to its new value over ~400ms. This is
the one place a small flourish is justified: it happens live in a client meeting and the
number moving is the point.

**Streaming research sections.** Sections fade in as they resolve. Subtle, 150ms, no
slide — the layout must not shift under someone who has started reading.

## Where motion is forbidden

- Page and tab transitions. Instant. Tabs are navigation, not narrative.
- Skeleton loaders. A quiet shimmer at most; no pulsing, no bouncing.
- Toasts and notifications. Appear, sit, leave. No slide-bounce.
- Chart entry animations. The data is the point; animating bars in delays reading it.
- Anything decorative — no parallax, no ambient movement, no scroll-triggered reveals.
- Hover effects that move layout. Colour and shadow only; never translate or scale a row.

## Layout must never shift

Reserve space for content that is still loading. A consultant who starts reading the
thesis and has it pushed down by a late-arriving section will lose their place at the
worst possible moment.

Skeletons match the final layout's dimensions, not an approximation.

## Reduced motion

Honour `prefers-reduced-motion` globally and completely.

```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}
```

Under reduced motion, functional transitions become instant state changes — the level
transition still works, it just does not animate. Nothing becomes unusable, and no
information is conveyed by movement alone.

## Performance

Animate `transform` and `opacity` only. Never `width`, `height`, `top`, or `left` on
anything in a list or on the canvas.

Canvas holds 60fps while panning with 100 nodes. If it does not, cut the animation, not
the node count.

## The test

Watch the interaction once. If you noticed the animation itself rather than what it
told you, it is too much.

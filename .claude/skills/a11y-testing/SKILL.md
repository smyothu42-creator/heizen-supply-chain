---
name: a11y-testing
description: Automated and manual accessibility testing for Meridian. Use when adding a11y tests, verifying a component, running audits, or checking contrast and screen reader behaviour.
---

# Accessibility Testing

Automated tooling catches roughly a third of real issues. The other two thirds are
keyboard flow, focus management, and whether announcements make sense — none of which a
linter can judge. Do both.

Accessibility tests are a CI gate, not advisory. `pnpm test:a11y` blocks merge.

## Automated — component level

`vitest-axe` on every product component, in every meaningful state.

```ts
import { axe } from "vitest-axe"

it.each([
  ["critical + no evidence", { health: "critical", completeness: "none" }],
  ["healthy + full evidence", { health: "healthy", completeness: "full" }],
  ["watch + partial", { health: "watch", completeness: "partial" }],
])("NodeCard has no violations: %s", async (_, props) => {
  const { container } = render(<NodeCard {...props} />)
  expect(await axe(container)).toHaveNoViolations()
})
```

Test states, not just the happy path. Empty, partial, loading, and error states are where
accessibility regressions hide, and in Meridian they are the common case.

## Automated — page level

`@axe-core/playwright` on every route, light and dark, at 100% and 200% zoom.

```ts
test("research full view is accessible", async ({ page }) => {
  await page.goto("/projects/demo/research?view=full")
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
    .analyze()
  expect(results.violations).toEqual([])
})
```

Dark mode is a separate run. Health colours are the most likely dark-mode contrast
failure in this product.

## Contrast — including data visualisation

Automated tools check text. They do not check whether two adjacent lanes in a comparison
are distinguishable, or whether a node border is visible against the canvas surface.

Write explicit assertions for the token pairs that matter:

```ts
it("health colours meet 3:1 against canvas surface in both themes", () => {
  for (const theme of ["light", "dark"] as const) {
    for (const h of ["critical", "watch", "healthy"] as const) {
      expect(contrast(tokens[theme].health[h], tokens[theme].canvasSurface))
        .toBeGreaterThanOrEqual(3)
    }
  }
})
```

## Colour-independence test

The product's core encoding is colour. Prove it survives without it.

```ts
it("health is distinguishable without colour", () => {
  render(<NodeCard health="critical" completeness="full" />)
  expect(screen.getByText(/critical/i)).toBeInTheDocument()   // text or sr-only
})
```

Manual version: screenshot Canvas and Compare, convert to greyscale, and confirm every
status is still readable. Do this whenever the palette changes.

## Keyboard — e2e

Automated tooling will not catch a lost focus. Playwright will.

```ts
test("closing node detail returns focus to its node", async ({ page }) => {
  await page.goto("/projects/demo/canvas")
  await page.keyboard.press("Tab")
  const node = page.locator(":focus")
  const id = await node.getAttribute("data-node-id")
  await page.keyboard.press("Enter")
  await page.keyboard.press("Escape")
  await expect(page.locator(":focus")).toHaveAttribute("data-node-id", id!)
})
```

Cover, at minimum:
1. Every route is fully traversable by keyboard with nothing unreachable
2. Focus is always visible — never `outline: none` without a replacement
3. Panel open and close restores focus correctly
4. Canvas is navigable and focused nodes scroll into view
5. Dialogs trap focus; the right panel does not
6. `Escape` closes the topmost layer only

## Manual checklist — per feature

Automated tests cannot judge these. Run them before calling a feature done.

- [ ] Unplug the mouse. Complete the full flow.
- [ ] Zoom to 200%. Nothing clipped, no horizontal scroll.
- [ ] Greyscale the screen. All statuses still readable.
- [ ] Enable `prefers-reduced-motion`. Everything still functions.
- [ ] Screen reader pass (VoiceOver or NVDA) on the primary flow. Ask: does the
      announcement sequence make sense to someone who cannot see the layout?
- [ ] Tab through with focus visible at all times.
- [ ] Read every empty and error state aloud. Does it say what to do next?

## Screen reader — what to listen for

Not "does it announce something" but "is what it announces useful".

- A gap announces its title, then its impact — not a string of nested labels
- A node announces its name, then its status as a description
- Research completion announces a summary, not every section as it lands
- A number is announced in a form a person would say: "fifty lakh rupees per year"

## Known risk areas

Check these first when something breaks:

1. **Canvas** — custom interaction, SVG, spatial navigation
2. **Streaming research** — live regions over-announcing
3. **Right panel** — focus restoration
4. **Dense tables** — header association at scale
5. **Health and completeness colours** — dark mode contrast
6. **Correction prompt** — a dialog inside a panel, nested focus management

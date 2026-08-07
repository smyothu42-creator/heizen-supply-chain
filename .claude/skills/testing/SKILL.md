---
name: testing
description: Testing strategy, what to test, and how to write tests for Meridian. Use when adding tests, deciding coverage, testing AI output handling, or setting up e2e flows.
---

# Testing

Vitest + Testing Library for units. Playwright for end-to-end. Coverage is not a target;
confidence in the flows that carry the product is.

## Priority order

Test in this order, because this is the order in which a failure costs the most:

1. **Evidence chain integrity** — a claim without a source must never render
2. **AI output parsing** — malformed model output degrades gracefully
3. **Money and unit formatting** — a wrong number in front of a client is unrecoverable
4. **Empty and partial states** — the common case, not the edge case
5. **Core flows** — create project → ingest → research → read gaps
6. **Accessibility** — see `a11y-testing`

## AI output is the highest-value test surface

Model output is non-deterministic and untrusted. Test the parsing boundary hard, with
recorded fixtures of real (including malformed) output.

```ts
describe("gap parsing", () => {
  it("rejects a gap with no evidence", () => {
    const r = GapSchema.safeParse({ ...validGap, evidence: [] })
    expect(r.success).toBe(false)
  })

  it("rejects a non-numeric impact rather than rendering NaN", () => {
    const r = GapSchema.safeParse({ ...validGap, annualImpact: "a lot" })
    expect(r.success).toBe(false)
  })

  it("keeps valid gaps when one gap in the batch is malformed", () => {
    const r = parseGapBatch([validGap, malformedGap])
    expect(r.gaps).toHaveLength(1)
    expect(r.rejected).toHaveLength(1)
  })
})
```

Partial success matters. One bad gap should not blank the Gaps tab minutes before a call.

## Never mock the model in integration tests

Mock the transport, not the schema. Fixtures are real recorded responses, including the
ones that failed in production. When a new failure mode appears, it becomes a fixture.

## Formatting tests

```ts
it("formats Indian currency in crore", () => {
  expect(formatMoney({ amount: 14_700_000, currency: "INR" })).toBe("₹1.47 Cr")
})

it("never renders NaN or undefined", () => {
  expect(formatMoney(undefined)).toBe("—")
})
```

`—` is the correct output for missing data everywhere. Never `0`, never `N/A`, never blank.

## Empty and partial state tests

Every list and detail component gets a test for: no data, partial data, one item, and
many items.

```ts
it("shows 'not researched' distinctly from 'confirmed none'", () => {
  render(<NodeMetrics data={undefined} />)
  expect(screen.getByText(/not researched/i)).toBeInTheDocument()

  render(<NodeMetrics data={null} />)
  expect(screen.getByText(/no issues found/i)).toBeInTheDocument()
})
```

These are opposite messages to a consultant. Conflating them is a real bug.

## Health and completeness must stay separable

```ts
it("renders a healthy node with no data differently from a healthy node with data", () => {
  const a = render(<NodeCard health="healthy" completeness="none" />)
  const b = render(<NodeCard health="healthy" completeness="full" />)
  expect(a.container.innerHTML).not.toEqual(b.container.innerHTML)
})
```

A regression test for the prototype's known conflation.

## E2E flows

Playwright, on every PR:

1. Create a project with only a name → lands in workspace, no error
2. Upload a source → ingests → appears in Sources with an excerpt
3. Run research → progress streams → thesis renders before other sections
4. Open a gap → evidence visible → click through to source
5. Add gaps to plan → total ROI updates → reload → selection persists (URL state)
6. Correction prompt → submit → element updates in place, instruction not lost
7. Toggle Brief/Full → instant, no network request

Flow 5 and 7 are on the critical path for a live client meeting. Treat their failures as
release blockers.

## What not to test

Do not snapshot-test whole pages — they break on every copy change and teach the team to
regenerate snapshots without reading them. Do not test shadcn primitives. Do not test
implementation details of hooks; test what the user sees.

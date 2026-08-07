---
name: api-layer
description: API route handlers, server actions, streaming, and AI pipeline contracts for Meridian. Use when adding endpoints, wiring mutations, handling long-running research jobs, or integrating model output.
---

# API Layer

Server Actions for mutations initiated from the UI. Route Handlers for streaming,
webhooks, file upload, and anything an external system calls.

## Shape

```
app/api/
  projects/[id]/research/route.ts    # POST — start run, GET — stream progress
  projects/[id]/sources/route.ts     # POST — upload + ingest
  projects/[id]/chat/route.ts        # POST — streaming chat over project context
  projects/[id]/corrections/route.ts # POST — natural-language correction
```

## Every response is validated

Model output is untrusted. Parse with Zod before it reaches a component.

```ts
const parsed = GapArraySchema.safeParse(modelOutput)
if (!parsed.success) {
  logger.error({ projectId, issues: parsed.error.issues }, "gap parse failed")
  return { ok: false, error: "RESEARCH_MALFORMED" as const }
}
```

Never let unvalidated model output reach the client. A hallucinated field that renders
as `NaN Cr` next to a real number destroys trust in every number on the screen.

## Errors are typed results, not thrown exceptions

```ts
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: ErrorCode; detail?: string }

export type ErrorCode =
  | "RESEARCH_MALFORMED"
  | "SOURCE_UNREADABLE"
  | "RATE_LIMITED"
  | "INSUFFICIENT_SOURCES"
  | "NOT_FOUND"
```

`INSUFFICIENT_SOURCES` is not a failure. It is a normal outcome that the UI renders as
guidance: *"Add a transcript or filing to research this section."*

## Long-running research

Research takes minutes. Never block a request on it.

1. `POST /research` enqueues a job, returns `{ runId, status: "queued" }` immediately.
2. Client subscribes to progress via SSE.
3. Sections persist as they complete — a consultant reads the thesis while operations
   is still generating.

```ts
export async function GET(req: Request, { params }) {
  const stream = new ReadableStream({
    async start(controller) {
      for await (const event of watchRun(params.id)) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`))
      }
      controller.close()
    },
  })
  return new Response(stream, {
    headers: { "Content-Type": "text/event-stream", "Cache-Control": "no-cache" },
  })
}
```

Progress events name the section being worked on, not a percentage. *"Researching
procurement operations"* tells a consultant something; *"47%"* does not.

## Every generated claim carries provenance

The API contract requires it. A claim without a source reference is rejected at the
schema boundary, not silently rendered.

```ts
const ClaimSchema = z.object({
  statement: z.string(),
  confidence: z.enum(["low", "medium", "medium-high", "high"]),
  evidence: z.array(EvidenceRefSchema).min(1),   // min(1) is load-bearing
})
```

This is what makes the evidence chain unbreakable. Do not relax it for convenience.

## Corrections

Users do not edit AI output directly. They describe the correction; the AI reapplies.

```ts
// POST /corrections
{ targetId: string, targetType: "node" | "gap" | "question", instruction: string }
```

Persist the instruction, the before state, and the after state. The audit trail is the
entire reason this pattern was chosen over inline editing — do not lose it.

## Chat

Streaming. Scoped to project context by default, narrowable to a node or gap. The scope
must be explicit in the request and reflected in the UI, so the consultant always knows
what the assistant can see.

```ts
{ projectId: string, scope: { type: "project" | "node" | "gap", id?: string }, message: string }
```

## Idempotency and cost

Research runs cost money and time. `POST /research` accepts an idempotency key and
returns the in-flight run if one exists. Never let a double-click trigger two runs.

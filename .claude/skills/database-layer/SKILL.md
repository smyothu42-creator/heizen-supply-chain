---
name: database-layer
description: Schema design, queries, migrations, and data modelling rules for Meridian. Use when adding tables, writing queries, designing relations, handling the evidence graph, or storing versioned AI output.
---

# Database Layer

Postgres. Typed query layer in `lib/queries/`. Migrations are versioned and never edited
after merge.

## Core entities

```
projects            id, name, sector, revenue_band, external_spend, research_prompt
stakeholders        project_id, name, role, is_known_contact
sources             project_id, kind, filename, ingested_at, extracted_text
claims              source_id, statement, confidence, span   -- extraction unit
process_nodes       project_id, level, parent_id, name, health, data_completeness
node_metrics        node_id, metric_key, actual, best_in_class, unit, benchmark_source
gaps                project_id, node_id, title, rationale, annual_impact, effort
questions           project_id, node_id, title, rationale, ask_order, stakeholder_id
evidence_links      claim_id, target_type, target_id      -- the provenance graph
corrections         target_type, target_id, instruction, before, after, author, at
research_runs       project_id, status, started_at, finished_at, model, cost
```

## The evidence graph is the point

`evidence_links` is not an audit nicety — it is the feature that lets a consultant
answer *"how do you know that?"* in front of a client.

Rules:

- Every gap, question, node metric, and dossier claim has **at least one**
  `evidence_links` row. Enforce it in the write path.
- Deleting a source must never orphan a claim silently. Soft-delete sources and mark
  dependent claims as `stale`, surfaced in the UI as "source removed".
- The link is directional and traversable both ways. A consultant clicks a gap to see
  its sources, and clicks a source to see everything derived from it.

## Health and completeness are separate columns

```sql
health            text  not null  -- 'critical' | 'watch' | 'healthy'
data_completeness text  not null  -- 'none' | 'partial' | 'full'
```

Never a single `status` column. A healthy node with no data and a critical node with
full evidence are opposite situations. Storing them as one field guarantees the UI
conflates them, which is the bug the prototype already has.

## Levels are a tree, not three tables

`process_nodes.parent_id` self-references. Level 0 nodes have `parent_id = null`.

Level 0 is identical across every company, so seed it once as a template and clone per
project. Level 2 is where companies diverge — that is where per-project rows accumulate
and where the real data volume lives. Index on `(project_id, parent_id)`.

## AI output is versioned, never overwritten

A correction creates a new version; it does not mutate the old row.

```sql
-- gaps
version      int  not null
superseded_by uuid references gaps(id)
```

Queries read the head version by default. History is queryable because a consultant may
need to explain why a number changed between two client calls.

## Benchmarks are shared, not per-project

`benchmarks` table keyed by `(sector, process_key, metric_key)`. Node metrics reference
it rather than storing a copy.

This is what makes the product compound. Every project improves the benchmark set, which
improves every future project. It is also the thing to point at when explaining to
investors why the asset grows.

## Query rules

- Every query is a named function in `lib/queries/`. No inline ORM calls in components.
- Every query takes `projectId` and filters on it. Cross-project reads are explicit and
  named as such (`compareAcrossProjects`).
- Never `SELECT *`. The dossier `extracted_text` columns are large; pulling them into a
  list view is how the Research tab gets slow.
- Paginate anything unbounded. Sources and claims grow without limit.

## Cross-project comparison

The Compare tab reads multiple projects at once. Give it a dedicated query that joins on
`process_key` — the stable identifier for "the same process in different companies" —
not on node name, which varies by company.

```ts
compareWorkflows({ processKey, projectIds }): Promise<WorkflowLane[]>
```

## Migrations

Forward-only. Every migration has a down script but production rolls forward. Never edit
a merged migration; add a new one.

Seed data lives in `db/seed/` and includes the Level 0 SCOR template and a starter
benchmark set, so a fresh environment can render a real Canvas immediately.

# Meridian — Research tab, four directions

Prototypes for the highest-priority problem in the product: the Research tab shows
too much at once, and Aryan cannot get "what do I say on this call?" out of it.

Four directions, each sorted by a different axis. Same data throughout.

| Direction | Sorted by | The idea |
|---|---|---|
| **Money-first** | Rupees | The dossier is a decomposition of ₹14.7 Cr. Company facts only appear where they explain a slice of it. |
| **Call-first** | Time | Laid out in the order the discovery call happens: open, establish, probe, land, next. |
| **Certainty-first** | Confidence | A claim ledger — confirmed, inferred, unverified — with the basis always attached. |
| **Stakeholder-first** | Person | Pick who you are meeting and the whole dossier re-sorts to what they own and are measured on. |

## Run it

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

The landing page lists all four with what each optimises for and what it sacrifices.
Every direction has a **Brief** and a **Full**, switchable in the top bar, and you can
flip between directions without losing your place.

Open Brief first and give yourself thirty seconds, the way Aryan would. If you cannot
say something useful out loud at the end of it, that direction has failed regardless
of how good its Full is.

## Verify

```bash
pnpm build && pnpm start -p 4311
node scripts/verify.mjs             # fit, contrast, keyboard
node scripts/verify-stakeholder.mjs # fit for every stakeholder selection
node scripts/shots.mjs              # writes screenshots/
```

Current state: Brief fits 375×667 with nothing clipped in all four directions, zero
AA contrast failures across eight pages in both light and dark, and every interactive
element is keyboard reachable with a working panel focus round-trip.

## Where things live

```
src/lib/suvarna.ts            all the data — 12 gaps, 4 sources, 18 claims, 8 questions
src/lib/directions.ts         the four principles, and what each sacrifices
src/app/globals.css           semantic tokens, light + dark
src/components/meridian/      MetricDelta, EvidenceChain, ConfidenceBadge, GapRow,
                              QuestionRow, EmptyState, the shared detail panel
src/components/directions/    the four directions, Brief and Full each
```

Change a gap's price or an excerpt in `src/lib/suvarna.ts` and it updates identically
in all four. Nothing is hard-coded into a layout.

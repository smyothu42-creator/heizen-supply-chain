/**
 * Data integrity. Every direction shows a different subtotal of the same
 * ₹14.7 Cr — by bucket, by tier, by stakeholder. If those do not reconcile,
 * one of the four screens is lying, and it will be the one the client reads.
 *
 * Run: node scripts/check-data.ts
 */
import {
  buckets,
  bucketTotal,
  claims,
  company,
  gapById,
  gaps,
  sources,
  stakeholders,
  valueForStakeholder,
} from "../src/lib/suvarna.ts";

const r = (n: number) => Math.round(n * 100) / 100;
const tierValue = (t: string) =>
  r(gaps.filter((g) => g.tier === t).reduce((s, g) => s + (g.amountCr ?? 0), 0));

let failed = 0;
const check = (label: string, actual: unknown, expected: unknown) => {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? "OK  " : "FAIL"}  ${label.padEnd(34)} ${actual}${ok ? "" : `  (expected ${expected})`}`);
};

const total = company.leakageCr;
check("sum of every gap price", r(gaps.reduce((s, g) => s + (g.amountCr ?? 0), 0)), total);
check("sum of money buckets", r(buckets.reduce((s, b) => s + bucketTotal(b.id), 0)), total);
check("sum by stakeholder", r(stakeholders.reduce((s, p) => s + valueForStakeholder(p.id), 0)), total);
check(
  "sum by evidence tier",
  r(tierValue("confirmed") + tierValue("inferred") + tierValue("unverified")),
  total,
);

// A gap priced by two claims would make the ledger's rows disagree with its header.
const owners = new Map<string, string[]>();
for (const c of claims) {
  if (c.linkedGapId) owners.set(c.linkedGapId, [...(owners.get(c.linkedGapId) ?? []), c.id]);
}
const dupes = [...owners].filter(([, cs]) => cs.length > 1);
check("gaps priced by more than one claim", dupes.length, 0);
if (dupes.length) console.log("     ", JSON.stringify(dupes));

for (const t of ["confirmed", "inferred", "unverified"] as const) {
  const rows = r(
    claims
      .filter((c) => c.tier === t && c.linkedGapId)
      .reduce((s, c) => s + (gapById(c.linkedGapId!).amountCr ?? 0), 0),
  );
  check(`ledger rows sum, ${t}`, rows, tierValue(t));
}

// Nothing in Meridian should be unattributable.
const srcIds = new Set(sources.map((s) => s.id));
check("gaps with no evidence", gaps.filter((g) => g.evidence.length === 0).length, 0);
check(
  "broken source references",
  gaps.flatMap((g) => g.evidence.filter((e) => !srcIds.has(e.sourceId))).length,
  0,
);
check("unpriced gaps carrying a reason", gaps.filter((g) => g.amountCr == null && !g.unpricedReason).length, 0);

console.log(failed === 0 ? "\nAll data checks passed." : `\n${failed} check(s) failed.`);
process.exit(failed === 0 ? 0 : 1);

import {
  gapById,
  gaps,
  netValue,
  type Gap,
} from "./suvarna";
import { pastProjectById } from "./atlas";

/* --------------------------------------------------------------------------
   What to build, ranked.

   Every other surface in the product answers a question about the *client*:
   how they run, what is wrong, what to ask. This one answers a question about
   *us*, and it is the question the consultant is actually being paid to
   answer: what should Heizen build here, and in what order.

   **The ranking is computed, never authored.** A hand-written "top three"
   is a fourth copy of the findings list that goes stale the first time a gap
   changes tier, and nothing on screen would say it had. Every input below is
   already on the `Gap`, so the order moves when the data moves and the
   rationale moves with it.

   **`gap.rank` is not this order and must not be reused as it.** That field is
   the *value* ranking, biggest number first. A build order that ignored how
   sure we are, what a fix costs to deliver and what has to land before it
   would put a ₹2.1 Cr guess with an unmet prerequisite above a confirmed
   ₹1.6 Cr fix we have already shipped twice, which is the opposite of the
   advice a consultant needs to give.
   ----------------------------------------------------------------------- */

/**
 * The four things that decide the order, and the balance between them is the
 * whole design of this page.
 *
 * **Money is doubled, and everything else is a nudge.** The first version
 * weighted tier, effort and precedent heavily enough that they outran the
 * rupee figure, and the page recommended the three safest small builds: a
 * confirmed, cheap, done-before ₹75 L fix at number one, on a company leaking
 * ₹9.1 Cr. That is a defensible list of *first deliveries* and a terrible
 * answer to *what should we build*, which is the question the screen asks in
 * its first line. A consultant who opens a call with ₹75 L has spent the
 * meeting's one good minute on the smallest thing in the dossier.
 *
 * So the three adjustments together can move a finding by about ₹1.5 Cr of
 * apparent value, which is enough to put a confirmed, proven, cheap build over
 * a slightly larger guess and not enough to bury the largest number on the
 * list. They are adjustments to a price, not points in an invented index,
 * which is why they stay in crores.
 */
const VALUE_WEIGHT = 2;
const TIER_WEIGHT = { confirmed: 1.5, inferred: 0.75, unverified: 0 } as const;
const EFFORT_WEIGHT = { Low: 0.75, Medium: 0.35, High: 0 } as const;
const PRECEDENT_WEIGHT = 0.6;
/** A fix that cannot start until another one lands is not a first build. It is
 *  demoted rather than hidden: it is still work, just not week one. */
const BLOCKED_PENALTY = 1;

export interface Recommendation {
  gap: Gap;
  /** Findings in `requires` that are not themselves in the recommended set. */
  blockedBy: Gap[];
  /** Has Heizen built this before, and where. */
  precedent?: { id: string; name: string };
  score: number;
  /** Why it sits where it sits, in one line. Composed from the fields above,
   *  so it cannot disagree with the chips beside it. */
  reason: string;
}

const precedentOf = (gap: Gap) => {
  const project = gap.precedentId ? pastProjectById(gap.precedentId) : undefined;
  return project ? { id: project.id, name: project.name } : undefined;
};

const scoreOf = (gap: Gap, blocked: boolean) =>
  (gap.amountCr ?? 0) * VALUE_WEIGHT +
  TIER_WEIGHT[gap.tier] +
  EFFORT_WEIGHT[gap.effort] +
  (gap.precedentId && pastProjectById(gap.precedentId) ? PRECEDENT_WEIGHT : 0) -
  (blocked ? BLOCKED_PENALTY : 0);

/**
 * One line saying why this one ranks where it does.
 *
 * Three clauses at most, in the order they change the decision: how sure we
 * are, whether we have built it, and what has to happen first. No dash between
 * them (§6a) and no adjective the data does not carry.
 */
const TIER_CLAUSE = {
  confirmed: "Confirmed in the sources",
  inferred: "Inferred, not confirmed",
  unverified: "Not verified yet",
} as const;

function reasonFor(gap: Gap, blockedBy: Gap[], precedent?: { name: string }): string {
  const clauses: string[] = [TIER_CLAUSE[gap.tier]];
  clauses.push(
    precedent
      ? `built before at ${precedent.name}`
      : "a first build, so the estimate carries no precedent",
  );
  clauses.push(
    blockedBy.length > 0
      /* The prerequisite's own `level2`, in the case it is written in.
         Lowercasing it to fit the sentence turned "Supplier master data" into
         a tidier clause and "SAP" into "sap" on the row beside it, which is
         the product misspelling a system it is telling a client about. */
      ? `starts after ${blockedBy.map((g) => g.level2).join(" and ")}`
      : `about ${gap.weeks} weeks with nothing in front of it`,
  );
  return `${clauses.join(", ")}.`;
}

/**
 * Every priced finding, in build order.
 *
 * Unpriced findings are not ranked and not dropped: they come back from
 * `unpriced()` below, under their own heading and with the reason they carry
 * no number. Ranking them against priced work would mean scoring a blank as a
 * zero, which reads as "worth nothing" rather than "not costed yet".
 */
export function buildOrder(): Recommendation[] {
  const priced = gaps.filter((g) => g.amountCr !== null);
  const pricedIds = new Set(priced.map((g) => g.id));

  return priced
    .map((gap) => {
      /* Only prerequisites that are themselves buildable count as blockers.
         A `requires` pointing at an unpriced finding is a research dependency,
         and it is stated in the detail rather than moving the row. */
      const blockedBy = gap.requires.filter((id) => pricedIds.has(id)).map((id) => gapById(id));
      const precedent = precedentOf(gap);
      return {
        gap,
        blockedBy,
        precedent,
        score: scoreOf(gap, blockedBy.length > 0),
        reason: reasonFor(gap, blockedBy, precedent),
      };
    })
    .sort((a, b) => b.score - a.score || a.gap.rank - b.gap.rank);
}

/** The answer, and the whole reason the page exists. Three, because three is
 *  what a consultant can say out loud on a first call without reading. */
export const FIRST_COUNT = 3;

export const unpriced = () => gaps.filter((g) => g.amountCr === null);

/** What the recommended set is worth together, net of the shared-root-cause
 *  deduction (§7.12). Never the sum of the three rows: two of them can share
 *  a cause, and a page that adds them anyway is overclaiming in its headline. */
export const valueOf = (items: Recommendation[]) => netValue(items.map((i) => i.gap.id));

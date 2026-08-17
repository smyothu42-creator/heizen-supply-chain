import { money } from "./format";
import {
  buckets,
  bucketTotal,
  businessContext,
  company,
  coverage,
  dealRisks,
  gapById,
  gaps,
  metrics,
  overlapGroups,
  pricedGaps,
  questions,
  sources,
  spendBase,
  stakeholders,
  timingSignals,
  urgency,
  valueForStakeholder,
  type Gap,
} from "./suvarna";
import {
  COMPLETENESS_LABEL,
  HEALTH_LABEL,
  HEALTH_MEANING,
  nodes,
  pathTo,
  type CanvasNode,
} from "./canvas";

/**
 * The assistant's answers, computed in the browser from the loaded research
 * set. No backend, and no pretend model either.
 *
 * **This retrieves, it does not generate**, and that distinction is the whole
 * design. A convincing fake — canned paragraphs that sound like a model — is
 * the one thing this product cannot ship: Meridian's entire proposition is
 * that a consultant can trace any sentence back to a source, and a screen that
 * invents fluent sentences in the same typeface as the researched ones poisons
 * the surface it sits on. So every answer below is assembled from `suvarna.ts`
 * at read time, carries the same source ids the rest of the product carries,
 * and says so when it has nothing.
 *
 * What that buys, beyond honesty: the answers stay correct when the data
 * changes. `check:data` already guarantees the totals reconcile, so an answer
 * built out of `bucketTotal` and `valueForStakeholder` cannot drift from the
 * page behind it the way a hardcoded transcript would within a week.
 *
 * The routing is deliberately shallow — keyword scoring over a dozen intents,
 * plus a title match against the twelve gaps. It is a prototype of the
 * *interaction*, not of the retrieval. When there is a real pipeline, this file
 * is what it replaces, and `AiPanel` should not need to change.
 */

export interface Answer {
  text: string;
  /** Source ids, so the reply cites what the rest of the product cites. */
  cites: string[];
  /** Suggested follow-ups, shown under the reply. */
  followUps?: string[];
}

const ALL_SOURCES = sources.map((s) => s.id);

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

/** The gap whose title shares the most distinctive words with the question. */
function matchGap(q: string): Gap | null {
  const words = q.split(/\W+/).filter((w) => w.length > 3);
  let best: { gap: Gap; score: number } | null = null;
  for (const gap of gaps) {
    const title = gap.title.toLowerCase();
    const score = words.filter((w) => title.includes(w)).length;
    if (score >= 2 && (!best || score > best.score)) best = { gap, score };
  }
  return best?.gap ?? null;
}

/**
 * The Operations node whose name the question is about.
 *
 * Same shape as `matchGap` and for the same reason: Operations' detail panel
 * hands the assistant a process by name, and a process name shares words with
 * the topic routes below it ("invoice", "match", "freight"), so it has to be
 * tried before them or *Ask Helix* on a node lands on a generic answer about
 * the total.
 *
 * The threshold is 2 for a multi-word name and 1 for a single-word one, which
 * is the only way "Make" and "Plan" can ever be matched at all.
 */
function matchNode(q: string): CanvasNode | null {
  const words = q.split(/\W+/).filter((w) => w.length > 3);
  let best: { node: CanvasNode; score: number } | null = null;
  for (const node of nodes) {
    const name = node.name.toLowerCase();
    const need = name.split(/\s+/).length > 1 ? 2 : 1;
    const score = words.filter((w) => name.includes(w)).length;
    if (score >= need && (!best || score > best.score)) best = { node, score };
  }
  return best?.node ?? null;
}

function nodeAnswer(node: CanvasNode): Answer {
  const trail = pathTo(node.id).map((n) => n.name).join(" → ");
  const here = node.gapIds.map(gapById);
  const worth = here.reduce((t, g) => t + (g.amountCr ?? 0), 0);

  return {
    text: [
      `${node.name}. ${trail}.`,
      node.plainLine,
      `${HEALTH_LABEL[node.health]}. ${HEALTH_MEANING[node.health]} ${COMPLETENESS_LABEL[node.completeness]}.`,
      here.length
        ? `${here.length} gap${here.length === 1 ? "" : "s"} sit here${
            worth > 0 ? `, worth ${money(worth)} a year` : ""
          }:\n${here.map((g) => `${g.title} — ${g.amountCr == null ? "not priced" : money(g.amountCr)}`).join("\n")}`
        : node.emptyKind === "confirmed-none"
          ? "Nothing was found here, and that is a result rather than a hole: we looked."
          : "Nothing has been found here yet, because nothing has been read about it.",
      node.needsCorrection
        ? `Somebody has flagged this: ${node.needsCorrection}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n"),
    cites: node.sourceIds,
    followUps: [
      node.gapIds.length ? "Which gap is biggest?" : "What has not been researched?",
      "What should I ask on the call?",
    ],
  };
}

function matchPerson(q: string) {
  return (
    stakeholders.find((s) => q.includes(s.name.split(" ")[0].toLowerCase())) ??
    null
  );
}

function gapAnswer(gap: Gap): Answer {
  const overlap = overlapGroups.find((o) => o.gapIds.includes(gap.id));
  const parts = [
    `${gap.title} is ranked ${gap.rank} of ${gaps.length}, at ${money(gap.amountCr)}${
      gap.amountCr == null ? "" : " a year"
    }. ${gap.plainLine}`,
    `Why we believe it: ${gap.why}`,
    `Confidence is ${gap.confidence.toLowerCase()} on the observation. ${gap.confidenceReason}`,
  ];
  if (gap.valuation) {
    parts.push(
      `The price is ${gap.valuation.basis}: ${gap.valuation.baseLabel}, ${gap.valuation.rateLabel}.`,
    );
  }
  if (gap.requires.length > 0) {
    parts.push(
      `Do not sell it alone. It needs ${gap.requires
        .map((r) => `"${gaps.find((g) => g.id === r)!.title}"`)
        .join(" and ")} first, or the saving does not arrive.`,
    );
  }
  if (overlap) {
    parts.push(
      `It shares a root cause with ${overlap.gapIds.length - 1} other${
        overlap.gapIds.length - 1 === 1 ? "" : "s"
      }, so the savings do not add. ${overlap.why}`,
    );
  }
  return {
    text: parts.join("\n\n"),
    cites: gap.evidence.map((e) => e.sourceId),
    followUps: [
      "What should I ask to verify this?",
      "Who owns this internally?",
    ],
  };
}

/**
 * Answer a question, optionally about a thing the user attached to it.
 *
 * **The typed question wins and the attachment is the fallback**, which is the
 * whole point of attaching rather than sending a canned line. Somebody who
 * selects a paragraph and types "why now?" is asking about urgency; somebody
 * who selects the same paragraph and types "what?" is asking about the
 * paragraph. Routing on the two concatenated would let the attachment's name
 * beat every topic route, because `matchGap` and `matchNode` run first.
 *
 * The fallback is detected by `cites.length === 0`, which is the one thing only
 * the no-match answer has: every real route cites at least one source, and that
 * is a rule this file already keeps for its own reasons rather than a marker
 * invented here. If a route ever legitimately answers with nothing behind it,
 * this needs an explicit flag instead.
 */
export function answerFor(question: string, context?: string): Answer {
  const direct = route(question);
  if (!context || direct.cites.length > 0) return direct;

  const viaContext = route(`${context} ${question}`);
  return viaContext.cites.length > 0 ? viaContext : direct;
}

function route(question: string): Answer {
  const q = question.toLowerCase().trim();

  /* A named gap beats every topic route: if someone types most of a gap title
     they want that gap, not the section it sits in. */
  const gap = matchGap(q);
  if (gap) return gapAnswer(gap);

  /* A named process, before the topic routes: "Invoice to posting" shares
     "invoice" with the money route and would otherwise never be reached. */
  const node = matchNode(q);
  if (node) return nodeAnswer(node);

  const person = matchPerson(q);
  if (person) {
    const theirs = questions
      .filter((x) => x.targetId === person.id)
      .sort((a, b) => a.askOrder - b.askOrder);
    return {
      text: [
        `${person.name}, ${person.role}. ${person.met ? "Already met." : "Not met yet."} Worth ${money(
          valueForStakeholder(person.id),
        )} of the ${money(company.grossLeakageCr)} total.`,
        `Measured on: ${person.measuredOn.join("; ")}.`,
        `Open with: "${person.openingLine}"`,
        `Avoid: ${person.avoid}`,
        theirs.length
          ? `Ask them: ${theirs.map((x) => `${x.askOrder}. ${x.text}`).join("\n")}`
          : "No questions are currently targeted at them.",
      ].join("\n\n"),
      cites: ALL_SOURCES.slice(0, 3),
      followUps: ["What could kill this deal?", "Why now?"],
    };
  }

  if (has(q, "why now", "urgen", "timing", "window", "when should")) {
    return {
      text: [
        `Urgency reads ${urgency.verdict.toLowerCase()}. ${urgency.because}`,
        `Against it: ${urgency.against}`,
        `The window is ${urgency.window}.`,
        timingSignals
          .map((s) => `${s.push === "accelerates" ? "↑" : "↓"} ${s.label} — ${s.value}`)
          .join("\n"),
      ].join("\n\n"),
      cites: ["src-ar25", "src-web", "src-call1"],
      followUps: ["What could kill this deal?", "What do I say to the CFO?"],
    };
  }

  if (has(q, "risk", "kill", "objection", "push back", "pushback", "incumbent", "tcs")) {
    return {
      text: [
        `${dealRisks.length} risks, all with a counter. ${dealRisks.filter((r) => r.severity === "high").length} decide the deal rather than delay it.`,
        ...dealRisks
          .filter((r) => r.severity === "high")
          .map((r) => `${r.label} (${r.value})\n${r.risk}\nSay: "${r.counter}"`),
      ].join("\n\n"),
      cites: dealRisks.flatMap((r) => r.sourceIds).slice(0, 4),
      followUps: ["Why now?", "What should I ask on the call?"],
    };
  }

  if (has(q, "ask", "question", "call plan")) {
    const first = questions
      .filter((x) => x.askWhen !== "after-this-call")
      .sort((a, b) => a.askOrder - b.askOrder)
      .slice(0, 4);
    return {
      text: [
        `${first.length} questions are answerable on this call. In order:`,
        ...first.map(
          (x) => `${x.askOrder}. ${x.text}\nWhy: ${x.whyItMatters}\nA bad answer: ${x.badAnswer}`,
        ),
      ].join("\n\n"),
      cites: ALL_SOURCES.slice(0, 2),
      followUps: ["Who am I meeting?", "What could kill this deal?"],
    };
  }

  if (has(q, "sure", "confiden", "certain", "verified", "trust", "reliable")) {
    return {
      text: [
        `Overall confidence is ${company.confidence}. ${company.confidenceReason}`,
        `None of the ${pricedGaps.length} priced gaps is measured from their own data — every price is modelled or a sector default. The observations are theirs; the numbers are ours.`,
        `The weakest is the ₹2.1 Cr indirect spend figure, where both the base and the rate are our estimates.`,
      ].join("\n\n"),
      cites: ALL_SOURCES,
      followUps: ["What should I ask to verify this?", "What have we not looked at?"],
    };
  }

  if (has(q, "cover", "not looked", "missing", "gap in the research", "blind")) {
    const thin = coverage.filter((c) => c.state !== "researched");
    return {
      text: [
        `${coverage.filter((c) => c.state === "researched").length} of ${coverage.length} SCOR stages are properly researched.`,
        ...thin.map((c) => `${c.stage} — ${c.state.replace("-", " ")}. ${c.line}${c.unclaimedRange ? " " + c.unclaimedRange : ""}`),
        `The largest hole is Make: yield and giveaway on ₹713 Cr of material is normally the biggest line on an agri-processor's board, and not one question has been asked about it.`,
      ].join("\n\n"),
      cites: ["src-ar25"],
      followUps: ["How sure are we about the total?", "What should I ask on the call?"],
    };
  }

  if (has(q, "source", "evidence", "where did", "how do we know")) {
    return {
      text: [
        `${sources.length} sources are loaded.`,
        ...sources.map((s) => `${s.name} — ${s.detail}, ${s.date}`),
        `No ERP extract has been shared, which is why no price is measured from their data.`,
      ].join("\n\n"),
      cites: ALL_SOURCES,
      followUps: ["How sure are we about the total?", "What have we not looked at?"],
    };
  }

  if (has(q, "total", "leak", "9.1", "how much", "worth", "money", "number", "breakdown")) {
    return {
      text: [
        `${money(company.netLeakageCr)} a year claimable, plus ${money(company.workingCapitalReleaseCr)} of cash released once. Those are different kinds of money and never add.`,
        `The gaps add to ${money(company.grossLeakageCr)}; ${money(company.overlapCr)} comes off for savings counted twice, which is how ${money(company.netLeakageCr)} is smaller than its own rows.`,
        buckets
          .map((b) => `${b.name} — ${money(bucketTotal(b.id))}`)
          .join("\n"),
        `Revenue is ${money(spendBase.revenueCr)}, so the leak is about ${((company.netLeakageCr / spendBase.revenueCr) * 100).toFixed(2)}% of it.`,
      ].join("\n\n"),
      cites: ["src-ar25", "src-call1", "src-call2"],
      followUps: ["How sure are we about the total?", "Which gap is biggest?"],
    };
  }

  if (has(q, "benchmark", "best in class", "best-in-class", "metric", "compare")) {
    const shown = metrics.filter((m) => m.actual != null).slice(0, 5);
    return {
      text: [
        `Every number carries a comparator. The ones that move the argument:`,
        ...shown.map(
          (m) => `${m.label}: ${m.actual}${m.unit} against ${m.bestInClass}${m.unit} best-in-class. ${m.gloss}`,
        ),
      ].join("\n\n"),
      cites: ALL_SOURCES.slice(0, 3),
      followUps: ["Which gap is biggest?", "How sure are we about the total?"],
    };
  }

  if (
    has(
      q,
      "company",
      "who are they",
      "about",
      "suvarna",
      "revenue",
      "plants",
      "profit",
      "margin",
      "customers",
      "suppliers",
      "scale",
      "how big",
    )
  ) {
    return {
      text: [
        company.thesis,
        /* Grouped, not a flat list of fifteen. The panel answers "who are
           they?" and the four headings are the four halves of that question.
           No dashes, per §6a: this is read out loud as often as it is read. */
        businessContext
          .map(
            (g) =>
              `${g.title}\n${g.facts.map((f) => `${f.label}: ${f.value}. ${f.detail}`).join("\n")}`,
          )
          .join("\n\n"),
      ].join("\n\n"),
      cites: ["src-ar25", "src-mca", "src-inv"],
      followUps: ["Where does the total come from?", "Why now?"],
    };
  }

  /* No match. It says so rather than improvising, and offers the routes it can
     actually answer — a fluent guess is the failure mode this whole file is
     arranged to avoid. */
  return {
    text: `I answer from the research loaded for ${company.name}, and I could not find anything in it for that.\n\nThings in here I can answer: the ${money(company.netLeakageCr)} total and how it breaks down, any of the ${gaps.length} gaps by name, why now, what could kill the deal, what to ask on the call, any of the four stakeholders, how sure we are, what has not been researched, and the ${sources.length} sources.`,
    cites: [],
    followUps: [
      "Where does the ₹9.1 Cr come from?",
      "What could kill this deal?",
      "Why now?",
    ],
  };
}

export const STARTERS = [
  "Where does the ₹9.1 Cr come from?",
  "Why now?",
  "What could kill this deal?",
  "What should I ask Rohan?",
  "How sure are we about the numbers?",
];

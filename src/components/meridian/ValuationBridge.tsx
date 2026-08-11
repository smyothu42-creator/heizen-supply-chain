import { cn } from "@/lib/cn";
import { money } from "@/lib/format";
import {
  MONEY_KIND_LABEL,
  VALUATION_BASIS_LABEL,
  VALUATION_BASIS_MEANING,
  type Valuation,
  type ValuationBasis,
} from "@/lib/suvarna";

/**
 * The working behind a price.
 *
 * A number with no working shown is the one a client challenges first, and the
 * one that hides an error longest — a ₹3.2 Cr gap sat on top of a ratio that was
 * three times its own company's headcount for four commits, because nothing on
 * screen ever said what the number was a percentage OF.
 *
 * So: named base × stated rate = claim, with the honest range around it, whose
 * numbers are whose, and — where a metric on screen implies something far
 * larger — the benchmark figure the client is about to compute themselves.
 *
 * Everything here is one interaction deep. It lives inside the gap expander,
 * never on the collapsed row. See layout-and-density.
 */

const BASIS_TONE: Record<ValuationBasis, string> = {
  measured: "text-foreground",
  modelled: "text-muted-foreground",
  "sector-default": "text-muted-foreground",
};

/** Filled / half / hollow. Shape, not hue — this sits beside health colours. */
function BasisMark({ basis, className }: { basis: ValuationBasis; className?: string }) {
  return (
    <svg viewBox="0 0 12 12" width="10" height="10" aria-hidden className={cn("shrink-0", className)}>
      <circle cx="6" cy="6" r="4.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      {basis === "measured" && <circle cx="6" cy="6" r="4.6" fill="currentColor" />}
      {basis === "modelled" && <path d="M6 1.4A4.6 4.6 0 0 1 6 10.6z" fill="currentColor" />}
    </svg>
  );
}

export function ValuationBasisBadge({
  basis,
  className,
  withLabel = true,
}: {
  basis: ValuationBasis;
  className?: string;
  withLabel?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-micro font-medium ",
        BASIS_TONE[basis],
        className,
      )}
    >
      <BasisMark basis={basis} />
      {withLabel && VALUATION_BASIS_LABEL[basis]}
      <span className="sr-only">price basis</span>
    </span>
  );
}

/**
 * Where the claim sits inside its own range. A range printed as text reads as
 * hedging; drawn, it reads as a position taken deliberately.
 */
function RangeBar({ v, claim }: { v: Valuation; claim: number }) {
  const span = v.highCr - v.lowCr;
  const at = span <= 0 ? 50 : ((claim - v.lowCr) / span) * 100;
  const clamped = Math.max(0, Math.min(100, at));

  return (
    <div className="mt-2">
      <div className="relative h-1.5 w-full rounded-full bg-muted" aria-hidden>
        <div className="absolute inset-y-0 left-0 rounded-full bg-foreground/25" style={{ width: `${clamped}%` }} />
        <div
          className="absolute -top-1 h-3.5 w-[3px] rounded-full bg-foreground"
          style={{ left: `calc(${clamped}% - 1.5px)` }}
        />
      </div>
      <div className="mt-1 flex justify-between text-micro text-muted-foreground tabular">
        <span>{money(v.lowCr)} if we are wrong low</span>
        <span>{money(v.highCr)} if we are wrong high</span>
      </div>
    </div>
  );
}

export function ValuationBridge({
  valuation: v,
  amountCr,
  className,
}: {
  valuation: Valuation;
  amountCr: number;
  className?: string;
}) {
  const gross = v.deduction ? amountCr + v.deduction.amountCr : amountCr;

  return (
    <div className={cn("rounded-md border border-border bg-muted/40 px-3 py-2.5", className)}>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <span className="text-micro font-medium text-muted-foreground">
          How this is priced
        </span>
        <ValuationBasisBadge basis={v.basis} />
      </div>

      {/* base × rate = claim. Read as one sentence, laid out as an equation so
          the base is impossible to miss — that is the part that was wrong. */}
      <dl className="mt-2 space-y-1.5 text-small">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="min-w-0 text-muted-foreground measure">{v.baseLabel}</dt>
          <dd className="tabular shrink-0 font-medium">{v.baseCr == null ? "Not stated" : money(v.baseCr)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="min-w-0 text-muted-foreground measure">{v.rateLabel}</dt>
          <dd className="tabular shrink-0 font-medium">{money(gross)}</dd>
        </div>
        {v.deduction && (
          <div className="flex items-baseline justify-between gap-3">
            <dt className="min-w-0 text-muted-foreground measure">less {v.deduction.label}</dt>
            <dd className="tabular shrink-0 font-medium">−{money(v.deduction.amountCr)}</dd>
          </div>
        )}
        <div className="flex items-baseline justify-between gap-3 border-t border-border pt-1.5">
          <dt className="font-medium">{MONEY_KIND_LABEL[v.kind]}</dt>
          <dd className="tabular shrink-0 font-medium">{money(amountCr)} a year</dd>
        </div>
        {v.oneOffCr != null && (
          // A one-off balance-sheet release is not annual leakage. It gets its
          // own line, in its own register, and is never added to the total.
          <div className="flex items-baseline justify-between gap-3">
            <dt className="text-muted-foreground">{v.oneOffLabel ?? "released once"}</dt>
            <dd className="tabular shrink-0 font-medium">{money(v.oneOffCr)}</dd>
          </div>
        )}
      </dl>

      <RangeBar v={v} claim={amountCr} />

      {v.benchmarkGapCr != null && (
        <p className="mt-2.5 border-t border-border pt-2 text-micro measure">
          <span className="font-medium">
            Closing the benchmark outright would be {money(v.benchmarkGapCr)}.{" "}
          </span>
          <span className="text-muted-foreground">
            {v.benchmarkNote ?? "We are not claiming it. The gap sizes the question, not the prize."}
          </span>
        </p>
      )}
      {v.benchmarkGapCr == null && v.benchmarkNote && (
        <p className="mt-2.5 border-t border-border pt-2 text-micro text-muted-foreground measure">
          {v.benchmarkNote}
        </p>
      )}

      <p className="mt-2 text-micro text-muted-foreground measure">
        {v.whoseNumbers} {VALUATION_BASIS_MEANING[v.basis]}
      </p>
    </div>
  );
}

/**
 * One line, for dense contexts — the Gaps list, the plan panel. Says what kind
 * of money it is and how solid the price is, without the derivation.
 */
export function ValuationLine({ valuation: v }: { valuation: Valuation }) {
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-micro text-muted-foreground">
      <ValuationBasisBadge basis={v.basis} />
      <span>{MONEY_KIND_LABEL[v.kind]}</span>
      {v.oneOffCr != null && (
        <span className="font-medium text-foreground">+ {money(v.oneOffCr)} once</span>
      )}
    </span>
  );
}

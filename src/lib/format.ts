/**
 * Indian money formatting. `₹14.7 Cr`, `₹50 L` — never `₹147000000`.
 * Missing money is an em dash, never `₹0`: zero is a claim, absence is not.
 * See .claude/skills/data-display-patterns.
 */
export function money(crores: number | null | undefined): string {
  if (crores == null) return "—";
  if (crores >= 1) {
    const v = Math.round(crores * 10) / 10;
    return `₹${group(v)} Cr`;
  }
  const lakhs = Math.round(crores * 100);
  return `₹${group(lakhs)} L`;
}

/**
 * Indian digit grouping: `1,150`, not `1150`, and `1,15,000` rather than
 * `115,000` past a lakh. Nothing in the product noticed while every figure was
 * a single-digit crore, and then a revenue column started printing `₹1150 Cr`
 * beside a Compare lane whose sector string had `₹1,150 Cr` typed into it by
 * hand. One of the two was wrong on every screen that showed both.
 *
 * `en-IN` is what knows the 3-then-2s rule; writing it out by hand is how the
 * lakh boundary gets missed.
 */
function group(n: number): string {
  return n.toLocaleString("en-IN", {
    minimumFractionDigits: n % 1 === 0 ? 0 : 1,
    maximumFractionDigits: 1,
  });
}

/** Same value, split so the unit can be typeset smaller than the number. */
export function moneyParts(crores: number | null | undefined): {
  value: string;
  unit: string;
} {
  if (crores == null) return { value: "—", unit: "" };
  if (crores >= 1) {
    const v = Math.round(crores * 10) / 10;
    return { value: `₹${v % 1 === 0 ? v.toFixed(0) : v.toFixed(1)}`, unit: "Cr" };
  }
  return { value: `₹${Math.round(crores * 100)}`, unit: "L" };
}

/** Share of a total, for the money tree. */
export function share(part: number, total: number): string {
  return `${Math.round((part / total) * 100)}%`;
}

export function pluralise(n: number, one: string, many: string): string {
  return `${n} ${n === 1 ? one : many}`;
}

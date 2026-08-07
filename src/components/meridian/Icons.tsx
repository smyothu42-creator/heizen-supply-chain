/**
 * Inline icons. Deliberately tiny and local — no icon dependency for a
 * prototype whose job is to be read, not shipped.
 * All are decorative: the label always carries the meaning.
 */

type P = { className?: string };

const base = "shrink-0";

export function FilingIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={`${base} ${className}`}>
      <path
        d="M4 1.5h5L12.5 5v9.5h-8.5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M9 1.5V5h3.5M6 8h4M6 10.5h4" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function TranscriptIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={`${base} ${className}`}>
      <path
        d="M2 3.5h12v8H6.5L3.5 14v-2.5H2z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinejoin="round"
      />
      <path d="M4.5 6.5h7M4.5 8.8h4.5" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function EmailIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={`${base} ${className}`}>
      <rect x="1.6" y="3.5" width="12.8" height="9" rx="1" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M2 4.4l6 4.2 6-4.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function WebIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={`${base} ${className}`}>
      <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path d="M1.8 8h12.4M8 1.8c3.4 3.6 3.4 8.8 0 12.4-3.4-3.6-3.4-8.8 0-12.4z" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function ChevronIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden className={`${base} ${className}`}>
      <path d="M5 3.5L10 8l-5 4.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function CloseIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={`${base} ${className}`}>
      <path d="M4 4l8 8M12 4l-8 8" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

export function ArrowIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden className={`${base} ${className}`}>
      <path d="M2.5 8h11M9.5 4l4 4-4 4" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/**
 * Tier marks. Shape carries the meaning so the ledger survives greyscale and
 * a projector in a bright room: filled / half / open.
 */
export function TierMark({ tier, className = "" }: { tier: "confirmed" | "inferred" | "unverified"; className?: string }) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden className={`${base} ${className}`}>
      {tier === "unverified" ? (
        <circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.4" strokeDasharray="2.2 2" />
      ) : (
        <circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      )}
      {tier === "confirmed" && <circle cx="8" cy="8" r="5.6" fill="currentColor" />}
      {tier === "inferred" && <path d="M8 2.4a5.6 5.6 0 010 11.2z" fill="currentColor" />}
    </svg>
  );
}

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
      <rect
        x="1.6"
        y="3.5"
        width="12.8"
        height="9"
        rx="1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path d="M2 4.4l6 4.2 6-4.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function WebIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={`${base} ${className}`}>
      <circle cx="8" cy="8" r="6.2" fill="none" stroke="currentColor" strokeWidth="1.2" />
      <path
        d="M1.8 8h12.4M8 1.8c3.4 3.6 3.4 8.8 0 12.4-3.4-3.6-3.4-8.8 0-12.4z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
    </svg>
  );
}

/* ---- Hero tiles. Drawn at 18px, one weight, no fills — they sit inside a
   circle on the indigo band and any detail below this size turns to mud. ---- */

export function MoneyIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden className={`${base} ${className}`}>
      <circle cx="10" cy="10" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M7.4 6.6h5.2M7.4 9h5.2M11.4 6.6c1.2 0 1.8 1 1.8 2s-.7 2-2.2 2H7.4l4.4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function AskIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden className={`${base} ${className}`}>
      <circle cx="10" cy="10" r="7.2" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M7.9 7.7a2.1 2.1 0 1 1 2.6 2.1v1.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <circle cx="10.5" cy="13.6" r="0.85" />
    </svg>
  );
}

export function MapIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden className={`${base} ${className}`}>
      <circle cx="4.6" cy="10" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="15.4" cy="5.4" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="15.4" cy="14.6" r="2.1" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M6.6 9.2l6.9-3M6.6 10.8l6.9 3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function LayersIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden className={`${base} ${className}`}>
      <path
        d="M10 3.2l6.6 3.3L10 9.8 3.4 6.5 10 3.2Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path
        d="M3.4 10l6.6 3.3L16.6 10M3.4 13.5l6.6 3.3 6.6-3.3"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ScaleIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden className={`${base} ${className}`}>
      <path
        d="M10 3.4v13.2M5.2 5.2h9.6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path
        d="M2.8 11.4l2.4-5 2.4 5a2.4 2.4 0 0 1-4.8 0ZM12.4 11.4l2.4-5 2.4 5a2.4 2.4 0 0 1-4.8 0Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ChevronIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden className={`${base} ${className}`}>
      <path
        d="M5 3.5L10 8l-5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CloseIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={`${base} ${className}`}>
      <path
        d="M4 4l8 8M12 4l-8 8"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A magnifier. Used only by the project switcher's filter field. */
export function SearchIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={`${base} ${className}`}>
      <circle cx="7" cy="7" r="4.25" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path
        d="M10.2 10.2 13.5 13.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * A pencil. Used only by the edit control on a gap row.
 *
 * Drawn at 14px like the other row-level marks, and open rather than filled:
 * twelve of these down a list is a column of small shapes, and a filled nib at
 * this size reads as a blob that draws more attention than the finding beside
 * it.
 */
export function EditIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={`${base} ${className}`}>
      <path
        d="M10.6 2.4l3 3L6.2 12.8l-3.7.7.7-3.7z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
      <path d="M9.2 3.8l3 3" fill="none" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

/** A tray with an arrow into it. The one mark that says "a file arrives". */
export function DownloadIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden className={`${base} ${className}`}>
      <path
        d="M8 2.2v7.2M5.2 6.8L8 9.6l2.8-2.8M2.8 12.4h10.4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ArrowIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden className={`${base} ${className}`}>
      <path
        d="M2.5 8h11M9.5 4l4 4-4 4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Tier marks. Shape carries the meaning so the ledger survives greyscale and
 * a projector in a bright room: filled / half / open.
 */
export function TierMark({
  tier,
  className = "",
}: {
  tier: "confirmed" | "inferred" | "unverified";
  className?: string;
}) {
  return (
    <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden className={`${base} ${className}`}>
      {tier === "unverified" ? (
        <circle
          cx="8"
          cy="8"
          r="5.6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeDasharray="2.2 2"
        />
      ) : (
        <circle cx="8" cy="8" r="5.6" fill="none" stroke="currentColor" strokeWidth="1.4" />
      )}
      {tier === "confirmed" && <circle cx="8" cy="8" r="5.6" fill="currentColor" />}
      {tier === "inferred" && <path d="M8 2.4a5.6 5.6 0 010 11.2z" fill="currentColor" />}
    </svg>
  );
}

/** A circular arrow. Used only by the Run research button. */
export function RerunIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={`${base} ${className}`}>
      <path
        d="M13.5 8a5.5 5.5 0 1 1-1.9-4.16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path
        d="M13.5 1.5v3.2h-3.2"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * The assistant's mark. It was defined privately inside `AiPanel`; the
 * selection popover needs the same glyph, and two copies of one four-point
 * star is how they drift apart.
 */
export function SparkIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={`${base} ${className}`}>
      <path d="M8 1.5 9.4 5.6 13.5 7 9.4 8.4 8 12.5 6.6 8.4 2.5 7 6.6 5.6Z" fill="currentColor" />
      <path
        d="M12.75 10.5 13.35 12.15 15 12.75 13.35 13.35 12.75 15 12.15 13.35 10.5 12.75 12.15 12.15Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CheckIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={`${base} ${className}`}>
      <path
        d="M3.5 8.5 6.5 11.5 12.5 4.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CopyIcon({ className = "" }: P) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className={`${base} ${className}`}>
      <rect
        x="5.5"
        y="5.5"
        width="9"
        height="9"
        rx="1.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
      />
      <path
        d="M10.5 3.5v-1a1 1 0 0 0-1-1h-7a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h1"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
      />
    </svg>
  );
}

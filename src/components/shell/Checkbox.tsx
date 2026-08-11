"use client";

import { cn } from "@/lib/cn";

/**
 * The product's tick-box.
 *
 * It was a bare `<input type="checkbox">` with `accent-foreground`, which is
 * the browser's own control tinted. That is one control in the product wearing
 * the operating system's shape: a different box on macOS, Windows and Android,
 * a different corner radius from every other box on the page, and a focus ring
 * the platform draws rather than the one `check:ui` measures.
 *
 * **The fill is `--evidence`, not `--foreground`.** On the page a cyan thing is
 * a thing you operate, which is exactly what this is. Ink would have made it
 * agree with the text beside it, and a control that matches the prose is a
 * control you stop seeing.
 *
 * **The tick is `--card`, and that is what makes one component work in both
 * themes.** Light mode fills deep teal and cuts a white tick out of it; dark
 * mode fills lifted cyan and cuts a near-black one. A hardcoded white tick
 * would sit at about 2:1 on the dark theme's `#4FC9D8`.
 *
 * The `appearance-none` input keeps the real element focusable and in the tab
 * order, so the ring lands on the box the user sees rather than on a wrapper.
 * The tick is a sibling driven by `peer-checked`, because a background-image
 * tick cannot be given a token colour.
 */
export function Checkbox({
  checked,
  onChange,
  label,
  className,
}: {
  checked: boolean;
  onChange: () => void;
  /** Read out instead of the box. There is no visible text beside it. */
  label: string;
  className?: string;
}) {
  return (
    /* **18px, with a 26px hit area under it.** The box was 16px and the label
       was the box, so the whole target was 16px square — under the 24px floor
       a touch device needs, on a surface read on an actual phone minutes before
       a call. `after:-inset-1` grows what the finger hits without moving what
       the eye sees. */
    <label
      className={cn(
        "relative flex size-[1.125rem] shrink-0 cursor-pointer",
        "after:absolute after:-inset-1 after:content-['']",
        className,
      )}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer size-[1.125rem] shrink-0 appearance-none rounded-[5px] border border-border-strong bg-card transition-colors checked:border-evidence checked:bg-evidence hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-card"
      />
      <svg
        viewBox="0 0 16 16"
        aria-hidden
        className="pointer-events-none absolute inset-0 size-[1.125rem] text-card opacity-0 transition-opacity peer-checked:opacity-100"
      >
        <path
          d="M3.75 8.5 6.6 11.25 12.25 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only">{label}</span>
    </label>
  );
}

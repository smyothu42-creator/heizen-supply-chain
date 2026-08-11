"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * A labelled on/off switch, for a setting that adds or removes something rather
 * than choosing between alternatives.
 *
 * **It is a switch and not a third dropdown, because the question is not "which
 * one".** `SelectField` sits beside it twice on Gaps, and both of those pick a
 * value out of a set: an ordering, an area. This one has two states and one of
 * them is "and also show me the plan". A two-option `<select>` reading *Plan:
 * Off* is a menu you have to open to find out it only had one other thing in
 * it.
 *
 * **`<button role="switch">`, not a checkbox.** The distinction is what the
 * control does *when* you press it. `Checkbox` on a gap row marks that row for
 * inclusion in something you build afterwards; this changes the screen the
 * moment it moves. ARIA has the two roles for exactly that difference, and
 * screen readers announce them differently — "switch, on" against "checkbox,
 * checked". A `<button>` is keyboard-operable with Space and Enter for free.
 *
 * **The label is visible and pointed at by `id`**, matching `SelectField` in the
 * same row: a micro-cap in `--muted-foreground` to the left of the control, so
 * three settings side by side read as three settings rather than as two
 * settings and a stray toggle. `aria-labelledby` rather than a `<label
 * htmlFor>` because the control is a `<button>`, which `<label>` does not
 * associate with.
 */
export function ToggleField({
  label,
  checked,
  onChange,
  className,
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  className?: string;
}) {
  const id = useId();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span id={id} className="shrink-0 text-micro font-medium text-muted-foreground">
        {label}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby={id}
        onClick={() => onChange(!checked)}
        /* **36×20 with a 16px thumb**, which is the smallest this can be and
           still read as a track with something in it rather than as a filled
           pill. The hit area is grown to 28px with `after:-inset-1` instead of
           growing the box — the same trick `Checkbox` uses, and for the same
           reason: this surface is read on a phone minutes before a call, and a
           20px target is under the floor a thumb needs. */
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border transition-colors",
          "after:absolute after:-inset-1 after:content-['']",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          /* On is `--evidence`, which is what a thing you operate looks like on
             the page everywhere else in this product — the same token the
             tick-box fills with. Off is a bordered `--muted`, so the track is
             visible as a track before it is switched rather than being an empty
             outline that reads as a disabled control. */
          checked
            ? "border-evidence bg-evidence"
            : "border-border-strong bg-muted hover:border-foreground",
        )}
      >
        {/* `--card`, not white. In dark mode the on-track is a lifted cyan and a
            hardcoded white thumb would be the one part of this control that did
            not invert. Same argument `Checkbox` records for its tick. */}
        <span
          aria-hidden
          className={cn(
            "pointer-events-none block size-4 rounded-full bg-card shadow-card transition-transform motion-reduce:transition-none",
            checked ? "translate-x-[1.125rem]" : "translate-x-0.5",
          )}
        />
      </button>
    </div>
  );
}

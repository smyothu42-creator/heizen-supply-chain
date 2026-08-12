"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import { SelectNative } from "@/components/ui/select-native";

/**
 * A labelled dropdown, for a setting whose options are too many or too long to
 * sit on one line as tabs.
 *
 * **It is a native `<select>`, deliberately.** A custom popover would match
 * `ProjectMenu`, but that one is navigation — you press a project and go
 * somewhere. This picks a *value*, which is the element's actual job, and
 * taking the native one buys three things a hand-built menu would have to
 * re-earn: it is keyboard-operable and screen-reader correct for free, it
 * cannot be scrolled off the edge of a card, and on a phone it opens the
 * platform's own picker. That last one matters here more than it usually
 * would — Meridian is read minutes before a call, sometimes on an actual
 * phone, and a native picker beats a 200px popover every time.
 *
 * **The label is visible, and that is a reversal worth naming.** `SwitchTrack`
 * lost its visible labels because beside underline tabs a micro-cap reads as a
 * sixth word in the row that happens not to be pressable. Beside a box with a
 * chevron it reads as what it is: the name of the thing the box sets. A
 * dropdown showing "Value" with nothing beside it does not say *value of
 * what*, and unlike a tab row it cannot rely on its siblings to imply the
 * question.
 *
 * `htmlFor` and a real `<label>`, not `aria-label`. There is visible text
 * here, so pointing at it is strictly better than repeating it.
 */
export function SelectField({
  label,
  value,
  onChange,
  options,
  className,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: [value: string, text: string][];
  className?: string;
}) {
  const id = useId();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <label
        htmlFor={id}
        className="shrink-0 text-small font-medium text-muted-foreground"
      >
        {label}
      </label>
      {/* The box itself is `SelectNative` in `components/ui` — a native
          `<select>` wearing shadcn's trigger, so it sits beside a `Button` and
          an `Input` without looking like a fourth kind of box. */}
      <SelectNative id={id} value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map(([v, text]) => (
          <option key={v} value={v}>
            {text}
          </option>
        ))}
      </SelectNative>
    </div>
  );
}

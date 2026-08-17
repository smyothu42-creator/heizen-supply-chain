"use client";

import { useId } from "react";
import { cn } from "@/lib/cn";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * A labelled dropdown, for a setting whose options are too many or too long to
 * sit on one line as tabs.
 *
 * **It was a native `<select>` and is now Radix**, on request, and the reason
 * is the half of a native control that is not ours: the option list is drawn by
 * the operating system, so on macOS every dropdown in this product opened a
 * dark sheet in the system font in the middle of a light ivory page. See
 * `ui/select.tsx` for what that costs, which is mainly the platform picker on a
 * phone.
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
      {/* The trigger keeps the shape it had as a native box, so it still sits
          beside a `Button` and an `Input` without looking like a fourth kind of
          thing. Only the list it opens has changed. */}
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="w-auto">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map(([v, text]) => (
            <SelectItem key={v} value={v}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

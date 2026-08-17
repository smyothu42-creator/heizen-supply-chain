"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * The product's dropdown: shadcn's Radix Select on Meridian's tokens.
 *
 * **This replaces the native `<select>`, on request, and the reason is the one
 * thing a native control cannot give up.** A `<select>`'s trigger is ours to
 * style and its *option list* is the operating system's: on macOS it opens as a
 * dark rounded sheet in the system font, which is a second palette appearing in
 * the middle of a light ivory page and reading as another application's menu.
 * Every other surface in this product is themed to one set of tokens, and the
 * one place a user could not be shown them was the list they were choosing
 * from.
 *
 * **What that costs, so it stays a decision.** `SelectNative` was chosen for
 * three real things, and two of them are re-earned here rather than lost:
 * Radix keeps the control keyboard-operable and screen-reader correct
 * (`role="combobox"`, typeahead, arrow keys, Escape, focus returned to the
 * trigger), and the list is portalled to the body, so it cannot be clipped by a
 * card's overflow or captured by a transformed ancestor. What genuinely goes is
 * the platform picker on a phone: a tap now opens a themed popover rather than
 * iOS's wheel. That is the trade the request makes, and it is the thing to
 * re-measure if this surface starts being used on an actual phone in anger.
 *
 * The trigger keeps `SelectNative`'s exact shape, so a dropdown still sits
 * beside a `Button` and an `Input` without looking like a fourth kind of box.
 */

const Select = SelectPrimitive.Root;
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

function SelectTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Trigger>) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-9 w-full min-w-0 items-center justify-between gap-2 rounded-md border border-border bg-card py-1 pl-3 pr-2.5",
        "text-small text-foreground shadow-card transition-colors hover:border-border-strong",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        "disabled:pointer-events-none disabled:opacity-50",
        // The value is one line and truncates; the box is sized by its widest
        // label at the call site, not by whatever happens to be chosen.
        "[&>span]:min-w-0 [&>span]:truncate",
        className,
      )}
      {...props}
    >
      {children}
      {/* Drawn, not the platform's: the native arrow is a different shape,
          weight and colour on every OS, and two of these side by side is
          exactly where that shows. */}
      <SelectPrimitive.Icon asChild>
        <ChevronDown
          aria-hidden
          data-slot="select-chevron"
          className="size-4 shrink-0 text-muted-foreground"
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectContent({
  className,
  children,
  position = "popper",
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        /* Above the dialog layer. One of these opens inside the invite dialog
           on Team, and a list that renders behind the box it was opened from is
           a control that appears to do nothing. See the stack in `AppShell`. */
        className={cn(
          "scroll-slim relative z-[100] max-h-72 overflow-y-auto overflow-x-hidden rounded-lg border border-border-strong bg-card text-foreground shadow-raised",
          /* **The floor is the trigger's own width**, so the list opens as the
             box growing downwards rather than as a menu of a different size
             beside it. It lives on the content and not on the viewport so a
             caller can override it: the sort control on Gaps is a 36px icon and
             its list is words. */
          position === "popper" &&
            "min-w-[var(--radix-select-trigger-width)] data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1",
          className,
        )}
        {...props}
      >
        <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center text-muted-foreground">
          <ChevronUp className="size-4" />
        </SelectPrimitive.ScrollUpButton>
        <SelectPrimitive.Viewport className="p-1">{children}</SelectPrimitive.Viewport>
        <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center text-muted-foreground">
          <ChevronDown className="size-4" />
        </SelectPrimitive.ScrollDownButton>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        // `--muted` on the highlighted row, not `--accent`: on this platform a
        // cyan thing is somewhere to go, and a menu row that fills itself cyan
        // spends that meaning six times per open. Same departure from stock
        // shadcn that `ui/button.tsx` records.
        "relative flex w-full cursor-default select-none items-center gap-2 rounded-md py-1.5 pl-2.5 pr-8 text-small outline-none",
        "data-[highlighted]:bg-muted data-[highlighted]:text-foreground",
        "data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      {/* The tick is at the end rather than in a leading gutter, so an
          unselected row starts where the trigger's own value does. */}
      <span className="absolute right-2.5 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <Check className="size-4 text-evidence" />
        </SelectPrimitive.ItemIndicator>
      </span>
    </SelectPrimitive.Item>
  );
}

/** An `<optgroup>` heading. The micro-cap the product uses for every other
 *  group label, so a grouped list reads like the rest of the platform. */
function SelectLabel({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn(
        "px-2.5 pb-1 pt-2 text-micro font-medium uppercase tracking-wide text-muted-foreground",
        className,
      )}
      {...props}
    />
  );
}

function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn("-mx-1 my-1 h-px bg-border", className)}
      {...props}
    />
  );
}

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectLabel,
  SelectSeparator,
};

"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A native `<select>` wearing shadcn's trigger.
 *
 * shadcn ships a Radix Select, and this deliberately is not it. This control
 * picks a *value*, which is the element's actual job, and the native one buys
 * three things a popover has to re-earn: it is keyboard-operable and screen
 * reader correct for free, it cannot be scrolled off the edge of a card, and on
 * a phone it opens the platform's own picker. Meridian is read minutes before a
 * call, sometimes on an actual phone, so that last one is worth more here than
 * it usually would be.
 *
 * What it borrows from shadcn is the trigger's shape, so a dropdown sits beside
 * a Button and an Input without looking like a fourth kind of box. The chevron
 * is drawn rather than the platform's, because the native arrow is a different
 * shape, weight and colour on every OS and two of these side by side is exactly
 * where that shows.
 */
function SelectNative({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <div className="relative min-w-0">
      <select
        data-slot="select-native"
        className={cn(
          "h-9 w-full appearance-none rounded-md border border-border bg-card py-1 pl-3 pr-8",
          "text-small text-foreground shadow-card transition-colors hover:border-border-strong",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        aria-hidden
        className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export { SelectNative };

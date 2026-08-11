"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui Tabs, in this product's underline register rather than the stock
 * pill rail.
 *
 * The rail needed a ground, and a ground fights every surface it lands on —
 * Operations put one inside a card and the active chip came out the same white
 * as the card around it. A row of words on a hairline needs no ground at all,
 * and the active word is marked by thickening the rule under it: `-mb-px` pulls
 * each trigger down a pixel so its own border lands *on* the list's rule rather
 * than stacking a second line above it.
 *
 * The rule is ink, not `--accent`. These tabs rearrange what is already on
 * screen; on this page a coloured word means somewhere to go.
 */
function Tabs({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col gap-4", className)}
      {...props}
    />
  );
}

function TabsList({ className, ...props }: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn("flex w-max items-baseline gap-4 border-b border-border", className)}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "-mb-px whitespace-nowrap border-b-2 border-transparent px-1 pb-2 text-small text-muted-foreground transition-colors",
        "hover:text-foreground data-[state=active]:border-foreground data-[state=active]:font-medium data-[state=active]:text-foreground",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };

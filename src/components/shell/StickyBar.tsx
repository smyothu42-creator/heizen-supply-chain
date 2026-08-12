"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { useMastheadVisible } from "./useScrollDirection";

/**
 * A surface's control row, pinned under the masthead while the page scrolls.
 *
 * On request, and it is the same argument the masthead's own hide-on-scroll
 * makes one level down. Gaps is twelve rows, Questions eleven, Compare four
 * lanes and Research Full three to four screens: the control that decides
 * *what* is in the list sat at the top of a document you have scrolled away
 * from, so changing the order meant scrolling back up, changing it, and
 * scrolling down again to see what changed. A setting you cannot see the effect
 * of is a setting you use once.
 *
 * **The offset follows the masthead rather than being a constant.** The band
 * hides on the way down and comes back on the way up, so a bar fixed at 48px
 * would leave a 48px strip of document sliding past above it the moment the
 * band went. It sits at the band's height while the band is there and at the
 * top of the window when it is not, and the 200ms matches what the band itself
 * transitions at. `motion-reduce` drops the slide and keeps the position, which
 * is the same split the masthead makes.
 *
 * **It draws `bg-background`, and that is load-bearing rather than decoration.**
 * A sticky row with no ground of its own has the document scrolling *through*
 * it. Because it renders the surface frame itself, the ground runs to both
 * window edges and nothing shows in the gutters.
 *
 * **`z-20`, which is page content.** The stack list in `AppShell` puts the
 * masthead at `z-30` and every panel above that: this is part of the page, so
 * it goes under the chrome and under anything the reader opened deliberately.
 */
export function StickyBar({
  children,
  className,
  from,
}: {
  children: ReactNode;
  className?: string;
  /**
   * Where the pinning starts. Anything tall enough to eat a phone screen names
   * a breakpoint and stays in the flow below it, because a bar that takes a
   * third of the window is not a bar, it is a second header.
   *
   * Measured, which is the only way to set this: Sources' block is 450px, half
   * of a 667px window, so it waits for `lg`. Gaps' row wraps to three lines at
   * 375 and is 186px there against 112px from 560 up, so it waits for `sm`.
   * Research and Questions are 110px at 375 and pin everywhere.
   */
  from?: "sm" | "lg";
}) {
  const mastheadVisible = useMastheadVisible();

  return (
    <div
      className={cn(
        "surface-frame z-20 bg-background transition-[top] duration-200 motion-reduce:transition-none",
        /* Written out rather than composed as `${from}:sticky`: Tailwind reads
           class names out of the source, so an interpolated one is a class that
           is never generated. */
        from === "lg" ? "lg:sticky" : from === "sm" ? "sm:sticky" : "sticky",
        /* 48px is the masthead. If the band's height changes, this changes with
           it — and so does `SectionNav`'s own offset, which clears this bar. */
        mastheadVisible ? "top-12" : "top-0",
        className,
      )}
    >
      {children}
    </div>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, type ComponentType, type RefObject } from "react";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/cn";
import { Wordmark } from "./Wordmark";

/**
 * The nav, as a side panel, below `xl`.
 *
 * **This reverses the note in `AppShell` that the row scrolls rather than
 * collapsing into a menu**, on request. That argument — a consultant will not
 * find a hidden tab mid-call — was made against an icon-only rail and against a
 * menu that hides the nav at *every* width. Neither is what this is: from `xl`
 * the six tabs are all still on the band, and below it the row was not really
 * available either.
 *
 * **The breakpoint is measured, not conventional.** The six tabs with a mark
 * each come to 647px, and the wordmark, project switcher, Ask Helix and the
 * theme control take another 450 — so the row needs about 1130px of window to
 * be whole, which is past `lg`. At 375 the strip had ~120px for it: four of the
 * six were behind a horizontal swipe with nothing on screen saying they were
 * there, and even at 1024 *Sources* was off the right edge. A swipe on an
 * unlabelled scroller is a worse hiding place than a labelled button.
 *
 * The one width this cannot cover is `xl` with the assistant open, which takes
 * 320px or more off the header and puts the row back into a scroll. A static
 * breakpoint cannot see a panel's width; the scroller is still there and still
 * draws a thumb, which is the old fallback doing its old job.
 *
 * What the panel buys back is that every tab is visible at once, at full size,
 * with room for the mark and the label — which is the thing the row could only
 * do on a monitor.
 *
 * **It is page-toned, not masthead-toned.** Same rule `ProjectMenu`'s popover
 * and `SelectionAsk` already follow: the `--masthead-*` family does not invert
 * with the theme and exists for the 48px strip. A full-height panel is a panel,
 * so it is `bg-card` on `border-border` like every other one in the product.
 *
 * **It renders outside `<header>`, and that is load-bearing.** The masthead
 * carries `transition-transform` and takes `-translate-y-full` on the way down,
 * and a transformed ancestor becomes the containing block for `position: fixed`
 * — so a drawer nested inside it would slide off the top of the window with the
 * band it was opened from. State lives in `Shell` for that reason rather than
 * because two components needed to share it.
 */

type Tab = {
  readonly name: string;
  readonly href: string;
  readonly Icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
};

export function NavButton({
  open,
  onToggle,
  ref,
}: {
  open: boolean;
  onToggle: () => void;
  ref?: RefObject<HTMLButtonElement | null>;
}) {
  return (
    <button
      ref={ref}
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="nav-drawer"
      /* Named on the element: it is a glyph and nothing else, and a button
         announced as "button" is the failure `AiButton` already records. */
      aria-label={open ? "Close the menu" : "Menu"}
      className={cn(
        // The masthead's own outline register, matching `ThemeToggle` beside it
        // at the other end of the band. `size-8` clears nothing on its own, so
        // the hit area is the padding: 32px of box inside a 48px strip that the
        // strip's own height finishes off.
        "flex size-8 shrink-0 items-center justify-center rounded-md border transition-colors xl:hidden",
        open
          ? "border-masthead-accent bg-masthead-border text-masthead-foreground"
          : "border-masthead-border text-masthead-muted hover:border-masthead-accent hover:text-masthead-foreground",
      )}
    >
      {open ? (
        <X aria-hidden className="size-[18px]" />
      ) : (
        <Menu aria-hidden className="size-[18px]" />
      )}
    </button>
  );
}

export function NavDrawer({
  open,
  onClose,
  tabs,
  label,
  surface,
  triggerRef,
}: {
  open: boolean;
  onClose: () => void;
  tabs: readonly Tab[];
  label: string;
  /** The first path segment, so a tab knows whether it is the current one. */
  surface: string;
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const pathname = usePathname();
  const panelRef = useRef<HTMLDivElement>(null);

  // Closing on navigation is the whole of what makes this usable: every control
  // in here is a link, so without it the panel stays over the surface it just
  // took you to. Keyed on the pathname rather than fired from the click, so a
  // back gesture out of a surface closes it too.
  useEffect(() => {
    if (open) onClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /* Focus goes in on open and back to the button on close. A drawer that leaves
     the caret on `<body>` drops a keyboard user at the top of the document with
     nothing to say where the thing they just closed was.

     **`opened` is what makes the second half a close and not a mount.** This
     component is always rendered and returns null when shut, so the effect runs
     once at first paint with `open` false — and the plain `else` put the focus
     ring on the hamburger on every page load in the product, which reads as the
     menu having just been closed. Found in a screenshot, not by a checker: a
     focus ring on a real control is not a contrast or reachability failure. */
  const opened = useRef(false);
  useEffect(() => {
    if (open) {
      opened.current = true;
      panelRef.current?.focus();
    } else if (opened.current) {
      opened.current = false;
      triggerRef.current?.focus();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Full width, with no breakpoint of its own — the trigger is gone from
          `xl`, so there is no width at which this can be showing and be wrong.
          A scrim that hid itself would leave the panel un-dismissable if a
          window were resized across the boundary while it was open. */}
      <button
        type="button"
        aria-label="Close the menu"
        onClick={onClose}
        className="fixed inset-0 z-[36] bg-foreground/25"
      />

      <div
        id="nav-drawer"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-label={label}
        /* Above the masthead and above Operations' full screen, below the
           evidence panel — see the stack in `AppShell`. Nothing above it in that
           list is reachable while this is open anyway: they all cover the band
           this is opened from. */
        className="fixed inset-y-0 left-0 z-[38] flex w-[16.5rem] max-w-[82%] flex-col border-r border-border bg-card shadow-raised outline-none"
      >
        {/* The mark is the way back to the projects list, the same job it does
            on the band. Repeating it here rather than relying on the one behind
            the scrim: the panel covers it. */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <Link
            href="/projects"
            aria-label="Heizen Discovery Tool — projects"
            className="flex items-center rounded-sm text-foreground transition-colors hover:text-muted-foreground"
          >
            <Wordmark />
          </Link>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close the menu"
            className="flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X aria-hidden className="size-[18px]" />
          </button>
        </div>

        <nav aria-label={label} className="min-h-0 flex-1 overflow-y-auto p-2">
          <ul className="flex flex-col gap-0.5">
            {tabs.map((tab) => {
              const active = tab.href.startsWith(`/${surface}`) && surface !== "";
              return (
                <li key={tab.name}>
                  <Link
                    href={tab.href}
                    aria-current={active ? "page" : undefined}
                    /* A filled row, not an accent rail — the same call
                       `SectionNav` makes, and for the same reason: inside a
                       panel a rail is a second vertical line a few pixels from
                       the panel's own border.

                       `py-2.5` on a 24px line is a 44px row, which is the touch
                       floor. This is the one control on a phone that a
                       consultant aims at while walking into a meeting. */
                    className={cn(
                      "flex items-center gap-3 rounded-md px-3 py-2.5 text-base transition-colors",
                      active
                        ? "bg-muted font-medium text-foreground"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <tab.Icon aria-hidden className="size-[18px] shrink-0" />
                    {tab.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </>
  );
}

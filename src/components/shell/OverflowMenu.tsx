"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The product's overflow control: one 28px box, three dots, a list under it.
 *
 * **Why it exists.** A row that carries every action it supports carries them
 * twelve times over. On Gaps that was a bookmark and a pencil on every finding,
 * so a list of twelve findings drew twenty-four controls the reader had to look
 * past to read twelve sentences. Neither action is one anybody performs while
 * scanning: saving happens once you have chosen, correcting happens once you
 * have read. Both belong one press away, which is what this is.
 *
 * **It keeps the manners the other two popovers in this product keep**, because
 * three popovers with three sets of manners is three products: Escape closes
 * and returns focus to the trigger, a click anywhere outside closes, moving
 * focus out closes. See `ProjectMenu` and `ThemePicker`, which this follows
 * rather than reimplements.
 *
 * **Hand-rolled rather than a Radix menu**, for consistency with those two. The
 * repo has `@radix-ui/react-dropdown-menu` in `package.json` and nothing
 * importing it; adding the fourth popover pattern to a product that already has
 * three of its own would cost more than it saves.
 *
 * **`role="menu"` is deliberately not used.** A menu role commits to arrow-key
 * roving focus, which this does not implement; a plain group of buttons in a
 * labelled container is announced correctly and is Tab-navigable, which is what
 * the contract actually is.
 */
export function OverflowMenu({
  label,
  children,
  triggerRef,
  align = "end",
  /** A dot on the trigger, for state that would otherwise be invisible while
      the menu is shut. Gaps uses it for "this finding is saved". */
  marked = false,
  className,
}: {
  /** Names what the menu acts on, for a screen reader: "More actions for X". */
  label: string;
  /** `MenuItem`s. They receive the close callback through context-free props,
      so an item that acts has to close the menu itself — see `MenuItem`. */
  children: (close: () => void) => ReactNode;
  /** The caller's handle on the trigger, for putting focus back on it after a
      dialog an item opened has closed. Optional: most menus do not need it. */
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
  align?: "start" | "end";
  marked?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const own = useRef<HTMLButtonElement>(null);
  const trigger = triggerRef ?? own;
  const id = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const onFocus = () => {
      if (!wrap.current?.contains(document.activeElement)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  return (
    <div ref={wrap} className={cn("relative shrink-0", className)}>
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        aria-haspopup="true"
        aria-label={`More actions for ${label}`}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "relative flex size-7 shrink-0 items-center justify-center rounded-md border bg-card shadow-card transition-colors",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          open
            ? "border-border-strong text-foreground"
            : "border-border text-muted-foreground hover:border-border-strong hover:bg-muted hover:text-foreground",
        )}
      >
        <DotsIcon />
        {/* The same overhanging badge with a ring in the page colour that the
            sort control uses, and for the same reason: at this radius a dot
            placed inside the corner sits on the curve and reads as clipped. */}
        {marked && (
          <span
            aria-hidden
            className="absolute -right-0.5 -top-0.5 size-2 rounded-full bg-foreground ring-2 ring-card"
          />
        )}
      </button>

      {open && (
        <div
          id={id}
          aria-label={label}
          className={cn(
            "absolute z-40 mt-1.5 min-w-[11rem] overflow-hidden rounded-lg border border-border bg-card py-1 text-foreground shadow-raised",
            align === "end" ? "right-0" : "left-0",
          )}
        >
          {children(close)}
        </div>
      )}
    </div>
  );
}

/**
 * One row in the menu.
 *
 * `onSelect` receives nothing and is expected to have closed the menu already
 * through the `close` the parent handed down. That is one line at every call
 * site and it is the honest shape: some items close on press and some (a
 * toggle you may want to press twice) do not.
 */
export function MenuItem({
  children,
  onSelect,
  icon,
  /** A toggle's current state. Renders a tick and announces as pressed. */
  pressed,
  tone = "default",
}: {
  children: ReactNode;
  onSelect: () => void;
  icon?: ReactNode;
  pressed?: boolean;
  tone?: "default" | "danger";
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-2.5 px-3 py-2 text-left text-small transition-colors",
        "focus-visible:outline-none focus-visible:bg-muted",
        tone === "danger"
          ? "text-health-critical hover:bg-health-critical-surface"
          : "hover:bg-muted",
      )}
    >
      {icon && <span className="shrink-0 text-muted-foreground">{icon}</span>}
      <span className="min-w-0 flex-1">{children}</span>
      {pressed && <TickIcon />}
    </button>
  );
}

function DotsIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden className="shrink-0">
      {[3.5, 8, 12.5].map((x) => (
        <circle key={x} cx={x} cy="8" r="1.35" fill="currentColor" />
      ))}
    </svg>
  );
}

function TickIcon() {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className="shrink-0">
      <path
        d="M3.5 8.5l3 3 6-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

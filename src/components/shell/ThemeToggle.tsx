"use client";

import { useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Dark mode is supported, so it needs to be checkable during review — the
 * health colours have separate dark values and a designer has to see both.
 *
 * Read once during render rather than in an effect: the inline script in the
 * root layout has already applied the stored theme by the time this runs, so
 * there is nothing to synchronise afterwards.
 */
function currentTheme(): "light" | "dark" {
  if (typeof document === "undefined") return "light";
  // Light unless someone has said otherwise. There is no `prefers-color-scheme`
  // fallback and there is none in `globals.css` either: a tool demoed to
  // investors on an unknown machine should not pick its palette from that
  // machine's OS setting, and dark mode here exists so a designer can check the
  // health colours rather than as a preference to be guessed at.
  return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
}

/**
 * **Visible again**, on request, and the one flag is what made that a one-line
 * change rather than a hunt.
 *
 * It was `false` for a while, which is why the flag exists at all: one switch
 * rather than two commented-out call sites, because the two are what drift — a
 * control taken out of `AppShell` and left on `/` is how a product ends up with
 * a theme you can reach from one screen and not the next. There is one call
 * site today, `AppShell`, so `tone="page"` currently has no caller; it stays
 * because the trap it exists for is real and the masthead is not the only place
 * this could land.
 *
 * **The masthead is one component for both levels**, so flipping this puts the
 * button on the workspace pages (Projects, Team, Settings, Account) and inside
 * a project in the same move. That is the point rather than a side effect: it
 * is the same band, and a theme control that appears when you open a project
 * would be exactly the drift above.
 *
 * **Dark mode works either way and is checked either way.**
 * `[data-theme="dark"]` is what actually switches the palette, the inline
 * script in `layout.tsx` still restores a stored choice, and both harnesses set
 * the attribute directly rather than pressing this button.
 */
const SHOW = true;

/**
 * `tone` exists because this button has two homes. In the app it sits on the
 * slate masthead, whose colours do not invert with the theme. On the index page
 * there is no masthead and it sits on the page, whose colours do. One set of
 * tokens cannot serve both — the masthead greys are ~2:1 on ivory.
 */
export function ThemeToggle({ tone = "masthead" }: { tone?: "masthead" | "page" }) {
  const [theme, setTheme] = useState<"light" | "dark">(currentTheme);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("meridian-theme", next);
  };

  // After the hooks, never before them: an early return above `useState` is a
  // conditional hook call, and it would break the moment `SHOW` became a prop
  // or a setting rather than a constant.
  if (!SHOW) return null;

  const dark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggle}
      suppressHydrationWarning
      /* **The label is the whole accessible name now, so it has to say the
         verb.** As a word-pill this read "Dark" with an `sr-only` "mode" after
         it, which is a state as much as an action — the button said what you
         would get and let its position say that pressing it was how. An icon
         cannot carry even that, so the name is what the press does. `title`
         repeats it for a pointer, which is the one affordance an icon button
         genuinely owes a user who is guessing. */
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      title={dark ? "Switch to light mode" : "Switch to dark mode"}
      className={cn(
        /* **A 28px box with a 36px target under it.** The visible button
           matches `AiButton`'s height beside it — a taller control next to that
           pill would make the pair read as two sizes of the same thing — and
           `after:-inset-1` puts a bigger hit area behind it without moving a
           pixel. Same trick the tick-box uses, and for the same reason: this is
           read on a phone minutes before a call. */
        "relative grid size-7 shrink-0 place-items-center rounded-full border transition-colors",
        "after:absolute after:-inset-1 after:content-['']",
        tone === "masthead"
          ? "border-masthead-border text-masthead-muted hover:border-masthead-accent hover:text-masthead-foreground"
          : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
      )}
    >
      {/* **Sun when it is dark, moon when it is light** — the icon is what you
          are switching *to*, matching the label. The other convention, showing
          the state you are in, puts a moon on a screen that is already dark and
          reads as a label rather than a control.

          The swap is a child element rather than text, so hydration patches it
          on the first client render when a dark choice is stored;
          `suppressHydrationWarning` is on the button for exactly that, and was
          already here for the word it replaced. */}
      {dark ? <SunIcon /> : <MoonIcon />}
    </button>
  );
}

/* 14px in a 28px box. The rays are separate strokes rather than a dashed
   circle: a dash array lands them differently at every stroke width, and this
   icon renders at one size on a band that is not going to grow. */
const SunIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
    <circle cx="8" cy="8" r="3.1" stroke="currentColor" strokeWidth="1.4" />
    <path
      d="M8 1.2v1.6M8 13.2v1.6M1.2 8h1.6M13.2 8h1.6M3.4 3.4l1.1 1.1M11.5 11.5l1.1 1.1M12.6 3.4l-1.1 1.1M4.5 11.5l-1.1 1.1"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
  </svg>
);

/* One path, not a circle with a circle punched out of it. A cutout needs a mask
   or an even-odd fill to work on a coloured band, and both break the moment the
   ground behind it is not what they assumed. */
const MoonIcon = () => (
  <svg viewBox="0 0 16 16" width="14" height="14" fill="none" aria-hidden>
    <path
      d="M13.2 9.6A5.6 5.6 0 0 1 6.4 2.8a5.6 5.6 0 1 0 6.8 6.8Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

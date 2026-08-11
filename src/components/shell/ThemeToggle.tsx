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
 * **Hidden, not removed.** Flip this back to `true` and the button returns to
 * both of its homes with nothing else to change.
 *
 * One flag rather than commenting out two call sites, because the two are what
 * drift: a control taken out of `AppShell` and left in `/` is how a product
 * ends up with a theme you can reach from one screen and not the next. It is
 * also why the rest of the file is untouched — the theme itself is not being
 * removed, only the way in.
 *
 * **Dark mode still works and is still checked.** `[data-theme="dark"]` is what
 * actually switches the palette, the inline script in `layout.tsx` still
 * restores a stored choice, and both harnesses set the attribute directly
 * rather than pressing this button — so `check:ui` still measures contrast in
 * both themes and `pnpm shots` still writes a dark screenshot of every surface.
 * Hiding the control does not make the second palette unverified.
 */
const SHOW = false;

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

  return (
    <button
      type="button"
      onClick={toggle}
      suppressHydrationWarning
      className={cn(
        "rounded-full border px-2.5 py-1 text-micro transition-colors",
        tone === "masthead"
          ? "border-masthead-border text-masthead-muted hover:border-masthead-accent hover:text-masthead-foreground"
          : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
      )}
    >
      {theme === "dark" ? "Light" : "Dark"}
      <span className="sr-only"> mode</span>
    </button>
  );
}

"use client";

import { useState } from "react";

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
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "dark" || attr === "light") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(currentTheme);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("meridian-theme", next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      suppressHydrationWarning
      className="rounded-md border border-border px-2 py-1 text-micro text-muted-foreground hover:border-border-strong hover:text-foreground"
    >
      {theme === "dark" ? "Light" : "Dark"}
      <span className="sr-only"> mode</span>
    </button>
  );
}

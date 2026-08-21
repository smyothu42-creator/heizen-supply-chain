"use client";

import { useEffect, useId, useRef, useState, useSyncExternalStore } from "react";
import { cn } from "@/lib/cn";
import { ChevronIcon } from "@/components/meridian/Icons";
import {
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
  THEMES,
  type ThemeId,
  isThemeId,
  themeById,
} from "@/lib/themes";

/**
 * The theme control. It was a two-state toggle and is a menu, because there are
 * more than two and because what is being chosen is a mode of one brand theme
 * rather than a lightness — see `lib/themes.ts`.
 *
 * **The theme is read through `useSyncExternalStore` and never during render,
 * and that is load-bearing rather than tidiness.** The toggle this replaced
 * seeded its state with `useState(currentTheme)`, reading `data-theme` off
 * `<html>` while rendering: the server has no `document` and rendered one icon,
 * a client with a theme stored rendered another, and those are two different
 * elements rather than two values of one attribute. `suppressHydrationWarning`
 * forgives a mismatched attribute or text node and never a differing child, so
 * React failed hydration, regenerated the whole tree on the client, recreated
 * `<html>` on the way past and took the restore script's `data-theme` off it. A
 * stored theme reverted on every load, and the same regeneration client-
 * rendered the head script, which is where the "Encountered a script tag"
 * console error came from. One read on the render path, three symptoms.
 *
 * `useSyncExternalStore` fixes it because hydration renders `getServerSnapshot`
 * on both sides and re-reads the DOM only afterwards, so there is nothing to
 * disagree about. Same primitive and reason as the section-collapse store and
 * the assistant's width, including not putting a `setState` in an effect, which
 * `pnpm lint` rejects.
 */

let listeners: Array<() => void> = [];

/**
 * The store is the `data-theme` attribute, so it watches the attribute rather
 * than only the one function that writes it. Without the observer the claim
 * below — that the DOM is the single source of truth — is not actually true:
 * anything that set the attribute from outside this component left the trigger
 * showing the previous theme's name and swatch while the page painted the new
 * one. The screenshot harnesses do exactly that, which is how it was noticed.
 */
function subscribe(onChange: () => void) {
  listeners = [...listeners, onChange];
  const observer = new MutationObserver(() => {
    for (const l of listeners) l();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => {
    observer.disconnect();
    listeners = listeners.filter((l) => l !== onChange);
  };
}

/**
 * The attribute on `<html>` is the single source of truth, not a copy of it in
 * React state. `localStorage` is where it persists; the DOM is where it lives.
 */
function readTheme(): ThemeId {
  const attr = document.documentElement.getAttribute("data-theme");
  return isThemeId(attr) ? attr : DEFAULT_THEME;
}

/**
 * The server has no theme to read and must not guess one. This is what both
 * sides render during hydration, whatever is stored.
 */
function serverTheme(): ThemeId {
  return DEFAULT_THEME;
}

function applyTheme(next: ThemeId) {
  // The DOM is the store, so it is written first and every subscriber then
  // re-reads it. Nothing holds a second copy that could drift from `<html>`.
  document.documentElement.setAttribute("data-theme", next);
  try {
    localStorage.setItem(THEME_STORAGE_KEY, next);
  } catch {
    // Private mode and blocked storage: the theme still changes for this
    // session, it just will not survive a reload. Losing the preference is not
    // a reason to leave the palette half-applied.
  }
  for (const l of listeners) l();
}

/**
 * `tone` exists because this control has two homes. In the app it sits on the
 * chrome strip, whose colours do not invert with the theme. On a page there is
 * no strip and it sits on the document, whose colours do. One set of tokens
 * cannot serve both: the masthead greys are ~2:1 on the page.
 */
export function ThemePicker({ tone = "masthead" }: { tone?: "masthead" | "page" }) {
  const theme = useSyncExternalStore(subscribe, readTheme, serverTheme);
  const [open, setOpen] = useState(false);
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  /* Escape closes and returns focus to the trigger, Tab out closes, a click
     anywhere else closes. The same contract `ProjectMenu` keeps, because two
     popovers on one strip with different manners is two products. */
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

  const current = themeById(theme);

  return (
    <div ref={wrap} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        /* The name says what it opens and what is set, because the icon cannot.
           A control that only says "Theme" makes the user open it to find out
           what they are on. */
        aria-label={`Theme: ${current.name}. Change theme`}
        title={`Theme: ${current.name}`}
        className={cn(
          /* **It was a 28px circle with a palette outline in it, and nobody
             could find it.** On a dark band, beside a filled pill and a project
             switcher carrying a monogram and a name, a grey line-icon in a ring
             is the quietest thing on the row — it read as a help button.

             It is the band's own trigger idiom now, the one `ProjectMenu`
             already uses: a mark, a name, and a chevron saying it opens. Three
             separate things say "control" where previously none did.

             **What it deliberately is not is filled.** `AiButton` is the one
             filled control in the chrome and the masthead's single place for
             boldness, spent on the thing that *does* something rather than
             navigating somewhere. Two filled pills side by side and you have to
             read both before pressing either. Obvious is bought here with a
             border, a swatch and a word.

             `after:-inset-1` keeps a hit area larger than the box, which is
             what gets this over the 44px touch floor on a phone. */
          "relative flex shrink-0 items-center gap-2 rounded-md border px-2 py-1 text-small transition-colors",
          "after:absolute after:-inset-1 after:content-['']",
          tone === "masthead"
            ? "border-masthead-border text-masthead-muted hover:border-masthead-accent hover:text-masthead-foreground"
            : "border-border text-muted-foreground hover:border-border-strong hover:text-foreground",
        )}
      >
        {/* The current mode's own colours, not a generic palette glyph. It
            says which mode you are in as well as what the control is for, and
            four colours on a dark band is the most visible thing available
            without spending a fill. */}
        <Swatch id={theme} className="size-4" />
        {/* **The name is gone from the trigger, on request.** The swatch
            already carries the mode's own colours and the chevron already
            says the control opens something; the word next to them was a
            third statement of the same fact `ProjectMenu`'s name-plus-chevron
            makes once. It survives in `aria-label` and `title` above, so a
            screen reader or a tooltip still says which mode is on. */}
        <ChevronIcon
          className={cn("shrink-0 rotate-90 transition-transform", open && "-rotate-90")}
        />
      </button>

      {open ? (
        <div
          id={id}
          role="menu"
          aria-label="Theme"
          /* `right-0`, not `left-0`: this sits at the right-hand end of the
             strip, and a left-aligned popover on a right-hand trigger runs off
             the window edge.

             `text-foreground` is load-bearing. The menu is a child of the
             masthead, which sets `text-masthead-foreground` — white. On its own
             card every unstyled name would render white on white and simply not
             be there. `ProjectMenu` documents the same trap. */
          className="absolute right-0 z-50 mt-2 w-72 overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-raised"
        >
          {/* The heading is where "Heizen" is said, once. The four rows are
              modes of one brand theme, so repeating the name on each of them
              would be four words of chrome to establish something the masthead
              wordmark already established. */}
          <p className="border-b border-border px-3 py-2 text-micro font-medium uppercase tracking-[0.12em] text-muted-foreground">
            Heizen theme
          </p>
          <div className="p-1.5">
            {THEMES.map((t) => {
              const active = t.id === theme;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="menuitemradio"
                  aria-checked={active}
                  onClick={() => {
                    applyTheme(t.id);
                    setOpen(false);
                    trigger.current?.focus();
                  }}
                  className={cn(
                    "flex w-full items-start gap-2.5 rounded-md px-2.5 py-2 text-left transition-colors",
                    active ? "bg-muted" : "hover:bg-muted",
                  )}
                >
                  {/* The swatch is the mode, not a bullet: paper, ink and
                      accent, which is exactly the three-part decision being
                      made. A tick alone would say which one is on and nothing
                      about what any of them look like. */}
                  <Swatch id={t.id} className="mt-0.5 size-4" />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-1.5">
                      <span className="text-small font-medium">{t.name}</span>
                      {active ? (
                        <span className="text-micro text-muted-foreground">On</span>
                      ) : null}
                    </span>
                    {/* `.reading` because these are two-line sentences at 12px,
                        which is exactly the size that needs the leading. */}
                    <span className="reading mt-0.5 block text-micro text-muted-foreground">
                      {t.note}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}

/**
 * Paper, ink and accent, in a 16px square. It is drawn from the same tokens the
 * mode itself sets, inside a `data-theme` scope, so a swatch can never drift
 * from the mode it advertises: adding a mode to `globals.css` and to `THEMES`
 * gives it a correct swatch with no third place to update.
 *
 * This is the one place in the product that renders another mode's colours
 * while not in that mode, which is why it carries the attribute itself. Brand's
 * block carries `[data-theme="heizen"]` alongside `:root` for exactly this: on
 * a plain `<span>` the `:root` half matches nothing.
 */
function Swatch({ id, className }: { id: ThemeId; className?: string }) {
  return (
    <span
      data-theme={id}
      aria-hidden
      className={cn(
        "grid shrink-0 grid-cols-2 overflow-hidden rounded-[3px] border border-border-strong",
        className,
      )}
    >
      <span className="bg-background" />
      <span className="bg-primary" />
      <span className="bg-card" />
      <span className="bg-accent" />
    </span>
  );
}

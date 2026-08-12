"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { CopyIcon } from "@/components/meridian/Icons";
import { HelixOrb } from "@/components/shell/HelixOrb";
import { useAi } from "./AiPanel";

/**
 * Select a sentence in the dossier and a small menu appears over it, with
 * **Ask Helix** at the front.
 *
 * CLAUDE.md §5 recorded three shapes for the assistant and settled on the side
 * panel: contextual click-to-ask was one of the two rejected, on the grounds
 * that it covers the thing being asked about. This is not that. The menu is a
 * *route into* the panel rather than a place to hold the conversation — it
 * appears on a selection, offers two verbs, and hands the question to the
 * panel that was always going to answer it. Nothing is read inside it.
 *
 * **Research only.** `AppShell` mounts it on the Research surfaces and nowhere
 * else. Research is the surface made of prose — Gaps and Questions are lists of
 * short rows where selecting a line is not something anyone does, and a menu
 * that appears on an accidental drag across a table is noise on five surfaces
 * to be useful on one.
 *
 * **The selected text becomes the *subject*, not the question.** It arrives in
 * the panel as a chip above the composer with the caret already in the box, and
 * the consultant writes what he actually wants to know. This used to send a
 * composed question — "what does this mean, and what is behind it?" with the
 * selection quoted inside — which is a guess made at the one moment the user has
 * told us the subject and nothing else. Somebody selecting a sentence to decide
 * whether he can say it on a call does not want it explained to him.
 *
 * The selection is still the best query available when the typed question routes
 * nowhere: `answerFor` takes it as a fallback, so selecting a gap title and
 * typing something vague still lands on that gap. See `AiAttachment`.
 *
 * Three things it does that a naïve version does not:
 *
 * - **It captures the text when it shows, not when it is clicked.** Clicking a
 *   button can collapse the selection in some browsers, and a menu whose
 *   action depends on the selection still being there is a menu that works
 *   until it does not.
 * - **It follows the page on scroll** rather than vanishing, by re-measuring
 *   the stored `Range`. A popover that disappears the moment you scroll to see
 *   what you selected is worse than one that never appeared.
 * - **Tab reaches it.** A selection menu that only takes a pointer is a
 *   control half the users cannot operate. While it is showing, the first Tab
 *   goes into the menu; Escape dismisses it and leaves the selection alone.
 */

/** Long enough to be a thought, short enough not to be a stray double-click. */
const MIN_CHARS = 3;

/**
 * What the panel is handed. Longer selections are trimmed, not refused.
 *
 * 240 and not 320, which was the first number and was measured wrong. A
 * selection that crosses several gap rows arrives as rank, effort, title and
 * price four times over, and 320 characters of that in the "you" bubble is an
 * unreadable slab that makes the whole transcript look broken. The trim is a
 * *readability* limit on the quote, not a limit on what can be asked about.
 */
const MAX_QUESTION_CHARS = 240;

/**
 * Collapse the DOM's whitespace before quoting it.
 *
 * `Selection.toString()` preserves the newlines between block elements, so a
 * drag across three rows arrives with a line break between every span. Quoted
 * into a chat bubble that reads as a broken paste, and it is also noise to the
 * keyword router. One space, always. This is the fix that a long-selection bug
 * is usually *actually* asking for.
 */
const flatten = (s: string) => s.replace(/\s+/g, " ").trim();

/** Keys that move the caret, and therefore can change a selection. */
const MOVES_CARET = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Home",
  "End",
  "PageUp",
  "PageDown",
]);

interface Anchor {
  /** Viewport coordinates of the selection's box. */
  top: number;
  left: number;
  bottom: number;
  text: string;
}

export function SelectionAsk() {
  const { attach } = useAi();
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const rangeRef = useRef<Range | null>(null);

  const hide = useCallback(() => {
    rangeRef.current = null;
    setAnchor(null);
    setCopied(false);
  }, []);

  /* Read the current selection and decide whether it deserves a menu.
     `null` means hide, and every rejection below is a reason it might. */
  const measure = useCallback((): Anchor | null => {
    if (typeof window === "undefined") return null;
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) return null;

    const text = flatten(sel.toString());
    if (text.length < MIN_CHARS) return null;

    const node = sel.anchorNode;
    if (!node) return null;
    const el =
      node.nodeType === Node.ELEMENT_NODE
        ? (node as Element)
        : node.parentElement;
    // Only inside the document itself. A selection in the assistant's own
    // transcript offering to ask the assistant about it is a loop, and a
    // selection on the masthead is someone dragging past a tab.
    if (!el?.closest("main")) return null;
    if (el.closest("#ai-panel")) return null;

    const range = sel.getRangeAt(0);
    const rect = range.getBoundingClientRect();
    if (rect.width === 0 && rect.height === 0) return null;

    rangeRef.current = range;
    return {
      top: rect.top,
      bottom: rect.bottom,
      left: rect.left + rect.width / 2,
      text,
    };
  }, []);

  /* Pointer and keyboard both, because a selection can be made either way:
     drag with a mouse, or Shift+arrow with a keyboard. `pointerup` rather
     than `selectionchange` — the latter fires on every character as the drag
     grows, and a menu that repositions under a moving cursor is unusable. */
  useEffect(() => {
    const onEnd = (e: Event) => {
      // A click on the menu is not a new selection. Without this the pointerup
      // that presses "Ask Helix" re-measures an empty selection and closes the
      // menu before the click lands.
      if (menuRef.current?.contains(e.target as Node)) return;
      // The selection is not final until the browser has settled it.
      window.setTimeout(() => setAnchor(measure()), 0);
    };
    const onKeyUp = (e: KeyboardEvent) => {
      // Only keys that can actually move a selection, and never one aimed at
      // the menu itself.
      //
      // **This is a whitelist because a blacklist had a bug**, and the bug was
      // the whole keyboard route: Tab's *keydown* focuses the first menu item,
      // then Tab's *keyup* arrives, re-measures, finds the selection changed,
      // and unmounts the menu out from under the focus that just landed on it.
      // Tab appeared to do nothing. Anything that is not a caret movement has
      // no business re-measuring.
      if (menuRef.current?.contains(e.target as Node)) return;
      if (!MOVES_CARET.has(e.key) && !(e.key.toLowerCase() === "a" && (e.ctrlKey || e.metaKey))) {
        return;
      }
      setAnchor(measure());
    };

    document.addEventListener("pointerup", onEnd);
    document.addEventListener("keyup", onKeyUp);
    return () => {
      document.removeEventListener("pointerup", onEnd);
      document.removeEventListener("keyup", onKeyUp);
    };
  }, [measure]);

  /* Follow the selection rather than vanishing on scroll. The stored `Range`
     is re-measured; if it has left the viewport or gone stale, the menu goes.
     `passive` because this runs on every scroll frame, on the longest
     documents in the product. */
  useEffect(() => {
    if (!anchor) return;
    const reposition = () => {
      const range = rangeRef.current;
      if (!range) return hide();
      let rect: DOMRect;
      try {
        rect = range.getBoundingClientRect();
      } catch {
        return hide();
      }
      if (rect.bottom < 0 || rect.top > window.innerHeight) return hide();
      setAnchor((a) =>
        a ? { ...a, top: rect.top, bottom: rect.bottom, left: rect.left + rect.width / 2 } : a,
      );
    };
    window.addEventListener("scroll", reposition, { passive: true, capture: true });
    window.addEventListener("resize", reposition);
    return () => {
      window.removeEventListener("scroll", reposition, { capture: true });
      window.removeEventListener("resize", reposition);
    };
  }, [anchor, hide]);

  /* Escape dismisses without touching the selection — the text stays selected,
     which is what someone pressing Escape on a menu expects.

     Tab moves into the menu. This is the whole keyboard story: select with
     Shift+arrows, press Tab, land on "Ask Helix". Intercepting Tab is a
     liberty, taken once, and only while a menu is on screen that is otherwise
     unreachable — normal tabbing resumes the moment focus is inside it. */
  useEffect(() => {
    if (!anchor) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        hide();
        return;
      }
      if (e.key !== "Tab" || e.shiftKey) return;
      const menu = menuRef.current;
      if (!menu || menu.contains(document.activeElement)) return;
      e.preventDefault();
      menu.querySelector<HTMLButtonElement>("button")?.focus();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [anchor, hide]);

  if (!anchor) return null;

  const askIt = () => {
    const trimmed = anchor.text.length > MAX_QUESTION_CHARS;
    const text = trimmed
      ? `${anchor.text.slice(0, MAX_QUESTION_CHARS).trimEnd()}...`
      : anchor.text;
    /* The selection is attached, not asked about.
       This used to send "What does this mean, and what is behind it?" with the
       selection quoted inside it, which is a guess at the question made at the
       one moment the user has told us the subject and nothing else. Somebody
       who selects a sentence because he is deciding whether to say it on a call
       does not want it explained. The chip carries the selection; he types the
       question. See `AiAttachment`.

       `query` is the untrimmed selection, so routing sees everything that was
       selected even where the chip shows an ellipsis: the trim is a
       readability limit on what is displayed, not on what may be asked about. */
    attach({ kind: "Selection", text, query: anchor.text });
    hide();
    window.getSelection()?.removeAllRanges();
  };

  const copyIt = async () => {
    try {
      await navigator.clipboard.writeText(anchor.text);
      setCopied(true);
      window.setTimeout(hide, 700);
    } catch {
      // Clipboard permission refused, or an insecure origin. Say nothing and
      // leave the menu up rather than reporting a success that did not happen.
      setCopied(false);
    }
  };

  /* Above the selection where there is room, below it where there is not, and
     never off either edge. 148px is half the menu's width plus the 8px gutter
     it should keep from the window. */
  const above = anchor.top > 96;
  const left = Math.min(Math.max(anchor.left, 148), window.innerWidth - 148);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label="What to do with the selected text"
      style={{
        top: above ? anchor.top - 10 : anchor.bottom + 10,
        left,
        transform: `translate(-50%, ${above ? "-100%" : "0"})`,
      }}
      // `z-[65]`: over the page and over the evidence panel's scrim, under the
      // assistant itself. The menu's whole job is to hand off to that panel, so
      // it must never be the thing on top of it. See the stack in `AppShell`.
      className="fixed z-[65] w-[17rem] overflow-hidden rounded-lg border border-border bg-card shadow-raised"
    >
      {/* Helix's own face, at the size a menu row's icon slot takes.

          **The masthead's pill says the same words and carries the spark**,
          which is a split rather than a slip. That pill is a filled cyan
          gradient and the mascot's ring is cyan, so half of it merges into the
          ground and the mark arrives with only its visor working. This menu is
          on a white card, where the pearl head and the ring both have an edge.
          Same rule either way: the mark is whichever one is legible on the
          ground it lands on. */}
      <MenuItem onClick={askIt} icon={<HelixOrb px={16} />} accent>
        Ask Helix
      </MenuItem>
      <div className="mx-3 h-px bg-border" aria-hidden />
      <MenuItem onClick={copyIt} icon={<CopyIcon />}>
        {copied ? "Copied" : "Copy text"}
      </MenuItem>
    </div>
  );
}

function MenuItem({
  onClick,
  icon,
  accent = false,
  children,
}: {
  onClick: () => void;
  icon: React.ReactNode;
  /** The first verb. It leads the menu and is the one in ink. */
  accent?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 px-3 py-2.5 text-left text-small transition-colors hover:bg-muted",
        accent ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
      )}
    >
      <span className={cn("shrink-0", accent ? "text-evidence" : "text-muted-foreground")}>
        {icon}
      </span>
      {children}
    </button>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { useToast } from "./Toast";

/**
 * Things a consultant has put aside, from anywhere in the product.
 *
 * **It started as an ask-list on Questions and moved up here**, on request,
 * because the same act happens on three surfaces: a question worth asking, a
 * finding worth raising, a section of the dossier worth re-reading before the
 * call. Three lists in three places is three places to look; one list with
 * three tabs is `/saved`.
 *
 * **The provider sits in `AppShell`, which is the layout**, so the set survives
 * moving between surfaces — client navigation keeps React state above the page.
 * A reload empties it, and that is deliberate: a saved set that came back would
 * be a promise about storage nothing here keeps.
 *
 * **An item describes itself.** `{ kind, id, label, href }` rather than a bare
 * id, so `/saved` renders the list without importing the research, the gaps and
 * the questions and looking three ids up in three shapes. The saving surface
 * knows what it is saving; the reading surface should not have to work it out.
 */

export type SavedKind = "question" | "gap" | "research";

export interface SavedItem {
  kind: SavedKind;
  id: string;
  /** What it says on the list. */
  label: string;
  /** Where it came from, so the list is a way back rather than a copy. */
  href: string;
}

export const SAVED_KIND_LABEL: Record<SavedKind, string> = {
  question: "Questions",
  gap: "Gaps",
  research: "Research",
};

interface SavedApi {
  items: SavedItem[];
  has: (kind: SavedKind, id: string) => boolean;
  countOf: (kind: SavedKind) => number;
  save: (item: SavedItem) => void;
  remove: (kind: SavedKind, id: string) => void;
  clear: (kind?: SavedKind) => void;
}

const SavedContext = createContext<SavedApi | null>(null);

export function useSaved() {
  const api = useContext(SavedContext);
  if (!api) throw new Error("useSaved must be used inside SavedProvider");
  return api;
}

export function SavedProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<SavedItem[]>([]);
  const { notify } = useToast();

  const has = useCallback(
    (kind: SavedKind, id: string) => items.some((i) => i.kind === kind && i.id === id),
    [items],
  );
  const countOf = useCallback(
    (kind: SavedKind) => items.filter((i) => i.kind === kind).length,
    [items],
  );

  /* The confirmation is the toast in the corner, and it is the only one: the
     tray that used to sit pinned to the bottom right of every screen has gone.
     A permanent counter is furniture the moment you have read it once, and it
     was in the corner a phone's thumb rests in. What it did that the toast does
     not is carry the count, so the count goes into the toast instead — and the
     way to `/saved` is the masthead's own tab, which was always there. */
  const save = useCallback(
    (item: SavedItem) => {
      /* Read off `items` rather than inside the updater. An updater is called
         twice under StrictMode, and a `notify` in there is two toasts for one
         press. */
      if (items.some((i) => i.kind === item.kind && i.id === item.id)) return;
      setItems((prev) => [...prev, item]);
      notify("Saved", {
        detail: item.label,
        action: { label: `Open your ${items.length + 1} saved`, href: "/saved" },
      });
    },
    [items, notify],
  );

  const remove = useCallback(
    (kind: SavedKind, id: string) => {
      setItems((prev) => prev.filter((i) => !(i.kind === kind && i.id === id)));
      notify("Removed from saved");
    },
    [notify],
  );
  const clear = useCallback(
    (kind?: SavedKind) => setItems((prev) => (kind ? prev.filter((i) => i.kind !== kind) : [])),
    [],
  );

  const api = useMemo<SavedApi>(
    () => ({ items, has, countOf, save, remove, clear }),
    [items, has, countOf, save, remove, clear],
  );

  return <SavedContext.Provider value={api}>{children}</SavedContext.Provider>;
}

/**
 * The save control, wherever something can be saved.
 *
 * One component for all three kinds: a question row, a gap row and a section
 * heading all press the same button and land in the same list. Saved is a filled
 * mark rather than a different colour — this is a state of the row, not a
 * reading about what is in it.
 */
export function SaveButton({
  item,
  className,
}: {
  item: SavedItem;
  className?: string;
}) {
  const { has, save, remove } = useSaved();
  const saved = has(item.kind, item.id);

  return (
    <button
      type="button"
      aria-pressed={saved}
      aria-label={saved ? "Remove from saved" : "Save for later"}
      onClick={() => (saved ? remove(item.kind, item.id) : save(item))}
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-md border bg-card shadow-card transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        saved
          ? "border-border-strong text-foreground"
          : "border-border text-muted-foreground hover:border-border-strong hover:bg-muted hover:text-foreground",
        className,
      )}
    >
      <BookmarkIcon filled={saved} />
    </button>
  );
}

/** Drawn on the same 16px grid and 1.4 stroke as the rest of the icon set. */
export function BookmarkIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden className="shrink-0">
      <path
        d="M4 2.75h8v10.5L8 10.4l-4 2.85z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

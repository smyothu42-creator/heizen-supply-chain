"use client";

import { useSyncExternalStore } from "react";
import { directions, type ViewMode } from "@/lib/directions";

/* -------------------------------------------------------------------------- */
/* Find across every reading                                                   */
/*                                                                             */
/* The navigator's box searches the whole dossier, not the page you happen to  */
/* be standing on. Type a word and every reading that carries it says so, with */
/* the headings underneath it; click through and the word is marked where it   */
/* actually is. Which reading you were on when you typed is not information the */
/* reader has, so it cannot be the thing that decides what a search finds.      */
/*                                                                             */
/* **The index is the product's own prerendered HTML, fetched and parsed.**    */
/* Every direction is a component, not a record, so there is no text field to  */
/* search: `suvarna.ts` holds the findings but the sentences around them live  */
/* in eleven `.tsx` files, and a search that read only the data would miss the */
/* half of the page a consultant actually reads. Fetching `/research/x/full`   */
/* gets the same words the reader would see, with no second copy to keep in    */
/* step. Every one of those routes is static, so this is eleven cache hits.    */
/*                                                                             */
/* It is fetched on the first search rather than on page load: nobody should   */
/* pay eleven requests for a page they opened to read.                         */
/*                                                                             */
/* **The state is a store, not `useState`.** The query has to survive moving   */
/* between readings — that is the whole feature — and it is read by the        */
/* navigator and written by the sheet's own effect. Same shape as the          */
/* section-collapse store in `Frames.tsx`, and the same reason: an external    */
/* store can be written from an effect without being a `setState` inside one.  */
/* -------------------------------------------------------------------------- */

/** The name the ranges are registered under. See `::highlight()` in `globals.css`. */
export const HIGHLIGHT = "meridian-find";

/** Below this a search is the alphabet. One letter marks most of a dossier. */
export const MIN_QUERY = 2;

export interface FindHits {
  total: number;
  /** Keyed by anchor id, so the navigator can say which headings carry it. */
  bySection: Record<string, number>;
}

export const NO_HITS: FindHits = { total: 0, bySection: {} };

/** What one reading has, for the navigator's list. */
export interface ReadingHits {
  total: number;
  sections: { id: string; label: string; count: number }[];
}

const NO_READING: ReadingHits = { total: 0, sections: [] };

interface FindState {
  query: string;
  /**
   * The sheet on screen, counted off the live DOM rather than off the index.
   * It is instant, where the index is a fetch away, and it is the only reading
   * whose folded sections we know about.
   */
  here: FindHits;
  /** Bumped when a reading finishes parsing, so the navigator recounts. */
  version: number;
  /** A fetch is in flight. The navigator says so rather than showing nothing. */
  loading: boolean;
}

let state: FindState = { query: "", here: NO_HITS, version: 0, loading: false };

const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
};

/** One snapshot object, replaced rather than mutated: `useSyncExternalStore`
    compares by identity, and a fresh object every read would loop. */
export function useFind() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  );
}

export function setQuery(query: string, view: ViewMode) {
  state = { ...state, query };
  emit();
  if (query.trim().length >= MIN_QUERY) void loadAll(view);
}

export function setHere(here: FindHits) {
  state = { ...state, here };
  emit();
}

/* ------------------------------------------------------------------ the index */

interface Doc {
  /** Lowercased and whitespace-collapsed: what is counted. */
  text: string;
  sections: { id: string; label: string; text: string }[];
}

const docs = new Map<string, Doc>();
const inFlight = new Set<string>();

const flat = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();

/**
 * The text of an element, with a space between every text node.
 *
 * `textContent` is the obvious call and it is wrong here: it concatenates
 * adjacent elements with nothing between them, so `<span>Suvarna</span>
 * <b>Meera</b>` arrives as "SuvarnaMeera" and the `M` is no longer the start of
 * a word. The index then under-counts exactly the matches that sit at a tag
 * boundary — which, in a document made of headings and rows, is most of the
 * interesting ones. The live DOM scan in `Frames.tsx` never had the problem
 * because it walks text nodes one at a time; this is that walk.
 */
function textOf(root: Node, doc: Document) {
  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const parts: string[] = [];
  for (let n = walker.nextNode(); n; n = walker.nextNode()) parts.push(n.nodeValue ?? "");
  return parts.join(" ");
}

/**
 * The section list comes off the fetched page's own navigator, not off a
 * hand-kept list here.
 *
 * Two shapes carry an anchor and this recognises both without knowing which is
 * which: a `Section`, whose `<h2 id>` sits beside a `<div id="${id}-body">`,
 * and a row that is its own anchor — Idea build's workflow table lists four ids
 * that are `<tr>`s inside one section. Reading the ids out of the rendered
 * `href="#…"` means a direction that changes its sections cannot fall out of
 * step with this file.
 */
function parse(html: string): Doc | null {
  const doc = new DOMParser().parseFromString(html, "text/html");
  const sheet = doc.querySelector("[data-research-sheet]");
  if (!sheet) return null;

  const sections: Doc["sections"] = [];
  const nav = doc.querySelector('nav[aria-label="Research table of contents"]');
  nav?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    const id = (a.getAttribute("href") ?? "").slice(1);
    if (!id) return;
    const anchor = doc.getElementById(id);
    const body = doc.getElementById(`${id}-body`);
    sections.push({
      id,
      label: (a.textContent ?? "").trim(),
      text: flat(
        `${anchor ? textOf(anchor, doc) : ""} ${body ? textOf(body, doc) : ""}`,
      ),
    });
  });

  return { text: flat(textOf(sheet, doc)), sections };
}

async function load(slug: string, view: ViewMode) {
  const key = `${slug}|${view}`;
  if (docs.has(key) || inFlight.has(key)) return;
  inFlight.add(key);
  try {
    const res = await fetch(`/research/${slug}/${view}`);
    if (!res.ok) return;
    const doc = parse(await res.text());
    if (doc) {
      docs.set(key, doc);
      state = { ...state, version: state.version + 1 };
      emit();
    }
  } catch {
    /* Offline, or the route moved. The reading you are on still searches: that
       comes off the DOM and needs nothing from the network. */
  } finally {
    inFlight.delete(key);
  }
}

/**
 * Every reading, in the view the reader is currently in.
 *
 * **Brief is indexed as Brief and Full as Full**, rather than always searching
 * Full. The promise this feature makes is that clicking a result lands on the
 * word: counting Full's sentences while sending someone to a Brief that says
 * two of them would break it on the click, which is the worst place to break.
 */
async function loadAll(view: ViewMode) {
  const pending = directions.filter((d) => !docs.has(`${d.slug}|${view}`));
  if (pending.length === 0) return;
  state = { ...state, loading: true };
  emit();
  await Promise.all(pending.map((d) => load(d.slug, view)));
  state = { ...state, loading: false };
  emit();
}

/* ----------------------------------------------------------------- counting */

const WORDISH = /[\p{L}\p{N}]/u;

/**
 * A match has to start a word, though it need not finish one.
 *
 * Plain substring search is what a browser's own find does, and on this
 * material it is wrong in a way that shows immediately: "CTO" — a job title, and
 * the obvious thing to look up before a call — matched inside *sector* and
 * marked the middle three letters of a word about freight. Nothing in this
 * research mentions a CTO at all, so the honest answer was "not here", and the
 * reader was shown a hit instead.
 *
 * Requiring the *end* of the match to be a boundary too would break the more
 * common case, which is typing. Nobody finishes the word before they expect
 * results: "invoi" has to find *invoice* while the fourth letter is still being
 * typed. Word-start is the rule that serves both.
 */
export function startsWord(hay: string, at: number) {
  return at === 0 || !WORDISH.test(hay[at - 1]);
}

function countIn(hay: string, needle: string) {
  let n = 0;
  for (let at = hay.indexOf(needle); at !== -1; at = hay.indexOf(needle, at + needle.length)) {
    if (startsWord(hay, at)) n += 1;
  }
  return n;
}

/**
 * What one reading has for this query, computed on read rather than stored.
 *
 * Eleven `indexOf` sweeps over a few tens of kilobytes is nothing next to a
 * render, and storing counts per query would mean a cache keyed on every
 * keystroke the reader has ever typed.
 */
export function readingHits(slug: string, view: ViewMode, query: string): ReadingHits {
  const q = flat(query);
  if (q.length < MIN_QUERY) return NO_READING;
  const doc = docs.get(`${slug}|${view}`);
  if (!doc) return NO_READING;
  return {
    total: countIn(doc.text, q),
    sections: doc.sections
      .map((s) => ({ id: s.id, label: s.label, count: countIn(s.text, q) }))
      .filter((s) => s.count > 0),
  };
}

/** Whether the index has anything to say yet, for the reading you are not on. */
export const indexed = (slug: string, view: ViewMode) => docs.has(`${slug}|${view}`);

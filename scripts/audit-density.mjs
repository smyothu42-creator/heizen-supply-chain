/**
 * Text-density audit. Meridian's failure mode is overwhelm, so the amount of
 * text a screen puts in front of Aryan is a number worth watching, not a
 * matter of taste. Counts what is actually visible, not what is in the DOM.
 */
import { chromium } from "playwright";

const BASE = "http://localhost:4311";
const PAGES = [
  "/operations", "/gaps", "/questions", "/compare", "/sources",
  "/research/money/brief", "/research/money/full",
  "/research/call/brief", "/research/call/full",
  "/research/tech/brief", "/research/tech/full",
  "/research/timing/brief", "/research/timing/full",
  "/research/risk/brief", "/research/risk/full",
  "/research/certainty/brief", "/research/certainty/full",
  "/research/stakeholder/brief", "/research/stakeholder/full",
];

const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 1280, height: 900 }, reducedMotion: "reduce" });
const rows = [];
for (const path of PAGES) {
  await p.goto(BASE + path, { waitUntil: "networkidle" });
  await p.waitForTimeout(200);
  rows.push({ path, ...(await p.evaluate(() => {
    // Ancestors, not just the immediate parent. getComputedStyle on a child of
    // a display:none element still reports display:block, so the old check
    // counted every folded section as visible — which made progressive
    // disclosure, the one tool that actually reduces on-screen density, look
    // like it did nothing. checkVisibility walks the chain.
    const vis = (el) => {
      if (el.closest(".sr-only") || el.closest("[hidden]")) return false;
      if (typeof el.checkVisibility === "function") {
        return el.checkVisibility({ visibilityProperty: true, contentVisibilityAuto: true });
      }
      const cs = getComputedStyle(el);
      return cs.display !== "none" && cs.visibility !== "hidden";
    };
    let words = 0, chars = 0;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const t = n.textContent.trim();
      if (!t || !n.parentElement || !vis(n.parentElement)) continue;
      words += t.split(/\s+/).length;
      chars += t.length;
    }
    const interactive = document.querySelectorAll(
      'a[href],button:not([disabled]),input:not([disabled])',
    ).length;
    return {
      words, chars, interactive,
      // How far you must scroll: the honest measure of "how much is here".
      screens: +(document.documentElement.scrollHeight / window.innerHeight).toFixed(1),
    };
  })) });
}
await b.close();

const pad = (s, n) => String(s).padEnd(n);
console.log(pad("page", 30), pad("words", 7), pad("controls", 9), "screens");
for (const r of rows) console.log(pad(r.path, 30), pad(r.words, 7), pad(r.interactive, 9), r.screens);
const tot = rows.reduce((a, r) => a + r.words, 0);
console.log(`\nTOTAL WORDS ACROSS ${PAGES.length} PAGES:`, tot);

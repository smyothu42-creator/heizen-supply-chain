import { chromium } from "playwright";

const BASE = "http://localhost:4311";
const DIRECTIONS = ["money", "call", "certainty", "stakeholder"];
const VIEWPORTS = [
  { name: "375x667 (iPhone SE)", width: 375, height: 667 },
  { name: "390x844 (iPhone 14)", width: 390, height: 844 },
];

// Relative luminance / contrast per WCAG.
function lum([r, g, b]) {
  const f = (c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function contrast(a, b) {
  const [l1, l2] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (l1 + 0.05) / (l2 + 0.05);
}
const parse = (s) => (s.match(/\d+(\.\d+)?/g) || []).slice(0, 3).map(Number);

const browser = await chromium.launch();
const RM = { reducedMotion: "reduce" };
const results = { scroll: [], contrast: [], keyboard: [], focus: [] };

/* ---- 1. Brief must not scroll ---------------------------------------- */
for (const vp of VIEWPORTS) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height }, ...RM });
  for (const d of DIRECTIONS) {
    await page.goto(`${BASE}/research/${d}/brief`, { waitUntil: "networkidle" });
    const m = await page.evaluate(() => ({
      docScroll: document.documentElement.scrollHeight,
      docClient: document.documentElement.clientHeight,
      bodyScroll: document.body.scrollHeight,
      overflowing: [...document.querySelectorAll("*")]
        .filter((el) => el.scrollHeight > el.clientHeight + 1 && getComputedStyle(el).overflowY !== "visible")
        .map((el) => ({
          cls: el.className?.toString?.().slice(0, 45) ?? el.tagName,
          overflowPx: el.scrollHeight - el.clientHeight,
        }))
        .filter((x) => !x.cls.includes("sr-only")),
    }));
    const scrolls = m.docScroll > m.docClient + 1;
    results.scroll.push({
      viewport: vp.name,
      direction: d,
      scrolls,
      doc: `${m.docScroll}/${m.docClient}`,
      clipped: m.overflowing,
    });
  }
  await page.close();
}

/* ---- 2. Contrast of text against its background ---------------------- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, ...RM });
  for (const theme of ["light", "dark"]) {
    for (const d of DIRECTIONS) {
      for (const view of ["brief", "full"]) {
        await page.goto(`${BASE}/research/${d}/${view}`, { waitUntil: "networkidle" });
        await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
        await page.waitForTimeout(250);
        const bad = await page.evaluate(() => {
          const out = [];
          const els = [...document.querySelectorAll("p,span,a,h1,h2,h3,li,td,th,button,div,dd,dt,blockquote")];
          for (const el of els) {
            const text = [...el.childNodes].filter((n) => n.nodeType === 3).map((n) => n.textContent.trim()).join("");
            if (!text) continue;
            const cs = getComputedStyle(el);
            if (cs.visibility === "hidden" || cs.display === "none" || Number(cs.opacity) < 0.9) continue;
            let bgEl = el, bg = "rgba(0, 0, 0, 0)";
            while (bgEl) {
              const c = getComputedStyle(bgEl).backgroundColor;
              if (c && !c.startsWith("rgba(0, 0, 0, 0)")) { bg = c; break; }
              bgEl = bgEl.parentElement;
            }
            const size = parseFloat(cs.fontSize);
            const weight = Number(cs.fontWeight) || 400;
            const large = size >= 24 || (size >= 18.66 && weight >= 700);
            out.push({ fg: cs.color, bg, size, large, text: text.slice(0, 40) });
          }
          return out;
        });
        for (const s of bad) {
          const ratio = contrast(parse(s.fg), parse(s.bg));
          const need = s.large ? 3 : 4.5;
          if (ratio < need) {
            results.contrast.push({
              theme, page: `${d}/${view}`, ratio: ratio.toFixed(2), need,
              size: s.size, text: s.text, fg: s.fg, bg: s.bg,
            });
          }
        }
      }
    }
  }
  await page.close();
}

/* ---- 3. Keyboard: tab reaches everything, panel opens & Escape closes -- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, ...RM });
  for (const d of DIRECTIONS) {
    await page.goto(`${BASE}/research/${d}/full`, { waitUntil: "networkidle" });
    const interactive = await page.evaluate(
      () => document.querySelectorAll('a[href],button:not([disabled]),[tabindex]:not([tabindex="-1"])').length,
    );
    let reached = 0, seen = new Set();
    for (let i = 0; i < interactive + 8; i++) {
      await page.keyboard.press("Tab");
      const id = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        return JSON.stringify({
          tag: el.tagName,
          txt: (el.textContent || "").trim().slice(0, 25),
          outline: cs.outlineWidth,
          i: [...document.querySelectorAll("*")].indexOf(el),
        });
      });
      if (id && !seen.has(id)) { seen.add(id); reached++; }
    }
    // Panel round trip
    const btn = page.locator('button:has-text("Open detail")').first();
    let panel = "no trigger";
    if (await btn.count()) {
      await btn.focus();
      await page.keyboard.press("Enter");
      await page.waitForTimeout(120);
      const opened = await page.locator('[role="dialog"]').count();
      const focusInPanel = await page.evaluate(
        () => !!document.activeElement?.closest?.('[role="dialog"]'),
      );
      await page.keyboard.press("Escape");
      await page.waitForTimeout(120);
      const closed = (await page.locator('[role="dialog"]').count()) === 0;
      const focusReturned = await page.evaluate(
        () => document.activeElement?.textContent?.trim() === "Open detail",
      );
      panel = `open=${opened > 0} focusMovedIn=${focusInPanel} escClosed=${closed} focusReturned=${focusReturned}`;
    }
    results.keyboard.push({ direction: d, interactive, tabReached: reached, panel });
  }

  // Focus ring visible?
  await page.goto(`${BASE}/research/money/full`, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  results.focus.push(
    await page.evaluate(() => {
      const cs = getComputedStyle(document.activeElement);
      return { outlineWidth: cs.outlineWidth, outlineColor: cs.outlineColor, offset: cs.outlineOffset };
    }),
  );
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

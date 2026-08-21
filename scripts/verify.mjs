/**
 * Headless checks for the constraints that are easy to claim and easy to break.
 *
 * Run a production build first:
 *   pnpm build && pnpm start -p 4311
 *   node scripts/verify.mjs
 *
 * Every context emulates prefers-reduced-motion. Without it, reading a computed
 * colour immediately after a theme switch returns the mid-transition value and
 * every element carrying transition-colors reports a false contrast failure.
 */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

/* Every mode is contrast-checked, and the list comes out of the stylesheet
   rather than being typed here. A mode is a `[data-theme="x"]` block in
   `globals.css`, so a mode added there is checked whether or not anyone
   remembered this file. The failure that matters is a mode nobody can see being
   wrong, not one nobody can pick.

   Brand needs no entry of its own: its block carries `[data-theme="heizen"]`
   alongside `:root`, so the regex finds it and setting the attribute paints
   exactly what no attribute paints. */
const THEMES = [
  ...new Set(
    [...readFileSync("src/app/globals.css", "utf8").matchAll(/\[data-theme="([\w-]+)"\]/g)].map(
      (m) => m[1],
    ),
  ),
].filter((t, i, all) => all.indexOf(t) === i);

const BASE = "http://localhost:4311";
const RM = { reducedMotion: "reduce" };

/* The eleven live direction slugs, from `src/lib/directions.ts`. Adding a
   direction means adding it here, or its two views are never looked at.

   It used to also list `all`, `about` and `risk`. Those slugs were re-cut out
   of `directions.ts` and their routes now render an empty shell, so the checks
   below were measuring three pages nobody can reach. */
const DIRECTIONS = [
  "company", "context", "initiatives", "leaks", "tech", "vendors",
  "money", "spend", "build", "solved", "stakeholder",
];

/**
 * **Research Brief is no longer a fixed screen, so nothing asserts that here.**
 *
 * Brief was one viewport with no scrollbar, and this list drove the check that
 * held the line: content that overran had to clip visibly rather than be
 * absorbed. Brief now takes Full's layout — navigator, sheet, one section — and
 * scrolls like any other document, so the assertion would fail on every route
 * for the reason the design intends.
 *
 * What replaced the guarantee is editorial rather than structural: a Brief is
 * short because it is written short, one section and one paragraph. That is the
 * weaker promise and the honest one, and it is not a thing a script can measure.
 * The contrast, overflow and keyboard checks below still cover both views.
 */
const BRIEFS = [];

/** Everything that renders, for contrast and keyboard. */
const PAGES = [
  "/",
  // The workspace: the level above a project. Checked here for the same reason
  // every surface is — these three carry new pairings (a danger panel, a
  // read-only field, a filled destructive button) that nothing else uses.
  "/projects",
  "/team",
  "/settings",
  "/build",
  "/research/intro",
  "/research/discovery",
  "/operations",
  "/gaps",
  "/questions",
  "/compare",
  "/sources",
  ...DIRECTIONS.flatMap((d) => [`/research/${d}/brief`, `/research/${d}/full`]),
];

/**
 * How the detail panel is opened on each surface. Gap rows collapsed to one
 * line no longer carry their own panel button, so those pages expand the row
 * first — which is the real user path anyway.
 */
const PANEL_TRIGGERS = {
  /* The three recommendation cards each carry their own panel control, so no
     expand step: the button is on the collapsed card. */
  "/build": { click: 'button:has-text("Evidence and what it takes")' },
  "/operations": { click: "[data-node] button" },
  "/sources": { click: "ul button" },
  "/gaps": { expand: "li > div > button", click: 'button:has-text("Open in panel")' },
  "/research/certainty/full": { click: "ul li button" },
  "/research/money/full": { expand: "li > button", click: 'button:has-text("Open in panel")' },
  "/research/call/full": { expand: "li > button", click: 'button:has-text("Open in panel")' },
  "/research/stakeholder/full": {
    expand: "li > button",
    click: 'button:has-text("Open in panel")',
  },
};

/* The two phones are the constraint Brief was designed against. The last two
   are the `roomy` variant — from 1024×780 Brief takes Full's frame, padding
   and tile size, and that is a second layout with its own way of not fitting.
   1024×780 is the boundary itself: one pixel shorter falls back to the tight
   rhythm, so this row is what catches the roomy layout being made taller. */
const VIEWPORTS = [
  { name: "375x667", width: 375, height: 667 },
  { name: "390x844", width: 390, height: 844 },
  { name: "1024x780 roomy", width: 1024, height: 780 },
  { name: "1440x900 roomy", width: 1440, height: 900 },
];

/* ---- WCAG contrast --------------------------------------------------- */
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
const results = { scroll: [], contrast: [], keyboard: [], focus: [] };

/* ---- 1. Research Brief must not scroll or clip ------------------------ */
for (const vp of VIEWPORTS) {
  const page = await browser.newPage({
    viewport: { width: vp.width, height: vp.height },
    ...RM,
  });
  /* Every theme, not just the default. A theme here carries tracking, gutter
     and corner language as well as colour, so a fit assertion measured in one
     theme says nothing about the others.

     `BRIEFS` is empty today — Brief takes Full's scrolling layout now — so this
     loop currently runs zero times. It is written theme-first anyway so that
     repopulating `BRIEFS` restores a check that covers every theme rather than
     one that quietly covers the default alone. */
  for (const theme of THEMES) {
    for (const path of BRIEFS) {
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
      // The attribute changes tracking and padding, so the layout has to be
      // re-read after it lands rather than measured from the default paint.
      await page.waitForTimeout(120);
      const m = await page.evaluate(() => ({
        docScroll: document.documentElement.scrollHeight,
        docClient: document.documentElement.clientHeight,
        overflowing: [...document.querySelectorAll("*")]
          .filter(
            (el) =>
              el.scrollHeight > el.clientHeight + 1 &&
              getComputedStyle(el).overflowY !== "visible",
          )
          .map((el) => ({
            cls: el.className?.toString?.().slice(0, 45) ?? el.tagName,
            overflowPx: el.scrollHeight - el.clientHeight,
          }))
          .filter((x) => !x.cls.includes("sr-only")),
      }));
      results.scroll.push({
        viewport: vp.name,
        theme,
        path,
        scrolls: m.docScroll > m.docClient + 1,
        clipped: m.overflowing,
      });
    }
  }
  await page.close();
}

/* ---- 2. Text contrast, light and dark, every page --------------------- */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, ...RM });
  for (const theme of THEMES) {
    for (const path of PAGES) {
      await page.goto(BASE + path, { waitUntil: "networkidle" });
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
      // Open the project menu so its rows are sampled too. It is a popover
      // inside the masthead, so it inherits chrome colours onto a page-coloured
      // card — the exact mistake that made every project name white on white,
      // and one this pass was blind to while the menu stayed shut.
      const projectTrigger = page.locator('button[aria-haspopup="menu"]').first();
      if (await projectTrigger.count()) await projectTrigger.click();
      await page.waitForTimeout(250);
      const samples = await page.evaluate(() => {
        const out = [];
        const els = [
          ...document.querySelectorAll(
            "p,span,a,h1,h2,h3,li,td,th,button,div,dd,dt,blockquote,label,legend,caption",
          ),
        ];
        for (const el of els) {
          const text = [...el.childNodes]
            .filter((n) => n.nodeType === 3)
            .map((n) => n.textContent.trim())
            .join("");
          if (!text) continue;
          const cs = getComputedStyle(el);
          if (cs.visibility === "hidden" || cs.display === "none") continue;
          if (Number(cs.opacity) < 0.9) continue;
          if (el.closest("[disabled]") || el.hasAttribute("disabled")) continue;
          let bgEl = el;
          let bg = "rgba(0, 0, 0, 0)";
          while (bgEl) {
            const c = getComputedStyle(bgEl).backgroundColor;
            if (c && !c.startsWith("rgba(0, 0, 0, 0)")) {
              bg = c;
              break;
            }
            bgEl = bgEl.parentElement;
          }
          const size = parseFloat(cs.fontSize);
          const weight = Number(cs.fontWeight) || 400;
          out.push({
            fg: cs.color,
            bg,
            size,
            large: size >= 24 || (size >= 18.66 && weight >= 700),
            text: text.slice(0, 40),
          });
        }
        return out;
      });
      for (const s of samples) {
        const ratio = contrast(parse(s.fg), parse(s.bg));
        const need = s.large ? 3 : 4.5;
        if (ratio < need) {
          results.contrast.push({
            theme,
            path,
            ratio: ratio.toFixed(2),
            need,
            size: s.size,
            text: s.text,
            fg: s.fg,
            bg: s.bg,
          });
        }
      }
    }
  }
  await page.close();
}

/* ---- 3. Keyboard: reach everything, panel round-trip ------------------ */
{
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 }, ...RM });
  for (const path of PAGES) {
    await page.goto(BASE + path, { waitUntil: "networkidle" });
    // Only count what is genuinely focusable. Content inside a collapsed
    // section is [hidden] and must not be in the tab order.
    //
    // `el.tabIndex !== -1` is the third filter and it is not the same as the
    // selector's `:not([tabindex="-1"])`: a `<button>` matches on its tag
    // whatever its tabindex says. A roving-focus group — Radix Tabs on Sources
    // — parks -1 on every trigger but the current one and takes the single tab
    // stop itself, which is the correct ARIA pattern and which this check read
    // as two unreachable controls. Reading the property rather than the
    // attribute counts what Tab can actually land on.
    const interactive = await page.evaluate(
      () =>
        [
          ...document.querySelectorAll(
            'a[href],button:not([disabled]),input:not([disabled]),[tabindex]:not([tabindex="-1"])',
          ),
        ].filter((el) => !el.closest("[hidden]") && el.offsetParent !== null && el.tabIndex !== -1)
          .length,
    );
    const seen = new Set();
    for (let i = 0; i < interactive + 8; i++) {
      await page.keyboard.press("Tab");
      const id = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        return JSON.stringify({
          tag: el.tagName,
          txt: (el.textContent || "").trim().slice(0, 25),
          i: [...document.querySelectorAll("*")].indexOf(el),
        });
      });
      if (id) seen.add(id);
    }

    let panel = null;
    const trigger = PANEL_TRIGGERS[path];
    if (trigger) {
      /* Research Full now opens with every section folded, so the row this
         check wants to click is inside a `[hidden]` body and Playwright waits
         for it forever. Press "Open all" first where there is one, rather than
         naming a section: the control is on every Full sheet and it keeps
         working whichever way the default goes next. */
      const openAll = page.getByRole("button", { name: "Open all sections" });
      if (await openAll.count()) {
        await openAll.first().click();
        await page.waitForTimeout(120);
      }
      if (trigger.expand) {
        const row = page.locator(trigger.expand).first();
        if (await row.count()) await row.click();
        await page.waitForTimeout(120);
      }
      const btn = page.locator(trigger.click).first();
      if (await btn.count()) {
        const label = (await btn.textContent())?.trim();
        await btn.focus();
        await page.keyboard.press("Enter");
        await page.waitForTimeout(150);
        const opened = (await page.locator('[role="dialog"]').count()) > 0;
        const focusIn = await page.evaluate(
          () => !!document.activeElement?.closest?.('[role="dialog"]'),
        );
        await page.keyboard.press("Escape");
        await page.waitForTimeout(150);
        const closed = (await page.locator('[role="dialog"]').count()) === 0;
        const returned = await page.evaluate(
          (l) => document.activeElement?.textContent?.trim() === l,
          label,
        );
        panel = { opened, focusIn, closed, returned };
      } else {
        panel = "no trigger found";
      }
    }

    results.keyboard.push({ path, interactive, tabReached: seen.size, panel });
  }

  await page.goto(`${BASE}/gaps`, { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  // Settle before reading: outline-color is transitioned, and sampling
  // immediately returns the starting value rather than the applied ring.
  await page.waitForTimeout(300);
  results.focus.push(
    await page.evaluate(() => {
      const cs = getComputedStyle(document.activeElement);
      return {
        outlineWidth: cs.outlineWidth,
        outlineColor: cs.outlineColor,
        offset: cs.outlineOffset,
      };
    }),
  );
  await page.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 2));

/* ---- Verdict -----------------------------------------------------------
   This used to print its findings and exit 0 regardless, which meant a
   contrast regression scrolled past in the output and the build stayed green.
   A check that cannot fail is documentation, not a check. */

const failures = [];

for (const s of results.scroll) {
  if (s.scrolls) failures.push(`${s.path} scrolls at ${s.viewport} in ${s.theme}`);
  for (const c of s.clipped) {
    // `.cls` and `.overflowPx`, not `.text` — the first version of this line
    // printed "[object Object]", which told you a Brief clipped and nothing
    // about where or by how much.
    failures.push(
      `${s.path} clips by ${c.overflowPx}px at ${s.viewport} in ${s.theme} — .${c.cls}`,
    );
  }
}

for (const c of results.contrast) {
  failures.push(
    `${c.theme} ${c.path}: "${c.text}" is ${c.ratio}:1 at ${c.size}px, needs ${c.need}`,
  );
}

for (const k of results.keyboard) {
  if (k.tabReached < k.interactive) {
    failures.push(`${k.path}: Tab reaches ${k.tabReached} of ${k.interactive} controls`);
  }
  if (k.panel) {
    for (const [step, ok] of Object.entries(k.panel)) {
      if (!ok) failures.push(`${k.path}: detail panel failed to ${step}`);
    }
  }
}

for (const f of results.focus) {
  if (parseFloat(f.outlineWidth) < 2) {
    failures.push(`focus ring is ${f.outlineWidth}, needs 2px`);
  }
}

if (failures.length > 0) {
  console.error(`\n${failures.length} failure${failures.length === 1 ? "" : "s"}:`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  process.exit(1);
}

console.error("\nAll UI checks passed.");

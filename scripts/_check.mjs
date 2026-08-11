import { chromium } from "playwright";
const b = await chromium.launch();
const p = await b.newPage({ viewport: { width: 375, height: 667 }, reducedMotion: "reduce" });
for (const path of ["/projects","/team","/settings"]) {
  await p.goto("http://localhost:4311"+path, { waitUntil: "networkidle" });
  const out = await p.evaluate(() => {
    const bad = [];
    document.querySelectorAll("body *").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > document.documentElement.clientWidth + 1)
        bad.push({ tag: el.tagName, cls: String(el.className).slice(0, 90), right: Math.round(r.right), w: Math.round(r.width) });
    });
    return { scrollW: document.documentElement.scrollWidth, clientW: document.documentElement.clientWidth, bad: bad.slice(0, 12) };
  });
  console.log(path, JSON.stringify(out, null, 1));
}
await b.close();

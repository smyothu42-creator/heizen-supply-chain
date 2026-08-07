import { chromium } from "playwright";
const b = await chromium.launch();
const out = [];
for (const vp of [{w:375,h:667,n:"375x667"},{w:390,h:844,n:"390x844"}]) {
  const p = await b.newPage({ viewport: { width: vp.w, height: vp.h }, reducedMotion: "reduce" });
  await p.goto("http://localhost:4311/research/stakeholder/brief", { waitUntil: "networkidle" });
  const chips = await p.locator('[aria-label="Select who you are meeting"] button').all();
  for (let i = 0; i < chips.length; i++) {
    await chips[i].click();
    await p.waitForTimeout(120);
    const m = await p.evaluate(() => ({
      label: document.querySelector('[aria-pressed="true"]')?.textContent?.trim(),
      pageScrolls: document.documentElement.scrollHeight > document.documentElement.clientHeight + 1,
      clipped: [...document.querySelectorAll("*")]
        .filter((el) => el.scrollHeight > el.clientHeight + 1 && getComputedStyle(el).overflowY !== "visible")
        .map((el) => ({ cls: (el.className?.toString?.() ?? "").slice(0,40), over: el.scrollHeight - el.clientHeight }))
        .filter((x) => !x.cls.includes("sr-only")),
    }));
    out.push({ viewport: vp.n, ...m });
  }
  await p.close();
}
await b.close();
out.forEach(o => console.log(o.viewport, "|", (o.label||"").padEnd(16), "| scrolls:", o.pageScrolls, "| clipped:", JSON.stringify(o.clipped)));

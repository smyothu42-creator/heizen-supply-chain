import { chromium } from "playwright";
const b = await chromium.launch();
const out = [];
/* Two phones and the roomy layout — Brief takes Full's frame from 1024×780.
   This direction's height used to vary by which person was selected, which is
   why it has a script of its own. The picker is gone and Brief opens on the
   Head of Procurement, so there is one screen per viewport now; the file stays
   because his is not the tallest of the four and a picker restored anywhere
   brings the variation back with it. */
for (const vp of [{w:375,h:667,n:"375x667"},{w:390,h:844,n:"390x844"},{w:1024,h:780,n:"1024x780 roomy"},{w:1440,h:900,n:"1440x900 roomy"}]) {
  const p = await b.newPage({ viewport: { width: vp.w, height: vp.h }, reducedMotion: "reduce" });
  await p.goto("http://localhost:4311/research/stakeholder/brief", { waitUntil: "networkidle" });
  /* An empty picker used to mean an empty loop, which reports green without
     having looked at anything. One pass per viewport, unconditionally. */
  {
    const m = await p.evaluate(() => ({
      label: document.querySelector("h1 + * p, main p")?.textContent?.trim().slice(0, 16),
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

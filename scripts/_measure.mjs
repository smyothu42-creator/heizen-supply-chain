import { chromium } from "playwright";
const b = await chromium.launch();
for (const w of [1360, 1400, 1440, 1480, 1520]) {
  const p = await b.newPage({ viewport: { width: w, height: 900 } });
  await p.goto("http://localhost:4311/research/intro", { waitUntil: "networkidle" });
  const r = await p.evaluate(() => {
    const header = document.querySelector("header");
    const nav = header?.querySelector("nav");
    const out = [];
    document.querySelectorAll("header *").forEach((el) => {
      if (el.scrollWidth > el.clientWidth + 1) out.push(`${el.tagName}.${el.className}`.slice(0, 90));
    });
    const tabs = [...(nav?.querySelectorAll("a") ?? [])].map((a) => [a.textContent.trim(), Math.round(a.getBoundingClientRect().width)]);
    return { navW: nav?.scrollWidth, navClient: nav?.clientWidth, tabs, overflow: out, headerW: header?.getBoundingClientRect().width };
  });
  console.log(w, JSON.stringify(r));
  await p.close();
}
await b.close();

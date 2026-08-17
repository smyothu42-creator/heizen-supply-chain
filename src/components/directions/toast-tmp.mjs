import { chromium } from "playwright";
const b = await chromium.launch();
const dir = "/private/tmp/claude-501/-Users-saimyothu-claude-workspace-meridian/137c59d3-868f-4fa5-b30b-5f156ae84c50/scratchpad";
for (const [name, w, h] of [["wide", 1440, 900], ["phone", 375, 667]]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.goto("http://localhost:4311/questions", { waitUntil: "networkidle" });
  const save = p.locator('button[aria-label="Save for later"]').first();
  await save.click();
  await p.waitForTimeout(400);
  await p.screenshot({ path: `${dir}/toast-${name}.png` });
  // second toast: save another
  await p.locator('button[aria-label="Save for later"]').first().click();
  await p.waitForTimeout(300);
  await p.screenshot({ path: `${dir}/toast-${name}-2.png` });
  await p.close();
}
// brief titles
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
for (const d of ["money", "leaks", "timing", "company"]) {
  await p.goto(`http://localhost:4311/research/${d}/brief`, { waitUntil: "networkidle" });
  await p.screenshot({ path: `${dir}/brief-${d}.png` });
}
await b.close();
console.log("ok");

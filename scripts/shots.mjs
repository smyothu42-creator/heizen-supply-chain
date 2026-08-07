import { chromium } from "playwright";
const B = "http://localhost:4311";
const D = ["money", "call", "certainty", "stakeholder"];
const b = await chromium.launch();
for (const theme of ["light", "dark"]) {
  // Brief at phone size, Full at desktop.
  const phone = await b.newPage({ viewport: { width: 375, height: 667 }, reducedMotion: "reduce" });
  const desk = await b.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  for (const d of D) {
    for (const [page, view, tag] of [[phone, "brief", "375"], [desk, "full", "1440"]]) {
      await page.goto(`${B}/research/${d}/${view}`, { waitUntil: "networkidle" });
      await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
      await page.waitForTimeout(300);
      await page.screenshot({
        path: `screenshots/${d}-${view}-${tag}-${theme}.png`,
        fullPage: view === "full",
      });
    }
  }
  await desk.goto(`${B}/`, { waitUntil: "networkidle" });
  await desk.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
  await desk.waitForTimeout(300);
  await desk.screenshot({ path: `screenshots/index-${theme}.png`, fullPage: true });
  await phone.close();
  await desk.close();
}
await b.close();
console.log("done");

/** Writes screenshots/ for review. Needs `pnpm build && pnpm start -p 4311`. */
import { chromium } from "playwright";

const B = "http://localhost:4311";
const D = ["money", "call", "certainty", "stakeholder"];
const SURFACES = ["canvas", "gaps", "questions", "compare", "sources"];

const b = await chromium.launch();
for (const theme of ["light", "dark"]) {
  const phone = await b.newPage({ viewport: { width: 375, height: 667 }, reducedMotion: "reduce" });
  const desk = await b.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  const shoot = async (page, path, file, full) => {
    await page.goto(B + path, { waitUntil: "networkidle" });
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `screenshots/${file}-${theme}.png`, fullPage: full });
  };

  for (const d of D) {
    await shoot(phone, `/research/${d}/brief`, `${d}-brief-375`, false);
    await shoot(desk, `/research/${d}/full`, `${d}-full-1440`, true);
  }
  for (const s of SURFACES) {
    await shoot(desk, `/${s}`, `${s}-1440`, true);
    await shoot(phone, `/${s}`, `${s}-375`, true);
  }
  await shoot(desk, "/", "index", true);

  await phone.close();
  await desk.close();
}
await b.close();
console.log("done");

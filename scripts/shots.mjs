/** Writes screenshots/ for review. Needs `pnpm build && pnpm start -p 4311`. */
import { chromium } from "playwright";
import { readFileSync } from "node:fs";

const B = "http://localhost:4311";
/* The modes, read out of the stylesheet rather than typed here, so a mode
   added to `globals.css` gets screenshots without anyone remembering to. Brand
   arrives as `heizen`, which its block carries alongside `:root`. */
const THEMES = [
  ...[...readFileSync("src/app/globals.css", "utf8").matchAll(/\[data-theme="([\w-]+)"\]/g)].map(
    (m) => m[1],
  ),
].filter((t, i, all) => all.indexOf(t) === i);
const D = ["all", "about", "leaks", "build", "tech", "solved", "money", "risk", "stakeholder"];
const SURFACES = ["build", "operations", "gaps", "questions", "compare", "sources"];

const b = await chromium.launch();
for (const theme of THEMES) {
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

  // The graph states are not reachable by URL, so they have to be driven.
  // They were previously captured by hand and went stale silently — a screenshot
  // showing a process that has since moved branches is worse than none.
  const graphShot = async (file, drive) => {
    await desk.goto(B + "/operations", { waitUntil: "networkidle" });
    await desk.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await drive(desk);
    await desk.waitForTimeout(400);
    await desk.screenshot({ path: `screenshots/${file}-${theme}.png` });
  };
  await graphShot("operations-l0", async () => {});
  // `Processes`, not `All processes` — the crumb was renamed when the level
  // path was rewritten in plain language. This threw rather than shooting a
  // stale frame, which is the behaviour to keep.
  await graphShot("operations-l1", (p) => p.getByRole("button", { name: "Processes" }).click());
  // No Entities shot: that view was removed from Operations, and the switch
  // went with it. `EntityList.tsx` is still in the tree unimported, so if it
  // comes back, so does this line.

  await phone.close();
  await desk.close();
}
await b.close();
console.log("done");

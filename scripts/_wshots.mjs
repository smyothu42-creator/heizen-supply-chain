import { chromium } from "playwright";
const B = "http://localhost:4311";
const OUT = "/private/tmp/claude-501/-Users-saimyothu-claude-workspace-meridian/a5831828-1ada-44c1-9679-cbc459a65c35/scratchpad";
const b = await chromium.launch();

for (const theme of ["light", "dark"]) {
  const desk = await b.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
  const phone = await b.newPage({ viewport: { width: 375, height: 667 }, reducedMotion: "reduce" });
  const shoot = async (page, path, file, full = true) => {
    await page.goto(B + path, { waitUntil: "networkidle" });
    await page.evaluate((t) => document.documentElement.setAttribute("data-theme", t), theme);
    await page.waitForTimeout(350);
    await page.screenshot({ path: `${OUT}/${file}-${theme}.png`, fullPage: full });
  };
  for (const p of ["projects", "team", "settings"]) {
    await shoot(desk, `/${p}`, `${p}-1440`);
    await shoot(phone, `/${p}`, `${p}-375`, false);
  }
  await shoot(desk, "/gaps", "gaps-1440");
  await shoot(desk, "/operations", "ops-1440", false);
}

// Dialogs, light only.
const p = await b.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: "reduce" });
await p.goto(`${B}/projects`, { waitUntil: "networkidle" });
await p.getByRole("button", { name: "New project" }).click();
await p.waitForTimeout(300);
await p.screenshot({ path: `${OUT}/dialog-create.png` });
await p.keyboard.press("Escape");

await p.goto(`${B}/team`, { waitUntil: "networkidle" });
await p.getByRole("button", { name: "Invite someone" }).click();
await p.waitForTimeout(300);
await p.screenshot({ path: `${OUT}/dialog-invite.png` });
await p.keyboard.press("Escape");
await p.getByRole("button", { name: /projects$/ }).first().click();
await p.waitForTimeout(300);
await p.screenshot({ path: `${OUT}/dialog-projects.png` });

// Phone: drawer open.
const ph = await b.newPage({ viewport: { width: 375, height: 667 }, reducedMotion: "reduce" });
await ph.goto(`${B}/gaps`, { waitUntil: "networkidle" });
await ph.getByRole("button", { name: /workspace panel/ }).click();
await ph.waitForTimeout(300);
await ph.screenshot({ path: `${OUT}/drawer-375.png` });

await b.close();
console.log("done");

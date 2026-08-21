/**
 * The modes, and what a mode is allowed to be.
 *
 * **There is one theme in this product and it is Heizen's.** What this file
 * lists is three modes of it: Brand, the default, plus Dark and Contrast.
 * Daylight and Studio are gone, a product with its own identity manual does
 * not also ship two palettes that are nobody's. Broadsheet is gone as well: it
 * was the one mode that changed the register rather than the ground, and a
 * register is a second shape to keep true on every surface rather than a
 * setting.
 *
 * **A mode here is mostly a colourway.** It may carry more than colour, and
 * Contrast does: it moves the legibility floor and trades shadows for rules.
 * But a mode that reaches past the ground and the floor into corners, tracking
 * and gutters is a fork wearing a menu entry, which is what Broadsheet turned
 * out to be.
 *
 * **What a mode may never change** is anything a reading depends on. Colour
 * still encodes health and fill still encodes evidence (§4); the accent still
 * means "somewhere to go" and is still spent once per screen; the chrome is
 * still one strip that is navigation and everything under it is still document;
 * and all three carry the brand's own faces, because a voice is not a property
 * of the ground it is set on. A mode that moved any of those would not be a
 * mode, it would be a fork.
 *
 * Every entry needs a matching `[data-theme="<id>"]` block in `globals.css`.
 * `heizen` is the one that is also `:root` — the block carries both selectors,
 * so Brand is what paints with no attribute set *and* is nameable when the
 * picker sets one. `pnpm check:ui` reads the ids straight out of that
 * stylesheet rather than out of this file, so a mode added in CSS is
 * contrast-checked whether or not it is listed here — the failure that matters
 * is a mode nobody can see being wrong, not one nobody can pick.
 */
export type ThemeId = "heizen" | "dark" | "contrast";

export type Theme = {
  id: ThemeId;
  /** What the picker calls it. */
  name: string;
  /** One line saying what it is for. The picker shows it under the name. */
  note: string;
};

/**
 * Order is the order in the menu, and it is not alphabetical: the default
 * first, then the two that change the ground under it.
 *
 * **The names do not repeat "Heizen".** The masthead already carries the
 * wordmark, the picker's own heading says whose theme these are modes of, and
 * "Heizen Contrast" on a 640px strip is a control that no longer fits beside
 * the project switcher. What is being chosen here is the mode.
 */
export const THEMES: readonly Theme[] = [
  {
    id: "heizen",
    name: "Brand",
    note: "The default. The identity manual applied: cream and graphite, dusty teal, one face throughout.",
  },
  {
    id: "dark",
    name: "Dark",
    note: "The same identity on graphite. Cream ink, dusty sky blue for anything you can open.",
  },
  {
    id: "contrast",
    name: "Contrast",
    note: "For a projector or a screen at an angle. Black ink, real rules instead of shadows, every colour deepened.",
  },
];

export const DEFAULT_THEME: ThemeId = "heizen";

export function isThemeId(value: string | null | undefined): value is ThemeId {
  return THEMES.some((t) => t.id === value);
}

export function themeById(id: string | null | undefined): Theme {
  return THEMES.find((t) => t.id === id) ?? THEMES[0];
}

/**
 * The one key the mode persists under. Named here rather than typed out in
 * `ThemePicker` and again in the restore script in `layout.tsx`: those two are
 * the pair that drifts, and a restore script reading a key nothing writes fails
 * silently by simply never restoring anything.
 */
export const THEME_STORAGE_KEY = "meridian-theme";

import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * `cn` — the shadcn/ui class helper, taught this product's type scale.
 *
 * It was a plain `join(" ")`, and CLAUDE.md records the same bug four separate
 * times because of it: two conflicting utilities on one element are settled by
 * their order in the *stylesheet*, not by the order they are written, so
 * `` `${FIELD} w-12` `` silently kept `w-full` and a base `max-w-full` beat a
 * caller's `max-w-[calc(...)]`. tailwind-merge settles it by the order they are
 * written, which is what every call site already assumed.
 *
 * **The extension is not optional.** tailwind-merge classifies `text-*` as a
 * font size only for names it knows (`sm`, `lg`, `2xl`, …) and treats the rest
 * as a colour. Our scale is `micro / small / base / lead / h3 / h2 / h1 /
 * display`, so without this every `"text-small text-muted-foreground"` in the
 * product would collapse to the colour alone and the size would vanish.
 * Add a size to `@theme` and it has to be added here in the same change.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: ["micro", "small", "lead", "h3", "h2", "h1", "display"] }],
      shadow: [{ shadow: ["card", "raised"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

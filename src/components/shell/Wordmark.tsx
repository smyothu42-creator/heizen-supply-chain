import { cn } from "@/lib/cn";

/**
 * The Heizen lockup: the mark, the name, and — from `lg` — what the tool is.
 *
 * The mark is the real asset, `heizen-mark.svg` from heizen.work, inlined
 * rather than referenced through `<img>` for one reason: `fill` is
 * `currentColor`, so the same component is white on the indigo masthead and
 * ink on the ivory index page. An `<img>` cannot inherit a colour, and the
 * masthead/page split is exactly the trap `ThemeToggle` already carries a
 * `tone` prop for.
 *
 * **The word is set in Inter, not in the licensed face.** Heizen's own lockup
 * pairs the mark with Axiforma, which this repo does not have a licence for —
 * the site ships that combination as a raster (`/images/logo-light.avif`), and
 * a 567px PNG cannot be recoloured by theme or held crisp at a 15px cap. Inter
 * at 600 with the product's own 0.12em eyebrow tracking is close at this size.
 * If the licensed lockup arrives as an SVG, it replaces the contents of this
 * component and nothing else moves.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("flex items-center gap-2", className)}>
      <svg
        viewBox="0 0 27 38"
        aria-hidden
        className="h-[1.15rem] w-auto shrink-0"
        fill="currentColor"
      >
        <path d="M7.14355 19.8535L7.18359 19.8135V29.543L7.14355 29.583V29.9854L0 37.1289V7.30371H7.14355V19.8535ZM26.9961 29.5928H19.9961V20.3486H20.001V6.99512L26.9961 0V29.5928ZM18.3242 18.4023L8.90332 27.8232V18.0938L18.3242 8.67285V18.4023Z" />
      </svg>
      {/* The mark and the name, and nothing else. A descriptor line under it
          was tried both inline and stacked; the masthead already says what the
          thing is by having Operations, Research, Gaps, Questions, Compare and
          Sources on it, and the product name is in the page title. The name
          goes at 375 and the mark stays — the old text wordmark hid entirely
          there, because it was costing the tabs 70px of a 375px line. */}
      <span className="hidden text-base font-semibold sm:inline">
        Heizen
      </span>
    </span>
  );
}

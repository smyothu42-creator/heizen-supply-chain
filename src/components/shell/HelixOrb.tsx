import { useId } from "react";
import { cn } from "@/lib/cn";

/**
 * Helix, as a face.
 *
 * The assistant's mark was a spark glyph on a filled `--primary` tile. This is
 * the mascot from the identity sheet: a pearl sphere with a gradient-rimmed
 * visor and two eyes, in the three states this panel can actually be in.
 *
 * ## The states are the situation, not a decoration
 *
 * - **idle** — open, waiting. Breathes, and blinks every 5.5s.
 * - **listening** — the composer has focus or a draft in it. The eyes narrow to
 *   a capsule. One shape change, nothing else: no colour move, no size move,
 *   nothing added. That is what keeps three states reading as one character in
 *   three moods rather than as three marks.
 * - **thinking** — a reply is streaming. **The visor dissolves entirely** and
 *   the sphere carries a turning swirl instead. The visor is how Helix looks at
 *   you, so when it stops looking at you and starts working, it has no face.
 *   It is the only state with continuous motion.
 *
 * The sheet carries a fourth, *asleep*, a closed lid at 72%. It is not here
 * because nothing in this panel is ever asleep — a state with no situation is a
 * variant pretending to be a decision. Adding it is one branch in `eyes()`.
 *
 * ## This reverses a recorded decision, deliberately
 *
 * CLAUDE.md said the ask pill in the masthead is the one thing in the product
 * that moves, and that a breathing orb on the surface it opens would be two.
 * That was right while the orb was decoration. It is not decoration now: the
 * motion is the only thing on screen that says which of three things the
 * assistant is doing, and the two controls are never visible together anyway —
 * the pill's runner stops the moment the panel opens.
 *
 * ## Level of detail, because this renders at 20px and at 120px
 *
 * Under 56px the specular highlight, the glass sweep and the contact shadow
 * come off and a hairline goes on. At 20px a blurred highlight is three pixels
 * of noise, and a white sphere on a white card with no shadow under it has no
 * edge at all. The rim and the eyes grow to compensate: at true proportions a
 * 4.6-unit rim renders at 0.77px on a 20px mark and simply disappears.
 */
export type HelixState = "idle" | "listening" | "thinking";

const HEAD = { cx: 60, cy: 58, r: 46 };
const VISOR = { x: 29, y: 34, w: 62, h: 48, r: 24 };
const EYE = { dx: 12.5, cy: 58, rx: 6.2, ry: 7.6 };

/* ---------------------------------------------------------------------------
   The rim runs on the product's own tokens, on request.

   It was the identity sheet's palette — magenta, violet, electric blue, cyan —
   which is the reference's and belongs to nothing else on screen. Four hues
   this product does not own, on the one mark that is supposed to say *this
   tool's assistant*, sitting two inches under a slate masthead. It is the
   chrome family now: slate deep, `--accent-soft` through the middle,
   `--masthead-accent` bright. The mascot is coloured out of the band it lives
   under.

   **The three were picked to survive both themes, which most of the palette
   does not.** `--accent` and `--masthead-accent` are both `#5fd6e4` in dark, so
   a ramp using the pair collapses to two stops there and reads as a flat cyan
   line. `--primary` is worse: it inverts to near-white, and a rim whose deep
   end is white on a pearl sphere loses that end entirely. Measured, the three
   below stay distinct in both:

     --masthead-border  #3a5c78  ->  #2f4557   the deep anchor
     --accent-soft      #00a6b8  ->  #4cc5d5   the middle
     --masthead-accent  #63d2e3  ->  #5fd6e4   the bright end

   **The deep anchor is `--masthead-border` and not `--masthead`, which was
   tried first and failed in dark.** The rim is a stroke on the visor's edge, so
   half of it lies over near-black: `--masthead` at `#152736` is four points off
   the visor's own `#080B14` and the left third of the ring simply disappeared
   into it, leaving a cyan crescent floating on the right. The border token is
   the chrome family's mid slate and it is the only value in that family with
   room on both sides — dark enough to anchor against the pearl head, light
   enough to separate from the screen it is drawn on.

   **Written as `var()` in inline `style`, never as a presentation attribute.**
   `stop-color="var(--x)"` is not reliably resolved as an attribute; a `style`
   declaration is. Getting this wrong fails silently to black.

   What is *not* tokenised, and why: the pearl head and the near-black visor are
   the character, not the chrome. A visor that lifted to `--card` in dark would
   be a robot whose screen switches off with the theme, and a head that followed
   `--background` would stop being a pearl sphere and start being a hole in the
   page. They stay fixed and the mark stays the same creature in both themes;
   only what it is lit with follows the product.
   --------------------------------------------------------------------------- */
const RIM = {
  deep: "var(--masthead-border)",
  mid: "var(--accent-soft)",
  bright: "var(--masthead-accent)",
};

const ART = {
  /** The screen. Near-black, never true black, and never a theme token. */
  visor: "#080B14",
  /** The compact mark's silhouette against a white card. Light-theme problem
      only: on a dark card the pearl head has all the edge it needs. */
  edge: "#C3CBDE",
};

/* `HelixGlyph` was here for one revision and is deleted.

   It was the flat mark in `currentColor` — one masked circle, the ground
   showing through the visor — built for the masthead pill on the reasoning that
   the identity sheet puts the cut to a flat reduction at 32px and the pill's
   slot is half that. That reasoning is sound and it was overruled on request:
   the pill carries the mascot in full colour, and so do the other three routes
   into the assistant, because the thing that identifies Helix should look like
   Helix wherever its name is said.

   **The flat mark is still the specification**, on the identity sheet, and it
   is still what a one-colour print, a foil block or a monochrome favicon needs.
   Rebuilding it is this component's geometry plus a mask; it is gone from here
   rather than left unimported, which is the same rule the deleted `.ai-orb` and
   `SparkIcon` follow. */

export function HelixOrb({
  state = "idle",
  px = 28,
  className,
}: {
  state?: HelixState;
  px?: number;
  className?: string;
}) {
  /* `useId` rather than a module counter: gradient ids have to be stable
     between the server render and the client one, and a counter is not. The
     sanitise is because React's ids carry punctuation that `url(#…)` will not
     take. */
  const id = `hx${useId().replace(/[^a-zA-Z0-9]/g, "")}`;
  const detail = px >= 56 ? "full" : "compact";
  const thinking = state === "thinking";

  const rimW = detail === "full" ? 4.6 : 6;
  const er = detail === "full" ? EYE.rx : 7.2;
  const ery = detail === "full" ? EYE.ry : 8.4;

  const L = HEAD.cx - EYE.dx;
  const R = HEAD.cx + EYE.dx;

  const eye = (cx: number) =>
    state === "listening" ? (
      <rect
        key={cx}
        x={cx - (detail === "full" ? 2.5 : 3)}
        y={EYE.cy - (detail === "full" ? 8.5 : 9)}
        width={detail === "full" ? 5 : 6}
        height={detail === "full" ? 17 : 18}
        rx={3}
        fill="#FFFFFF"
      />
    ) : (
      <ellipse key={cx} cx={cx} cy={EYE.cy} rx={er} ry={ery} fill="#FFFFFF" />
    );

  return (
    <svg
      viewBox="0 0 120 120"
      width={px}
      height={px}
      aria-hidden
      focusable="false"
      className={cn("helix-orb block shrink-0", thinking && "helix-thinking", className)}
    >
      <defs>
        <radialGradient id={`${id}s`} cx="0.36" cy="0.28" r="0.86">
          <stop offset="0" stopColor="#FFFFFF" />
          <stop offset="0.42" stopColor="#FBFCFE" />
          <stop offset="0.78" stopColor="#E7EBF3" />
          <stop offset="1" stopColor="#CFD6E5" />
        </radialGradient>

        {/* Slate at the left round to bright cyan at the right. Nearly
            horizontal, because the visor is 62 wide against 48 tall: a
            corner-to-corner gradient spends most of its run on the two long
            edges and lands its bright end in the bottom-right corner instead
            of on the right side.

            The deep stop is held to the first third of the run. Slate against
            the near-black visor is low contrast on the rim's inner half, so a
            long dark arc makes the left side of the ring read thinner than the
            right; a short one reads as an anchor. */}
        <linearGradient id={`${id}r`} x1="0" y1="0.28" x2="1" y2="0.72">
          <stop offset="0" style={{ stopColor: RIM.deep }} />
          <stop offset="0.5" style={{ stopColor: RIM.mid }} />
          <stop offset="1" style={{ stopColor: RIM.bright }} />
        </linearGradient>
        {/* The second stroke is now shading rather than a hue.

            It existed because one linear gradient cannot put a *third* hue
            along the bottom of a closed loop, and the sheet's rim had three.
            This one is a single ramp, so that reason has expired — but the run
            is left to right, which makes the top and bottom edges identical
            and flattens the ring. A deepening at the base is what gives it an
            underside. `--masthead` is dark in both themes, so it shades rather
            than inverting into a highlight. */}
        <linearGradient id={`${id}r2`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.5" style={{ stopColor: RIM.deep }} stopOpacity="0" />
          <stop offset="1" style={{ stopColor: RIM.deep }} stopOpacity="0.38" />
        </linearGradient>

        {/* The thinking swirl takes the same three, bright end leading. It is
            the one thing on the mark that is pure colour with no shape holding
            it, so it is where the product's cyan is most recognisable. */}
        <linearGradient id={`${id}w`} x1="0" y1="0" x2="1" y2="0.4">
          <stop offset="0" style={{ stopColor: RIM.bright }} stopOpacity="0" />
          <stop offset="0.22" style={{ stopColor: RIM.bright }} />
          <stop offset="0.5" style={{ stopColor: RIM.mid }} />
          <stop offset="0.78" style={{ stopColor: RIM.deep }} stopOpacity="0.9" />
          <stop offset="1" style={{ stopColor: RIM.deep }} stopOpacity="0" />
        </linearGradient>

        {detail === "full" && (
          <linearGradient id={`${id}g`} x1="0" y1="0" x2="0.75" y2="1">
            <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.2" />
            <stop offset="0.46" stopColor="#FFFFFF" stopOpacity="0.05" />
            <stop offset="0.62" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        )}
        {detail === "full" && (
          <linearGradient id={`${id}b`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0" />
            <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.72" />
          </linearGradient>
        )}

        <filter id={`${id}f1`} x="-90%" y="-90%" width="280%" height="280%">
          <feGaussianBlur stdDeviation="2.1" />
        </filter>
        <filter id={`${id}f2`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.4" />
        </filter>
        <filter id={`${id}f3`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <filter id={`${id}f4`} x="-60%" y="-140%" width="220%" height="380%">
          <feGaussianBlur stdDeviation="4.2" />
        </filter>

        <clipPath id={`${id}c`}>
          <circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} />
        </clipPath>
      </defs>

      {detail === "full" && (
        <ellipse
          cx={HEAD.cx}
          cy={108}
          rx={31}
          ry={5.4}
          fill="#12162A"
          opacity={0.16}
          filter={`url(#${id}f4)`}
        />
      )}

      <g className="helix-head">
        <circle cx={HEAD.cx} cy={HEAD.cy} r={HEAD.r} fill={`url(#${id}s)`} />

        {detail === "full" && (
          <>
            <circle
              cx={HEAD.cx}
              cy={HEAD.cy}
              r={HEAD.r - 0.9}
              fill="none"
              stroke={`url(#${id}b)`}
              strokeWidth="1.7"
            />
            <ellipse
              cx={43}
              cy={30}
              rx={17}
              ry={11}
              fill="#FFFFFF"
              opacity={0.9}
              filter={`url(#${id}f2)`}
              transform="rotate(-24 43 30)"
            />
            <ellipse
              cx={35.5}
              cy={36}
              rx={3.4}
              ry={2.2}
              fill="#FFFFFF"
              opacity={0.95}
              transform="rotate(-24 35.5 36)"
            />
          </>
        )}

        {thinking ? (
          <g clipPath={`url(#${id}c)`}>
            <g className="helix-swirl">
              <ellipse
                cx={HEAD.cx}
                cy={HEAD.cy}
                rx={47}
                ry={13}
                fill={`url(#${id}w)`}
                filter={`url(#${id}f3)`}
                transform={`rotate(-20 ${HEAD.cx} ${HEAD.cy})`}
              />
              {/* The swirl's bright core. `style`, not a `fill` attribute, for
                  the reason the stops carry: a presentation attribute does not
                  resolve `var()` and fails silently to black. */}
              <ellipse
                cx={HEAD.cx - 6}
                cy={HEAD.cy + 2}
                rx={30}
                ry={5}
                style={{ fill: RIM.mid }}
                opacity={0.9}
                filter={`url(#${id}f2)`}
                transform={`rotate(-20 ${HEAD.cx} ${HEAD.cy})`}
              />
            </g>
          </g>
        ) : (
          <g>
            <rect
              x={VISOR.x}
              y={VISOR.y}
              width={VISOR.w}
              height={VISOR.h}
              rx={VISOR.r}
              fill={ART.visor}
            />
            {detail === "full" && (
              <rect
                x={VISOR.x}
                y={VISOR.y}
                width={VISOR.w}
                height={VISOR.h}
                rx={VISOR.r}
                fill={`url(#${id}g)`}
              />
            )}
            {/* The glow is a blurred copy underneath, never a filter on the eye
                itself: a filtered eye loses its edge, and the edge is the only
                crisp thing inside a dark visor. */}
            <g className="helix-eyes">
              {detail === "full" && (
                <g filter={`url(#${id}f1)`} opacity={0.85}>
                  {[L, R].map(eye)}
                </g>
              )}
              {[L, R].map(eye)}
            </g>
            <rect
              x={VISOR.x}
              y={VISOR.y}
              width={VISOR.w}
              height={VISOR.h}
              rx={VISOR.r}
              fill="none"
              stroke={`url(#${id}r)`}
              strokeWidth={rimW}
            />
            <rect
              x={VISOR.x}
              y={VISOR.y}
              width={VISOR.w}
              height={VISOR.h}
              rx={VISOR.r}
              fill="none"
              stroke={`url(#${id}r2)`}
              strokeWidth={rimW}
            />
          </g>
        )}

        {/* The hairline is the compact mark's edge. Without a contact shadow
            and a bounce light under it, a pearl sphere on the white card this
            header sits on has no silhouette at all. */}
        {detail === "compact" && (
          <circle
            cx={HEAD.cx}
            cy={HEAD.cy}
            r={HEAD.r - 0.4}
            fill="none"
            stroke={ART.edge}
            strokeWidth="1.4"
            opacity={0.85}
          />
        )}
      </g>
    </svg>
  );
}

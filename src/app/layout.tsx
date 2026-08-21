import type { Metadata } from "next";
import { Figtree, Geist_Mono } from "next/font/google";
import "./globals.css";

/**
 * One face, because the product has one voice.
 *
 * Every family is loaded here and named nowhere else. What a mode picks is
 * `--font-body-family`, `--font-display-family` and `--font-accent-family` in
 * `globals.css`, which is what keeps "a mode is a stylesheet block" true even
 * once the product carries a typeface. Nothing outside this file names a
 * family.
 *
 * **The serif is gone**, on request. Inria Serif Bold Italic carried
 * `.font-display` and `.accent-heading` — every section heading, every
 * document lead and the band on What to build. All three type roles point at
 * the body face now and the heading voices are separated from it by weight and
 * tracking; see the typography block in `globals.css`.
 *
 * **The download went with it, and that is the half worth stating.** Inter was
 * left loaded for a while after Daylight and Studio were cut, and the note
 * here at the time said what was wrong with that: an unused Google Font is a
 * download every reader pays for so that a token nothing reads can resolve.
 * Deleting the family the moment the last role stopped pointing at it is that
 * lesson applied rather than restated.
 */
/**
 * **Figtree stands in for Axiforma**, which is Heizen's licensed body face and
 * is not on Google Fonts. This repo has used Figtree for exactly this before;
 * keeping the same stand-in means the substitution is one decision recorded
 * once rather than a different guess each time. If the licensed face is ever
 * bought, it replaces this import and nothing else moves.
 */
const geometric = Figtree({
  variable: "--font-geom-family",
  subsets: ["latin"],
});

const mono = Geist_Mono({
  variable: "--font-mono-family",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Heizen Discovery Tool — Research directions",
  description:
    "Four organising principles for the Research tab, built against Suvarna Agro Foods.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geometric.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        {/* Applies the stored mode before first paint so the page never flashes
            the wrong palette. Falls through to Brand, which is `:root`, when
            nothing is stored.

            It has to be a raw inline script and not `next/script`: measured,
            `strategy="beforeInteractive"` only queues the source into
            `__next_s`, so the attribute lands at `load` rather than before the
            first paint frame, which is the flash this exists to prevent.

            Nothing that renders may branch on the attribute this sets during
            its own render. React would then hydrate a tree that disagrees with
            the server's, regenerate the whole thing on the client, and take
            this attribute off `<html>` on the way past. See `ThemePicker`.

            The id list is inlined rather than imported from `lib/themes.ts`
            because this runs as a string before any bundle does. It is a
            whitelist and not a passthrough, and `light`, `studio` and
            `broadsheet` coming off it is exactly what it is for: a browser
            holding any of those three in storage would otherwise put an
            attribute on `<html>` that matches no block, and the page would
            paint Brand while the picker showed something that no longer
            exists. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('meridian-theme');if(['heizen','dark','contrast'].indexOf(t)>-1){document.documentElement.setAttribute('data-theme',t)}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

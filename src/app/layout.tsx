import type { Metadata } from "next";
import { Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

/**
 * One face for the whole platform: Inter.
 *
 * The earlier typeset ran a geometric sans against Inria Serif italic for
 * second-level headings, mirroring heizen.work's two-voice pairing. That was
 * dropped deliberately — the accent voice is now Inter italic in brand teal,
 * so the distinction is colour and slant rather than a second family.
 *
 * Italic is loaded because `.accent-heading` needs it. Swapping the face is
 * still a one-import change; nothing outside this file names a family.
 */
const sans = Inter({
  variable: "--font-sans-family",
  style: ["normal", "italic"],
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
      className={`${sans.variable} ${mono.variable} h-full antialiased`}
    >
      <head>
        {/* Applies the stored theme before first paint so the page never flashes
            the wrong palette. Falls through to prefers-color-scheme when unset. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('meridian-theme');if(t){document.documentElement.setAttribute('data-theme',t)}}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

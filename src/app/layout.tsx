import type { Metadata } from "next";
import { Geist, Geist_Mono, Instrument_Serif } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Display role only: the thesis and the leakage number. See design-system —
// visual boldness is spent in exactly one place per screen.
const instrumentSerif = Instrument_Serif({
  variable: "--font-instrument-serif",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Meridian — Research directions",
  description:
    "Four organising principles for the Research tab, built against Suvarna Agro Foods.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} h-full antialiased`}
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

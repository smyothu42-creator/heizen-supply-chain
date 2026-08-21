import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /**
   * The surfaces live at the top level — `/questions`, `/gaps`, `/research/…`.
   * A project-scoped URL (`/project/prj_vertex/questions`) is a shape this app
   * has never served, and a stale tab or a hand-typed link lands on a 404 with
   * nothing to say. Meridian is project-first and the project lives in the
   * switcher rather than in the path, so the honest resolution is to drop the
   * prefix and land on the surface that was asked for.
   *
   * `/research` alone is the same fault from the other end: the route is
   * `[direction]/[view]`, so the bare word has no page. It goes where the
   * masthead tab points.
   */
  async redirects() {
    return [
      /* The projects list is the product's front door. Meridian is project-first
         (CLAUDE.md §5) and every one of the six surfaces is a reading of one
         company, so the first screen has to be the one where a company gets
         chosen. The wordmark points here too, from every screen. */
      { source: "/", destination: "/projects", permanent: false },
      { source: "/project/:id/research", destination: "/research/all/full", permanent: false },
      // `:path+`, not `:path*` — a star matches zero segments too, so
      // `/project/prj_vertex` redirected to an empty Location and the browser
      // sat on the URL it started from. A dead redirect is worse than the 404.
      { source: "/project/:id/:path+", destination: "/:path+", permanent: false },
      { source: "/project/:id", destination: "/operations", permanent: false },
      /* **`/research/all/full` was a dead target and both of these pointed at
         it.** `all` came off the direction list when the row was re-cut, so
         the route's guard rejected it and the bare `/research` landed on a
         404 — the exact failure the note above the project redirect warns
         about, in the same file. They point where the masthead tab points. */
      { source: "/research", destination: "/research/company/brief", permanent: false },
      /* **The negative lookahead is what keeps the two call agendas alive.**
         They are one-segment routes under `/research`, so a bare
         `:direction` catch-all swallowed them and sent `/research/intro` to
         `/research/intro/full`, which is not a page. The pattern excludes
         them by name; a new agenda needs adding here as well as to
         `ResearchSwitch`. */
      {
        source: "/research/:direction((?!intro$|discovery$)[^/]+)",
        destination: "/research/:direction/full",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;

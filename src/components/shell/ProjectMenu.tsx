"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { initialsOf } from "@/lib/projects";
import { ROLE_LABEL } from "@/lib/workspace";
import { useWorkspace } from "./WorkspaceProvider";
import { Plus } from "lucide-react";
import { ChevronIcon, SearchIcon } from "@/components/meridian/Icons";

/**
 * A monogram, or a photograph when there is one.
 *
 * `tone` is not decoration. The trigger sits on the indigo band and the rows
 * sit on a white popover, and the masthead tokens do not invert with the theme
 * while the page tokens do — the same trap `ThemeToggle` carries a `tone` for.
 * One set of colours cannot serve both places.
 */
function Avatar({
  name,
  photoUrl,
  tone = "band",
  className,
}: {
  name: string;
  photoUrl?: string;
  tone?: "band" | "page";
  className?: string;
}) {
  const shell = cn(
    "grid shrink-0 place-items-center overflow-hidden rounded-full border text-micro font-medium uppercase",
    tone === "band"
      ? "border-masthead-border bg-masthead-border text-masthead-foreground"
      : "border-border bg-muted text-foreground",
    className,
  );
  return photoUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={photoUrl} alt="" className={cn(shell, "object-cover")} />
  ) : (
    <span aria-hidden className={shell}>
      {initialsOf(name)}
    </span>
  );
}

/**
 * The project switcher, in the masthead.
 *
 * A menu button rather than a `<select>`: a native select cannot hold a filter
 * field, and it cannot mark a row as having nothing behind it yet.
 *
 * **It is a filtered list of names now**, on request. The rows used to carry a
 * monogram, the sector, a contract value and a status line each, which is four
 * facts about a project you are not in, on a menu whose entire job is to get
 * you into one. The name is what you are looking for. The one thing that
 * survives beside it is the reason a row cannot be pressed.
 *
 * **The filter is forward-looking and says so.** Three projects do not need
 * searching; thirty do, and a consultancy accumulates them. It is the same
 * reasoning as the connectors and the disabled rows below it — build the shape
 * the real thing has. If the list ever stays short, the cheap fix is to render
 * the field only past a threshold rather than to delete it.
 *
 * Keyboard contract, because this is the one bit of chrome on every screen:
 * Escape closes and returns focus to the button, Tab out closes, and a click
 * anywhere else closes. The filter takes focus on open, which is what makes it
 * worth having — typing works before the pointer arrives. Arrow-key roving is
 * deliberately not implemented; the rows are ordinary buttons and Tab reaches
 * all of them, which is what `check:ui` asserts.
 */
export function ProjectMenu() {
  /* The list, the open project and the signed-in person all come from the
     workspace store rather than from the static module, because a project can
     now be *created*. A switcher reading a frozen import is a switcher that
     does not list the project you made a moment ago on the Projects page. */
  const { projects, currentProjectId, setCurrentProject, askNewProject, askForUpdates, me } =
    useWorkspace();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const id = useId();
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const selected = currentProjectId;
  const project = projects.find((p) => p.id === selected) ?? projects[0];
  /* Matched on the name alone, and not on the sector underneath it. A row that
     appears for a word the reader cannot see in it reads as a bug. */
  const shown = projects.filter((p) =>
    p.name.toLowerCase().includes(query.trim().toLowerCase()),
  );

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const onFocus = () => {
      if (!wrap.current?.contains(document.activeElement)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    document.addEventListener("focusin", onFocus);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("focusin", onFocus);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative min-w-0">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={id}
        aria-haspopup="menu"
        /* The trigger's only accessible name, now that the visible label is
           gone: the avatar's initials are `aria-hidden` and its `<img>` has an
           empty `alt`, both deliberately so the monogram is not read twice.
           Without this the button would announce as nothing at all. */
        aria-label={`Project: ${project.name}. Switch project`}
        onClick={() => {
          setOpen((v) => !v);
          setQuery("");
        }}
        className="flex min-w-0 max-w-full items-center gap-2 rounded-md py-1 pl-1 pr-1 text-small text-masthead-muted transition-colors hover:text-masthead-foreground"
      >
        <Avatar
          name={project.name}
          photoUrl={project.photoUrl}
          className="h-6 w-6"
        />
        {/* **The name is gone from the trigger, on request**, the same change
            `ThemePicker` just took. The monogram already says which project is
            open and the chevron already says the control opens something; the
            name stays in `aria-label` below so it is still announced. This
            also retires the width note that used to live here: the trigger no
            longer has a string in it that can run past the masthead's cap. */}
        <ChevronIcon
          className={cn(
            "shrink-0 rotate-90 transition-transform",
            open && "-rotate-90",
          )}
        />
      </button>

      {open && (
        <div
          id={id}
          role="menu"
          aria-label="Switch project"
          /* `text-foreground` is load-bearing, not tidiness. This popover is a
             child of the masthead, which sets `text-masthead-foreground` —
             white. Rendered on a white card, every row's name inherited white
             on white and simply was not there, while the sector and status
             lines showed because they name their own colour. A popover that
             escapes a coloured band has to reset the colour it landed in. */
          className="absolute right-0 top-full z-50 mt-1 w-[19rem] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-raised"
        >
          {/* The field is the first thing in the menu and takes focus with it,
              so the menu opens ready to be typed into. `autoFocus` is safe
              here in a way it is not on a page: this element did not exist a
              moment ago and the user opened it deliberately. */}
          <div className="relative border-b border-border">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              <SearchIcon />
            </span>
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search projects"
              aria-label="Search projects"
              className="w-full bg-transparent py-2.5 pl-9 pr-3 text-small text-foreground placeholder:text-muted-foreground focus-visible:outline-none"
            />
          </div>

          <ul className="max-h-[60vh] overflow-y-auto py-1">
            {shown.map((p) => {
              const isCurrent = p.id === selected;
              return (
                <li key={p.id}>
                  {/* Name, and whether there is research behind it. Nothing
                      else. The sector, the contract value and the status line
                      were four facts about a project you are not in, on a
                      control whose whole job is to get you into one.

                      **Every row is pressable**, on request, and the note beside
                      it is what carries the honesty the disabled state used to.
                      The same change went into the project cards. */}
                  {/* **Compact**, on request: 6px of vertical padding rather
                      than 8, so nine projects are a list you take in at once
                      instead of one that fills two thirds of the window. The
                      row is still 30px tall, which clears a pointer target on a
                      list this dense; the 44px floor is for the chrome you aim
                      at on a phone, and this popover is 19rem of names. */}
                  <button
                    type="button"
                    role="menuitemradio"
                    aria-checked={isCurrent}
                    onClick={() => {
                      setCurrentProject(p.id);
                      /* Switching client is the other arrival, so it asks the
                         same question. Not on the row you are already in:
                         re-picking the open project is a dismissal, not an
                         entrance. See `UpdateAsk`. */
                      if (!isCurrent) askForUpdates();
                      setOpen(false);
                      trigger.current?.focus();
                    }}
                    className={cn(
                      "flex w-full items-baseline justify-between gap-2 px-3 py-1.5 text-left text-small transition-colors hover:bg-muted",
                      /* The open one is marked on the row rather than by a word
                         at the end of it. A tint and a weight say *you are here*
                         without spending the only column the row has. */
                      isCurrent && "bg-muted font-medium",
                    )}
                  >
                    <span className="truncate">{p.name}</span>
                    {/* Nothing on the current row. *Open* was there to explain a
                        row that could not be pressed, and every row is pressable
                        now, so it was a label on the thing you are already
                        looking at. */}
                    {!isCurrent && !p.researched && (
                      <span className="shrink-0 text-micro text-muted-foreground">
                        No research yet
                      </span>
                    )}
                  </button>
                </li>
              );
            })}
            {shown.length === 0 && (
              <li className="px-3 py-2 text-small text-muted-foreground">
                No project matches “{query.trim()}”.
              </li>
            )}
          </ul>

          {/* **A button that starts the creation, not a signpost to it.** It
              was a link with a line of instruction under it — *Name the company
              and sector first. Sources come after* — which is the form
              explaining itself before you have reached the form.

              It still routes to `/projects`, because creating a project asks
              six questions and one is a paragraph, and a menu 19rem wide
              hanging off the masthead is the wrong room for that. What changed
              is that it arrives with the form **open**: `askNewProject` sets a
              flag the Projects page picks up. Project-first creation (§5)
              survives intact; this is one press instead of two.

              A `<Link>` and not a `<button>` with `router.push`, so the
              destination is in the status bar and the row can be opened in a
              new tab. */}
          <div className="border-t border-border p-1">
            <Link
              href="/projects"
              role="menuitem"
              onClick={() => {
                askNewProject();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-md border border-border-strong bg-card px-2.5 py-1.5 text-left text-small font-medium transition-colors hover:bg-muted"
            >
              <Plus className="size-4 shrink-0" />
              New project
            </Link>
          </div>

          {/* Who is signed in. The email is the identity — no display name is
              invented from it, because an address is not a name. */}
          <div className="flex items-center gap-2.5 border-t border-border px-3 py-2.5">
            <Avatar
              name={me.name ?? me.email}
              photoUrl={me.photoUrl}
              tone="page"
              className="h-7 w-7 text-small"
            />
            <span className="min-w-0">
              <span className="block truncate text-small font-medium">
                {me.name ?? me.email}
              </span>
              <span className="block text-micro text-muted-foreground">
                {ROLE_LABEL[me.role]} · {me.title}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

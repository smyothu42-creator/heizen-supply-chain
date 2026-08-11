"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { CloseIcon, SparkIcon } from "@/components/meridian/Icons";
import { SourceChip } from "@/components/meridian/Evidence";
import { STARTERS, answerFor } from "@/lib/assistant";

/**
 * The AI chat, as a side panel.
 *
 * CLAUDE.md §5 records that chat is wanted, that the prototype's bottom bar is
 * not the answer, and that side panel / popover / contextual click-to-ask were
 * all still open. This is the side panel, and the argument for it over the
 * other two is what the conversation is *about*: on every surface in this
 * product the question is about the thing currently on screen. A popover
 * covers it. A panel sits beside it, and the document reflows rather than
 * being hidden — which is why this pushes the page rather than floating over
 * it at desktop width.
 *
 * **It is designed as real and labelled honestly**, the same rule as
 * `RunButton` and the data-source connectors: a real control in the real
 * place, with a real transcript shape, wired to nothing. The prototype reads
 * one static research set and there is no model behind this. The composer says
 * so rather than pretending to think.
 *
 * Three things it does that a plain drawer does not, all asked for:
 *
 * - **The width is draggable**, from the left edge, and remembered. A chat you
 *   read next to a document is a different width from a chat you are dictating
 *   corrections into, and the consultant is the one who knows which.
 * - **Full view**, which takes the whole window. This is the mode for reading
 *   back a long answer, and the panel keeps its dragged width underneath so
 *   leaving full view returns you to where you were.
 * - **It pushes rather than overlays, from `lg`.** Below that it is an overlay
 *   with a scrim, because 420px of panel beside 375px of phone is not a
 *   layout.
 */

const MIN_WIDTH = 320;
const MAX_WIDTH = 720;
const DEFAULT_WIDTH = 400;
const WIDTH_KEY = "meridian-ai-width";

/**
 * A thing the user has handed to the assistant to ask about.
 *
 * **Attaching is not asking.** Both routes into this panel used to compose a
 * question on the user's behalf and send it: selecting a paragraph asked "what
 * does this mean, and what is behind it?", and the panel header asked "tell me
 * about X". That is a guess at the question, made at the one moment the user
 * has told us the *subject* and nothing else — and a consultant who selected a
 * sentence because he wants to know whether he can say it out loud gets an
 * explanation of what it means instead, then has to type the real question
 * anyway with the answer he did not want already in the transcript.
 *
 * So the selection arrives as a chip above the composer and the caret lands in
 * the box. The subject is ours to carry; the question is his to write.
 */
export interface AiAttachment {
  /** Micro-cap on the chip. "Selected text", "Process", "Gap". */
  kind: string;
  /** The thing itself, shown in the chip and recorded on the sent turn. */
  text: string;
  /**
   * What `answerFor` falls back to routing on when the typed question matches
   * nothing. Usually the subject's name: a 240-character selection is a poor
   * query, and a process name is a good one.
   */
  query?: string;
}

interface AiState {
  open: boolean;
  full: boolean;
  toggle: () => void;
  close: () => void;
  setFull: (v: boolean) => void;
  width: number;
  setWidth: (w: number) => void;
  registerTrigger: (el: HTMLElement | null) => void;
  /**
   * Open the panel with something attached to the composer, ready for a
   * question. `SelectionAsk` and the detail panel's *Ask Helix* are the callers.
   *
   * **This replaced `ask(question)`**, which opened the panel and sent a
   * composed question in one call. That needed `registerSend` — a ref handed up
   * from the panel, because the transcript lives down there — and a note
   * explaining why it could not be a queue. Attachment state lives in this
   * provider, so nothing has to be registered and there is no ordering problem
   * to document: `attach` is a plain `setState` and the panel reads it.
   *
   * The old plumbing is gone rather than left for a future caller. If something
   * genuinely needs to send without the user typing, the honest way back is to
   * lift the transcript into this provider, which is what the removed note
   * already recommended.
   */
  attach: (a: AiAttachment) => void;
  attachment: AiAttachment | null;
  clearAttachment: () => void;
}

const AiContext = createContext<AiState | null>(null);

export const useAi = () => {
  const ctx = useContext(AiContext);
  if (!ctx) throw new Error("useAi outside AiProvider");
  return ctx;
};

/* The remembered width, as an external store.

   Not `useState` seeded in an effect. The server has no `localStorage`, so
   reading it during render is a hydration mismatch and reading it in an effect
   is a synchronous `setState` inside one — which `react-hooks` rejects and is
   right to: it is a second render of the whole tree on every mount. This is
   the same shape `Frames.tsx` uses for the collapse state, for the same
   reason. `getServerSnapshot` returns the default, and React swaps the stored
   value in after hydration without a mismatch. */
const widthListeners = new Set<() => void>();
let widthCache: number | null = null;

function readWidth(): number {
  if (widthCache !== null) return widthCache;
  let stored = NaN;
  try {
    stored = Number(localStorage.getItem(WIDTH_KEY));
  } catch {
    /* private mode */
  }
  widthCache =
    stored >= MIN_WIDTH && stored <= MAX_WIDTH ? stored : DEFAULT_WIDTH;
  return widthCache;
}

function writeWidth(w: number) {
  const clamped = Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, Math.round(w)));
  if (clamped === widthCache) return;
  widthCache = clamped;
  try {
    localStorage.setItem(WIDTH_KEY, String(clamped));
  } catch {
    /* private mode — the drag still works for this session */
  }
  widthListeners.forEach((l) => l());
}

const subscribeWidth = (cb: () => void) => {
  widthListeners.add(cb);
  return () => widthListeners.delete(cb);
};

export function AiProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [full, setFull] = useState(false);
  const width = useSyncExternalStore(
    subscribeWidth,
    readWidth,
    () => DEFAULT_WIDTH,
  );
  const trigger = useRef<HTMLElement | null>(null);
  const [attachment, setAttachment] = useState<AiAttachment | null>(null);

  const setWidth = useCallback((w: number) => writeWidth(w), []);

  const close = useCallback(() => {
    setOpen(false);
    setFull(false);
    // Focus goes back to what opened it. Same contract as `EvidencePanel`:
    // closing a panel with Escape must not drop the caret at the top of the
    // document.
    trigger.current?.focus?.();
  }, []);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  const attach = useCallback((a: AiAttachment) => {
    if (!a.text.trim()) return;
    setAttachment(a);
    setOpen(true);
  }, []);

  const clearAttachment = useCallback(() => setAttachment(null), []);

  return (
    <AiContext.Provider
      value={{
        open,
        full,
        toggle,
        close,
        setFull,
        width,
        setWidth,
        attach,
        attachment,
        clearAttachment,
        registerTrigger: (el) => {
          trigger.current = el;
        },
      }}
    >
      {children}
    </AiContext.Provider>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * The masthead trigger, beside the theme control.
 *
 * `tone` is not a prop here because unlike `ThemeToggle` and `Avatar` this only
 * ever appears on the band — but it obeys the same rule, and every colour on it
 * comes from the `--masthead-*` family. Page greys are 2.03:1 up here.
 */
export function AiButton() {
  const { open, toggle, registerTrigger } = useAi();

  return (
    <button
      ref={registerTrigger}
      type="button"
      onClick={toggle}
      aria-expanded={open}
      aria-controls="ai-panel"
      className={cn(
        // Filled, not outlined, and the only filled control in the chrome. See
        // `.ask-pill` in `globals.css` for the three layers and for why the
        // solid `background-color` under the gradient is load-bearing.
        "ask-pill flex items-center gap-1.5 rounded-full px-3 py-1 text-small font-semibold",
        // The runner and the halo stop once the panel is open: the invitation
        // has been accepted, and a control still asking to be pressed beside
        // the thing it opened is noise. The fill stays, so the button does not
        // change shape or size at the moment it is pressed.
        !open && "ask-pill-live",
      )}
    >
      {/* The ring, and the blade that spins inside it. A real element rather
          than a `::before`, because the blade has to be its child and a
          pseudo-element cannot have one.

          The rotation was a registered `@property` angle interpolated inside
          the `conic-gradient` itself, which is tidier CSS and depends on the
          browser both having `@property` and repainting a gradient whose only
          change is a custom property. Where either is missing it does not fail
          loudly — the ring renders perfectly and never moves, which is
          indistinguishable from a static rim. `transform: rotate()` on an
          element has neither problem. */}
      <span aria-hidden className="ask-ring">
        <span className="ask-ring-blade" />
      </span>
      {/* The spark sits still and takes the label's colour. It used to pulse
          from `--masthead-muted` to `--masthead-accent` in step with the ring,
          which was the right idea on an outlined pill and is the wrong one on a
          filled pill: on this ground the only colours available to it are the
          label's or something less legible than the label. The animation on
          this control is the light running the edge, and one is enough. */}
      <SparkIcon />
      {/* **"Ask Helix", not "Ask".** The assistant has a name and now uses it on
          the masthead, which is where the invitation is made. It matches
          `SelectionAsk`'s first menu item exactly, so the two routes into the
          same panel say the same words.

          The label still hides below `sm` and the mark stays, for the reason
          the wordmark's does: on a 375px line the six surface tabs need every
          pixel, and a spark in a pill beside a theme toggle is unambiguous. */}
      <span className="hidden sm:inline">Ask Helix</span>
    </button>
  );
}

/* -------------------------------------------------------------------------- */
/* The conversation                                                            */
/* -------------------------------------------------------------------------- */

interface Turn {
  id: number;
  role: "you" | "assistant";
  text: string;
  cites: string[];
  /** What the question was attached to, kept on the turn so the transcript
   *  records what was being asked about. Two turns reading "is this safe to
   *  say?" mean different things depending on what was clipped to each. */
  attachment?: AiAttachment;
  /** Set while the reply is still being revealed. */
  streaming?: boolean;
  followUps?: string[];
}

/**
 * How fast a reply reveals itself, in words per tick, and the tick.
 *
 * It is a reveal and not a fetch: the whole answer exists the moment the
 * question is asked, because `answerFor` is synchronous. Revealing it is
 * honest anyway — a 400-word answer landing as one block is unreadable, and
 * the progressive reveal is what lets a consultant start reading the first
 * sentence while the rest arrives, which is the actual reason chat interfaces
 * stream rather than a decorative one.
 *
 * It is skipped entirely under `prefers-reduced-motion`. Text appearing word
 * by word is motion, and it is the kind that cannot be ignored because it is
 * the content itself moving.
 */
const WORDS_PER_TICK = 3;
const TICK_MS = 26;

let nextId = 1;

export function AiPanel() {
  const { open, full, close, setFull, width, setWidth, attachment, clearAttachment } = useAi();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [dragging, setDragging] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [draft, setDraft] = useState("");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const streaming = turns.some((t) => t.streaming);

  const stopStreaming = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setTurns((ts) => ts.map((t) => (t.streaming ? { ...t, streaming: false } : t)));
  }, []);

  // Clear the interval if the panel unmounts mid-reply, or it keeps ticking
  // against state nobody is rendering.
  useEffect(() => () => {
    if (timer.current) clearInterval(timer.current);
  }, []);

  const send = useCallback(
    (text: string) => {
      const question = text.trim();
      if (!question || timer.current) return;

      /* The attachment is the fallback subject, not part of the question.
         `answerFor` routes on what was typed and only falls back to the
         attachment when that lands nowhere — see the note there. */
      const clipped = attachment;
      const answer = answerFor(question, clipped?.query ?? clipped?.text);
      const youId = nextId++;
      const aiId = nextId++;

      clearAttachment();

      setTurns((ts) => [
        ...ts,
        {
          id: youId,
          role: "you",
          text: question,
          cites: [],
          ...(clipped ? { attachment: clipped } : {}),
        },
        {
          id: aiId,
          role: "assistant",
          text: "",
          cites: answer.cites,
          streaming: true,
          followUps: answer.followUps,
        },
      ]);
      setDraft("");

      const reduce =
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      if (reduce) {
        setTurns((ts) =>
          ts.map((t) =>
            t.id === aiId ? { ...t, text: answer.text, streaming: false } : t,
          ),
        );
        return;
      }

      const words = answer.text.split(" ");
      let i = 0;
      timer.current = setInterval(() => {
        i += WORDS_PER_TICK;
        const done = i >= words.length;
        setTurns((ts) =>
          ts.map((t) =>
            t.id === aiId
              ? {
                  ...t,
                  text: words.slice(0, i).join(" "),
                  streaming: !done,
                }
              : t,
          ),
        );
        if (done && timer.current) {
          clearInterval(timer.current);
          timer.current = null;
        }
      }, TICK_MS);
    },
    [attachment, clearAttachment],
  );

  const reset = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    setTurns([]);
    setDraft("");
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  /* The caret goes into the box the moment something is attached.
     Attaching is the first half of asking, and a chip that appears with the
     focus still on the node you clicked makes the user find the composer
     themselves — on a surface where the next thing they do is always type.
     A DOM call in an effect, not a `setState`, so this is outside the
     cascading-render rule the width store documents. */
  useEffect(() => {
    if (attachment) inputRef.current?.focus();
  }, [attachment]);

  // Follow the reply down as it grows. `scrollTop = scrollHeight` and not
  // `scrollIntoView`: the latter scrolls the *page* behind the panel too when
  // the panel is the thing that moved.
  useEffect(() => {
    const el = scrollerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [turns]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      // Escape unwinds one layer at a time: stop the reply, then leave full
      // view, then close. One keystroke from full screen to nothing loses the
      // conversation.
      if (timer.current) stopStreaming();
      else if (full) setFull(false);
      else close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, full, close, setFull, stopStreaming]);

  // Drag on the window rather than on the handle, so the pointer can outrun
  // the element without the drag ending — the reason a resize that only
  // listens on its own handle feels sticky.
  useEffect(() => {
    if (!dragging) return;
    const move = (e: PointerEvent) => setWidth(window.innerWidth - e.clientX);
    const up = () => setDragging(false);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      document.body.style.userSelect = "";
      document.body.style.cursor = "";
    };
  }, [dragging, setWidth]);

  if (!open) return null;

  return (
    <>
      {/* Below `lg` the panel is an overlay and needs a scrim to close on.
          From `lg` it pushes the page, so there is nothing to dismiss. */}
      {!full && (
        <button
          type="button"
          aria-label="Close the assistant"
          onClick={close}
          className="fixed inset-0 z-[60] bg-foreground/20 lg:hidden"
        />
      )}

      <div
        id="ai-panel"
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-label="Assistant"
        style={full ? undefined : { width }}
        // Top of the stack — see the note on the masthead in `AppShell`. A
        // sticky header spanning the window sat *over* this panel's own header
        // at first and swallowed every click on Full view and Close: the panel
        // looked right and two of its three controls did nothing.
        className={cn(
          "fixed inset-y-0 right-0 z-[70] flex flex-col border-l border-border bg-card shadow-raised outline-none",
          full ? "left-0 w-full border-l-0" : "w-full max-w-[calc(100%-2rem)] lg:max-w-none",
        )}
      >
        {/* The drag handle. A 7px hit area on a 1px line, because a border you
            have to hit exactly is a border nobody resizes. Hidden in full view,
            where there is no edge to pull, and below `lg`, where the panel is
            an overlay sized to the phone. */}
        {!full && (
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            role="separator"
            aria-orientation="vertical"
            aria-label="Resize the assistant"
            aria-valuenow={width}
            aria-valuemin={MIN_WIDTH}
            aria-valuemax={MAX_WIDTH}
            tabIndex={0}
            onKeyDown={(e) => {
              // Keyboard resize, because a drag handle that only takes a
              // pointer is a control half the users cannot operate.
              if (e.key === "ArrowLeft") setWidth(width + 24);
              if (e.key === "ArrowRight") setWidth(width - 24);
            }}
            className={cn(
              "absolute inset-y-0 -left-[3px] z-10 hidden w-[7px] cursor-col-resize lg:block",
              "after:absolute after:inset-y-0 after:left-[3px] after:w-px after:bg-transparent hover:after:bg-accent-soft",
              dragging && "after:bg-accent-soft",
            )}
          />
        )}

        {/* **The header says who this is, and it says Helix.** It was a
            micro-cap `Assistant` beside a spark, which is a label on a box
            rather than the name of the thing you just pressed *Ask Helix* to
            reach — and CLAUDE.md already recorded the header as the odd half of
            that pair.

            The mark is filled in `--primary`, the same token the masthead strip
            and every filled button use, so the panel opens with something of
            the product's own colour in it rather than as a white column with
            grey text at the top. */}
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-2.5">
          {/* The name and the mark, and nothing else. A line saying what this
              answers from was tried here and clipped at every width the panel
              can be dragged to: with *New chat* beside it there are 69px left
              at the 320px floor. It is said twice already, in the opening card
              and under the composer, and both of those have a full line to say
              it in. */}
          <p className="flex min-w-0 items-center gap-2.5">
            <HelixMark />
            <span className="truncate text-small font-semibold">Helix</span>
          </p>
          <div className="flex shrink-0 items-center gap-1">
            {turns.length > 0 && (
              <button
                type="button"
                onClick={reset}
                className="rounded-md px-2 py-1 text-micro font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                New chat
              </button>
            )}
            <button
              type="button"
              onClick={() => setFull(!full)}
              aria-pressed={full}
              className="rounded-md px-2 py-1 text-micro font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              {full ? "Exit full view" : "Full view"}
            </button>
            <button
              type="button"
              onClick={close}
              aria-label="Close the assistant"
              className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <CloseIcon />
            </button>
          </div>
        </header>

        {/* **Two grounds, the same split the product makes everywhere else.**
            The header and the composer are chrome and stay on `--card`; the
            conversation is the document and sits on the ivory page tone. One
            flat white column from the masthead to the composer is what made
            this read as unfinished — nothing said where the panel's furniture
            stopped and its content began, and a reply had no ground of its own
            to be a card against. */}
        <div ref={scrollerRef} className="min-h-0 flex-1 overflow-y-auto bg-background">
          <div
            className={cn(
              "px-4 py-4",
              // Full view is the mode for reading a long answer back, so the
              // column caps there. In the side panel it is already narrower.
              full && "mx-auto w-full max-w-3xl",
              /* Empty, the opening sits in the middle of the panel rather than
                 pinned under the header with the rest of the height blank. It
                 is `min-h-full` and `justify-center`, not `h-full`, so a short
                 panel scrolls instead of squashing the starters. */
              turns.length === 0 && "flex min-h-full flex-col justify-center",
            )}
          >
            {turns.length === 0 ? (
              <Empty onPick={send} />
            ) : (
              <ul className="space-y-5">
                {turns.map((t) => (
                  <li key={t.id}>
                    <Bubble turn={t} />
                    {!t.streaming && t.followUps && (
                      <ul className="mt-2.5 flex flex-wrap gap-1.5">
                        {t.followUps.map((f) => (
                          <li key={f}>
                            <button
                              type="button"
                              onClick={() => send(f)}
                              className="rounded-full border border-border bg-card px-2.5 py-1 text-micro text-muted-foreground transition-colors hover:border-border-strong hover:text-foreground"
                            >
                              {f}
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div
          className={cn(
            "shrink-0 border-t border-border px-4 py-3",
            full && "mx-auto w-full max-w-3xl",
          )}
        >
          {/* What you are asking about, above the box you ask in.
              Inside the composer's border rather than floating above it: it is
              part of the message being composed, and it leaves with the message
              when the message is sent. */}
          {attachment && (
            /* **Cyan stroke, cyan surface.** It was a dashed neutral box on
               `--muted`, which is the ground the panel already uses for
               anything quiet, so the one thing on screen that changes what the
               next answer is about looked like furniture.

               The colour is `--evidence` and `--evidence-muted`, the pair this
               product already spends on provenance: an attachment is a piece of
               the research handed to the assistant, and cyan is what means
               *this is a thing you can follow* everywhere else. Dashed stays —
               it is provisional, and it leaves with the message. */
            <div className="mb-1.5 flex items-start gap-2 rounded-lg border border-dashed border-evidence bg-evidence-muted px-3 py-2">
              <span className="min-w-0 flex-1">
                <span className="block text-micro font-medium text-evidence">
                  {attachment.kind}
                </span>
                {/* Three lines, then it clips. A selection can be a paragraph,
                    and a chip that grows to five lines has taken the composer's
                    place rather than labelled it. The whole selection is still
                    what gets asked about. */}
                <span className="mt-0.5 line-clamp-3 text-small">{attachment.text}</span>
              </span>
              <button
                type="button"
                onClick={clearAttachment}
                aria-label="Remove what this question is about"
                className="-mr-1 -mt-1 shrink-0 rounded-md p-1 text-evidence transition-colors hover:bg-card"
              >
                <CloseIcon />
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(draft);
            }}
            /* **One line: the field and the send button on the same row.** It
               was two rows for a revision, on the argument that a 320px panel
               cannot spare 40px of field to a button. The cost was worse than
               the saving: an empty composer stood three lines tall and read as
               a text area waiting for a paragraph, when what this takes is a
               question. It still grows to fit as you type, up to 140px. */
            className="flex items-end gap-2 rounded-xl border border-border bg-background px-3 py-2 shadow-card focus-within:border-border-strong"
          >
            <label htmlFor="ai-composer" className="sr-only">
              Ask about this research
            </label>
            <textarea
              id="ai-composer"
              ref={inputRef}
              rows={1}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                // Grow to fit, up to a point. `height = auto` first, or the
                // box only ever grows and never shrinks on delete.
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 140)}px`;
              }}
              onKeyDown={(e) => {
                // Enter sends, Shift+Enter breaks the line. The convention is
                // worth following exactly: a consultant typing a two-line
                // correction should not have to learn a new key.
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send(draft);
                }
              }}
              placeholder={
                attachment
                  ? `Ask about this ${attachment.kind.toLowerCase()}`
                  : "Ask about anything on this screen"
              }
              className="max-h-[140px] min-w-0 flex-1 resize-none bg-transparent py-1 text-small leading-relaxed outline-none placeholder:text-muted-foreground"
            />

            {/* The round filled send stays from the reference. It is the one
                thing in the composer that is not text, so it is the one thing
                that gets a fill. */}
            {streaming ? (
              <button
                type="button"
                onClick={stopStreaming}
                className="shrink-0 rounded-full border border-border px-3 py-1 text-micro font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                Stop
              </button>
            ) : (
              <button
                type="submit"
                disabled={!draft.trim()}
                aria-label="Send"
                className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-30"
              >
                <SendIcon />
              </button>
            )}
          </form>
          {/* The other half of the scope, and the half the chip cannot carry:
              there is no model behind this. Said once, under the composer, and
              not dressed up. */}
          <p className="mt-1.5 text-micro text-muted-foreground">
            Nothing is sent anywhere. No model, no browsing.
          </p>
        </div>
      </div>
    </>
  );
}

/**
 * The panel's identity mark: the spark on a filled `--primary` tile.
 *
 * One component in three places — the header, the opening, and every reply —
 * so the assistant is the same object wherever it speaks. `--primary` inverts
 * with the theme and `--primary-foreground` inverts with it, so this is a deep
 * slate tile in light and a pale one in dark without a branch.
 */
function HelixMark({ size = "sm" }: { size?: "sm" | "lg" }) {
  return (
    <span
      aria-hidden
      className={cn(
        "grid shrink-0 place-items-center rounded-md bg-primary text-primary-foreground",
        size === "lg" ? "h-9 w-9" : "h-7 w-7",
      )}
    >
      <SparkIcon />
    </span>
  );
}

/**
 * What the panel is before anything has been asked, which is what it looks like
 * most of the time it is open.
 *
 * It was a bold line, a paragraph and five hairline boxes on a white column,
 * with the rest of the height blank. The material has not changed much; what
 * changed is that it now sits on the page tone with the starters as cards, so
 * the opening reads as something composed rather than as a form that has not
 * loaded.
 *
 * **The starters keep their own label.** Five sentences under a paragraph read
 * as more prose the moment they stop being obviously pressable; a micro-cap
 * over them says they are a list of things to do, and the trailing chevron
 * says each one goes somewhere.
 */
function Empty({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="py-4">
      {/* **The orb, and why it is the one decorative thing allowed here.**
          A blurred blob is decoration, which this product spends carefully —
          but an assistant with nothing said to it yet has no material to show,
          and the alternative is what was here before: a heading and a paragraph
          in the top corner with two thirds of the panel blank underneath.

          It is drawn from the product's own colours, cyan into slate, so it
          reads as this tool's assistant rather than as a stock AI mark. And it
          is **still**: the ask pill in the masthead is the one thing in the
          product that moves, and a breathing orb on the surface it opens would
          be two. */}
      <div className="flex flex-col items-center text-center">
        <span aria-hidden className="ai-orb" />
        <p className="reading mt-5 max-w-[24rem] text-small text-muted-foreground">
          Ask about anything on this project. Every answer comes out of the research
          already loaded, with the same sources the pages cite.
        </p>
      </div>

      {/* The starters stay a left-aligned list under the centred opening.
          Centred, five sentences of different lengths read as a poem; what
          makes a list scannable is one left edge. */}
      <p className="mt-7 text-micro font-medium uppercase tracking-[0.12em] text-muted-foreground">
        Try one of these
      </p>
      <ul className="mt-2 space-y-2">
        {STARTERS.map((s) => (
          <li key={s}>
            <button
              type="button"
              onClick={() => onPick(s)}
              className="group flex w-full items-center gap-3 rounded-lg border border-border bg-card px-3 py-2.5 text-left text-small shadow-card transition-colors hover:border-border-strong hover:bg-muted"
            >
              <span className="min-w-0 flex-1">{s}</span>
              <span
                aria-hidden
                className="shrink-0 text-muted-foreground transition-colors group-hover:text-foreground"
              >
                ›
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * One turn.
 *
 * The user's is a right-aligned tinted bubble and the assistant's is plain
 * full-width text, which is the shape every chat interface has converged on
 * for a good reason: what you typed is short and needs bounding, what came
 * back is long and needs to read like a document. Bubbling both makes the
 * answer look like a text message.
 */
function Bubble({ turn }: { turn: Turn }) {
  if (turn.role === "you") {
    return (
      <div className="flex flex-col items-end gap-1">
        {/* What the question was about, above the question.
            The transcript has to keep it: "is this safe to say?" means nothing
            a screen later without the paragraph it was clipped to, and a
            consultant scrolling back is doing so precisely because he cannot
            remember which thing he asked about. */}
        {/* The same box as the composer's, because it is the same object one
            step later: what this question was clipped to. */}
        {turn.attachment && (
          <div className="max-w-[85%] rounded-lg border border-dashed border-evidence bg-evidence-muted px-3 py-1.5">
            <span className="block text-micro font-medium text-evidence">
              {turn.attachment.kind}
            </span>
            <span className="mt-0.5 line-clamp-2 text-micro text-muted-foreground">
              {turn.attachment.text}
            </span>
          </div>
        )}
        {/* **The question is filled, the answer is not.** On the ivory ground a
            `--muted` bubble was a tint against a tint and barely drew itself.
            `--primary` is the token the masthead and every filled button
            already use, so what you said carries the product's own colour and
            what came back reads as a document — which is the split every chat
            interface has converged on, for the reason below. */}
        <p className="max-w-[85%] whitespace-pre-wrap rounded-lg rounded-br-sm bg-primary px-3 py-2 text-small text-primary-foreground">
          {turn.text}
        </p>
      </div>
    );
  }

  /* The reply is a card on the page tone, where the question is a bubble. Both
     are on `--card` in the end; what separates them is that the answer runs the
     full width and keeps a document's left edge, because it is the thing being
     read rather than the thing being said. */
  return (
    <div className="rounded-lg border border-border bg-card p-3 shadow-card">
      <p className="mb-2 flex items-center gap-2 text-micro font-medium text-muted-foreground">
        <HelixMark />
        Helix
      </p>
      {turn.text === "" ? (
        <Thinking />
      ) : (
        <div className="reading space-y-2.5 text-small">
          {turn.text.split("\n\n").map((para, i) => (
            <p key={i} className="whitespace-pre-wrap">
              {para}
              {/* The caret rides the last paragraph rather than sitting on its
                  own line, so the block does not jump by a line-height when
                  the reply finishes. */}
              {turn.streaming && i === turn.text.split("\n\n").length - 1 && (
                <span className="ml-0.5 inline-block h-3.5 w-[2px] translate-y-[2px] animate-pulse bg-foreground motion-reduce:hidden" />
              )}
            </p>
          ))}
        </div>
      )}
      {!turn.streaming && turn.cites.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-micro text-muted-foreground">
            From
          </span>
          {[...new Set(turn.cites)].map((id) => (
            <SourceChip key={id} sourceId={id} />
          ))}
        </div>
      )}
    </div>
  );
}

function Thinking() {
  return (
    <p className="flex items-center gap-1" aria-live="polite">
      <span className="sr-only">Working</span>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 animate-pulse rounded-full bg-muted-foreground"
          style={{ animationDelay: `${i * 160}ms` }}
        />
      ))}
    </p>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" aria-hidden>
      <path
        d="M8 13V3M8 3 4 7M8 3l4 4"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

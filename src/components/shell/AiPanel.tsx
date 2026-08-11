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
import { Paperclip } from "lucide-react";
import { cn } from "@/lib/cn";
import { CloseIcon, SparkIcon } from "@/components/meridian/Icons";
import { SourceChip } from "@/components/meridian/Evidence";
import { FILE_ACCEPT, fileSize } from "@/lib/files";
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
      /* **Named on the element, because below `sm` the label is hidden and the
         spark is all that is left.** Without this the control had no accessible
         name at all on a phone — a button announced as "button". It was true of
         the shorter label too and nothing caught it: `check:ui` tests that every
         interactive element is reachable by Tab, not that it says anything when
         you get there. */
      aria-label="Ask Helix"
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
          the masthead, which is where the invitation is made.

          **It is deliberately shorter than the panel's**, which says *Ask or
          Edit with Helix*. This used to match `SelectionAsk`'s menu item and the
          panel's button exactly, on the rule that routes into one place should
          say one thing. The rule still holds for the two that are about
          *something*: the panel button and the selection menu both arrive with a
          subject attached, and editing is a real thing you can do to a subject.
          This one arrives with nothing attached and opens an empty
          conversation — there is no output on the masthead to correct — and it
          is a pill among six tabs, a project switcher and a theme control, with
          about 85px to spare rather than 85px to give.

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
  /**
   * Files clipped to the question, kept as name and size rather than as `File`
   * objects.
   *
   * The transcript outlives the picker, and a `File` is a handle to something on
   * disk that this prototype never reads. Keeping the handle would imply the
   * conversation still has the document; keeping the name is the true record —
   * *you asked this while pointing at that file* — and it is what a consultant
   * scrolling back needs to make sense of the question.
   */
  files?: { name: string; size: number }[];
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

/**
 * A conversation that is not the current one.
 *
 * **Kept in component state, not `localStorage`**, unlike the panel's width and
 * the section-collapse store. Those two are *settings* — how you like the tool
 * arranged — and they should survive a reload. A transcript is content, and the
 * composer says plainly that nothing is sent anywhere and there is no model
 * behind it. Persisting a conversation the prototype invented would be the
 * first thing in here pretending to be real, and it is the one claim
 * `RunButton` and the connectors are careful not to make.
 *
 * **The title is the first thing you said, not a summary of it.** A generated
 * name is a second thing that can be wrong about a conversation you can already
 * read. Where a question arrived with something clipped to it, the subject
 * leads: *Transport · why is this flagged?* is findable in a list where four
 * rows all start "what does this mean".
 */
interface Chat {
  id: number;
  turns: Turn[];
  title: string;
}

/** The first thing the user said, with whatever it was attached to in front. */
function titleOf(turns: Turn[]): string {
  const first = turns.find((t) => t.role === "you");
  if (!first) return "Empty chat";
  return first.attachment ? `${first.attachment.text} · ${first.text}` : first.text;
}

/**
 * Stop any reply that was still revealing itself.
 *
 * A transcript leaving the screen takes its `streaming` flag with it unless
 * something clears it, and the timer only ever fills the live one — so an
 * archived turn would keep a caret blinking on a half-written answer that can
 * never finish, and reopening it would show that state as if it were live.
 */
const settle = (turns: Turn[]): Turn[] =>
  turns.map((t) => (t.streaming ? { ...t, streaming: false } : t));

const archive = (turns: Turn[]): Chat => {
  const done = settle(turns);
  return { id: nextId++, turns: done, title: titleOf(done) };
};

export function AiPanel() {
  const { open, full, close, setFull, width, setWidth, attachment, clearAttachment } = useAi();
  const panelRef = useRef<HTMLDivElement>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [dragging, setDragging] = useState(false);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [history, setHistory] = useState<Chat[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  /* The full-view sidebar, collapsed to a rail.
     **Plain state, not the `localStorage` store the width uses.** The width is
     a setting about how the tool is arranged and survives a reload; this is a
     mode inside a mode — you have to be in full view to see it at all — and
     full view does not survive a reload either. Persisting the child of
     something transient is a preference you can set and never see honoured. */
  const [railed, setRailed] = useState(false);
  /**
   * Files clipped to the question being written.
   *
   * **Real `File` objects while they are on the composer**, so the chip can
   * show the true size and the picker can be pressed twice without losing the
   * first pass. They become names on the way into the transcript.
   */
  const [files, setFiles] = useState<File[]>([]);
  const [dropping, setDropping] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  /**
   * Take a `FileList` from either route, the picker or a drop.
   *
   * **It appends and de-duplicates.** Picking twice should add to what is
   * already clipped rather than replace it — a consultant assembling a question
   * from three documents opens the picker three times — and the same file
   * arriving twice is a mistake rather than an instruction. Name, size and
   * modified time together are as close to an identity as a browser gives you.
   */
  const addFiles = useCallback((list: FileList | null) => {
    const picked = Array.from(list ?? []);
    if (!picked.length) return;
    setFiles((all) => {
      const key = (f: File) => `${f.name}|${f.size}|${f.lastModified}`;
      const seen = new Set(all.map(key));
      return [...all, ...picked.filter((f) => !seen.has(key(f)))];
    });
    inputRef.current?.focus();
  }, []);
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
      /* **A file alone is not a question.** Attaching a document and pressing
         send with an empty box would produce a turn with nothing asked in it,
         and the send button is disabled on an empty draft for the same reason.
         The files stay clipped until there is something to ask about them. */
      if (!question || timer.current) return;

      /* The attachment is the fallback subject, not part of the question.
         `answerFor` routes on what was typed and only falls back to the
         attachment when that lands nowhere — see the note there. */
      const clipped = attachment;
      const answer = answerFor(question, clipped?.query ?? clipped?.text);
      const youId = nextId++;
      const aiId = nextId++;

      // Name and size only. See `Turn.files` for why the handle is dropped.
      const carried = files.map((f) => ({ name: f.name, size: f.size }));

      clearAttachment();
      setFiles([]);

      setTurns((ts) => [
        ...ts,
        {
          id: youId,
          role: "you",
          text: question,
          cites: [],
          ...(clipped ? { attachment: clipped } : {}),
          ...(carried.length ? { files: carried } : {}),
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
    [attachment, clearAttachment, files],
  );

  /**
   * Start a new chat, keeping the old one.
   *
   * It used to be `reset`, which threw the transcript away — fine while there
   * was nowhere for it to go, and wrong the moment there is a list to find it
   * in. **A button that discards work silently is the one thing a history
   * control has to stop being true.**
   *
   * An empty transcript is not archived: pressing New chat twice would
   * otherwise leave a row you cannot tell from the one above it.
   */
  const newChat = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = null;
    if (turns.length) setHistory((h) => [archive(turns), ...h]);
    setTurns([]);
    setDraft("");
    setShowHistory(false);
    inputRef.current?.focus();
  }, [turns]);

  /**
   * Reopen an archived chat.
   *
   * **It swaps rather than appends**, and the current conversation goes into
   * the list on the way past, so there is always exactly one live transcript
   * and no way to lose one by pressing the wrong row. The reopened chat leaves
   * the list, because a chat that is both open and listed is two places one
   * thing can be edited from.
   *
   * Any half-revealed reply in either direction is settled first: a turn
   * carrying `streaming` that is not the one the timer is filling would sit
   * with a caret blinking on it for ever.
   */
  const openChat = useCallback(
    (id: number) => {
      const picked = history.find((c) => c.id === id);
      if (!picked) return;
      if (timer.current) clearInterval(timer.current);
      timer.current = null;

      /* Both writes are computed from the values already in hand and neither
         updater reads the other's result. Threading one through the other's
         callback is a side effect inside a reducer, which React runs twice in
         development — the same trap `PanelProvider` documents about its own
         stack and cursor. */
      const rest = history.filter((c) => c.id !== id);
      setHistory(turns.length ? [archive(turns), ...rest] : rest);
      setTurns(settle(picked.turns));
      setShowHistory(false);
    },
    [history, turns],
  );

  useEffect(() => {
    if (open) panelRef.current?.focus();
  }, [open]);

  /* **The list needs no teardown, and that is worth knowing rather than
     rediscovering.** A popover surviving a close would reopen hanging off a
     button nobody pressed — the rule `ProjectMenu` keeps about clearing its
     filter on the way out. Clearing it in an effect keyed on `open` is the
     obvious fix and `pnpm lint` rejects it: a synchronous `setState` inside an
     effect is the cascading-render rule this file already documents about the
     width store.

     It does not need one. Every way out of the panel already dismisses the
     list: Escape hits `ChatHistory`'s capture-phase handler first, and the
     header's Close button, the masthead pill and the scrim are all outside the
     popover, so each fires the outside-mousedown that closes it. */

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
        /* **A row, with the conversation as one child of it.** It was a column,
           and full view had nothing beside it. The sidebar is the second child;
           in the docked panel there is no second child, and a row holding one
           `flex-1 flex-col` lays out exactly as the column did. */
        className={cn(
          "fixed inset-y-0 right-0 z-[70] flex border-l border-border bg-card shadow-raised outline-none",
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

        {/* **The sidebar exists only in full view**, which is the whole design
            decision here rather than a breakpoint.

            Docked, the panel is 320 to 720px and its job is to sit *beside* the
            thing being asked about; spending 256 of those on a list of past
            conversations would make the assistant the subject of the screen
            instead of the tool beside it. That version already exists and is
            the right one: the history popover on the header. Full view is the
            opposite situation — the whole window, nothing else on screen, and
            the reading mode — so it gets the shape every chat product has
            settled on, and the popover stands down. */}
        {full && (
          <ChatSidebar
            chats={history}
            current={turns.length > 0 ? titleOf(turns) : null}
            collapsed={railed}
            onToggle={() => setRailed((v) => !v)}
            onNew={newChat}
            canNew={turns.length > 0}
            onPick={openChat}
          />
        )}

        {/* The conversation column: header, transcript, composer. */}
        <div className="flex min-w-0 flex-1 flex-col">
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
          <div className="relative flex shrink-0 items-center gap-1">
            {/* **Both are icons, on request, and both are always rendered
                rather than appearing when they have something to do.** New chat
                used to be mounted only while `turns.length > 0`, which is the
                tidier header and the worse control: it appears under the
                pointer that was aiming at Full view, and it means the one thing
                that clears the panel is invisible at the moment you have most
                just typed into it. Disabled is what "nothing to do" looks like.
                The same argument `EvidencePanel` records for its back and
                forward arrows.

                Icons need names, so each carries `aria-label` and `title`. The
                width they give back is real: the header comment above notes 69px
                left at the 320px floor with one word-button in the row. */}
            {/* **Both stand down in full view**, where the sidebar carries them
                — including when it is collapsed to a rail, which keeps its own
                copies. Two New chat buttons a hand's width apart is not
                redundancy, it is a reader wondering whether they do the same
                thing.

                **Except below `md`, where there is no sidebar to carry them.**
                Full view on a 375px screen is the whole window, and a 256px
                column beside it leaves 119px of conversation — so the sidebar
                is `hidden md:flex` and these come back underneath it. It is a
                CSS swap rather than a branch because the two are mutually
                exclusive at every width: exactly one of the pair is in the
                accessibility tree, which `hidden` guarantees and a `useState`
                keyed on a media query would not, on the server. */}
            <div className={cn("contents", full && "md:hidden")}>
                <IconAction
                  onClick={newChat}
                  disabled={turns.length === 0}
                  label="New chat"
                  icon={<NewChatIcon />}
                />
                <IconAction
                  onClick={() => setShowHistory((v) => !v)}
                  disabled={history.length === 0}
                  pressed={showHistory}
                  label={
                    history.length === 0
                      ? "Previous chats"
                      : `Previous chats, ${history.length}`
                  }
                  icon={<HistoryIcon />}
                />
                {showHistory && (
                  <ChatHistory
                    chats={history}
                    onPick={openChat}
                    onClose={() => setShowHistory(false)}
                  />
                )}
            </div>
            {/* **A drawn button**, on request, and it is `CopyQuestion`'s exact
                shape: border, `--card`, `shadow-card`, and the same hover that
                deepens the edge rather than filling it. It was bare words, so
                the header ran a plain phrase into two icon buttons and a close
                cross with nothing saying which of them was the pressable one
                you would reach for — and this is the control that changes the
                whole window.

                It is `whitespace-nowrap` because the label swaps between *Full
                view* and *Exit full view*, and the box has to keep its shape at
                the moment it is pressed rather than wrapping to two lines in a
                48px header. */}
            <button
              type="button"
              onClick={() => setFull(!full)}
              aria-pressed={full}
              className="flex items-center whitespace-nowrap rounded-md border border-border bg-card px-2.5 py-1.5 text-micro font-medium text-muted-foreground shadow-card transition-colors hover:border-border-strong hover:bg-muted hover:text-foreground"
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
          /* **The whole composer block is the drop target, not the field.**
             Dragging a document at a 40px-tall textarea is a game; people aim
             at the bottom of the window, which is the area this covers. The
             chips, the clip button and the box are all inside it, so wherever
             the pointer lands in that region the file is taken.

             `preventDefault` on dragover is what makes a drop possible at all —
             without it the browser navigates to the file and the conversation
             is gone. The counter is not tracked: `dragleave` fires when the
             pointer crosses into a *child*, so a naive boolean flickers off as
             the cursor passes over the chips. Checking `currentTarget.contains`
             against `relatedTarget` is what settles it. */
          onDragOver={(e) => {
            e.preventDefault();
            if (!dropping) setDropping(true);
          }}
          onDragLeave={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDropping(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setDropping(false);
            addFiles(e.dataTransfer.files);
          }}
          className={cn(
            "shrink-0 border-t border-border px-4 py-3 transition-colors",
            full && "mx-auto w-full max-w-3xl",
            // The whole block tints while something is over it, which is the
            // only moment in this panel where a ground says "let go here".
            dropping && "bg-evidence-muted",
          )}
        >
          {/* Attached files, above the subject chip and the box, newest last.
              They are a list rather than one chip because a consultant drops a
              folder's worth at once and needs to see which ones landed. */}
          {files.length > 0 && (
            <ul className="mb-1.5 flex flex-wrap gap-1.5">
              {files.map((f, i) => (
                <li key={`${f.name}-${f.size}-${f.lastModified}`}>
                  <span className="flex max-w-full items-center gap-1.5 rounded-md border border-border bg-muted py-1 pl-2 pr-1 text-micro">
                    <Paperclip className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                    <span className="truncate font-medium">{f.name}</span>
                    <span className="tabular shrink-0 text-muted-foreground">
                      {fileSize(f.size)}
                    </span>
                    <button
                      type="button"
                      onClick={() => setFiles((all) => all.filter((_, j) => j !== i))}
                      aria-label={`Remove ${f.name}`}
                      className="shrink-0 rounded p-0.5 text-muted-foreground transition-colors hover:bg-card hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <CloseIcon />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          )}
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
            /* **A clip, and a solid rail down the attaching edge.** The chip
               said what it was in words and drew itself in a hue, and a hue is
               a thing a reader has to have been taught. A paperclip is the one
               mark that means *attached to this message* without a caption, in
               every mail client and every chat window there has ever been, and
               it is the mark this chip was missing.

               The rail is 3px of solid `--evidence` on the left edge, and the
               dashes stop there. That is the shape saying the block is clipped
               *to* the composer under it: fixed on one side, provisional on the
               other three. Nothing was added in words to do either. */
            <div className="mb-1.5 flex items-start gap-2.5 rounded-lg border border-dashed border-l-[3px] border-evidence border-l-evidence bg-evidence-muted py-2 pl-2.5 pr-2">
              <span
                aria-hidden
                className="mt-px grid size-6 shrink-0 place-items-center rounded-md bg-evidence text-card"
              >
                <Paperclip className="size-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-micro font-semibold uppercase tracking-[0.08em] text-evidence">
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
            {/* **A real `<input type="file">`, hidden, driven by the clip
                button.** The same element Sources uses, and for the same
                reasons: it is the platform's own picker, it is what a screen
                reader announces as a file control, and on a phone it opens the
                camera roll and the files app rather than a web dialogue.

                It is `sr-only` rather than `hidden`, which is the difference
                between an input the assistive tree can reach and one it cannot.
                `value = ""` on every change so picking the same file twice in a
                row still fires — the same line Sources needs. */}
            <input
              ref={fileInput}
              id="ai-files"
              type="file"
              multiple
              accept={FILE_ACCEPT}
              className="sr-only"
              onChange={(e) => {
                addFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <label htmlFor="ai-files" className="sr-only">
              Attach files
            </label>
            {/* The clip sits before the field, where every chat window puts it,
                and it is the same 28px ghost the header actions are. */}
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              aria-label="Attach files"
              title="Attach files"
              className="mb-0.5 shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Paperclip className="size-4" />
            </button>
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
          {/* **The scope line covers the files too, and says so once there are
              any.** "Nothing is sent anywhere" is already true of an attached
              document, but a consultant who has just dropped a contract in is
              owed the specific version of that sentence rather than being left
              to infer it from a general one. Same doctrine as Sources, whose
              ingest button says the set is not wired up rather than accepting
              the files silently. */}
          <p className="mt-1.5 text-micro text-muted-foreground">
            {files.length > 0
              ? "Nothing is sent anywhere. Files are not read, and nothing leaves this browser."
              : "Nothing is sent anywhere. No model, no browsing."}
          </p>
        </div>
        </div>
      </div>
    </>
  );
}

/**
 * A header action with no words on it.
 *
 * One component for both, because two icon buttons written out separately in
 * the same row is where the padding, the hover and the disabled treatment drift
 * apart by a pixel each.
 *
 * **Disabled rather than absent**, so the row never changes width and the
 * neighbour never moves under a pointer already travelling towards it.
 * `disabled` also takes it out of the tab order, which is the honest reading:
 * there is nothing there to operate yet.
 */
function IconAction({
  onClick,
  disabled,
  pressed,
  label,
  icon,
}: {
  onClick: () => void;
  disabled?: boolean;
  /** Set only on the toggle, so the history button reports its open state. */
  pressed?: boolean;
  label: string;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={cn(
        "rounded-md p-1.5 text-muted-foreground transition-colors",
        "hover:bg-muted hover:text-foreground",
        // 30% is the same weight `AiPanel`'s send button uses when the composer
        // is empty, so the two disabled states in one panel match.
        "disabled:pointer-events-none disabled:opacity-30",
        pressed && "bg-muted text-foreground",
      )}
    >
      {icon}
    </button>
  );
}

/**
 * The full-view sidebar: new chat at the top, the conversations under it.
 *
 * The shape every chat product has settled on, and it is worth being clear that
 * this is a *borrowing* rather than a convergence — a consultant who uses one
 * of them all day should not have to learn where the new-chat button is here.
 *
 * **It is chrome, so it takes the chrome's ground.** `--card`, like the header
 * and the composer, against the transcript's `--background`. That is this
 * product's own split rather than the reference's: Claude and ChatGPT put a
 * *darker* rail beside a lighter chat, which on a warm ivory palette would make
 * the sidebar the heaviest thing in the window and the conversation the
 * recessed one. Here the document is the tinted surface and the furniture is
 * white, everywhere, and a sidebar is furniture.
 *
 * **Collapsing leaves a rail rather than nothing.** A sidebar that vanishes
 * takes its own way back with it, and the only remaining handle would be a
 * button on the far side of the window from where the panel just was. The rail
 * is 56px and keeps all three controls, so nothing becomes unreachable in the
 * collapsed state — which is the same argument the Operations key makes for
 * keeping a `KEY` toggle below `sm` instead of dropping the key.
 */
function ChatSidebar({
  chats,
  current,
  collapsed,
  onToggle,
  onNew,
  canNew,
  onPick,
}: {
  chats: Chat[];
  /** The live transcript's title, or `null` when nothing has been asked. */
  current: string | null;
  collapsed: boolean;
  onToggle: () => void;
  onNew: () => void;
  canNew: boolean;
  onPick: (id: number) => void;
}) {
  return (
    <div
      className={cn(
        // Below `md` there is no room for it beside the conversation, and the
        // header's icons come back instead. See the note on them.
        "hidden shrink-0 flex-col border-r border-border md:flex",
        /* **`--muted`, not `--card`**, and this is what gives the column an
           edge to be. It was white, against a white header above it and an
           ivory transcript beside it: the only thing saying where it stopped
           was a 1px rule, and the only thing saying it *was* a region was that
           rule too. On the warm neutral the column is a recessed rail, its rows
           can come forward onto `--card` when they are the one you are in, and
           the shape reads at a glance the way it does in every product this is
           borrowed from — where the rail is the darker surface for the same
           reason.

           It is the one place in the product that surface is used at this
           scale, and it holds in both themes without a branch: light puts
           `--muted` below the card, dark puts it above, and either way the
           active row lands on `--card` and separates. */
        "bg-muted",
        // Width is the only thing that animates. A sidebar that slid or faded
        // would be the panel's second animation, and the ask pill already owns
        // the product's one moving thing.
        "transition-[width] duration-200 motion-reduce:transition-none",
        collapsed ? "w-14" : "w-64",
      )}
    >
      {/* **The toolbar is 48px with a rule under it, so it lands on the
          conversation header's own bottom border.** They were two rows of
          different heights with no rule between them, so the top-left corner of
          full view was an undefined white area rather than two columns of one
          window. `h-12` is the header's 28px content plus its `py-2.5`. */}
      <div
        className={cn(
          "flex h-12 shrink-0 items-center gap-1 border-b border-border px-2",
          collapsed && "justify-center",
        )}
      >
        <IconAction
          onClick={onToggle}
          pressed={!collapsed}
          label={collapsed ? "Show previous chats" : "Hide previous chats"}
          icon={<SidebarIcon />}
        />
        {!collapsed && (
          /* **Expanded it is a labelled button, not an icon**, because it is the
             one thing in this column that is an action rather than a
             destination. Everything below it is a list of places to go. On the
             rail's ground it takes `--card`, which is the same "raised out of
             the rail" the active row uses. */
          <button
            type="button"
            onClick={onNew}
            disabled={!canNew}
            className="ml-auto flex h-7 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-micro font-medium text-foreground shadow-card transition-colors hover:border-border-strong hover:bg-background disabled:pointer-events-none disabled:opacity-40"
          >
            <NewChatIcon />
            New chat
          </button>
        )}
      </div>

      {collapsed ? (
        /* The rail keeps the action and drops the list. Everything the list
           holds is a title, and a title in 56px is one letter. */
        <div className="flex justify-center pt-2">
          <IconAction
            onClick={onNew}
            disabled={!canNew}
            label="New chat"
            icon={<NewChatIcon />}
          />
        </div>
      ) : (
        <div className="scroll-slim min-h-0 flex-1 space-y-0.5 overflow-y-auto p-2">
          {current && (
            <>
              <SidebarLabel>This chat</SidebarLabel>
              {/* Not a button. It is where you already are, and a row that looks
                  pressable and does nothing when pressed is worse than one that
                  never invited it. `aria-current` says so to a screen reader,
                  which the fill cannot. */}
              <p
                aria-current="true"
                className="rounded-md border border-border bg-card px-2.5 py-2 shadow-card"
              >
                <span className="line-clamp-2 text-small font-medium">{current}</span>
                <span className="mt-0.5 block text-micro text-evidence">Open now</span>
              </p>
            </>
          )}

          {chats.length > 0 && <SidebarLabel>Earlier</SidebarLabel>}
          <ul className="space-y-0.5">
            {chats.map((c) => (
              <li key={c.id}>
                <ChatRow chat={c} onPick={onPick} />
              </li>
            ))}
          </ul>

          {!current && chats.length === 0 && (
            <p className="reading px-2.5 pt-2 text-micro text-muted-foreground">
              Chats you start appear here. Nothing is kept between visits.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * One conversation, as a row.
 *
 * **The same component in the sidebar and in the docked panel's popover**, on
 * request that both be defined, and one row is what makes that true rather than
 * a promise: the two lists were written separately and had already drifted in
 * padding and in what they hid.
 *
 * The title takes two lines and then stops. It is a question somebody typed, so
 * it has no length of its own, and one truncated line cuts most of them at
 * "what does this mean by…". This is the one place in the product where hiding
 * text is right, because the row *is* the thing being restored: nothing here is
 * the only copy of anything.
 */
function ChatRow({
  chat,
  onPick,
  tone = "rail",
}: {
  chat: Chat;
  onPick: (id: number) => void;
  /** Which ground the row is sitting on. See below — this is not decoration. */
  tone?: "rail" | "card";
}) {
  const n = questionCount(chat);
  return (
    <button
      type="button"
      onClick={() => onPick(chat.id)}
      /* **The hover has to move away from whatever is under it, so the ground
         is a prop.** This is the trap `ThemeToggle` carries a `tone` for and
         `Avatar` after it, arriving a third time: one hover value cannot serve
         two grounds. On the sidebar's `--muted` rail the row comes forward onto
         `--card` with a border, which previews what pressing it does — the
         active row above is already saying raised means "this one". Inside the
         popover the ground *is* `--card`, so the same class would paint the row
         the colour it already was and the list would have no hover at all. */
      className={cn(
        "w-full rounded-md border border-transparent px-2.5 py-2 text-left transition-colors hover:border-border",
        tone === "rail" ? "hover:bg-card" : "hover:bg-muted",
      )}
    >
      <span className="line-clamp-2 text-small">{chat.title}</span>
      <span className="mt-0.5 block text-micro text-muted-foreground">
        {n} {n === 1 ? "question" : "questions"}
      </span>
    </button>
  );
}

const SidebarLabel = ({ children }: { children: ReactNode }) => (
  <p className="px-2.5 pb-1 pt-2.5 text-micro font-medium uppercase tracking-[0.12em] text-muted-foreground">
    {children}
  </p>
);

const questionCount = (c: Chat) => c.turns.filter((t) => t.role === "you").length;

/* A panel with its left column ruled off, which is the mark every one of these
   products uses for this control. Not a hamburger: three lines mean "a menu",
   and this shows and hides a column that is still there either way. */
const SidebarIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
    <rect
      x="1.8"
      y="2.8"
      width="12.4"
      height="10.4"
      rx="1.6"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <path d="M6.4 3v10" stroke="currentColor" strokeWidth="1.4" />
  </svg>
);

/**
 * The list of chats that are not the current one.
 *
 * **A popover under the button, not a rail down the side.** A sidebar is what a
 * dedicated chat product does, and it can afford one; this panel is 320px at
 * its floor and its whole job is to sit *beside* the thing being asked about.
 * Spending a third of it permanently on a list of four conversations would
 * make the assistant the subject of the screen.
 *
 * It closes on Escape and on a click anywhere outside it, which are the two
 * things anybody tries. **Escape stops there and does not reach the panel**:
 * one press should shut the thing you just opened, not the thing behind it.
 */
function ChatHistory({
  chats,
  onPick,
  onClose,
}: {
  chats: Chat[];
  onPick: (id: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      onClose();
    };
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    // Capture, so this runs before the panel's own Escape handler rather than
    // after it — otherwise one press closes both.
    document.addEventListener("keydown", onKey, true);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey, true);
      document.removeEventListener("mousedown", onDown);
    };
  }, [onClose]);

  return (
    <div
      ref={ref}
      /* `right-0`, against the edge it is nearest, for the reason `ProjectMenu`
         gives: a left-aligned popover on a right-hand trigger runs off the
         screen. `w-72` with `max-w-[calc(100vw-2rem)]` so it still fits when
         the panel is an overlay on a 375px phone. */
      className="absolute right-0 top-full z-10 mt-1.5 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border bg-card shadow-raised"
    >
      {/* **A titled header with the count, on `--muted`.** It was an unruled
          micro-cap sitting straight on the card, which reads as the first item
          in the list rather than as the name of it — the same fault the source
          strip's label had when it sat on the chips' own baseline. A tinted bar
          with a rule under it is what makes this a defined box rather than a
          floating list, and it is the rail's ground one screen across, so the
          two places this list appears are recognisably the same thing.

          The count is on the right, in figures. It is the answer to the only
          question you have before opening the menu: is there anything in
          here. */}
      <div className="flex items-baseline justify-between gap-2 border-b border-border bg-muted px-3 py-2">
        <p className="text-micro font-medium uppercase tracking-[0.12em] text-muted-foreground">
          Previous chats
        </p>
        <span className="tabular text-micro text-muted-foreground">{chats.length}</span>
      </div>
      {/* About six rows, then it scrolls. A popover taller than the panel it
          hangs off is a second panel. */}
      <ul className="scroll-slim max-h-72 space-y-0.5 overflow-y-auto p-1.5">
        {chats.map((c) => (
          <li key={c.id}>
            <ChatRow chat={c} onPick={onPick} tone="card" />
          </li>
        ))}
      </ul>
    </div>
  );
}

/* A sheet with a pen on it, which is the compose mark rather than a plus. A
   plus in this product adds a row to something you are looking at — a gap, a
   project — and this replaces what you are looking at instead. */
const NewChatIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
    <path
      d="M13.5 8.6v3.9a1 1 0 0 1-1 1h-9a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1h3.9"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M11.1 2.4 13.6 4.9 8.4 10.1l-3 .5.5-3 5.2-5.2Z"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
    />
  </svg>
);

/* A clock with its hand set back, not a list of lines. A list says "several
   things"; the point of this one is that they are *earlier* things. */
const HistoryIcon = () => (
  <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
    <path
      d="M2.6 8a5.4 5.4 0 1 0 1.6-3.8"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
    />
    <path
      d="M2.2 2.6v2.6h2.6"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path d="M8 5.2V8l1.9 1.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

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
          <div className="max-w-[85%] rounded-lg border border-dashed border-l-[3px] border-evidence border-l-evidence bg-evidence-muted py-1.5 pl-2.5 pr-3">
            <span className="flex items-center gap-1.5 text-micro font-semibold uppercase tracking-[0.08em] text-evidence">
              <Paperclip className="size-3 shrink-0" aria-hidden />
              {turn.attachment.kind}
            </span>
            <span className="mt-0.5 line-clamp-2 text-micro text-muted-foreground">
              {turn.attachment.text}
            </span>
          </div>
        )}
        {/* Files the question was sent with, above it and beside the subject
            chip. Names and sizes only — the transcript records *what you were
            pointing at*, not a handle to a document this prototype never
            opened. See `Turn.files`. */}
        {turn.files && (
          <ul className="flex max-w-[85%] flex-wrap justify-end gap-1.5">
            {turn.files.map((f) => (
              <li key={`${f.name}-${f.size}`}>
                <span className="flex max-w-full items-center gap-1.5 rounded-md border border-border bg-card py-1 px-2 text-micro">
                  <Paperclip className="size-3 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="truncate font-medium">{f.name}</span>
                  <span className="tabular shrink-0 text-muted-foreground">
                    {fileSize(f.size)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
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

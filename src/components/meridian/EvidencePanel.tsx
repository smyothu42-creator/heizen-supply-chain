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
import { money } from "@/lib/format";
import {
  claims,
  dealRisks,
  gapById,
  gaps,
  metricById,
  sourceById,
  sources,
  type SourceKind,
  timingSignals,
  type Tier,
} from "@/lib/suvarna";
import { ChevronIcon, CloseIcon, LayersIcon, SparkIcon, TierMark } from "./Icons";
import { SOURCE_ICON, SOURCE_KIND_LABEL } from "./Evidence";
import { Field } from "./GapRow";
import { ConfidenceChip } from "./Confidence";
import { useAi } from "@/components/shell/AiPanel";
import { EvidenceMark, HealthMark } from "./NodeCard";
import {
  COMPLETENESS_LABEL,
  COMPLETENESS_MEANING,
  HEALTH_LABEL,
  HEALTH_MEANING,
  childrenOf,
  entityById,
  nodeById,
  pathTo,
} from "@/lib/canvas";

/**
 * One right-hand slot, shared by every detail view. Never two panels at once —
 * a consultant with three panels open has lost the thread.
 * Overlays on narrow screens, splits the layout on wide ones.
 * See .claude/skills/layout-and-density.
 */

export type PanelTarget =
  | { kind: "gap"; id: string }
  | { kind: "claim"; id: string }
  | { kind: "source"; id: string }
  /** Every source behind this dossier, as a list. No id: the subject is the
      whole set, not one of them. */
  | { kind: "sources" }
  | { kind: "node"; id: string }
  | { kind: "entity"; id: string }
  | null;

interface PanelContextValue {
  target: PanelTarget;
  open: (t: NonNullable<PanelTarget>) => void;
  close: () => void;
  /** Browser-style history within the panel. Opening a source from the resource
      list and wanting to get back to the list is the common case, and closing
      and reopening loses the filter you had set. */
  back: () => void;
  forward: () => void;
  canBack: boolean;
  canForward: boolean;
}

const PanelContext = createContext<PanelContextValue>({
  target: null,
  open: () => {},
  close: () => {},
  back: () => {},
  forward: () => {},
  canBack: false,
  canForward: false,
});

export const usePanel = () => useContext(PanelContext);

/* -------------------------------------------------------------------------- */
/* Going down a level, from inside the panel                                   */
/* -------------------------------------------------------------------------- */

/**
 * **The panel cannot reach the canvas, so the canvas hands it a way down.**
 *
 * `EvidencePanel` is mounted by `AppShell`, above every surface; `CanvasView`
 * owns the level, the Level 2 parent and the drill rules. There is no prop path
 * between them and there should not be — the panel is shared by six surfaces
 * and none of the other five has a level to change.
 *
 * **An external store rather than context state**, which is the third time this
 * codebase has reached for this shape and for the same reason each time: a
 * provider registering a handler in an effect is a synchronous `setState`
 * inside one, and `pnpm lint` rejects it. `useSyncExternalStore` gives the
 * panel a value that updates when a canvas mounts or unmounts, with no render
 * cascade. Same as the assistant's width and `Frames`' collapse state.
 *
 * **It is registered, not assumed.** The button asks the store rather than
 * asking `canDrill()` alone, so on a surface with no canvas mounted it does not
 * render at all. A control that is visible and does nothing is the thing this
 * product keeps writing down that it will not ship.
 */
type Driller = (id: string) => void;
let driller: Driller | null = null;
const drillListeners = new Set<() => void>();

/** Call from a canvas surface's effect. Returns the cleanup. */
export function registerDrill(fn: Driller) {
  driller = fn;
  drillListeners.forEach((l) => l());
  return () => {
    // Guarded, or a canvas unmounting after a newer one registered would clear
    // the newer one's handler on its way out.
    if (driller !== fn) return;
    driller = null;
    drillListeners.forEach((l) => l());
  };
}

const subscribeDrill = (cb: () => void) => {
  drillListeners.add(cb);
  return () => drillListeners.delete(cb);
};

const useDriller = () =>
  useSyncExternalStore(
    subscribeDrill,
    () => driller,
    () => null,
  );

export function PanelProvider({ children }: { children: ReactNode }) {
  /* One stack and a cursor, in ONE piece of state.
     
     It was two `useState`s with `setI` called inside the `setStack` updater,
     which is a side effect inside a reducer: React invokes updaters twice under
     StrictMode, so the index advanced twice, ran off the end of the stack, and
     `target` came back undefined — the panel simply did not open in dev while
     working fine in the production build. One object, one pure updater. */
  const [hist, setHist] = useState<{ stack: NonNullable<PanelTarget>[]; i: number }>({
    stack: [],
    i: -1,
  });
  const lastTrigger = useRef<HTMLElement | null>(null);
  const { stack, i } = hist;
  const target = i >= 0 ? (stack[i] ?? null) : null;

  const open = useCallback((t: NonNullable<PanelTarget>) => {
    if (typeof document !== "undefined") {
      lastTrigger.current = document.activeElement as HTMLElement | null;
    }
    setHist((h) => {
      const cur = h.i >= 0 ? h.stack[h.i] : null;
      // Opening the thing already on screen should not add a step.
      if (cur && sameTarget(cur, t)) return h;
      // Opening from anywhere but the end truncates the forward half, so the
      // arrows can never walk into a branch nobody took.
      const next = [...h.stack.slice(0, h.i + 1), t];
      return { stack: next, i: next.length - 1 };
    });
  }, []);

  const close = useCallback(() => {
    setHist({ stack: [], i: -1 });
    // Focus goes back where it came from, or the user is stranded at the top
    // of the document with no idea what they just closed.
    lastTrigger.current?.focus?.();
  }, []);

  const back = useCallback(() => setHist((h) => ({ ...h, i: Math.max(0, h.i - 1) })), []);
  const forward = useCallback(
    () => setHist((h) => ({ ...h, i: Math.min(h.stack.length - 1, h.i + 1) })),
    [],
  );

  return (
    <PanelContext.Provider
      value={{ target, open, close, back, forward, canBack: i > 0, canForward: i < stack.length - 1 }}
    >
      <div className={cn("flex-1 min-h-0 flex flex-col", target && "lg:pr-[420px]")}>
        {children}
      </div>
      <EvidencePanel />
    </PanelContext.Provider>
  );
}

/** One chevron, rotated. Disabled rather than hidden — see the note in the
 *  header. */
function NavArrow({
  dir,
  onClick,
  disabled,
}: {
  dir: "back" | "forward";
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "rounded-md p-1 transition-colors",
        disabled
          ? "text-border-strong"
          : "text-muted-foreground hover:bg-muted hover:text-foreground",
      )}
    >
      <svg viewBox="0 0 16 16" width="15" height="15" fill="none" aria-hidden>
        <path
          d={dir === "back" ? "M10 3.5 5.5 8l4.5 4.5" : "M6 3.5 10.5 8 6 12.5"}
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="sr-only">{dir === "back" ? "Back" : "Forward"}</span>
    </button>
  );
}

const sameTarget = (a: NonNullable<PanelTarget>, b: NonNullable<PanelTarget>) =>
  a.kind === b.kind && ("id" in a ? a.id : "") === ("id" in b ? b.id : "");

function EvidencePanel() {
  const { target, close, back, forward, canBack, canForward } = usePanel();
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (target) panelRef.current?.focus();
  }, [target]);

  useEffect(() => {
    if (!target) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [target, close]);

  if (!target) return null;

  return (
    <>
      <button
        type="button"
        aria-label="Close detail"
        onClick={close}
        className="fixed inset-0 z-40 bg-foreground/20 lg:hidden"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-label="Detail"
        tabIndex={-1}
        className={cn(
          "fixed inset-y-0 right-0 z-50 w-full max-w-[420px] overflow-y-auto",
          "border-l border-border bg-card shadow-xl outline-none",
        )}
      >
        <div className="sticky top-0 flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-2.5">
          <span className="flex min-w-0 items-center gap-1">
            {/* Back and forward, left of the label, where a browser puts them.
                They are always rendered and disabled when there is nowhere to
                go — a control that appears and disappears as you navigate moves
                the label under the pointer. */}
            <NavArrow dir="back" onClick={back} disabled={!canBack} />
            <NavArrow dir="forward" onClick={forward} disabled={!canForward} />
          <span className="truncate text-micro font-medium text-muted-foreground">
            {target.kind === "gap" && "Gap detail"}
            {target.kind === "claim" && "Claim detail"}
            {target.kind === "source" && "Source"}
            {target.kind === "sources" && "Related resources"}
            {target.kind === "node" && "Process detail"}
            {target.kind === "entity" && "Entity detail"}
          </span>
          </span>
          {/* **`shrink-0`, so the longer label costs the kind word and not
              itself.** The panel is `w-full` under 420px, and at 375 the header
              is about 20px short of holding both at full width. Something has
              to give, and it is the left group: *Related resources* already
              carries `truncate` and is a restatement of what you just pressed,
              where the button is the only action in the header. Without this
              the flex row would take the difference out of the pill and wrap
              *Ask or Edit with Helix* onto two lines, which grows the header
              instead of shortening a label. */}
          <span className="flex shrink-0 items-center gap-1">
            {/* **The assistant is reachable from the panel header, not from a
                block at the bottom of it.** This panel runs four screens on a
                well-evidenced node, and an action that only exists past the
                fold is an action nobody finds while a call is running. It sits
                beside Close because those are the two things you do *to* the
                panel rather than read inside it. */}
            <AskHelix target={target} onDone={close} />
            <button
              type="button"
              onClick={close}
              className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <CloseIcon />
              <span className="sr-only">Close</span>
            </button>
          </span>
        </div>

        <div className="px-4 py-4">
          {target.kind === "gap" && <GapDetail id={target.id} />}
          {target.kind === "claim" && <ClaimDetail id={target.id} />}
          {target.kind === "source" && <SourceDetail id={target.id} />}
          {target.kind === "sources" && <SourceList />}
          {target.kind === "node" && <NodeDetail id={target.id} />}
          {target.kind === "entity" && <EntityDetail id={target.id} />}
        </div>

        {target.kind === "node" && <DrillFooter id={target.id} onDone={close} />}
      </div>
    </>
  );
}

/**
 * The way down a level, pinned to the foot of the panel.
 *
 * **Sticky, because a well-evidenced process runs several screens.** The panel
 * already learned this about `AskHelix`: an action that only exists past the
 * fold is one nobody finds while a call is running. The difference is that Ask
 * is something you do *to* the panel, so it sits in the header with Close;
 * this is where you go *next*, so it sits at the end, which is where the reader
 * arrives having decided.
 *
 * **It renders only when there is somewhere to go and something to take you
 * there.** `canDrill` answers the first, the driller store the second: on a
 * surface with no canvas mounted the button is absent rather than dead.
 *
 * **It closes the panel on the way.** The map is now showing this node's
 * children, so the open detail is a description of the level you have just
 * left, sitting over the level you asked for.
 */
function DrillFooter({ id, onDone }: { id: string; onDone: () => void }) {
  const drill = useDriller();
  const node = nodeById(id);
  const kids = childrenOf(id);

  if (!drill || kids.length === 0) return null;

  return (
    <div
      /* `sticky bottom-0` inside the panel's own scroller, so it rides the
         content on a short panel and pins on a long one without the panel
         needing to become a three-row grid. The top border is what stops the
         last card appearing to run underneath a floating button. */
      className="sticky bottom-0 border-t border-border bg-card px-4 py-3"
    >
      <button
        type="button"
        onClick={() => {
          drill(id);
          onDone();
        }}
        /* **Filled in `--primary`**, on request, keeping
           `RelatedResources`' shape: full width, a mark, a label, a chevron.
           It is the one thing in this panel you press to go somewhere rather
           than to read, and the panel's other filled control — the ask pill —
           is in the header and never adjacent to it.

           `hover:opacity-90` rather than a colour shift, which is what every
           other filled button in the product does: `--primary` is one value in
           two roles, the chrome strip and every fill, and there is no lighter
           step of it to move to. */
        className="flex w-full items-center justify-between gap-2 rounded-md bg-primary px-3 py-2 text-small font-medium text-primary-foreground shadow-card transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="flex min-w-0 items-center gap-2">
          <LayersIcon className="shrink-0" />
          {/* The count and the noun, because "Go deeper" says neither how far
              nor into what. Level 0 holds processes and Level 1 holds
              sub-processes; §4 is the only place that vocabulary is stated, so
              the button is a chance to state it where it is used. */}
          <span className="truncate">
            Open the {kids.length}{" "}
            {node.level === 0
              ? kids.length === 1
                ? "process"
                : "processes"
              : kids.length === 1
                ? "sub-process"
                : "sub-processes"}{" "}
            inside
          </span>
        </span>
        {/* No rotation: `ChevronIcon` already points right, which is the
            direction this goes. It is the same mark the node's own footer strip
            ends with, so the two ways down wear the same sign. */}
        <ChevronIcon className="shrink-0" />
      </button>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

/**
 * Hand this panel's subject to Helix.
 *
 * **This is §5's correction route, not a second one.** The rule is that users
 * never hand-edit AI output; they describe the change and the assistant applies
 * it, so the audit log keeps one shape. Every "This isn't right" and "Describe
 * the correction" button in this file arrives here, and so does the plain *Ask*
 * in the header, because a consultant who wants a process explained and one who
 * wants it corrected are opening the same conversation about the same object.
 *
 * **It attaches the subject rather than composing a question.** `attach` puts a
 * chip above the composer and drops the caret in the box; it does not send.
 * That matters most for the correction route, where §5's whole instruction is
 * *describe the correction in your own words* — a button that sent "this is
 * wrong" on the user's behalf would be answering the question it was supposed
 * to ask. `query` carries the subject's name so `answerFor` has something good
 * to route on when the typed question matches nothing; `matchNode` in
 * `assistant.ts` exists for exactly that.
 */
/* **"Ask or Edit with Helix", not "Ask Helix"**, on request, and only here —
   the masthead pill keeps the short form. See `AiButton` for why the two are
   allowed to differ.

   The long version earns its width on this button and not on that one. §5 is
   explicit that users never hand-edit AI output: they describe the correction
   and the assistant applies it. So this control is the *only* way anything in
   the product gets changed, and every "This isn't right" and "Describe the
   correction" button in this file already arrives at it. A consultant looking
   for how to fix a wrong finding had no word on screen saying it was this. The
   masthead's opens an empty conversation with nothing attached, where there is
   no output to correct and the word would be a promise about the wrong screen.

   The cost is about 80px in a 420px header, which is why the header row had to
   give the label somewhere to wrap to. */
function AskHelix({
  target,
  onDone,
  label = "Ask or Edit with Helix",
  variant = "icon",
}: {
  target: NonNullable<PanelTarget>;
  onDone?: () => void;
  label?: string;
  variant?: "icon" | "button";
}) {
  const { attach } = useAi();
  const subject = subjectOf(target);

  const go = () => {
    attach({ kind: KIND_LABEL[target.kind], text: subject, query: subject });
    /* The assistant pushes the page from `lg` and overlays below it, so leaving
       this panel open would put two drawers on a phone. */
    onDone?.();
  };

  if (variant === "button") {
    return (
      <button
        type="button"
        onClick={go}
        className="inline-flex items-center gap-1.5 rounded-md border border-border-strong bg-card px-2.5 py-1 text-small transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <SparkIcon />
        {label}
      </button>
    );
  }

  return (
    /* **Filled, on request, and it is `.ask-pill` rather than a new
       treatment.** This is the same act as the button on the masthead, with the
       same name on it, so it should be the same object; a second highlighted
       style for one control is how a product ends up with two Ask buttons that
       look related rather than identical.

       As grey micro text beside a grey close cross it read as a label on the
       panel rather than as the one thing in the header that opens something.
       That is the same argument `AiButton` records for being the only filled
       control in the chrome.

       **No ring and no halo.** `.ask-pill-live` and the `.ask-ring` element are
       left to the masthead: the two buttons are on screen at once, and two
       chase lights running the same lap is a fairground. The fill is what
       carries it here. Colours come from the `--masthead-*` family in both
       themes, which is deliberate — this pill does not invert, so the pairing
       is the one already measured on the band. */
    <button
      type="button"
      onClick={go}
      className="ask-pill flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-micro font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <SparkIcon />
      {label}
    </button>
  );
}

/** The chip's micro-cap. It says what kind of thing was handed over. */
const KIND_LABEL: Record<NonNullable<PanelTarget>["kind"], string> = {
  gap: "Gap",
  claim: "Claim",
  source: "Source",
  sources: "Resources",
  node: "Process",
  entity: "Entity",
};

function subjectOf(target: NonNullable<PanelTarget>): string {
  if (target.kind === "gap") return gapById(target.id).title;
  if (target.kind === "node") return nodeById(target.id).name;
  if (target.kind === "entity") return entityById(target.id).name;
  if (target.kind === "source") return sourceById(target.id).name;
  if (target.kind === "sources") return "the sources behind this research";
  return claims.find((c) => c.id === target.id)?.statement ?? "this";
}

/**
 * A short fact, as a row rather than a sentence.
 *
 * The Operations panel opened with a two-column grid carrying four lines: two
 * labels, two values and **two full sentences of grey gloss**, before the
 * reader had reached anything they came for. `Fact` is the same information as
 * a scannable pair, and the gloss appears only where it earns its line — see
 * `NodeDetail`.
 */
function Fact({
  label,
  children,
  wide,
}: {
  label: string;
  children: ReactNode;
  wide?: boolean;
}) {
  return (
    /* **A card each, in the gap detail's voice**, on request: bordered, white,
       shadowed, with the label over a rule that bleeds to both edges. It was
       four pairs sharing one `bg-muted` block, where the only thing separating
       *Watch* from *Some evidence* was the column gap, and the two are answers
       to different questions.

       It is the same shape as `Block boxed` two functions up and as `Field
       boxed` on Gaps, which is the point: one panel, one kind of box.

       **The label stays a micro-cap rather than taking Field's ink-at-600**,
       and that is a deliberate departure. There the body is a paragraph and the
       label has to be the landmark; here the body is two words and promoting
       the label would make *How it runs* louder than *Watch*. The value is what
       the eye is meant to land on. */
    <div
      className={cn(
        "rounded-lg border border-border bg-card px-3 py-2 shadow-card",
        wide && "col-span-2",
      )}
    >
      <dt className="-mx-3 border-b border-border px-3 pb-1.5 text-micro font-medium text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-2 flex items-center gap-1.5 text-small font-medium">{children}</dd>
    </div>
  );
}

function TierLine({ tier }: { tier: Tier }) {
  const label =
    tier === "confirmed" ? "Confirmed" : tier === "inferred" ? "Inferred" : "Unverified";
  return (
    <span className="inline-flex items-center gap-1.5 text-micro text-muted-foreground">
      <TierMark tier={tier} />
      {label}
    </span>
  );
}

function Excerpts({ items }: { items: { excerpt: string; label: string }[] }) {
  return (
    <ul className="space-y-3 border-l border-border pl-3">
      {items.map((it, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[15px] top-[7px] h-1.5 w-1.5 rounded-full bg-evidence" aria-hidden />
          <blockquote className="text-small">{it.excerpt}</blockquote>
          <div className="mt-1 text-micro text-muted-foreground">{it.label}</div>
        </li>
      ))}
    </ul>
  );
}

/**
 * A titled block in the panel.
 *
 * **Boxed everywhere, on request**, which is what `boxed = true` as the default
 * means: the whole panel is cards now, on every one of its six kinds of target.
 * It is the gap detail's card and the same argument `Field` already makes — a
 * hairline box with its label in ink at 600 over a rule that bleeds to both
 * edges — and one prop rather than a second component is what stops two copies
 * of that shape drifting apart.
 *
 * It used to be off by default, on the argument that the gap, claim, node and
 * entity details are one thing read top to bottom while *Related resources* is
 * a list of separate records. That argument is the one Research Full still
 * wins with, and it does not survive here: this panel is 420px of small type
 * where *The numbers here*, *Gaps here* and *Sources* are answers to three
 * separate questions, and grey micro-cap headings on one continuous ground gave
 * a reader nothing to aim at. The `Fact` strip above them was already carded.
 *
 * `boxed={false}` is still available for a block that genuinely is a
 * continuation of the one above it. Nothing passes it.
 */
function Block({
  title,
  boxed = true,
  children,
}: {
  title: string;
  boxed?: boolean;
  children: ReactNode;
}) {
  return (
    <section
      className={cn(
        "mt-5 first:mt-0",
        boxed && "rounded-lg border border-border bg-card px-4 py-3 shadow-card",
      )}
    >
      <h3
        className={cn(
          "text-micro font-medium text-muted-foreground",
          boxed &&
            "-mx-4 border-b border-border px-4 pb-2 text-small font-semibold tracking-normal text-foreground",
        )}
      >
        {title}
      </h3>
      <div className={boxed ? "mt-3" : "mt-1.5"}>{children}</div>
    </section>
  );
}

function GapDetail({ id }: { id: string }) {
  const gap = gapById(id);

  return (
    <div>
      <h2 className="text-h3 font-medium tracking-tight">{gap.title}</h2>
      <p className="mt-1.5 text-small text-muted-foreground">{gap.plainLine}</p>

      {gap.unpricedReason && (
        <p className="mt-3 rounded-md border border-dashed border-border-strong bg-muted px-3.5 py-2.5 text-small">
          {gap.unpricedReason}
        </p>
      )}

      {/* **The five cards, the same shape the inline detail used.** They moved
          here when the Gaps row stopped expanding, and they had to come whole:
          a micro-cap label over a hairline box is what makes five answers to
          five questions scannable, where five labelled paragraphs on one ground
          is a wall of small grey text with headings in it.

          `Field` is imported from `GapRow` rather than copied. Two versions of
          this drifting apart is exactly what the `boxed` prop exists to
          prevent. */}
      <dl className="mt-4 space-y-3">
        <Field label="What we think is happening" boxed emphasis>
          {gap.hypothesis}
        </Field>

        <Field
          label="Why we believe it"
          boxed
          right={<ConfidenceChip level={gap.confidence} />}
        >
          {gap.why}
          <span className="mt-2 block text-muted-foreground">{gap.confidenceReason}</span>
        </Field>

        <Field label="Expected impact" boxed>
          {gap.impact}
        </Field>

        {gap.stillUnknown.length > 0 && (
          /* The dashed one. Everything else in the stack is something we are
             telling the consultant; this is the part we cannot. */
          <Field label="Still unknown" boxed tone="watch">
            <ul className="space-y-1">
              {gap.stillUnknown.map((u) => (
                <li key={u}>{u}</li>
              ))}
            </ul>
          </Field>
        )}

        {gap.nextSteps.length > 0 && (
          <Field label="Next steps" boxed>
            <ul className="space-y-1">
              {gap.nextSteps.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ul>
          </Field>
        )}
      </dl>

      <Block title={`Evidence · ${gap.evidence.length}`}>
        <Excerpts
          items={gap.evidence.map((e) => ({
            excerpt: e.excerpt,
            label: `${sourceById(e.sourceId).name} · ${e.locator}`,
          }))}
        />
      </Block>

    </div>
  );
}

function ClaimDetail({ id }: { id: string }) {
  const claim = claims.find((c) => c.id === id)!;
  const gap = claim.linkedGapId ? gapById(claim.linkedGapId) : null;

  return (
    <div>
      <TierLine tier={claim.tier} />
      <h2 className="mt-2 text-lead font-medium measure">{claim.statement}</h2>

      <Block title="What this rests on">
        <p className="text-small measure">{claim.basis}</p>
      </Block>

      {claim.sourceIds.length > 0 ? (
        <Block title={`Sources · ${claim.sourceIds.length}`}>
          <ul className="space-y-1.5">
            {claim.sourceIds.map((sid) => {
              const s = sourceById(sid);
              return (
                <li key={sid} className="text-small">
                  {s.name}
                  <span className="text-muted-foreground"> · {s.detail}</span>
                </li>
              );
            })}
          </ul>
        </Block>
      ) : (
        <Block title="Sources">
          <p className="text-small text-muted-foreground measure">
            Nothing is attached to this. It came from reasoning, not from a document. Treat it as a
            question, not a statement.
          </p>
        </Block>
      )}

      {gap && (
        <Block title="What it is worth">
          <p className="text-small">
            <span className="tabular font-medium">{money(gap.amountCr)}</span>{" "}
            <span className="text-muted-foreground">{gap.title}</span>
          </p>
        </Block>
      )}
    </div>
  );
}

/**
 * A process on the Operations map.
 *
 * **Rebuilt to be scanned rather than read.** It opened with two labels, two
 * values and two full sentences of gloss before anything a consultant came
 * for, then ran two more paragraphs of empty-state prose, then the material.
 * On a surface read in the minutes before a call that is the wrong order and
 * the wrong register.
 *
 * What changed, in order of what it bought:
 *
 * - **The four facts are one strip of pairs**, health, evidence, gaps, worth.
 *   A label and a short value each, nothing that has to be read as a sentence.
 *   The eye lands on four values instead of parsing four lines of prose.
 * - **The glosses appear only where they earn their line.** `HEALTH_MEANING`
 *   under the strip, because "Critical" is a word a non-expert can misread;
 *   `COMPLETENESS_MEANING` only when there is no evidence, which is the one
 *   case where the label alone would let a colour be trusted. §7.6 asks for a
 *   term to be glossed once, not for every state to carry a paragraph.
 * - **The two empty-state paragraphs became one line each.** Both used to end
 *   with an instruction — "add a transcript or ask about it on the next call" —
 *   which is now the *Ask Helix* button rather than a sentence about a button
 *   that did not exist.
 * - **Metric glosses are one line, clamped.** Three of them stacked was three
 *   sentences between the reader and the gaps below.
 */
function NodeDetail({ id }: { id: string }) {
  const node = nodeById(id);
  const trail = pathTo(id);
  const value = node.gapIds.reduce((s, gid) => s + (gapById(gid).amountCr ?? 0), 0);

  return (
    <div>
      <nav aria-label="Level" className="text-micro text-muted-foreground">
        {trail.map((n, i) => (
          <span key={n.id}>
            {i > 0 && <span aria-hidden> → </span>}
            {i === 0 ? `Level 0 · ${n.name}` : n.name}
          </span>
        ))}
      </nav>

      <h2 className="mt-1.5 text-h3 font-medium tracking-tight">{node.name}</h2>
      <p className="mt-1.5 text-small text-muted-foreground measure">{node.plainLine}</p>

      {/* The two axes stay stated separately and are never merged into one
          badge: a healthy process with no data and a critical one with full
          evidence are opposite situations. What they no longer carry is a
          sentence each. */}
      <dl className="mt-3 grid grid-cols-2 gap-2.5">
        <Fact label="How it runs">
          <HealthMark
            health={node.health}
            className={
              node.health === "critical"
                ? "text-health-critical"
                : node.health === "watch"
                  ? "text-health-watch"
                  : "text-health-healthy"
            }
          />
          {HEALTH_LABEL[node.health]}
        </Fact>
        <Fact label="Evidence">
          <EvidenceMark completeness={node.completeness} />
          {COMPLETENESS_LABEL[node.completeness]}
        </Fact>
        <Fact label="Gaps here">
          <span className="tabular">{node.gapIds.length}</span>
        </Fact>
        <Fact label="Worth">
          <span className="tabular">{value > 0 ? `${money(value)} a year` : "Not priced"}</span>
        </Fact>
      </dl>

      {/* One line, not two, and only when the box below is not showing.
          "Critical" is the word a non-expert can misread, so it keeps its
          gloss — but on an unevidenced node the callout underneath says the
          same thing better, and the two ran as near-duplicates: *"We looked and
          found nothing worth raising"* directly above *"We looked and found
          nothing."* Two sentences of the same sentence is the text-heaviness
          this panel was rebuilt to lose. */}
      {node.completeness !== "none" && (
        <p className="mt-2 text-micro text-muted-foreground measure">
          {HEALTH_MEANING[node.health]}
        </p>
      )}

      {/* The flag first, above everything it casts doubt on. Read after the
          metrics and the gaps it is about, "this may be wrong" arrives too late
          to change how they were read — the same argument the Gaps detail makes
          for putting the confidence chip in the card header. */}
      {node.needsCorrection && (
        <div className="mt-3 rounded-md border border-foreground bg-muted px-3.5 py-3">
          <p className="flex items-center gap-1.5 text-micro font-medium ">
            <span
              className="rounded-[3px] bg-foreground px-1 py-[2px] text-[10px] normal-case tracking-normal text-card"
              aria-hidden
            >
              Check
            </span>
            Somebody has flagged this
          </p>
          <p className="mt-1.5 text-small measure">{node.needsCorrection}</p>
          {/* §5: no hand-editing. The button opens the assistant, which is the
              same route every correction in this file takes, so the audit log
              has one shape. */}
          <div className="mt-2.5">
            <AskHelix
              target={{ kind: "node", id }}
              label="Describe the correction"
              variant="button"
            />
          </div>
        </div>
      )}

      {node.completeness === "none" && (
        <p className="mt-3 rounded-md border border-dashed border-border-strong px-3.5 py-2.5 text-small measure">
          <span className="font-medium">
            {node.health === "unknown"
              ? "No reading here. "
              : "We looked and found nothing. "}
          </span>
          <span className="text-muted-foreground">
            {node.health === "unknown"
              ? COMPLETENESS_MEANING.none
              : "That is a result, not an absence, which is why this one keeps a colour."}
          </span>
        </p>
      )}

      {node.metricIds.length > 0 && (
        <Block title="The numbers here">
          <ul className="space-y-2">
            {node.metricIds.map((mid) => {
              const m = metricById(mid);
              return (
                <li key={mid} className="text-small">
                  <div className="flex items-baseline justify-between gap-3">
                    <span>{m.label}</span>
                    <span className="tabular shrink-0">
                      <span className="font-medium">
                        {m.actual == null ? "Not measured" : `${m.actual}${m.unit}`}
                      </span>
                      <span className="text-metric-best-in-class">
                        {" "}
                        vs {m.bestInClass}
                        {m.unit}
                      </span>
                    </span>
                  </div>
                  {/* **The gloss wraps rather than truncating**, and that is a
                      reversal within this same change. Clamping it to one line
                      read as the tidier panel and is the mistake the density
                      pass already recorded about the claim ledger: truncated
                      text is pure cost, because the words are paid for and
                      cannot be read. Aryan is not a supply-chain expert (§7.6)
                      and "first-time match rate" is exactly the term he cannot
                      decode, so the sentence stays whole. The density win on
                      this panel comes from the strip and the empty states,
                      not from cutting a definition in half. */}
                  <p className="text-micro text-muted-foreground">{m.gloss}</p>
                </li>
              );
            })}
          </ul>
        </Block>
      )}

      {node.gapIds.length > 0 ? (
        <Block title={`Gaps here · ${node.gapIds.length}`}>
          <ul className="space-y-1.5">
            {node.gapIds.map((gid) => {
              const g = gapById(gid);
              return (
                <li key={gid} className="flex items-baseline justify-between gap-3 text-small">
                  <span className="measure">{g.title}</span>
                  <span className="tabular shrink-0 font-medium">{money(g.amountCr)}</span>
                </li>
              );
            })}
          </ul>
        </Block>
      ) : (
        /* The count and the money are already in the strip above, so an empty
           "Gaps here · 0" block would be a heading over a restatement. What is
           left is the one thing the strip cannot say: which kind of empty. */
        node.completeness !== "none" && (
          <Block title="Gaps here · 0">
            <p className="text-small text-muted-foreground measure">
              {node.emptyKind === "confirmed-none"
                ? "We looked and found nothing worth raising."
                : "Not yet researched. Nothing here is a finding either way."}
            </p>
          </Block>
        )
      )}

      <Block title={`Sources · ${node.sourceIds.length}`}>
        {node.sourceIds.length > 0 ? (
          <ul className="space-y-1.5">
            {node.sourceIds.map((sid) => {
              const s = sourceById(sid);
              return (
                <li key={sid} className="text-small">
                  {s.name}
                  <span className="text-muted-foreground"> · {s.detail}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-small text-muted-foreground">Nothing attached to this process.</p>
        )}
      </Block>
    </div>
  );
}

function EntityDetail({ id }: { id: string }) {
  const entity = entityById(id);
  const value = entity.gapIds.reduce((s, gid) => s + (gapById(gid).amountCr ?? 0), 0);

  return (
    <div>
      <span className="text-micro text-muted-foreground">
        Entity · a record that moves through the operation
      </span>
      <h2 className="mt-1.5 text-h3 font-medium tracking-tight">{entity.name}</h2>
      <p className="mt-1.5 text-small text-muted-foreground measure">{entity.plainLine}</p>

      {/* The same strip the process panel uses, with the two facts that were
          a headed block each folded into it. *Where it lives* and *How much of
          it* were a micro-cap heading over four words twice over: a heading
          costs about as much vertical space as the fact under it, which is the
          worst ratio on the page. As pairs in the strip they are read in the
          same glance as the health. */}
      <dl className="mt-3 grid grid-cols-2 gap-2.5">
        <Fact label="How it runs">
          <HealthMark
            health={entity.health}
            className={
              entity.health === "critical"
                ? "text-health-critical"
                : entity.health === "watch"
                  ? "text-health-watch"
                  : "text-health-healthy"
            }
          />
          {HEALTH_LABEL[entity.health]}
        </Fact>
        <Fact label="Evidence">
          <EvidenceMark completeness={entity.completeness} />
          {COMPLETENESS_LABEL[entity.completeness]}
        </Fact>
        <Fact label="Where it lives">{entity.system}</Fact>
        <Fact label="How much of it">
          <span className="tabular">{entity.volume}</span>
        </Fact>
      </dl>

      <p className="mt-2 text-micro text-muted-foreground measure">
        {HEALTH_MEANING[entity.health]}
      </p>

      <Block title={`Gaps involving it · ${entity.gapIds.length}`}>
        {entity.gapIds.length > 0 ? (
          <>
            <p className="mb-2 tabular text-small font-medium">{money(value)} a year</p>
            <ul className="space-y-1.5">
              {entity.gapIds.map((gid) => {
                const g = gapById(gid);
                return (
                  <li key={gid} className="flex items-baseline justify-between gap-3 text-small">
                    <span className="measure">{g.title}</span>
                    <span className="tabular shrink-0 font-medium">{money(g.amountCr)}</span>
                  </li>
                );
              })}
            </ul>
          </>
        ) : (
          <p className="text-small text-muted-foreground">Nothing found against this record.</p>
        )}
      </Block>

      <Block title={`Sources · ${entity.sourceIds.length}`}>
        {entity.sourceIds.length > 0 ? (
          <ul className="space-y-1.5">
            {entity.sourceIds.map((sid) => {
              const s = sourceById(sid);
              return (
                <li key={sid} className="text-small">
                  {s.name}
                  <span className="text-muted-foreground"> · {s.detail}</span>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-small text-muted-foreground">Nothing attached.</p>
        )}
      </Block>
    </div>
  );
}

/**
 * Every source behind the dossier, in one list.
 *
 * Opened from *Related resources* beside Fold all. The strip under the document
 * lead shows what is cited and collapses the rest into a count; this is the
 * whole folder, and the two answer different questions — "what does this page
 * rest on" against "what have we got".
 *
 * Split by whether anything cites it, because that is the only ordering anyone
 * would sort by, and the quiet half is the honest half: a consultant drops in a
 * folder, the pipeline reads all of it, and most documents corroborate rather
 * than carry a finding of their own.
 */
/* The filter survives a trip into a source and back. `SourceList` unmounts when
   the panel navigates, so component state would reset — and coming back to
   "All" after filtering to transcripts makes the back arrow feel like it went
   somewhere else. Module scope because there is only ever one panel. */
let lastKind: SourceKind | "all" = "all";

function SourceList() {
  const { open } = usePanel();
  const [kind, setKindState] = useState<SourceKind | "all">(lastKind);
  const setKind = (k: SourceKind | "all") => {
    lastKind = k;
    setKindState(k);
  };

  const cites = (id: string) =>
    claims.filter((c) => c.sourceIds.includes(id)).length +
    gaps.filter((g) => g.evidence.some((e) => e.sourceId === id)).length +
    timingSignals.filter((t) => t.items.some((i) => i.sourceId === id)).length +
    dealRisks.filter((r) => r.sourceIds.includes(id)).length;

  const shown = kind === "all" ? sources : sources.filter((s) => s.kind === kind);
  const carrying = shown.filter((s) => cites(s.id) > 0);
  const quiet = shown.filter((s) => cites(s.id) === 0);

  /* Only the kinds actually present, with their counts. A filter offering a
     type that returns nothing is a control that punishes you for using it. */
  const kinds = (["filing", "transcript", "email", "web"] as SourceKind[])
    .map((k) => [k, sources.filter((s) => s.kind === k).length] as const)
    .filter(([, n]) => n > 0);

  const Row = ({ id }: { id: string }) => {
    const s = sourceById(id);
    const Icon = SOURCE_ICON[s.kind];
    const n = cites(id);
    return (
      <li>
        <button
          type="button"
          onClick={() => open({ kind: "source", id })}
          className="group flex w-full items-start gap-3 rounded-md px-2 py-2.5 text-left transition-colors hover:bg-muted"
        >
          <Icon className="mt-0.5 shrink-0 text-evidence" />
          <span className="min-w-0 flex-1">
            <span className="block text-base transition-colors group-hover:text-muted-foreground">
              {s.name}
            </span>
            <span className="block text-small text-muted-foreground">{s.detail}</span>
          </span>
          <span className="tabular shrink-0 pt-0.5 text-small text-muted-foreground">
            {n > 0 ? `${n} cited` : s.date}
          </span>
        </button>
      </li>
    );
  };

  return (
    <div>
      <h2 className="text-h3 font-medium tracking-tight">Related resources</h2>
      <p className="mt-1 text-small text-muted-foreground">
        Everything ingested for this project. Open one to see what was drawn from it.
      </p>

      {/* The filter is chips rather than a dropdown: four options that each
          carry a count are worth showing at rest, and the counts are half the
          information — "2 email threads" is a fact about the research. */}
      <div className="mt-3 flex flex-wrap gap-1.5 border-b border-border pb-3">
        <FilterChip active={kind === "all"} onClick={() => setKind("all")}>
          All <span className="tabular">{sources.length}</span>
        </FilterChip>
        {kinds.map(([k, n]) => {
          const Icon = SOURCE_ICON[k];
          return (
            <FilterChip key={k} active={kind === k} onClick={() => setKind(k)}>
              <Icon />
              {SOURCE_KIND_LABEL[k]} <span className="tabular">{n}</span>
            </FilterChip>
          );
        })}
      </div>

      {carrying.length > 0 && (
        <Block title={`Behind a finding · ${carrying.length}`}>
          <ul className="-mx-2 divide-y divide-border">
            {carrying.map((s) => (
              <Row key={s.id} id={s.id} />
            ))}
          </ul>
        </Block>
      )}

      {quiet.length > 0 && (
        <Block title={`Read, nothing cited yet · ${quiet.length}`}>
          <p className="mb-1 text-small text-muted-foreground measure">
            Not a hole in the research. Most documents corroborate what is already known
            rather than carrying a finding of their own.
          </p>
          <ul className="-mx-2 divide-y divide-border">
            {quiet.map((s) => (
              <Row key={s.id} id={s.id} />
            ))}
          </ul>
        </Block>
      )}
    </div>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-micro transition-colors",
        active
          ? "border-primary bg-primary font-medium text-primary-foreground"
          : "border-border bg-card text-muted-foreground hover:border-border-strong hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function SourceDetail({ id }: { id: string }) {
  const source = sourceById(id);

  // Walking the chain backwards: everything this source produced.
  const drawnFrom = gaps.flatMap((g) =>
    g.evidence
      .filter((e) => e.sourceId === id)
      .map((e) => ({ excerpt: e.excerpt, label: `${e.locator} → ${g.title}`, gapId: g.id })),
  );
  const supports = claims.filter((c) => c.sourceIds.includes(id));

  return (
    <div>
      <h2 className="text-h3 font-medium tracking-tight">{source.name}</h2>
      <p className="mt-1 text-small text-muted-foreground">{source.detail}</p>
      <p className="mt-0.5 text-small text-muted-foreground">{source.date}</p>

      <Block title={`What we drew from it · ${drawnFrom.length}`}>
        {drawnFrom.length > 0 ? (
          <Excerpts items={drawnFrom} />
        ) : (
          <p className="text-small text-muted-foreground">Nothing yet.</p>
        )}
      </Block>

      <Block title={`Claims it supports · ${supports.length}`}>
        <ul className="space-y-1.5">
          {supports.map((c) => (
            <li key={c.id} className="text-small measure flex gap-2">
              <TierMark tier={c.tier} className="mt-1 shrink-0 text-muted-foreground" />
              <span>{c.statement}</span>
            </li>
          ))}
        </ul>
      </Block>
    </div>
  );
}

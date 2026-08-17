"use client";

import Link from "next/link";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { cn } from "@/lib/cn";
import { CheckIcon, CloseIcon } from "@/components/meridian/Icons";

/**
 * One place the product says *that worked*, in the top right corner.
 *
 * **On request, and it replaces two different habits.** Saving something used
 * to bump a pill pinned to the bottom right of every screen, and every form
 * that committed anything printed its own grey line beside its own button. So
 * the same act — a thing was recorded — was reported in a dozen registers, in a
 * dozen places, and half of them were below the fold of the thing that had just
 * been pressed.
 *
 * **The corner is fixed and the message is transient**, which is the whole
 * argument for a toast over an inline line: a consultant who has just pressed
 * *Save* is looking at the button, not at the corner, so the confirmation has to
 * find them rather than wait to be found. It sits under the masthead rather
 * than over it, because the band is chrome and a message about the page belongs
 * on the page's side of it.
 *
 * **It is announced, not just drawn.** The container is mounted for the life of
 * the app and carries `aria-live`, because a live region has to be in the DOM
 * before its content changes or the announcement is missed. That is the same
 * reason `SaveMenu`'s status line used to stay mounted and empty.
 */

export interface ToastAction {
  label: string;
  href: string;
}

export interface ToastOptions {
  /** A second, quieter line: the caveat, the file name, the count. */
  detail?: string;
  /** A way to the thing that was just saved. Buys the toast longer on screen. */
  action?: ToastAction;
}

interface Toast extends ToastOptions {
  id: number;
  message: string;
}

export interface ToastApi {
  notify: (message: string, opts?: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

export function useToast() {
  const api = useContext(ToastContext);
  if (!api) throw new Error("useToast must be used inside ToastProvider");
  return api;
}

/** Long enough to read a sentence; longer again if there is somewhere to go. */
const LINGER = 3400;
const LINGER_WITH_ACTION = 5600;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const next = useRef(0);
  const timers = useRef(new Map<number, ReturnType<typeof setTimeout>>());

  const dismiss = useCallback((id: number) => {
    const timer = timers.current.get(id);
    if (timer) clearTimeout(timer);
    timers.current.delete(id);
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, opts?: ToastOptions) => {
      const id = (next.current += 1);
      /* Three at a time. A fourth pushes the first out rather than growing a
         column down the side of the window: nobody reads a stack of
         confirmations, they read the last one. */
      setToasts((prev) => [...prev.slice(-2), { id, message, ...opts }]);
      timers.current.set(
        id,
        setTimeout(() => dismiss(id), opts?.action ? LINGER_WITH_ACTION : LINGER),
      );
    },
    [dismiss],
  );

  /* The timers outlive the toasts they were set for if the app unmounts mid
     flight, which in a client-navigated shell is a reload rather than a leak.
     Cleared anyway, because a stray `setState` after unmount is a warning
     somebody else has to diagnose. */
  useEffect(() => {
    const map = timers.current;
    return () => {
      map.forEach((t) => clearTimeout(t));
      map.clear();
    };
  }, []);

  const api = useMemo<ToastApi>(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={api}>
      {children}

      {/* Above everything, including the full-screen map at `z-80`: a
          confirmation the reader cannot see is a button that appears to have
          done nothing. `pointer-events-none` on the column so an empty corner
          is not a dead zone over the page. */}
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-3 top-14 z-[90] flex w-[min(21rem,calc(100vw-1.5rem))] flex-col gap-2 sm:right-5"
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            role="status"
            className="toast-in pointer-events-auto flex items-start gap-2.5 rounded-lg border border-border-strong bg-card px-3.5 py-2.5 shadow-raised"
          >
            <span className="mt-0.5 shrink-0 text-evidence" aria-hidden>
              <CheckIcon />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-small font-medium leading-snug">{toast.message}</p>
              {toast.detail && (
                <p className="reading mt-0.5 text-micro text-muted-foreground">{toast.detail}</p>
              )}
              {toast.action && (
                <Link
                  href={toast.action.href}
                  onClick={() => dismiss(toast.id)}
                  className="mt-1 inline-block text-micro font-medium text-evidence transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {toast.action.label}
                </Link>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              aria-label="Dismiss"
              className={cn(
                "-mr-1 -mt-0.5 shrink-0 rounded-md p-1 text-muted-foreground transition-colors",
                "hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <CloseIcon />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

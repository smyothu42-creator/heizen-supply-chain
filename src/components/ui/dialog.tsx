"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui Dialog, on this product's tokens.
 *
 * Radix rather than a hand-rolled overlay for the three things a form in a box
 * has to get right and nothing on screen shows: focus is trapped inside it,
 * Escape closes it, and focus returns to whatever opened it. `GapPanel` already
 * documents finding that last one broken by driving it.
 *
 * **A dialog, not a drawer, and the split is what the thing is for.** The right
 * hand drawers in this product — evidence, the gap editor, the assistant — are
 * things you keep open *beside* the page you are reading. These are short forms
 * you finish and dismiss, and a form the page can be worked behind is a form
 * that gets filled in twice.
 *
 * The scrim is `--foreground` at 20%, the same one `AiPanel` uses below `lg`,
 * so a scrim means one thing everywhere: there is something above this.
 */

const Dialog = DialogPrimitive.Root;
const DialogTrigger = DialogPrimitive.Trigger;
const DialogClose = DialogPrimitive.Close;

function DialogContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-[90] bg-foreground/20" />
      <DialogPrimitive.Content
        data-slot="dialog-content"
        className={cn(
          "fixed left-1/2 top-1/2 z-[95] w-[calc(100vw-1.5rem)] max-w-lg -translate-x-1/2 -translate-y-1/2",
          // A dialog can be taller than a phone. It scrolls inside itself
          // rather than growing past the viewport, which is what puts the
          // submit button out of reach.
          "flex max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-lg border border-border bg-card text-foreground shadow-raised outline-none",
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          aria-label="Close"
          className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <X className="size-4" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}

function DialogHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-header"
      className={cn("shrink-0 border-b border-border px-5 py-4 pr-12", className)}
      {...props}
    />
  );
}

/** The scrolling middle. Everything that is not the header or the footer. */
function DialogBody({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-body"
      className={cn("min-h-0 flex-1 overflow-y-auto px-5 py-4", className)}
      {...props}
    />
  );
}

function DialogFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="dialog-footer"
      className={cn(
        // Below `sm` the buttons stack and the primary one is on top, where a
        // thumb is. Reversed order in the DOM would put focus out of step with
        // reading order, so the markup keeps Cancel first and the row does not
        // reverse — it simply goes full width.
        "flex shrink-0 flex-col-reverse gap-2 border-t border-border px-5 py-4 sm:flex-row sm:justify-end",
        className,
      )}
      {...props}
    />
  );
}

function DialogTitle({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Title>) {
  return (
    <DialogPrimitive.Title
      data-slot="dialog-title"
      className={cn("text-lead font-semibold leading-tight", className)}
      {...props}
    />
  );
}

function DialogDescription({
  className,
  ...props
}: React.ComponentProps<typeof DialogPrimitive.Description>) {
  return (
    <DialogPrimitive.Description
      data-slot="dialog-description"
      className={cn("mt-1 text-small text-muted-foreground", className)}
      {...props}
    />
  );
}

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogBody,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

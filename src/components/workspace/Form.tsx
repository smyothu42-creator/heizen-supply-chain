"use client";

import { useId, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

/**
 * The parts every form on the workspace surfaces is made of.
 *
 * One label voice, one hint voice, one error voice, in one file, because three
 * forms that each invent their own is how a product ends up with three.
 */

/**
 * A labelled control.
 *
 * **A real `<label htmlFor>`, never `aria-label`.** There is visible text, so
 * pointing at it beats repeating it. The same argument `SelectField` makes.
 *
 * The hint sits *under* the control and the error replaces it. Two lines of
 * grey under a box that is also red is the reader deciding which one to believe.
 */
export function Field({
  label,
  hint,
  error,
  required,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  required?: boolean;
  /** Takes the generated id, so the label points at the real control. */
  children: (id: string) => ReactNode;
  className?: string;
}) {
  const id = useId();
  return (
    <div className={cn("min-w-0", className)}>
      <label htmlFor={id} className="mb-1.5 flex items-baseline gap-1.5 text-small font-medium">
        {label}
        {/* **Parenthesised, on request.** Beside a label at the same baseline a
            bare *Required* reads as a second word in the label — "Company
            Required" — and on the two fields that carry it the eye has to
            decide whether the word is part of the name. Brackets say it is an
            aside about the field rather than more of its name. */}
        {required && (
          <span className="text-micro font-normal text-muted-foreground">(Required)</span>
        )}
      </label>
      {children(id)}
      {error ? (
        <p className="mt-1.5 text-micro text-health-critical" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-micro text-muted-foreground">{hint}</p>
      )}
    </div>
  );
}

/**
 * The heading on a workspace page.
 *
 * **These surfaces get an `h1` where the six project surfaces do not**, and it
 * is not an inconsistency. `SurfaceHero` dropped its title because the masthead
 * says *Operations* two inches above it in an underlined tab. Nothing on the
 * band says *Team*: the workspace is a level the tabs do not describe, so the
 * page has to name itself or the reader has only the side panel's highlight to
 * go on, and that is gone the moment the panel is shut.
 */
export function PageHead({
  title,
  line,
  children,
}: {
  title: string;
  line: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="min-w-0">
        <h1 className="font-display text-h1 leading-tight">{title}</h1>
        <p className="measure mt-1 text-small text-muted-foreground">{line}</p>
      </div>
      {children && <div className="flex shrink-0 flex-wrap gap-2">{children}</div>}
    </div>
  );
}

/**
 * The one confirm box, for everything destructive.
 *
 * **Refusing with a reason beats accepting and warning afterwards**, which the
 * plan panel already records about prerequisites. What that means here is that
 * the description says what else goes with the thing, not that the action
 * cannot be undone: everybody knows a delete cannot be undone and nobody knows
 * that deleting a project takes its sources with it.
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DialogBody className="py-0" />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


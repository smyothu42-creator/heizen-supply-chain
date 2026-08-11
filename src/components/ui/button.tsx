import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * shadcn/ui Button, with one deliberate departure from stock: the quiet
 * variants hover to `bg-muted` rather than `bg-accent`.
 *
 * shadcn's `--accent` is a hover *surface*. Meridian's `--accent` is the cyan
 * *ink* that means "somewhere to go" — the one colour this product spends
 * carefully. Letting a ghost button fill itself cyan on hover would spend it
 * forty times a screen. One token, one meaning, and `--muted` is already the
 * hover ground every row in the product uses.
 */
const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-small font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground shadow-card hover:bg-primary/90",
        destructive:
          "bg-health-critical text-primary-foreground shadow-card hover:bg-health-critical/90",
        outline:
          "border border-border-strong bg-card text-foreground shadow-card hover:bg-muted",
        secondary: "bg-muted text-foreground hover:bg-muted/70",
        ghost: "text-muted-foreground hover:bg-muted hover:text-foreground",
        link: "text-evidence underline-offset-4 hover:text-foreground",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-10 px-6 has-[>svg]:px-4",
        icon: "size-9",
        "icon-sm": "size-8",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };

import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-medium w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1.5 [&>svg]:pointer-events-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive transition-all duration-200 overflow-hidden",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary/15 text-primary [a&]:hover:bg-primary/25",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive/15 text-destructive [a&]:hover:bg-destructive/25 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20",
        outline:
          "text-foreground border-border/60 [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        success:
          "border-transparent bg-[oklch(0.92_0.06_170)] text-[oklch(0.40_0.12_170)] dark:bg-[oklch(0.25_0.06_170)] dark:text-[oklch(0.75_0.10_170)]",
        warning:
          "border-transparent bg-[oklch(0.94_0.06_85)] text-[oklch(0.45_0.12_85)] dark:bg-[oklch(0.28_0.06_85)] dark:text-[oklch(0.80_0.10_85)]",
        info:
          "border-transparent bg-[oklch(0.92_0.05_220)] text-[oklch(0.45_0.10_220)] dark:bg-[oklch(0.25_0.05_220)] dark:text-[oklch(0.72_0.08_220)]",
        error:
          "border-transparent bg-[oklch(0.94_0.06_25)] text-[oklch(0.50_0.16_25)] dark:bg-[oklch(0.28_0.08_25)] dark:text-[oklch(0.75_0.14_25)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }

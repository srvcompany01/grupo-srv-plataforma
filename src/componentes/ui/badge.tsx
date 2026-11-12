import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { Slot } from "radix-ui"

const badgeVariants = cva(
  "",
  {
    variants: {
      variant: {
        default: "",
        secondary:
          "",
        destructive:
          "",
        outline:
          "",
        ghost:
          "",
        link: "",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span"

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={className} {...props}
    />
  )
}

export { Badge, badgeVariants }

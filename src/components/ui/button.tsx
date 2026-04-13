import { cva, type VariantProps } from "class-variance-authority"
import { Loader2 } from "lucide-react"

import * as React from "react"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-base text-sm font-base ring-offset-white transition-all gap-2 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default:
          "text-main-foreground bg-main border-2 border-border shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
        noShadow: "text-main-foreground bg-main border-2 border-border",
        neutral:
          "bg-secondary-background text-foreground border-2 border-border shadow-shadow hover:translate-x-boxShadowX hover:translate-y-boxShadowY hover:shadow-none",
        reverse:
          "text-main-foreground bg-main border-2 border-border hover:translate-x-reverseBoxShadowX hover:translate-y-reverseBoxShadowY hover:shadow-shadow",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  children,
  disabled,
  loading = false,
  loadingText,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    loading?: boolean
    loadingText?: React.ReactNode
  }) {
  const isDisabled = disabled || loading
  const content = loading
    ? (loadingText ?? (size === "icon" ? null : children))
    : children
  const classNames = cn(buttonVariants({ variant, size, className }))

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      className?: string
      children?: React.ReactNode
    }>
    const childProps = child.props

    return React.cloneElement(child, {
      ...props,
      className: cn(classNames, childProps.className),
      "data-slot": "button",
      "aria-disabled": isDisabled,
      children: (
        <>
          {loading ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : null}
          {content}
        </>
      ),
    } as Record<string, unknown>)
  }

  return (
    <button
      data-slot="button"
      className={classNames}
      disabled={isDisabled}
      aria-disabled={isDisabled}
      {...props}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : null}
      {content}
    </button>
  )
}

export { Button, buttonVariants }

"use client"

import * as React from "react"
import * as CheckboxPrimitive from "@radix-ui/react-checkbox"
import { CheckIcon, MinusIcon } from "lucide-react"

import { cn } from "@/lib/utils"

type CheckboxProps = React.ComponentProps<typeof CheckboxPrimitive.Root> & {
  variant?: "default" | "glass"
}

function Checkbox({ className, variant = "default", ...props }: CheckboxProps) {
  const base = "peer group/checkbox size-5 shrink-0 rounded transition-all outline-none cursor-pointer"
  const defaultStyles = cn(
    "border border-white/15 bg-white/5",
    "data-[state=checked]:bg-accent/40 data-[state=checked]:text-white data-[state=checked]:border-accent/40 data-[state=indeterminate]:bg-accent/25 data-[state=indeterminate]:text-white data-[state=indeterminate]:border-accent/40",
    "hover:border-white/25 hover:bg-white/8 focus-visible:border-white/35 focus-visible:ring-accent/25"
  )
  const glassStyles = cn(
    "border border-white/15 bg-white/5 backdrop-blur-sm",
    "data-[state=checked]:bg-accent/40 data-[state=checked]:border-accent/40 data-[state=checked]:text-white",
    "hover:border-white/25 hover:bg-white/8 focus-visible:border-white/35 focus-visible:ring-accent/25"
  )

  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(
        base,
        variant === "glass" ? glassStyles : defaultStyles,
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <CheckboxPrimitive.Indicator
        data-slot="checkbox-indicator"
        className="grid place-content-center text-current transition-none"
      >
        {/* Partial selection shows a dash instead of the check */}
        <CheckIcon className="size-3.5 group-data-[state=indeterminate]/checkbox:hidden" />
        <MinusIcon className="size-3.5 hidden group-data-[state=indeterminate]/checkbox:block" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  )
}

export { Checkbox }


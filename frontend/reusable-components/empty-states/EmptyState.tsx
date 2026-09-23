"use client"

import * as React from "react"
import { LucideIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { ButtonPrimary } from "../../reusable-elements/buttons/ButtonPrimary"
import { Card, CardContent } from "../../reusable-elements/cards/Card"

interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  variant?: "default" | "glass" | "inline"
  className?: string
}

function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = "default",
  className,
}: EmptyStateProps) {
  const content = (
    <div className={cn("text-center", variant === "inline" ? "py-8" : "py-12")}>
      {Icon && (
        <div
          className={cn(
            "mx-auto mb-4",
            variant === "inline"
              ? "flex items-center justify-center"
              : "w-14 h-14 rounded-[16px] bg-white/[0.05] flex items-center justify-center"
          )}
        >
          <Icon className="w-6 h-6 text-white/45" />
        </div>
      )}
      <h3
        className={cn(
          "font-semibold text-white mb-2",
          variant === "inline" ? "text-base" : "text-xl"
        )}
      >
        {title}
      </h3>
      {description && (
        <p
          className={cn(
            "text-gray-400 mb-6",
            variant === "inline" ? "text-sm mb-4" : "max-w-md mx-auto"
          )}
        >
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <ButtonPrimary onClick={onAction}>
          {actionLabel}
        </ButtonPrimary>
      )}
    </div>
  )

  if (variant === "inline") {
    return <div className={className}>{content}</div>
  }

  return (
    <Card variant={variant === "glass" ? "glass" : "default"} className={className}>
      <CardContent>{content}</CardContent>
    </Card>
  )
}

export { EmptyState }
export type { EmptyStateProps }


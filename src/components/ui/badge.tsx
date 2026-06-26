"use client"

import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-indigo-600/20 text-indigo-300 border border-indigo-600/30",
        secondary: "bg-[#2a2a3a] text-gray-300 border border-[#3a3a4a]",
        destructive: "bg-red-600/20 text-red-300 border border-red-600/30",
        outline: "border border-[#2a2a3a] text-gray-300",
        success: "bg-emerald-600/20 text-emerald-300 border border-emerald-600/30",
        warning: "bg-amber-600/20 text-amber-300 border border-amber-600/30",
        purple: "bg-violet-600/20 text-violet-300 border border-violet-600/30",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }

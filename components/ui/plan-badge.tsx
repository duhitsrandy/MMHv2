/*
<ai_context>
This component displays a badge showing the user's current subscription plan.
</ai_context>
*/

"use client"

import { Badge } from "@/components/ui/badge"
import { usePlan } from "@/hooks/usePlan"
import { TIER_DETAILS } from "@/lib/stripe/tier-map"
import { Skeleton } from "@/components/ui/skeleton"
import { Crown, Star, Zap, Building } from "lucide-react"

interface PlanBadgeProps {
  showIcon?: boolean
  variant?: "default" | "outline" | "secondary" | "destructive"
  size?: "sm" | "default" | "lg"
}

const tierIcons = {
  starter: null,
  plus: <Star className="h-3 w-3" />,
  pro: <Zap className="h-3 w-3" />,
  business: <Building className="h-3 w-3" />,
}

const tierColors = {
  starter: "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300",
  plus: "bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300",
  pro: "bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-900 dark:text-purple-300",
  business: "bg-yellow-100 text-yellow-800 hover:bg-yellow-200 dark:bg-yellow-900 dark:text-yellow-300",
}

export function PlanBadge({ 
  showIcon = true, 
  variant = "default",
  size = "default" 
}: PlanBadgeProps) {
  const { tier, isLoading } = usePlan()

  if (isLoading) {
    return <Skeleton className="h-6 w-16" />
  }

  if (!tier) {
    return null
  }

  const tierName = TIER_DETAILS[tier]?.name || tier
  const icon = showIcon ? tierIcons[tier] : null

  return (
    <Badge 
      variant={variant}
      className={`
        ${variant === "default" ? tierColors[tier] : ""}
        ${size === "sm" ? "text-xs px-1.5 py-0.5" : ""}
        ${size === "lg" ? "text-sm px-3 py-1" : ""}
        flex items-center gap-1 font-medium
      `}
    >
      {icon}
      {tierName}
    </Badge>
  )
} 
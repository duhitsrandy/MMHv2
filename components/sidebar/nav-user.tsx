/*
<ai_context>
This client component provides a user button for the sidebar via Clerk.
</ai_context>
*/

"use client"

import { SidebarMenu, SidebarMenuItem } from "@/components/ui/sidebar"
import { UserButton, useUser } from "@clerk/nextjs"
import { PlanBadge } from "@/components/ui/plan-badge"

export function NavUser() {
  const { user } = useUser()

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex items-center gap-2 font-medium">
        <UserButton afterSignOutUrl="/" />
        <div className="flex flex-col gap-1">
          <span>{user?.fullName}</span>
          <PlanBadge size="sm" />
        </div>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}

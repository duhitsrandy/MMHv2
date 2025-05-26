"use server"

import { getUserPlanInfo } from "../lib/auth/plan" // Relative path
import { UserPlan } from "../types/index" // Relative path

export async function getUserPlanAction(): Promise<UserPlan | null> {
  // getUserPlanInfo handles authentication and fetching internally
  const planInfo = await getUserPlanInfo()
  return planInfo?.tier as UserPlan || null
} 
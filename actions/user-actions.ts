"use server"

import { getUserPlan } from "../lib/auth/plan" // Relative path
import { UserPlan } from "../types/index" // Relative path

export async function getUserPlanAction(): Promise<UserPlan | null> {
  // getUserPlan handles authentication and fetching internally
  return await getUserPlan()
} 
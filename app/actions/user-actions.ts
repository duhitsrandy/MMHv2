"use server";

import { getUserPlan } from "@/lib/auth/plan";
import { UserPlan } from "@/types";

export async function getUserPlanAction(): Promise<UserPlan | null> {
  try {
    const plan = await getUserPlan();
    return plan;
  } catch (error) {
    console.error("[getUserPlanAction] Error:", error);
    // Depending on how you want to handle errors in the hook,
    // you might re-throw, or return null/specific error structure.
    // For now, returning null to match current usePlan hook's expectation on error.
    return null;
  }
} 
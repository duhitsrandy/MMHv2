"use server";

// import { getUserPlan } from "@/lib/auth/plan"; // OLD
// import { UserPlan } from "@/types"; // OLD
import { getUserPlanInfo, UserPlanInfo } from "@/lib/auth/plan"; // NEW

// export async function getUserPlanAction(): Promise<UserPlan | null> { // OLD
export async function getUserPlanInfoAction(): Promise<UserPlanInfo | null> { // NEW
  try {
    // const plan = await getUserPlan(); // OLD
    const planInfo = await getUserPlanInfo(); // NEW
    return planInfo;
  } catch (error) {
    console.error("[getUserPlanInfoAction] Error:", error);
    // Depending on how you want to handle errors in the hook,
    // you might re-throw, or return null/specific error structure.
    // For now, returning null to match current usePlan hook's expectation on error.
    return null;
  }
} 
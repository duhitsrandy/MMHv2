"use server";

import { requirePlusPlan } from "@/lib/auth/plan";
import {
  getTravelTimeMatrixHere,
} from "@/lib/providers/here-platform";

// Define types for origins and destinations matching the provider
interface HereMatrixOrigin {
  lat: number;
  lng: number;
}

interface HereMatrixDestination {
  lat: number;
  lng: number;
}

interface MatrixActionParams {
  origins: HereMatrixOrigin[];
  destinations: HereMatrixDestination[];
}

// Action name reflects matrix calculation
export async function getTrafficMatrixHereAction(params: MatrixActionParams) {
  try {
    // Ensure user is on a Plus plan or higher
    await requirePlusPlan();

    const result = await getTravelTimeMatrixHere({
      origins: params.origins,
      destinations: params.destinations,
    });

    if (result.error) {
      return { success: false, error: result.error, data: null };
    }

    return { success: true, error: null, data: result.data };

  } catch (error: any) {
    console.error("[Action Error - getTrafficMatrixHereAction]", error);
    return {
      success: false,
      error: error.message || "An unexpected error occurred.",
      data: null,
    };
  }
} 
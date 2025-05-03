/*
<ai_context>
Contains the utility functions for the app.
</ai_context>
*/

import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from 'zod';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to get the base URL for the application
export function getBaseUrl() {
  if (typeof window !== "undefined") return ""; // browser should use relative url
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}` // Vercel
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL // Custom env var
  return `http://localhost:${process.env.PORT ?? 3000}` // Default to localhost
}

// Helper function to safely parse JSON
export function safeJsonParse<T>(jsonString: string | null | undefined): T | null {
  if (jsonString === null || jsonString === undefined) return null;
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("Error parsing JSON:", error);
    return null;
  }
}

// Helper function to format Zod errors into a user-friendly string
export const formatZodError = (error: z.ZodError): string => {
  return error.errors.map(e => `${e.path.join('.') || 'input'}: ${e.message}`).join('; ');
};

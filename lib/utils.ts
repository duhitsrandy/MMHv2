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

// Helper function to format Zod errors into a user-friendly string
export const formatZodError = (error: z.ZodError): string => {
  return error.errors.map(e => `${e.path.join('.') || 'input'}: ${e.message}`).join('; ');
};

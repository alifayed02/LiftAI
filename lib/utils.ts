import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
 
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Formats a date (ISO string or Date) into a user-friendly string, e.g. "Sep 7, 2025, 11:30 PM".
// Falls back gracefully if the input is invalid or Intl is unavailable.
export function formatDate(
  input: string | Date,
  options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  },
  locale?: string
): string {
  try {
    const date = input instanceof Date ? input : new Date(input)
    if (isNaN(date.getTime())) return String(input)
    // Prefer device locale when not provided
    const resolvedLocale = locale || (typeof Intl !== "undefined" && (Intl.DateTimeFormat as any)?.resolvedOptions?.().locale) || undefined
    if (typeof Intl !== "undefined" && Intl.DateTimeFormat) {
      return new Intl.DateTimeFormat(resolvedLocale, options).format(date)
    }
    // Fallback: basic formatting
    return date.toDateString() + ", " + date.toLocaleTimeString()
  } catch {
    return String(input)
  }
}
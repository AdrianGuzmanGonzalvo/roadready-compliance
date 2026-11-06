import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** SSNs are only ever kept and shown as their last four digits ("***-**-1234"); already-masked values pass through. */
export function maskSSN(raw: string | null): string | null {
  if (!raw) return null;
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 4) return raw;
  const last4 = digits.slice(-4);
  return `***-**-${last4}`;
}

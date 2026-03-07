import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCambodianPhone(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, "");
  
  if (cleaned.length > 0) {
    // Rule: Must start with 0. If first char is not 0, prepend 0.
    if (cleaned[0] !== '0') {
      cleaned = '0' + cleaned;
    }
    
    // Rule: No double zero at start. If index 1 is also 0, remove it.
    if (cleaned.length >= 2 && cleaned[1] === '0') {
      cleaned = '0' + cleaned.slice(2);
    }
  }

  // Limit to 10 digits total (Cambodian numbers are 9 or 10 digits including leading 0)
  cleaned = cleaned.slice(0, 10);

  // Formatting: 0XX XXX XXXX
  if (cleaned.length <= 3) return cleaned;
  if (cleaned.length <= 6) return `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
  return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6)}`;
}

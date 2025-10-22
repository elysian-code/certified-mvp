
import { randomUUID, createHash } from "crypto";
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function generateCertIds() {
  const uuid = randomUUID();
  const hash = createHash("sha256").update(uuid).digest("hex");
  const shortId = hash.substring(0, 10).toUpperCase();
  return { uuid, shortId };
}

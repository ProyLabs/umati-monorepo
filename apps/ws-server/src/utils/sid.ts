import { nanoid } from "nanoid";

/**
 * Generate a 16-character session ID (SID)
 * Example: "vQf8YJrL2zUxE9tB"
 */
export function generateSid(): string {
  return nanoid(16);
}

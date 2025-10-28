"use client";

import { useCallback, useState } from "react";

/**
 * A custom hook to copy text to the clipboard with optional timeout feedback.
 *
 * @param timeout Duration (ms) before resetting "copied" state. Default: 2000
 */
export function useClipboard(timeout: number = 2000) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string) => {
    if (!text) return;

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);

      if (timeout > 0) {
        setTimeout(() => setCopied(false), timeout);
      }
    } catch (err) {
      console.error("Failed to copy text:", err);
      setCopied(false);
    }
  }, [timeout]);

  return { copied, copy };
}

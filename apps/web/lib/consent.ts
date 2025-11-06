// utils/consent.ts
import Cookies from "js-cookie";

const COOKIE_KEY = "cookie-consent";

export type ConsentStatus = "accepted" | "declined" | null;

/**
 * Get the user's cookie consent status (client-side)
 */
export function getConsent(): ConsentStatus {
  const value = Cookies.get(COOKIE_KEY);
  if (value === "accepted" || value === "declined") {
    return value;
  }
  return null;
}

/**
 * Set the user's cookie consent status
 */
export function setConsent(status: "accepted" | "declined") {
  Cookies.set(COOKIE_KEY, status, { expires: 365, sameSite: "Lax" });
}

/**
 * Remove the consent cookie (optional)
 */
export function clearConsent() {
  Cookies.remove(COOKIE_KEY);
}

/**
 * Helper booleans
 */
export function hasAcceptedCookies() {
  return getConsent() === "accepted";
}

export function hasDeclinedCookies() {
  return getConsent() === "declined";
}


export const handleAccept = () => {
  setConsent("accepted");
};

export const handleDecline = () => {
    setConsent("declined");
};

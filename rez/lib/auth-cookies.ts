const AUTH_COOKIE_MAX_AGE = 604800; // 7 days

function cookieAttributes(maxAge?: number): string {
  const parts = ["path=/"];
  if (typeof maxAge === "number") {
    parts.push(`max-age=${maxAge}`);
  }
  parts.push("SameSite=Lax");
  if (typeof window !== "undefined" && window.location.protocol === "https:") {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export function setFirebaseTokenCookie(token: string): void {
  document.cookie = `firebaseToken=${token}; ${cookieAttributes(AUTH_COOKIE_MAX_AGE)}`;
}

export function setOrganizationIdCookie(organizationId: string): void {
  document.cookie = `organizationId=${organizationId}; ${cookieAttributes(AUTH_COOKIE_MAX_AGE)}`;
}

export function clearFirebaseTokenCookie(): void {
  document.cookie = `firebaseToken=; ${cookieAttributes(0)}`;
}

export function clearOrganizationIdCookie(): void {
  document.cookie = `organizationId=; ${cookieAttributes(0)}`;
}

export function clearAuthCookies(): void {
  clearFirebaseTokenCookie();
  clearOrganizationIdCookie();
}

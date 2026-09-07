// Minimal JWT payload decoder — no verification, just base64url decoding of
// the middle segment. Good enough to read `sub`/`email` client-side; the
// server is the one place tokens are actually verified.
export type JwtPayload = {
  sub: string;
  email?: string;
  [key: string]: unknown;
};

export function decodeJwt(token: string): JwtPayload | null {
  try {
    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload.replace(/-/g, "+").replace(/_/g, "/");
    const json = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${c.charCodeAt(0).toString(16).padStart(2, "0")}`)
        .join(""),
    );

    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

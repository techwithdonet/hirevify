import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_SESSION_COOKIE = "hirevify_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 8;

type AdminSessionPayload = {
  role: "admin";
  expiresAt: number;
};

function getSessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) return null;
  return secret;
}

function encode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

export function isAdminSessionConfigured() {
  return Boolean(getSessionSecret());
}

export function createAdminSessionToken() {
  const secret = getSessionSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET must contain at least 32 characters.");
  }

  const payload: AdminSessionPayload = {
    role: "admin",
    expiresAt: Date.now() + ADMIN_SESSION_MAX_AGE * 1000,
  };
  const encodedPayload = encode(JSON.stringify(payload));
  return `${encodedPayload}.${sign(encodedPayload, secret)}`;
}

export function verifyAdminSessionToken(token?: string | null) {
  const secret = getSessionSecret();
  if (!secret || !token) return false;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return false;

  const expected = Buffer.from(sign(encodedPayload, secret));
  const supplied = Buffer.from(signature);
  if (expected.length !== supplied.length || !timingSafeEqual(expected, supplied)) {
    return false;
  }

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, "base64url").toString("utf8"),
    ) as AdminSessionPayload;
    return payload.role === "admin" && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
}

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

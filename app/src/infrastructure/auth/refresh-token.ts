import crypto from "crypto";
import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

function getRefreshSecret() {
  const secret = process.env.JWT_REFRESH_SECRET;

  if (!secret) {
    throw new Error("JWT_REFRESH_SECRET is not configured");
  }

  return encoder.encode(secret);
}

export function hashRefreshToken(token: string) {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
}

export async function createRefreshToken(userId: string) {
  return new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getRefreshSecret());
}

export async function verifyRefreshToken(token: string) {
  const { payload } = await jwtVerify(
    token,
    getRefreshSecret(),
  );

  if (!payload.sub) {
    throw new Error("INVALID_REFRESH_TOKEN");
  }

  return {
    userId: payload.sub,
  };
}
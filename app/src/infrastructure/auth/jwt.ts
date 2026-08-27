import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

function getAccessSecret() {
  const secret = process.env.JWT_ACCESS_SECRET;

  if (!secret) {
    throw new Error("JWT_ACCESS_SECRET is not configured");
  }

  return encoder.encode(secret);
}

export async function createAccessToken(payload: {
  userId: string;
  name: string;
  jobTitle: string;
}) {
  return new SignJWT({
    name: payload.name,
    jobTitle: payload.jobTitle,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.userId)
    .setIssuedAt()
    .setExpirationTime("15m")
    .sign(getAccessSecret());
}

export async function verifyAccessToken(token: string) {
  const { payload } = await jwtVerify(token, getAccessSecret());

  if (!payload.sub) {
    throw new Error("INVALID_TOKEN");
  }

  return {
    userId: payload.sub,
    name: payload.name as string,
    jobTitle: payload.jobTitle as string,
  };
}
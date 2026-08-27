import { verifyAccessToken } from "@/infrastructure/auth/jwt";

export async function getAuthenticatedUser(request: Request) {
  const authorization = request.headers.get("authorization");

  if (!authorization?.startsWith("Bearer ")) {
    throw new Error("UNAUTHORIZED");
  }

  const token = authorization.slice(7);

  try {
    return await verifyAccessToken(token);
  } catch {
    throw new Error("UNAUTHORIZED");
  }
}
import { NextResponse } from "next/server";

import {
  hashRefreshToken,
  verifyRefreshToken,
} from "@/infrastructure/auth/refresh-token";

import { query } from "@/infrastructure/database/postgres";

export async function POST(request: Request) {
  try {
    const cookieHeader = request.headers.get("cookie");

    const refreshToken = cookieHeader
      ?.split(";")
      .map((cookie) => cookie.trim())
      .find((cookie) =>
        cookie.startsWith("refresh_token="),
      )
      ?.split("=")[1];

    if (refreshToken) {
      try {
        await verifyRefreshToken(refreshToken);

        const tokenHash =
          hashRefreshToken(refreshToken);

        await query(
          `
          UPDATE rw_refresh_tokens
          SET revoked_at = NOW()
          WHERE token_hash = $1
            AND revoked_at IS NULL
          `,
          [tokenHash],
        );
      } catch {
        // Si el token ya es inválido o expiró,
        // simplemente continuamos limpiando la cookie.
      }
    }

    const response = NextResponse.json({
      message: "Logout successful",
    });

    response.cookies.set(
      "refresh_token",
      "",
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 0,
      },
    );

    return response;
  } catch (error) {
    console.error("Logout error:", error);

    return NextResponse.json(
      {
        message: "Unable to logout",
      },
      {
        status: 500,
      },
    );
  }
}
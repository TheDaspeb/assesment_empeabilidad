import { NextResponse } from "next/server";

import {
  createRefreshToken,
  hashRefreshToken,
  verifyRefreshToken,
} from "@/infrastructure/auth/refresh-token";

import { createAccessToken } from "@/infrastructure/auth/jwt";
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

    if (!refreshToken) {
      return NextResponse.json(
        { message: "Refresh token required" },
        { status: 401 },
      );
    }

    const payload = await verifyRefreshToken(
      refreshToken,
    );

    const tokenHash =
      hashRefreshToken(refreshToken);

    const storedToken = await query<{
      id: string;
      user_id: string;
    }>(
      `
      SELECT
        id,
        user_id
      FROM rw_refresh_tokens
      WHERE token_hash = $1
        AND revoked_at IS NULL
        AND expires_at > NOW()
      LIMIT 1
      `,
      [tokenHash],
    );

    const tokenRecord = storedToken.rows[0];

    if (!tokenRecord) {
      return NextResponse.json(
        { message: "Invalid refresh token" },
        { status: 401 },
      );
    }

    const userResult = await query<{
      id: string;
      name: string;
      job_title: string;
    }>(
      `
      SELECT
        id,
        name,
        job_title
      FROM rw_users
      WHERE id = $1
        AND deleted_at IS NULL
        AND is_active = TRUE
      LIMIT 1
      `,
      [payload.userId],
    );

    const user = userResult.rows[0];

    if (!user) {
      return NextResponse.json(
        { message: "Invalid refresh token" },
        { status: 401 },
      );
    }

    await query(
      `
      UPDATE rw_refresh_tokens
      SET revoked_at = NOW()
      WHERE id = $1
      `,
      [tokenRecord.id],
    );

    const newRefreshToken =
      await createRefreshToken(user.id);

    await query(
      `
      INSERT INTO rw_refresh_tokens (
        user_id,
        token_hash,
        expires_at
      )
      VALUES (
        $1,
        $2,
        NOW() + INTERVAL '7 days'
      )
      `,
      [
        user.id,
        hashRefreshToken(newRefreshToken),
      ],
    );

    const accessToken =
      await createAccessToken({
        userId: user.id,
        name: user.name,
        jobTitle: user.job_title,
      });

    const response = NextResponse.json({
      accessToken,
    });

    response.cookies.set(
      "refresh_token",
      newRefreshToken,
      {
        httpOnly: true,
        secure:
          process.env.NODE_ENV === "production",
        sameSite: "strict",
        path: "/",
        maxAge: 60 * 60 * 24 * 7,
      },
    );

    return response;
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Invalid refresh token" },
      { status: 401 },
    );
  }
}
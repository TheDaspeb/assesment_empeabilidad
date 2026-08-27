import { NextResponse } from "next/server";
import { z } from "zod";

import { LoginUser } from "@/application/use-cases/login-user";

import { createAccessToken } from "@/infrastructure/auth/jwt";

import {
  createRefreshToken,
  hashRefreshToken,
} from "@/infrastructure/auth/refresh-token";

import { query } from "@/infrastructure/database/postgres";

import { PostgresUserRepository } from "@/infrastructure/database/user.repository.pg";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const input = loginSchema.parse(body);

    const repository = new PostgresUserRepository();

    const loginUser = new LoginUser(repository);

    const user = await loginUser.execute(input);

    const accessToken = await createAccessToken({
      userId: user.id,
      name: user.name,
      jobTitle: user.jobTitle,
    });

    const refreshToken = await createRefreshToken(
      user.id,
    );

    const refreshTokenHash =
      hashRefreshToken(refreshToken);

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
        refreshTokenHash,
      ],
    );

    const response = NextResponse.json(
      {
        accessToken,
        user,
      },
      {
        status: 200,
      },
    );

    response.cookies.set(
      "refresh_token",
      refreshToken,
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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid request",
          issues: error.issues,
        },
        {
          status: 400,
        },
      );
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_CREDENTIALS"
    ) {
      return NextResponse.json(
        {
          message: "Invalid credentials",
        },
        {
          status: 401,
        },
      );
    }

    console.error("Login error:", error);

    return NextResponse.json(
      {
        message: "Internal server error",
      },
      {
        status: 500,
      },
    );
  }
}
import { NextResponse } from "next/server";
import { z } from "zod";

import { LoginUser } from "@/application/use-cases/login-user";
import { createAccessToken } from "@/infrastructure/auth/jwt";
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

    return NextResponse.json({
      accessToken,
      user,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          message: "Invalid request",
          issues: error.issues,
        },
        { status: 400 },
      );
    }

    if (
      error instanceof Error &&
      error.message === "INVALID_CREDENTIALS"
    ) {
      return NextResponse.json(
        { message: "Invalid credentials" },
        { status: 401 },
      );
    }

    console.error(error);

    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
}
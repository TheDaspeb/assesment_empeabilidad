import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/infrastructure/auth/authenticated-user";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    return NextResponse.json({
      user,
    });
  } catch {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 },
    );
  }
}
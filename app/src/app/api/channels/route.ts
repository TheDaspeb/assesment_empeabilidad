import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/infrastructure/auth/authenticated-user";
import { withUserTransaction } from "@/infrastructure/database/postgres";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    const channels = await withUserTransaction(
      user.userId,
      async (client) => {
        const result = await client.query(
          `
          SELECT
            id,
            name,
            type,
            created_at
          FROM rw_channels
          ORDER BY created_at ASC
          `,
        );

        return result.rows;
      },
    );

    return NextResponse.json({
      channels,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Unauthorized or unable to load channels" },
      { status: 401 },
    );
  }
}
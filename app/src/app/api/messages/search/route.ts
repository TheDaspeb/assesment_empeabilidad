import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/infrastructure/auth/authenticated-user";
import { withUserTransaction } from "@/infrastructure/database/postgres";

export async function GET(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q")?.trim();

    if (!query) {
      return NextResponse.json(
        { message: "Search query is required" },
        { status: 400 },
      );
    }

    const messages = await withUserTransaction(
      user.userId,
      async (client) => {
        const result = await client.query(
          `
          SELECT
            id,
            channel_id,
            sender_id,
            content,
            ts_headline(
              'spanish',
              content,
              plainto_tsquery('spanish', $1)
            ) AS highlighted_content,
            created_at
          FROM rw_messages
          WHERE deleted_at IS NULL
            AND to_tsvector('spanish', content)
                @@ plainto_tsquery('spanish', $1)
          ORDER BY created_at DESC, id DESC
          LIMIT 20
          `,
          [query],
        );

        return result.rows;
      },
    );

    return NextResponse.json({
      messages,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Unable to search messages" },
      { status: 401 },
    );
  }
}
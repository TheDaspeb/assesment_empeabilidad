import { NextResponse } from "next/server";

import { getAuthenticatedUser } from "@/infrastructure/auth/authenticated-user";
import { withUserTransaction } from "@/infrastructure/database/postgres";

interface RouteContext {
  params: Promise<{
    id: string;
  }>;
}

export async function GET(
  request: Request,
  context: RouteContext,
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id: channelId } = await context.params;

    const { searchParams } = new URL(request.url);

    const cursorCreatedAt = searchParams.get("cursorCreatedAt");
    const cursorId = searchParams.get("cursorId");
    const limit = Math.min(
      Number(searchParams.get("limit") ?? 20),
      50,
    );

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
            status,
            created_at::text AS cursor_created_at,
            updated_at
          FROM rw_messages
          WHERE channel_id = $1
            AND deleted_at IS NULL
            AND (
              $2::timestamptz IS NULL
              OR (created_at, id) < ($2::timestamptz, $3::uuid)
            )
          ORDER BY created_at DESC, id DESC
          LIMIT $4
          `,
          [
            channelId,
            cursorCreatedAt,
            cursorId,
            limit,
          ],
        );

        return result.rows;
      },
    );

    const lastMessage = messages.at(-1);

    const nextCursor = lastMessage
      ? {
          createdAt: lastMessage.cursor_created_at,
          id: lastMessage.id,
        }
      : null;

    return NextResponse.json({
      messages,
      nextCursor,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Unable to load message history" },
      { status: 401 },
    );
  }
}
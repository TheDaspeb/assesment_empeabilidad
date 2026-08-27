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
            created_at,
            updated_at
          FROM rw_messages
          WHERE channel_id = $1
            AND deleted_at IS NULL
          ORDER BY created_at DESC, id DESC
          LIMIT 20
          `,
          [channelId],
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
      { message: "Unauthorized or unable to load messages" },
      { status: 401 },
    );
  }
}

export async function POST(
  request: Request,
  context: RouteContext,
) {
  try {
    const user = await getAuthenticatedUser(request);
    const { id: channelId } = await context.params;

    const body = await request.json();

    const content =
      typeof body.content === "string"
        ? body.content.trim()
        : "";

    if (!content) {
      return NextResponse.json(
        { message: "Content is required" },
        { status: 400 },
      );
    }

    const message = await withUserTransaction(
      user.userId,
      async (client) => {
        const result = await client.query(
          `
          SELECT rw_create_message($1, $2) AS message_id
          `,
          [channelId, content],
        );

        return result.rows[0];
      },
    );

    return NextResponse.json(
      {
        message: "Message sent",
        messageId: message.message_id,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { message: "Unable to send message" },
      { status: 403 },
    );
  }
}
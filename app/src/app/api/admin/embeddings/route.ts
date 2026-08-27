import { NextResponse } from "next/server";

import { GeminiProvider } from "@/infrastructure/ai/gemini-provider";
import { query } from "@/infrastructure/database/postgres";

export async function POST() {
  try {
    const ai = new GeminiProvider();

    const result = await query<{
      id: string;
      content: string;
    }>(
      `
      SELECT
        id,
        content
      FROM rw_messages
      WHERE deleted_at IS NULL
        AND embedding IS NULL
      ORDER BY created_at ASC
      `,
    );

    let indexed = 0;

    for (const message of result.rows) {
      const embedding =
        await ai.createEmbedding(message.content);

      const vector = `[${embedding.join(",")}]`;

      await query(
        `
        UPDATE rw_messages
        SET embedding = $1::vector
        WHERE id = $2
        `,
        [
          vector,
          message.id,
        ],
      );

      indexed++;
    }

    return NextResponse.json({
      indexed,
    });
  } catch (error) {
    console.error("Embedding indexing error:", error);

    return NextResponse.json(
      {
        message: "Unable to index message embeddings",
      },
      {
        status: 500,
      },
    );
  }
}
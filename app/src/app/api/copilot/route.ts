import { NextResponse } from "next/server";
import { z } from "zod";

import { getAuthenticatedUser } from "@/infrastructure/auth/authenticated-user";
import { GeminiProvider } from "@/infrastructure/ai/gemini-provider";
import { withUserTransaction } from "@/infrastructure/database/postgres";

const copilotSchema = z.object({
  question: z.string().trim().min(3).max(500),
});

export async function POST(request: Request) {
  try {
    const user = await getAuthenticatedUser(request);

    const body = await request.json();
    const { question } = copilotSchema.parse(body);

    const ai = new GeminiProvider();

    const questionEmbedding =
      await ai.createEmbedding(question);

    const vector = `[${questionEmbedding.join(",")}]`;

    const context = await withUserTransaction(
      user.userId,
      async (client) => {
        const result = await client.query<{
          id: string;
          channel_id: string;
          content: string;
          similarity: number;
        }>(
          `
          SELECT
            id,
            channel_id,
            content,
            1 - (embedding <=> $1::vector) AS similarity
          FROM rw_messages
          WHERE deleted_at IS NULL
            AND embedding IS NOT NULL
          ORDER BY embedding <=> $1::vector
          LIMIT 5
          `,
          [vector],
        );

        return result.rows;
      },
    );

    if (context.length === 0) {
      return NextResponse.json({
        answer:
          "No tengo suficiente información autorizada para responder esta pregunta.",
        citations: [],
      });
    }

    const answer = await ai.answerQuestion({
      question,
      userName: user.name,
      jobTitle: user.jobTitle,
      context: context.map((message) => ({
        id: message.id,
        channelId: message.channel_id,
        content: message.content,
      })),
    });

    const insufficientContext =
      answer.answer.includes(
        "No tengo suficiente información autorizada",
      );

    const usedCitations = insufficientContext
      ? []
      : context.filter((message) =>
          answer.answer.includes(
            `[message:${message.id}]`,
          ),
        );

    return NextResponse.json({
      answer: answer.answer,
      citations: usedCitations.map((message) => ({
        messageId: message.id,
        channelId: message.channel_id,
        similarity: message.similarity,
      })),
      tokensUsed: answer.tokensUsed,
    });
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

    console.error("Copilot error:", error);

    return NextResponse.json(
      {
        message: "Unable to answer question",
      },
      {
        status: 500,
      },
    );
  }
}

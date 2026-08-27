import { GoogleGenAI } from "@google/genai";

import {
    AiAnswer,
    AiProvider,
    AnswerQuestionInput,
} from "@/application/ports/ai-provider";

import {
    SYSTEM_PROMPT,
    SYSTEM_PROMPT_VERSION,
} from "@/infrastructure/ai/system-prompt";

export class GeminiProvider implements AiProvider {
    private readonly client: GoogleGenAI;

    constructor() {
        const apiKey = process.env.GEMINI_API_KEY;

        if (!apiKey) {
            throw new Error("GEMINI_API_KEY is not configured");
        }

        this.client = new GoogleGenAI({
            apiKey,
        });
    }

    async createEmbedding(
        text: string,
    ): Promise<number[]> {
        const response =
            await this.client.models.embedContent({
                model:
                    process.env.GEMINI_EMBEDDING_MODEL ??
                    "gemini-embedding-2",

                contents: text,

                config: {
                    outputDimensionality: 1536,
                },
            });

        const embedding = response.embeddings?.[0]?.values;

        if (!embedding) {
            throw new Error("EMBEDDING_GENERATION_FAILED");
        }

        return embedding;
    }

    async answerQuestion({
        question,
        userName,
        jobTitle,
        context,
    }: AnswerQuestionInput): Promise<AiAnswer> {
        const formattedContext = context
            .map(
                (message) =>
                    `[message:${message.id}]
Channel: ${message.channelId}
Content: ${message.content}`,
            )
            .join("\n\n");

        const interaction =
            await this.client.interactions.create({
                model:
                    process.env.GEMINI_CHAT_MODEL ??
                    "gemini-3.6-flash",

                input: `
${SYSTEM_PROMPT}

Prompt version: ${SYSTEM_PROMPT_VERSION}

Authenticated user:
Name: ${userName}
Job title: ${jobTitle}

AUTHORIZED CONTEXT:

${formattedContext || "NO AUTHORIZED CONTEXT"}

USER QUESTION:

${question}
`,
            });

        return {
            answer:
                interaction.output_text ??
                "No tengo suficiente información autorizada para responder esta pregunta.",

            tokensUsed: 0,
        };
    }
}

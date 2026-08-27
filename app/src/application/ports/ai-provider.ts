export interface AiContextMessage {
  id: string;
  channelId: string;
  content: string;
}

export interface AiAnswer {
  answer: string;
  tokensUsed: number;
}

export interface AnswerQuestionInput {
  question: string;
  userName: string;
  jobTitle: string;
  context: AiContextMessage[];
}

export interface AiProvider {
  createEmbedding(text: string): Promise<number[]>;

  answerQuestion(
    input: AnswerQuestionInput,
  ): Promise<AiAnswer>;
}
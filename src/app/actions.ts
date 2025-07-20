'use server';

import { generateAreaQuiz, type GenerateAreaQuizInput } from '@/ai/flows/generate-area-quiz';
import { generateChatbotResponse, type GenerateChatbotResponseInput } from '@/ai/flows/generate-chatbot-response';
import type { QuizData } from '@/lib/types';

export async function createQuiz(input: GenerateAreaQuizInput): Promise<QuizData | null> {
  try {
    const result = await generateAreaQuiz(input);
    if (!result || !result.quiz) {
      console.error('AI failed to generate quiz');
      return null;
    }
    return { questions: result.quiz };
  } catch (error) {
    console.error('Error generating quiz:', error);
    return null;
  }
}

export async function getChatbotResponse(input: GenerateChatbotResponseInput) {
    try {
        const result = await generateChatbotResponse(input);
        return result;
    } catch (error) {
        console.error("Error generating chatbot response:", error);
        return { response: '抱歉，我現在無法回答。請稍後再試。' };
    }
}

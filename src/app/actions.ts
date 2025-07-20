
'use server';

import { generateAreaQuiz } from '@/ai/flows/generate-area-quiz';
import { getChatbotResponse as getChatbotResponseFlow } from '@/ai/flows/generate-chatbot-response';
import type { 
    QuizData, 
    GenerateAreaQuizInput,
    Message,
    ChatbotInput
} from '@/lib/types';


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

export async function getChatbotResponse(locationName: string, query: string, history: Message[]): Promise<string> {
    try {
        const input: ChatbotInput = { locationName, query, history };
        const result = await getChatbotResponseFlow(input);
        return result.response;
    } catch (error) {
        console.error("Error getting chatbot response:", error);
        return "抱歉，我現在無法回答。請稍後再試。";
    }
}

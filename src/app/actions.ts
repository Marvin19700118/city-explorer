
'use server';

import { generateAreaQuiz } from '@/ai/flows/generate-area-quiz';
import { getChatbotResponse as getChatbotResponseFlow } from '@/ai/flows/generate-chatbot-response';
import { generateLocationIntro as generateLocationIntroFlow } from '@/ai/flows/generate-location-intro';
import { generateRestaurantDescription as generateRestaurantDescriptionFlow } from '@/ai/flows/generate-restaurant-description';
import { generateAttractionInfo as generateAttractionInfoFlow } from '@/ai/flows/generate-attraction-info';


import type { 
    QuizData, 
    GenerateAreaQuizInput,
    Message,
    ChatbotInput,
    GenerateLocationIntroInput,
    GenerateLocationIntroOutput,
    GenerateRestaurantDescriptionInput,
    GenerateRestaurantDescriptionOutput,
    Locale,
    GenerateAttractionInfoInput,
    GenerateAttractionInfoOutput
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

export async function getChatbotResponse(locationName: string, query: string, history: Message[], locale: Locale): Promise<string> {
    try {
        const input: ChatbotInput = { locationName, query, history, locale };
        const result = await getChatbotResponseFlow(input);
        return result.response;
    } catch (error) {
        console.error("Error getting chatbot response:", error);
        return locale === 'en' 
            ? "Sorry, I can't respond right now. Please try again later."
            : "抱歉，我現在無法回答。請稍後再試。";
    }
}

export async function generateLocationIntro(input: GenerateLocationIntroInput): Promise<GenerateLocationIntroOutput | null> {
    try {
      const result = await generateLocationIntroFlow(input);
      return result;
    } catch (error) {
      console.error('Error generating location intro:', error);
      return null;
    }
}

export async function generateRestaurantDescription(input: GenerateRestaurantDescriptionInput): Promise<GenerateRestaurantDescriptionOutput | null> {
    try {
        const result = await generateRestaurantDescriptionFlow(input);
        return result;
    } catch (error) {
        console.error("Error generating restaurant description:", error);
        return null;
    }
}

export async function generateAttractionInfo(input: GenerateAttractionInfoInput): Promise<GenerateAttractionInfoOutput | null> {
    try {
        const result = await generateAttractionInfoFlow(input);
        return result;
    } catch (error) {
        console.error("Error generating attraction info:", error);
        return null;
    }
}

'use server';

import { generateAreaQuiz } from '@/ai/flows/generate-area-quiz';
import { generateLocalGuide } from '@/ai/flows/generate-local-guide';
import type { QuizData } from '@/lib/types';

export async function createQuiz(areaDescription: string): Promise<QuizData | null> {
  try {
    const result = await generateAreaQuiz({ areaDescription });
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

export async function createGuide(locationDescription: string) {
    try {
        const result = await generateLocalGuide({ locationDescription });
        return result;
    } catch (error) {
        console.error("Error generating guide:", error);
        return null;
    }
}

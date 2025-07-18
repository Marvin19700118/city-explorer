'use server';

import { generateAreaQuiz } from '@/ai/flows/generate-area-quiz';
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

'use server';

import { generateAreaQuiz, type GenerateAreaQuizInput } from '@/ai/flows/generate-area-quiz';
import { generateLocalGuide, type GenerateLocalGuideInput } from '@/ai/flows/generate-local-guide';
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

export async function createGuide(input: GenerateLocalGuideInput) {
    try {
        const result = await generateLocalGuide(input);
        return result;
    } catch (error) {
        console.error("Error generating guide:", error);
        return null;
    }
}

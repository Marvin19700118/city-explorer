'use server';

/**
 * @fileOverview AI flow to generate a quiz about a specific area based on its description or coordinates.
 *
 * The flow takes an area description and optional coordinates as input and returns a quiz consisting of questions and answers.
 * It uses a Genkit prompt to generate the quiz content.
 */

import {ai} from '@/ai/genkit';
import { GenerateAreaQuizInput, GenerateAreaQuizOutput, GenerateAreaQuizInputSchema, GenerateAreaQuizOutputSchema } from '@/lib/types';

export async function generateAreaQuiz(input: GenerateAreaQuizInput): Promise<GenerateAreaQuizOutput> {
  const result = await generateAreaQuizFlow(input);
  // For local challenges, we only want 3 questions.
  if (result.quiz.length > 3) {
    result.quiz = result.quiz.slice(0, 3);
  }
  return result;
}

const generateAreaQuizPrompt = ai.definePrompt({
  name: 'generateAreaQuizPrompt',
  input: {schema: GenerateAreaQuizInputSchema},
  output: {schema: GenerateAreaQuizOutputSchema},
  prompt: `您是一位 AI 測驗產生器。請根據以下地區描述，產生一個包含 3-5 個問題的選擇題測驗。每個問題應有 4 個可能的答案。
問題應與該地區的歷史、文化或地標相關且有趣。
請用繁體中文回答。

地區描述: {{{areaDescription}}}

{{#if previousQuestions}}
請避免產生以下已經問過的問題：
{{#each previousQuestions}}
- {{{this}}}
{{/each}}
{{/if}}

將測驗結果輸出為 JSON 物件。每個問題應包含一個 question 欄位、一個 answers 欄位（包含 4 個字串的陣列）以及一個 correctAnswerIndex 欄位（答案在 answers 陣列中的 0-based 索引）。`,
});

const generateAreaQuizFlow = ai.defineFlow(
  {
    name: 'generateAreaQuizFlow',
    inputSchema: GenerateAreaQuizInputSchema,
    outputSchema: GenerateAreaQuizOutputSchema,
  },
  async input => {
    const {output} = await generateAreaQuizPrompt(input);
    return output!;
  }
);

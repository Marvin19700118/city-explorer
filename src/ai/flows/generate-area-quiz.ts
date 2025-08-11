
'use server';

/**
 * @fileOverview AI flow to generate a quiz about a specific area based on its description or coordinates.
 *
 * The flow takes an area description and optional coordinates as input and returns a quiz consisting of questions and answers.
 */

import {ai} from '@/ai/genkit';
import { GenerateAreaQuizInput, GenerateAreaQuizOutput, GenerateAreaQuizOutputSchema } from '@/lib/types';

export async function generateAreaQuiz(input: GenerateAreaQuizInput): Promise<GenerateAreaQuizOutput> {
  let promptContent = `地區描述: ${input.areaDescription}\n\n`;
  if (input.previousQuestions && input.previousQuestions.length > 0) {
    promptContent += `請避免產生與以下已問過問題重複或主題相似的題目：\n- ${input.previousQuestions.join('\n- ')}\n\n`;
  }

  const result = await ai.generate({
    model: 'googleai/gemini-2.0-flash',
    system: `您是一位 AI 測驗產生器。請根據以下地區描述，產生一個包含 3-5 個問題的選擇題測驗。每個問題應有 4 個可能的答案。
問題應與該地區的歷史、文化或地標相關且有趣。
請用繁體中文回答。
將測驗結果輸出為 JSON 物件。每個問題應包含一個 question 欄位、一個 answers 欄位（包含 4 個字串的陣列）以及一個 correctAnswerIndex 欄位（答案在 answers 陣列中的 0-based 索引）。`,
    prompt: promptContent,
    output: {
      schema: GenerateAreaQuizOutputSchema,
    },
  });

  const output = result.output;
  if (!output) {
    throw new Error('AI failed to generate quiz output.');
  }

  // For local challenges, we only want 3 questions.
  if (output.quiz.length > 3) {
    output.quiz = output.quiz.slice(0, 3);
  }
  return output;
}

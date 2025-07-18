'use server';

/**
 * @fileOverview AI flow to generate a quiz about a specific area based on its description or coordinates.
 *
 * The flow takes an area description and optional coordinates as input and returns a quiz consisting of questions and answers.
 * It uses a Genkit prompt to generate the quiz content.
 *
 * @interface GenerateAreaQuizInput - Input type for the generateAreaQuiz function.
 * @interface GenerateAreaQuizOutput - Output type for the generateAreaquiz function.
 * @function generateAreaQuiz - Main function to generate the area quiz.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAreaQuizInputSchema = z.object({
  areaDescription: z
    .string()
    .describe('A detailed description of the area for which the quiz is to be generated.'),
  lat: z.number().optional().describe('The latitude of the location.'),
  lng: z.number().optional().describe('The longitude of the location.'),
});
export type GenerateAreaQuizInput = z.infer<typeof GenerateAreaQuizInputSchema>;

const GenerateAreaQuizOutputSchema = z.object({
  quiz: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      answers: z.array(z.string()).describe('An array of 4 possible answers to the question.'),
      correctAnswerIndex: z
        .number()
        .describe('The index of the correct answer in the answers array.'),
    })
  ).describe('An array of quiz questions, their answers, and correct answer indices.'),
});
export type GenerateAreaQuizOutput = z.infer<typeof GenerateAreaQuizOutputSchema>;

export async function generateAreaQuiz(input: GenerateAreaQuizInput): Promise<GenerateAreaQuizOutput> {
  // For local challenges, we only want 3 questions. The prompt itself doesn't easily support variable array length,
  // so we generate 5 and slice it down.
  const result = await generateAreaQuizFlow(input);
  if (input.lat && result.quiz.length > 3) {
    result.quiz = result.quiz.slice(0, 3);
  }
  return result;
}

const generateAreaQuizPrompt = ai.definePrompt({
  name: 'generateAreaQuizPrompt',
  input: {schema: GenerateAreaQuizInputSchema},
  output: {schema: GenerateAreaQuizOutputSchema},
  prompt: `您是一位 AI 測驗產生器。請根據以下地區描述，產生一個包含 5 個問題的選擇題測驗。每個問題應有 4 個可能的答案。
問題應與該地區的歷史、文化或地標相關且有趣。
{{#if lat}}
請特別專注於以經緯度 ({{lat}}, {{lng}}) 為中心，方圓 2 公里內的人文歷史、景點或特殊事件。
{{/if}}
請用繁體中文回答。

地區描述: {{{areaDescription}}}

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

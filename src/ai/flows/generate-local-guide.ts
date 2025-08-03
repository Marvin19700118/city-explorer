'use server';

/**
 * @fileOverview An AI flow to generate a local guide introduction for a specific area.
 *
 * - generateLocalGuide - A function that handles the guide generation.
 * - GenerateLocalGuideInput - The input type for the function.
 * - GenerateLocalGuideOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';


export const GenerateLocalGuideInputSchema = z.object({
  areaDescription: z.string().describe('A description of the area, like "信義區" or "關於台灣台北市中正區的介紹".'),
});
export type GenerateLocalGuideInput = z.infer<typeof GenerateLocalGuideInputSchema>;


export const GenerateLocalGuideOutputSchema = z.object({
  introduction: z.string().describe('A fun, engaging introduction to the area, around 100-150 words.'),
});
export type GenerateLocalGuideOutput = z.infer<typeof GenerateLocalGuideOutputSchema>;


export async function generateLocalGuide(input: GenerateLocalGuideInput): Promise<GenerateLocalGuideOutput> {
  const prompt = `你是一個風趣幽默、知識淵博的在地導遊 AI，名叫「AI tour guide」。
你的任務是根據使用者提供的地區描述，產生一段引人入勝的介紹。
介紹內容可以包含歷史、文化、美食、景點、有趣的小知識。
保持你的回答簡潔有力，大約在 100-150 字之間。
請用繁體中文回答。

地區描述: ${input.areaDescription}`;

  const { text } = await ai.generate({
    prompt,
    model: 'googleai/gemini-2.0-flash',
  });

  return { introduction: text };
}

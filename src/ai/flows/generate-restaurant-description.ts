
'use server';

/**
 * @fileOverview An AI flow to generate a short, engaging description for a restaurant.
 *
 * - generateRestaurantDescription - A function that handles the description generation.
 */

import { ai } from '@/ai/genkit';
import { GenerateRestaurantDescriptionInput, GenerateRestaurantDescriptionOutput, GenerateRestaurantDescriptionInputSchema, GenerateRestaurantDescriptionOutputSchema } from '@/lib/types';

export async function generateRestaurantDescription(input: GenerateRestaurantDescriptionInput): Promise<GenerateRestaurantDescriptionOutput> {
    const result = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      system: `你是一位美食評論家 AI。你的任務是根據餐廳名稱和地址，產生一段約 50-70 字的生動簡介。
請根據網路上的資訊（例如評論、官方網站、食記），總結出這家餐廳的特色、招牌菜或氛圍。
你的文筆要像個真正的部落客，風趣、有吸引力，並使用繁體中文。`,
      prompt: `餐廳名稱: ${input.restaurantName}\n地址: ${input.restaurantAddress}`,
      output: {
        schema: GenerateRestaurantDescriptionOutputSchema
      }
    });

    const output = result.output;
    if (!output) {
      throw new Error('AI failed to generate a description.');
    }
    return output;
}

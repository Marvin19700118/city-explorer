
'use server';

/**
 * @fileOverview An AI flow to generate a short, engaging description for a restaurant.
 *
 * - generateRestaurantDescription - A function that handles the description generation.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GenerateRestaurantDescriptionInput, GenerateRestaurantDescriptionOutput, GenerateRestaurantDescriptionInputSchema, GenerateRestaurantDescriptionOutputSchema } from '@/lib/types';

const generateDescriptionTool = ai.defineTool(
    {
      name: 'getRestaurantInfo',
      description: 'Get information about a restaurant to write a description.',
      inputSchema: GenerateRestaurantDescriptionInputSchema,
      outputSchema: z.object({
          business_summary: z.string().optional().describe("A summary of the business from its Google Business Profile."),
          reviews: z.array(z.string()).optional().describe("A list of up to 3 relevant user reviews."),
          website: z.string().optional().describe("The official website of the restaurant.")
      }),
    },
    async () => {
        // This is a placeholder. In a real scenario, you'd use a search tool
        // like Google Places API or a general web search API here.
        // Since we can't make external API calls here, we will return empty data
        // and rely on the model's existing knowledge.
      return {};
    }
);


const restaurantDescriptionFlow = ai.defineFlow(
  {
    name: 'restaurantDescriptionFlow',
    inputSchema: GenerateRestaurantDescriptionInputSchema,
    outputSchema: GenerateRestaurantDescriptionOutputSchema,
  },
  async (input) => {
    
    const prompt = `你是一位美食評論家 AI。
你的任務是根據餐廳名稱「${input.restaurantName}」和地址「${input.restaurantAddress}」，產生一段約 50-70 字的生動簡介。
請根據網路上的資訊（例如評論、官方網站、食記），總結出這家餐廳的特色、招牌菜或氛圍。
你的文筆要像個真正的部落客，風趣、有吸引力，並使用繁體中文。
`;

    const { text } = await ai.generate({
        prompt: prompt,
        model: 'googleai/gemini-2.0-flash',
    });

    return { description: text };
  }
);


export async function generateRestaurantDescription(input: GenerateRestaurantDescriptionInput): Promise<GenerateRestaurantDescriptionOutput> {
    return restaurantDescriptionFlow(input);
}

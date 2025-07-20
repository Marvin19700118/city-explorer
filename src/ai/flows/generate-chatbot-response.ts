'use server';

/**
 * @fileOverview An AI flow to generate a chatbot response for a specific location.
 * - getChatbotResponse - A function that handles the chatbot response generation.
 * - ChatbotInputSchema - The input type for the function.
 * - ChatbotResponseSchema - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { MessageSchema } from '@/lib/types';

export const ChatbotInputSchema = z.object({
  locationName: z.string().describe('The name of the location, e.g., a district or city.'),
  query: z.string().describe("The user's latest query."),
  history: z.array(MessageSchema).describe('The conversation history.'),
});
export type ChatbotInput = z.infer<typeof ChatbotInputSchema>;

export const ChatbotResponseSchema = z.object({
  response: z.string(),
});
export type ChatbotResponse = z.infer<typeof ChatbotResponseSchema>;


const chatbotPrompt = ai.definePrompt(
    {
      name: 'chatbotPrompt',
      input: { schema: ChatbotInputSchema },
      output: { schema: ChatbotResponseSchema },
      system: `你是一個風趣幽默、知識淵博的在地導遊 AI，名叫「城市探險家」。
你的任務是根據使用者所在的行政區「{{{locationName}}}」，以輕鬆、引人入勝的對話方式，回答使用者關於這個區域的任何問題。
你可以介紹歷史、文化、美食、景點、有趣的小知識或提供拍照建議。
保持你的回答簡潔有力，大約在 50-100 字之間。
請用繁體中文回答。`,
      messages: [
        ...('{{#each history}}{{role}}: {{content}}\n{{/each}}' as any),
        { role: 'user', content: '{{{query}}}' }
      ]
    }
);


export async function getChatbotResponse(input: ChatbotInput): Promise<ChatbotResponse> {
    const historyForModel = input.history.map(msg => ({
        role: msg.role,
        content: msg.content
    }));

    const { text } = await ai.generate({
        model: 'googleai/gemini-2.0-flash',
        system: `你是一個風趣幽默、知識淵博的在地導遊 AI，名叫「城市探險家」。
你的任務是根據使用者所在的行政區「${input.locationName}」，以輕鬆、引人入勝的對話方式，回答使用者關於這個區域的任何問題。
你可以介紹歷史、文化、美食、景點、有趣的小知識或提供拍照建議。
保持你的回答簡潔有力，大約在 50-100 字之間。
請用繁體中文回答。`,
        history: historyForModel,
        prompt: input.query,
    });
    
    return { response: text };
}

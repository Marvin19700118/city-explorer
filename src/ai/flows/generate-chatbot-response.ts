'use server';

/**
 * @fileOverview An AI flow to generate a chatbot response for a local guide.
 *
 * - generateChatbotResponse - A function that handles the chatbot conversation.
 * - GenerateChatbotResponseInput - The input type for the function.
 * - GenerateChatbotResponseOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const GenerateChatbotResponseInputSchema = z.object({
  locationName: z
    .string()
    .describe('The name of the current area or district the user is in. e.g., "台北市信義區"'),
  history: z.array(ChatMessageSchema).describe('The previous conversation history.'),
  query: z.string().describe("The user's latest question or message."),
});
export type GenerateChatbotResponseInput = z.infer<typeof GenerateChatbotResponseInputSchema>;

const GenerateChatbotResponseOutputSchema = z.object({
  response: z.string().describe('The generated response from the chatbot.'),
});
export type GenerateChatbotResponseOutput = z.infer<typeof GenerateChatbotResponseOutputSchema>;

export async function generateChatbotResponse(input: GenerateChatbotResponseInput): Promise<GenerateChatbotResponseOutput> {
  return generateChatbotResponseFlow(input);
}

const generateChatbotResponseFlow = ai.defineFlow(
  {
    name: 'generateChatbotResponseFlow',
    inputSchema: GenerateChatbotResponseInputSchema,
    outputSchema: GenerateChatbotResponseOutputSchema,
  },
  async ({ locationName, history, query }) => {
    
    const systemPrompt = `你是一個風趣幽默、知識淵博的在地導遊 AI，名叫「城市探險家」。
你的任務是根據使用者所在的行政區「${locationName}」，以輕鬆、引人入勝的對話方式，回答使用者關於這個區域的任何問題。
你可以介紹歷史、文化、美食、景點、有趣的小知識或提供拍照建議。
保持你的回答簡潔有力，大約在 50-100 字之間。
請用繁體中文回答。`;

    const model = ai.model;
    const { text } = await model.generate({
      system: systemPrompt,
      history: history,
      prompt: query,
    });
    
    return { response: text };
  }
);

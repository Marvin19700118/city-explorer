
'use server';

/**
 * @fileOverview An AI flow to generate a chatbot response for a specific location, with image analysis capabilities.
 * - getChatbotResponse - A function that handles the chatbot response generation.
 */

import { ai } from '@/ai/genkit';
import { ChatbotInput, ChatbotInputSchema, ChatbotResponse, ChatbotResponseSchema } from '@/lib/types';
import { z } from 'zod';

export async function getChatbotResponse(input: ChatbotInput): Promise<ChatbotResponse> {
    const { output } = await ai.generate({
      model: 'googleai/gemini-2.0-flash',
      system: `你是一個風趣幽默、知識淵博的在地導遊 AI，名叫「AI tour guide」。
你的任務是根據使用者所在的行政區「${input.locationName}」，以輕鬆、引人入勝的對話方式，回答使用者關於這個區域的任何問題。
你可以介紹歷史、文化、美食、景點、有趣的小知識或提供拍照建議。
如果使用者上傳了一張照片，你必須根據照片內容進行詳細分析，解說照片中的人物、事件、地點、物品及其歷史背景。
保持你的回答簡潔有力，大約在 50-100 字之間，但對於圖片分析可以更詳細。
請用繁體中文回答。`,
      prompt: [
        {text: `這是我們的對話紀錄:
        ${input.history.map(msg => `${msg.role}: ${msg.content}`).join('\n')}

        這是使用者最新的問題:
        ${input.query}`},
        // Conditionally add the image if it exists
        ...(input.photoDataUri ? [{ media: { url: input.photoDataUri } }] : [])
      ],
      output: {
        schema: ChatbotResponseSchema,
      }
    });

    // Sometimes the model returns an empty response, so we provide a default.
    if (!output || !output.response) {
      return { response: "抱歉，我好像有點詞窮了，可以再問一次嗎？" };
    }
    return output;
}

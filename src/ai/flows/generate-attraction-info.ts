
'use server';

/**
 * @fileOverview An AI flow to generate an introduction, a quiz, and audio for a tourist attraction.
 *
 * - generateAttractionInfo - A function that handles the generation.
 * - GenerateAttractionInfoInput - The input type for the function.
 * - GenerateAttractionInfoOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { GenerateAttractionInfoInputSchema, GenerateAttractionInfoOutputSchema, GenerateAttractionInfoInput, GenerateAttractionInfoOutput } from '@/lib/types';
import wav from 'wav';
import { googleAI } from '@genkit-ai/googleai';


async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as any[];
    writer.on('error', reject);
    writer.on('data', function (d) {
      bufs.push(d);
    });
    writer.on('end', function () {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}


const generateAttractionInfoFlow = ai.defineFlow(
  {
    name: 'generateAttractionInfoFlow',
    inputSchema: GenerateAttractionInfoInputSchema,
    outputSchema: GenerateAttractionInfoOutputSchema,
  },
  async (input) => {
    
    const prompt = `你是一位風趣幽默、知識淵博的在地導遊 AI。
你的任務是為觀光景點「${input.attractionName}」產生一段引人入勝的介紹和一個有趣的問答測驗。
地址位於「${input.attractionAddress}」。

1.  **介紹 (introduction)**: 產生一段約 100-150 字的生動簡介。內容可以包含歷史、文化、特色、或有趣的小知識。文筆要像個真正的部落客，風趣、有吸引力，並使用繁體中文。

2.  **測驗 (quiz)**: 產生一個包含 3 個問題的選擇題測驗。每個問題應有 4 個可能的答案。問題應與該景點的歷史、文化或特色相關且有趣。將測驗結果輸出為 JSON 物件。每個問題應包含一個 question 欄位、一個 answers 欄位（包含 4 個字串的陣列）以及一個 correctAnswerIndex 欄位（答案在 answers 陣列中的 0-based 索引）。

請將最終結果以一個 JSON 物件的形式回傳，包含 'introduction' 和 'quiz' 兩個欄位。`;

    const { output: infoOutput } = await ai.generate({
        prompt: prompt,
        model: 'googleai/gemini-2.0-flash',
        output: {
            schema: z.object({
                introduction: z.string(),
                quiz: z.array(z.any()),
            }),
        }
    });

    if (!infoOutput) {
        throw new Error("Failed to generate attraction info text and quiz.");
    }
    
    const { introduction, quiz } = infoOutput;

    // Generate TTS from the introduction
    const { media } = await ai.generate({
        model: googleAI.model('gemini-2.5-flash-preview-tts'),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: introduction,
      });

      if (!media) {
        // Don't throw, just return without audio
        return {
          introduction,
          quiz,
          audioDataUri: null,
        }
      }

      const audioBuffer = Buffer.from(
        media.url.substring(media.url.indexOf(',') + 1),
        'base64'
      );

      const wavBase64 = await toWav(audioBuffer);
      const audioDataUri = 'data:audio/wav;base64,' + wavBase64;
    
      return {
        introduction,
        quiz,
        audioDataUri,
      };
  }
);


export async function generateAttractionInfo(input: GenerateAttractionInfoInput): Promise<GenerateAttractionInfoOutput> {
    const result = await generateAttractionInfoFlow(input);
    return result;
}

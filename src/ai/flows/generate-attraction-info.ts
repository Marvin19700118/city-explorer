
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
import { GenerateAttractionInfoInputSchema, GenerateAttractionInfoOutputSchema, GenerateAttractionInfoInput, GenerateAttractionInfoOutput, QuizQuestionSchema } from '@/lib/types';
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

export async function generateAttractionInfo(input: GenerateAttractionInfoInput): Promise<GenerateAttractionInfoOutput> {
    
    // Step 1: Generate Introduction Text and Quiz in parallel
    const introAndQuizPromise = ai.generate({
        model: 'googleai/gemini-2.0-flash',
        system: `你是一位風趣幽默、知識淵博的在地導遊 AI。
你的任務是為觀光景點產生一段引人入勝的介紹和一個相關的測驗。
請使用繁體中文。`,
        prompt: `景點名稱: 「${input.attractionName}」
地址: 「${input.attractionAddress}」

請為此景點完成兩件事：
1.  **介紹**: 產生一段約 100-150 字的生動簡介。內容可以包含歷史、文化、特色、或有趣的小知識。文筆要像個真正的部落客，風趣、有吸引力。
2.  **測驗**: 產生一個包含 3 個問題的選擇題測驗。每個問題應有 4 個可能的答案，並與景點的歷史、文化或特色相關。`,
        output: {
            schema: z.object({
                introduction: z.string().describe("The generated introduction text for the attraction."),
                quiz: z.array(QuizQuestionSchema).describe("The generated quiz with 3 questions.")
            })
        }
    });

    const { output } = await introAndQuizPromise;

    if (!output || !output.introduction || !output.quiz) {
        throw new Error("Failed to generate attraction introduction and quiz.");
    }
    
    const { introduction, quiz } = output;

    // Step 2: Generate TTS from the introduction
    try {
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
            // Don't throw, just return without audio if TTS fails
            console.warn("TTS generation failed, returning without audio.");
            return {
                introduction,
                quiz,
                audioDataUri: null,
            };
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

    } catch (ttsError) {
        console.error("TTS generation encountered an error:", ttsError);
        // Return text content even if TTS fails
        return {
            introduction,
            quiz,
            audioDataUri: null,
        };
    }
}

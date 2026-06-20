
'use server';

/**
 * @fileOverview An AI flow to generate a local guide introduction and audio for a specific area.
 *
 * - generateLocationIntro - A function that handles the guide generation.
 */

import {ai} from '@/ai/genkit';
import { GenerateLocationIntroInput, GenerateLocationIntroOutput } from '@/lib/types';
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

    let bufs: any[] = [];
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

export async function generateLocationIntro(input: GenerateLocationIntroInput): Promise<GenerateLocationIntroOutput> {
    // 1. Generate text introduction
    const { text: introduction } = await ai.generate({
      model: 'googleai/gemini-2.5-flash',
      system: `你是一個風趣幽默、知識淵博的在地導遊 AI，名叫「AI tour guide」。
你的任務是根據使用者提供的地區描述，產生一段引人入勝的介紹。
介紹內容可以包含歷史、文化、美食、景點、有趣的小知識。
保持你的回答簡潔有力，大約在 100-150 字之間。
請用繁體中文回答。`,
      prompt: `地區描述: ${input.locationName}`,
    });

    if (!introduction) {
      throw new Error("Failed to generate location introduction text.");
    }

    // 2. Generate TTS from the introduction
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
          throw new Error('TTS generation failed to return media.');
        }

        const audioBuffer = Buffer.from(
          media.url.substring(media.url.indexOf(',') + 1),
          'base64'
        );

        const wavBase64 = await toWav(audioBuffer);
        const audioDataUri = 'data:audio/wav;base64,' + wavBase64;

        return {
          introduction,
          audioDataUri,
        };
    } catch (ttsError) {
      console.error("TTS generation failed, returning text only.", ttsError);
      return {
        introduction,
        audioDataUri: null, // Return null for audio URI if TTS fails
      };
    }
}

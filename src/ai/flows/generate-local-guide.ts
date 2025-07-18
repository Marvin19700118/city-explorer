'use server';

/**
 * @fileOverview An AI flow to generate a local text and audio guide.
 *
 * - generateLocalGuide - A function that handles the guide generation process.
 * - GenerateLocalGuideInput - The input type for the generateLocalGuide function.
 * - GenerateLocalGuideOutput - The return type for the generateLocalGuide function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import wav from 'wav';

const GenerateLocalGuideInputSchema = z.object({
  locationDescription: z
    .string()
    .describe('A description of the user location, e.g., an address or area name.'),
  lat: z.number().optional().describe('The latitude of the location.'),
  lng: z.number().optional().describe('The longitude of the location.'),
});
export type GenerateLocalGuideInput = z.infer<typeof GenerateLocalGuideInputSchema>;

const GenerateLocalGuideOutputSchema = z.object({
  guideText: z.string().describe('The generated textual guide.'),
  audioDataUri: z.string().describe('The generated audio guide as a data URI.'),
});
export type GenerateLocalGuideOutput = z.infer<typeof GenerateLocalGuideOutputSchema>;

export async function generateLocalGuide(input: GenerateLocalGuideInput): Promise<GenerateLocalGuideOutput> {
  return generateLocalGuideFlow(input);
}

const textGenerationPrompt = ai.definePrompt({
    name: 'generateLocalGuideTextPrompt',
    input: {schema: GenerateLocalGuideInputSchema},
    output: {schema: z.object({ guideText: z.string() })},
    prompt: `您是一位知識淵博的在地導遊。請根據使用者目前所在的位置，產生一段約 150-200 字的人文歷史或附近有趣景點的導覽解說。
{{#if lat}}
請特別專注於以經緯度 ({{lat}}, {{lng}}) 為中心，方圓 2 公里內的人文歷史、景點或特殊事件。
{{/if}}
請用繁體中文回答。

使用者位置描述: {{{locationDescription}}}
`,
});

async function textToSpeech(text: string): Promise<string> {
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
      prompt: text,
    });
    if (!media) {
      throw new Error('no media returned from TTS');
    }
    const audioBuffer = Buffer.from(
      media.url.substring(media.url.indexOf(',') + 1),
      'base64'
    );
    const wavData = await toWav(audioBuffer);
    return 'data:audio/wav;base64,' + wavData;
}


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

    let bufs: Buffer[] = [];
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

const generateLocalGuideFlow = ai.defineFlow(
  {
    name: 'generateLocalGuideFlow',
    inputSchema: GenerateLocalGuideInputSchema,
    outputSchema: GenerateLocalGuideOutputSchema,
  },
  async input => {
    // 1. Generate text guide
    const { output: textOutput } = await textGenerationPrompt(input);
    const guideText = textOutput?.guideText;

    if (!guideText) {
        throw new Error("Failed to generate guide text.");
    }

    // 2. Convert text to speech
    const audioDataUri = await textToSpeech(guideText);

    return {
        guideText,
        audioDataUri,
    };
  }
);

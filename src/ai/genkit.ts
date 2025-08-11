import {genkit, GenerationCommonOptions, GenerationOptions, ModelArgument} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {generate} from 'genkit/generate';

function incrementGeminiApiCount() {
  if (typeof window !== 'undefined') {
    let count = parseInt(localStorage.getItem('geminiApiCallCount') || '0', 10);
    count++;
    localStorage.setItem('geminiApiCallCount', count.toString());
  }
}

const originalGenerate = generate;

// @ts-ignore
const wrappedGenerate: typeof generate = async (options: GenerationOptions, commonOptions?: GenerationCommonOptions) => {
  incrementGeminiApiCount();
  return originalGenerate(options, commonOptions);
}


export const ai = {
  ...genkit({
    plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
    model: 'googleai/gemini-2.0-flash',
  }),
  generate: wrappedGenerate,
};


import {genkit, GenerationCommonOptions, GenerationOptions} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

function incrementGeminiApiCount() {
  if (typeof window !== 'undefined') {
    let count = parseInt(localStorage.getItem('geminiApiCallCount') || '0', 10);
    count++;
    localStorage.setItem('geminiApiCallCount', count.toString());
  }
}

const originalGenerate = genkit.generate;

const wrappedGenerate: typeof originalGenerate = async (
  options: GenerationOptions,
  commonOptions?: GenerationCommonOptions
) => {
  incrementGeminiApiCount();
  // @ts-ignore
  return originalGenerate(options, commonOptions);
};


export const ai = {
  ...genkit({
    plugins: [googleAI({apiKey: process.env.GEMINI_API_KEY})],
  }),
  generate: wrappedGenerate,
};

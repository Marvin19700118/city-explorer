
import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// This is the correct way to initialize and export the genkit instance.
// The previous implementation with a custom 'ai' object was flawed and
// did not correctly export all necessary genkit functions, causing errors.
export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.GEMINI_API_KEY || '__GENKIT_API_KEY__',
    }),
  ],
});

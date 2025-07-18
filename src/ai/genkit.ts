import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

export const ai = genkit({
  plugins: [googleAI({apiKey: "AIzaSyCzYSkR6smA2Qyp7WJvLmG-nqDjOG6itvY"})],
  model: 'googleai/gemini-2.0-flash',
});

'use server';

/**
 * @fileOverview AI flow to generate a quiz about a specific area based on its description.
 *
 * The flow takes an area description as input and returns a quiz consisting of questions and answers.
 * It uses a Genkit prompt to generate the quiz content.
 *
 * @interface GenerateAreaQuizInput - Input type for the generateAreaQuiz function.
 * @interface GenerateAreaQuizOutput - Output type for the generateAreaQuiz function.
 * @function generateAreaQuiz - Main function to generate the area quiz.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAreaQuizInputSchema = z.object({
  areaDescription: z
    .string()
    .describe('A detailed description of the area for which the quiz is to be generated.'),
});
export type GenerateAreaQuizInput = z.infer<typeof GenerateAreaQuizInputSchema>;

const GenerateAreaQuizOutputSchema = z.object({
  quiz: z.array(
    z.object({
      question: z.string().describe('The quiz question.'),
      answers: z.array(z.string()).describe('An array of 4 possible answers to the question.'),
      correctAnswerIndex: z
        .number()
        .describe('The index of the correct answer in the answers array.'),
    })
  ).describe('An array of 5 quiz questions, their answers, and correct answer indices.'),
});
export type GenerateAreaQuizOutput = z.infer<typeof GenerateAreaQuizOutputSchema>;

export async function generateAreaQuiz(input: GenerateAreaQuizInput): Promise<GenerateAreaQuizOutput> {
  return generateAreaQuizFlow(input);
}

const generateAreaQuizPrompt = ai.definePrompt({
  name: 'generateAreaQuizPrompt',
  input: {schema: GenerateAreaQuizInputSchema},
  output: {schema: GenerateAreaQuizOutputSchema},
  prompt: `You are an AI quiz generator. Generate a 5-question multiple-choice quiz based on the following area description. Each question should have 4 possible answers. The questions should be interesting and related to the history, culture, or landmarks of the area.

Area Description: {{{areaDescription}}}

Output the quiz as a JSON object. Each question should have a question field, an answers field (an array of 4 strings), and a correctAnswerIndex field (the 0-based index of the correct answer in the answers array).`,
});

const generateAreaQuizFlow = ai.defineFlow(
  {
    name: 'generateAreaQuizFlow',
    inputSchema: GenerateAreaQuizInputSchema,
    outputSchema: GenerateAreaQuizOutputSchema,
  },
  async input => {
    const {output} = await generateAreaQuizPrompt(input);
    return output!;
  }
);

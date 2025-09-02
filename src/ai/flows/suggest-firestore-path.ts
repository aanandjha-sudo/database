'use server';

/**
 * @fileOverview An AI agent that suggests a Firestore path based on a user prompt.
 *
 * - suggestFirestorePath - A function that handles the Firestore path suggestion process.
 * - SuggestFirestorePathInput - The input type for the suggestFirestorePath function.
 * - SuggestFirestorePathOutput - The return type for the suggestFirestorePath function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestFirestorePathInputSchema = z.object({
  prompt: z.string().describe('The user prompt describing the data to store or retrieve.'),
});
export type SuggestFirestorePathInput = z.infer<typeof SuggestFirestorePathInputSchema>;

const SuggestFirestorePathOutputSchema = z.object({
  suggestedPath: z.string().describe('The suggested Firestore path for storing or retrieving the data.'),
  reasoning: z.string().describe('The reasoning behind the suggested path.'),
});
export type SuggestFirestorePathOutput = z.infer<typeof SuggestFirestorePathOutputSchema>;

export async function suggestFirestorePath(input: SuggestFirestorePathInput): Promise<SuggestFirestorePathOutput> {
  return suggestFirestorePathFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestFirestorePathPrompt',
  input: {schema: SuggestFirestorePathInputSchema},
  output: {schema: SuggestFirestorePathOutputSchema},
  prompt: `You are a helpful assistant that suggests Firestore paths based on user prompts.

  The Firestore path should be structured and logical, reflecting the type of data being stored or retrieved.
  Consider common Firestore best practices when suggesting paths.

  User Prompt: {{{prompt}}}

  Respond with a JSON object containing the suggested path and the reasoning behind it.
  `,
});

const suggestFirestorePathFlow = ai.defineFlow(
  {
    name: 'suggestFirestorePathFlow',
    inputSchema: SuggestFirestorePathInputSchema,
    outputSchema: SuggestFirestorePathOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

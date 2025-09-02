'use server';

/**
 * @fileOverview A Genkit flow for summarizing data at a given Firestore path for a user.
 *
 * - summarizeDataForUser - A function that takes a Firestore path and returns a summary of the data.
 * - SummarizeDataForUserInput - The input type for the summarizeDataForUser function.
 * - SummarizeDataForUserOutput - The return type for the summarizeDataForUser function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeDataForUserInputSchema = z.object({
  firestorePath: z.string().describe('The Firestore path to the document or collection to summarize.'),
});
export type SummarizeDataForUserInput = z.infer<typeof SummarizeDataForUserInputSchema>;

const SummarizeDataForUserOutputSchema = z.object({
  summary: z.string().describe('A summary of the data found at the given Firestore path.'),
});
export type SummarizeDataForUserOutput = z.infer<typeof SummarizeDataForUserOutputSchema>;

export async function summarizeDataForUser(input: SummarizeDataForUserInput): Promise<SummarizeDataForUserOutput> {
  return summarizeDataForUserFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeDataForUserPrompt',
  input: {schema: SummarizeDataForUserInputSchema},
  output: {schema: SummarizeDataForUserOutputSchema},
  prompt: `You are an expert summarizer of data stored in Firestore.  You will be provided with the path to a Firestore document or collection, and you will provide a concise summary of the data contained within that document or collection. The summary should be easy to understand for someone who is not familiar with the data.

Firestore Path: {{{firestorePath}}}`,
});

const summarizeDataForUserFlow = ai.defineFlow(
  {
    name: 'summarizeDataForUserFlow',
    inputSchema: SummarizeDataForUserInputSchema,
    outputSchema: SummarizeDataForUserOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

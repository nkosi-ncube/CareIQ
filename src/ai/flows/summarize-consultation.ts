'use server';

/**
 * @fileOverview Generates a summary of past consultations using AI.
 *
 * - summarizeConsultationHistory - A function that generates a summary of past consultations.
 * - SummarizeConsultationHistoryInput - The input type for the summarizeConsultationHistory function.
 * - SummarizeConsultationHistoryOutput - The return type for the summarizeConsultationHistory function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeConsultationHistoryInputSchema = z.object({
  consultationHistory: z
    .string()
    .describe('The historical details of past consultations.'),
});
export type SummarizeConsultationHistoryInput = z.infer<
  typeof SummarizeConsultationHistoryInputSchema
>;

const SummarizeConsultationHistoryOutputSchema = z.object({
  summary: z.string().describe('The AI-generated summary of past consultations.'),
});
export type SummarizeConsultationHistoryOutput = z.infer<
  typeof SummarizeConsultationHistoryOutputSchema
>;

export async function summarizeConsultationHistory(
  input: SummarizeConsultationHistoryInput
): Promise<SummarizeConsultationHistoryOutput> {
  return summarizeConsultationHistoryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeConsultationHistoryPrompt',
  input: {schema: SummarizeConsultationHistoryInputSchema},
  output: {schema: SummarizeConsultationHistoryOutputSchema},
  prompt: `You are an AI assistant designed to summarize a patient's consultation history.  Provide a concise summary highlighting key trends, changes in health status, and important observations across all consultations.  The goal is to give the user a quick understanding of their health journey progression.

Consultation History: {{{consultationHistory}}}`,
});

const summarizeConsultationHistoryFlow = ai.defineFlow(
  {
    name: 'summarizeConsultationHistoryFlow',
    inputSchema: SummarizeConsultationHistoryInputSchema,
    outputSchema: SummarizeConsultationHistoryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

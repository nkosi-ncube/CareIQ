'use server';

/**
 * @fileOverview AI agent to analyze user symptoms and suggest relevant healthcare professionals for consultation.
 *
 * - analyzeSymptomsForConsultation - A function that handles the symptom analysis and professional suggestion process.
 * - AnalyzeSymptomsInput - The input type for the analyzeSymptomsForConsultation function.
 * - AnalyzeSymptomsOutput - The return type for the analyzeSymptomsForConsultation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeSymptomsInputSchema = z.object({
  symptomsDescription: z
    .string()
    .describe('A detailed description of the user\'s symptoms.'),
});
export type AnalyzeSymptomsInput = z.infer<typeof AnalyzeSymptomsInputSchema>;

const AnalyzeSymptomsOutputSchema = z.object({
  suggestedProfessionals: z
    .array(z.string())
    .describe(
      'A list of healthcare professional specializations that are relevant to the described symptoms.'
    ),
  confidenceLevel: z
    .number()
    .describe(
      'A numerical value (0-1) indicating the confidence level of the AI in its suggestions.'
    ),
});
export type AnalyzeSymptomsOutput = z.infer<typeof AnalyzeSymptomsOutputSchema>;

export async function analyzeSymptomsForConsultation(
  input: AnalyzeSymptomsInput
): Promise<AnalyzeSymptomsOutput> {
  return analyzeSymptomsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeSymptomsPrompt',
  input: {schema: AnalyzeSymptomsInputSchema},
  output: {schema: AnalyzeSymptomsOutputSchema},
  prompt: `You are an AI assistant designed to analyze a user's description of their symptoms and suggest relevant healthcare professionals for a consultation.

Analyze the following symptoms description:

{{symptomsDescription}}

Based on this description, suggest a list of healthcare professional specializations that would be most appropriate for the user to consult. Also, provide a confidence level (0-1) for your suggestions.

Please output your response as a JSON object conforming to the following schema:
\n${JSON.stringify(AnalyzeSymptomsOutputSchema.shape, null, 2)}`,
});

const analyzeSymptomsFlow = ai.defineFlow(
  {
    name: 'analyzeSymptomsFlow',
    inputSchema: AnalyzeSymptomsInputSchema,
    outputSchema: AnalyzeSymptomsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

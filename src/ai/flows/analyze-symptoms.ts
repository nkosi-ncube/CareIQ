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
  photoDataUri: z
    .string()
    .optional()
    .describe(
      "An optional photo of a symptom, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
  followUpAnswers: z.string().optional().describe("The user's answers to the AI-generated follow-up questions, if any."),
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
  urgencyLevel: z
    .enum(['Low', 'Medium', 'High'])
    .describe('An assessment of the urgency of the situation based on the symptoms.'),
  recommendedAction: z
    .string()
    .describe('A recommended course of action for the user, e.g., "Schedule a routine check-up".'),
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
  prompt: `You are an AI assistant designed to analyze a user's description of their symptoms and suggest relevant healthcare professionals for a consultation. You may also be provided with a photo for visual analysis and answers to follow-up questions you previously generated.

Analyze the following symptoms description:
{{symptomsDescription}}

{{#if photoDataUri}}
You have also been provided with a photo of the symptom. Analyze it carefully.
Photo: {{media url=photoDataUri}}
{{/if}}

{{#if followUpAnswers}}
The user has also provided answers to your follow-up questions. Use this additional information to refine your analysis and provide a more accurate recommendation.
Follow-up Answers:
{{{followUpAnswers}}}
{{/if}}

Based on all the information provided (text, photo, and answers):
1. Suggest a list of healthcare professional specializations.
2. Provide a confidence level (0-1) for your suggestions.
3. Determine an urgency level ('Low', 'Medium', or 'High').
4. Provide a clear, concise recommended action for the user.

Please output your response as a JSON object.`,
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


'use server';

/**
 * @fileOverview Generates a potential diagnosis based on initial symptoms and live consultation notes.
 *
 * - generateDiagnosis - A function that generates a structured diagnosis.
 * - GenerateDiagnosisInput - The input type for the function.
 * - GenerateDiagnosisOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDiagnosisInputSchema = z.object({
  symptomsSummary: z
    .string()
    .describe("The patient's initial summary of their symptoms."),
  consultationNotes: z
    .string()
    .describe("The healthcare professional's notes taken during the live consultation."),
});
export type GenerateDiagnosisInput = z.infer<typeof GenerateDiagnosisInputSchema>;

const GenerateDiagnosisOutputSchema = z.object({
  diagnosisSummary: z
    .string()
    .describe('A concise summary of the diagnosis based on all available information.'),
  potentialConditions: z
    .array(z.string())
    .min(1)
    .describe('A list of potential conditions or differential diagnoses for the HCP to review.'),
  recommendedNextSteps: z
    .string()
    .describe('A clear, actionable set of recommended next steps for the patient or HCP.'),
});
export type GenerateDiagnosisOutput = z.infer<typeof GenerateDiagnosisOutputSchema>;

export async function generateDiagnosis(
  input: GenerateDiagnosisInput
): Promise<GenerateDiagnosisOutput> {
  return generateDiagnosisFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDiagnosisPrompt',
  input: {schema: GenerateDiagnosisInputSchema},
  output: {schema: GenerateDiagnosisOutputSchema},
  prompt: `You are an AI assistant for a healthcare professional conducting a live telehealth consultation. Your task is to generate a potential diagnosis and action plan based on the information provided.

Analyze the following information carefully:
1.  **Patient's Initial Symptoms**: {{{symptomsSummary}}}
2.  **HCP's Consultation Notes**: {{{consultationNotes}}}

Based on a comprehensive analysis of both the initial symptoms and the detailed notes from the consultation, please provide:
- A concise summary of your diagnosis.
- A list of potential conditions or differential diagnoses. This list will be presented to the HCP as a checklist to make a final decision.
- A clear, actionable set of recommended next steps (e.g., "Create a prescription for Amoxicillin," "Recommend a physical visit for a blood test," "No further action needed at this time.").
`,
});

const generateDiagnosisFlow = ai.defineFlow(
  {
    name: 'generateDiagnosisFlow',
    inputSchema: GenerateDiagnosisInputSchema,
    outputSchema: GenerateDiagnosisOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

    
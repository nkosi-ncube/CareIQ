'use server';

/**
 * @fileOverview Generates a prescription suggestion based on a diagnosis.
 *
 * - generatePrescription - A function that generates a structured prescription suggestion.
 * - GeneratePrescriptionInput - The input type for the function.
 * - GeneratePrescriptionOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import type { GenerateDiagnosisOutput } from './generate-diagnosis';

const MedicationSuggestionSchema = z.object({
    name: z.string().describe('The name of the suggested medication.'),
    dosage: z.string().describe('The recommended dosage, e.g., "500mg".'),
    frequency: z.string().describe('The recommended frequency, e.g., "Twice a day for 7 days".'),
    reason: z.string().describe('A brief reason for suggesting this medication.'),
});

const GeneratePrescriptionInputSchema = z.object({
  diagnosis: z.custom<GenerateDiagnosisOutput>()
    .describe('The diagnosis object containing summary, potential conditions, and next steps.'),
});
export type GeneratePrescriptionInput = z.infer<typeof GeneratePrescriptionInputSchema>;


const GeneratePrescriptionOutputSchema = z.object({
  medications: z
    .array(MedicationSuggestionSchema)
    .describe('A list of suggested medications for the prescription.'),
  notes: z
    .string()
    .describe('Additional notes for the pharmacist or patient.'),
  confidenceLevel: z.number().describe('A confidence score (0-1) for the prescription suggestion.'),
});
export type GeneratePrescriptionOutput = z.infer<typeof GeneratePrescriptionOutputSchema>;


export async function generatePrescription(
  input: GeneratePrescriptionInput
): Promise<GeneratePrescriptionOutput> {
  return generatePrescriptionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generatePrescriptionPrompt',
  input: {schema: GeneratePrescriptionInputSchema},
  output: {schema: GeneratePrescriptionOutputSchema},
  prompt: `You are an AI assistant to a qualified healthcare professional (HCP). Your task is to suggest a potential prescription based on a diagnosis provided by the HCP's AI diagnostic assistant.

**IMPORTANT**: This is a suggestion only. The HCP will review, edit, and approve the final prescription. Your suggestions should be based on common, evidence-based treatment guidelines.

Analyze the following diagnosis information:
- **Diagnosis Summary**: {{{diagnosis.diagnosisSummary}}}
- **Potential Conditions**: {{#each diagnosis.potentialConditions}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- **Recommended Next Steps**: {{{diagnosis.recommendedNextSteps}}}

Based on this diagnosis, provide a list of suggested medications, including their name, dosage, frequency, and a brief reason for the suggestion. Add any relevant notes for the pharmacist or patient. Finally, provide a confidence score for your suggestion.
`,
});

const generatePrescriptionFlow = ai.defineFlow(
  {
    name: 'generatePrescriptionFlow',
    inputSchema: GeneratePrescriptionInputSchema,
    outputSchema: GeneratePrescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

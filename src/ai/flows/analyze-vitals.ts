'use server';

/**
 * @fileOverview AI agent to analyze real-time vital signs from a connected device.
 *
 * - analyzeVitals - A function that handles the real-time vital analysis.
 * - AnalyzeVitalsInput - The input type for the analyzeVitals function.
 * - AnalyzeVitalsOutput - The return type for the analyzeVitals function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AnalyzeVitalsInputSchema = z.object({
  heartRate: z.number().describe('The current heart rate in beats per minute (BPM).'),
  bloodOxygen: z.number().describe('The current blood oxygen saturation level (SpO2) as a percentage.'),
  temperature: z.number().optional().describe('The current body temperature in Celsius (°C).'),
});
export type AnalyzeVitalsInput = z.infer<typeof AnalyzeVitalsInputSchema>;

const AnalyzeVitalsOutputSchema = z.object({
  status: z.enum(['Normal', 'Warning', 'Critical']).describe('The overall status of the vitals.'),
  analysis: z.string().describe('A brief, human-readable analysis of the current vitals.'),
});
export type AnalyzeVitalsOutput = z.infer<typeof AnalyzeVitalsOutputSchema>;

export async function analyzeVitals(
  input: AnalyzeVitalsInput
): Promise<AnalyzeVitalsOutput> {
  return analyzeVitalsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'analyzeVitalsPrompt',
  input: {schema: AnalyzeVitalsInputSchema},
  output: {schema: AnalyzeVitalsOutputSchema},
  prompt: `You are "CareWatch," an AI Health Monitoring Agent. Your task is to analyze real-time vital signs from a user's connected device. Provide a concise, one-sentence analysis and a corresponding status level.

Normal Ranges:
- Heart Rate: 60-100 BPM
- Blood Oxygen (SpO2): 95-100%
- Temperature: 36.5-37.5 °C

Current Vitals:
- Heart Rate: {{heartRate}} BPM
- Blood Oxygen: {{bloodOxygen}}%
{{#if temperature}}- Temperature: {{temperature}}°C{{/if}}

Analyze these vitals and determine if they are Normal, a Warning (slightly outside the normal range), or Critical (significantly outside the normal range, potentially requiring attention). Provide a brief analysis explaining your reasoning.
`,
});

const analyzeVitalsFlow = ai.defineFlow(
  {
    name: 'analyzeVitalsFlow',
    inputSchema: AnalyzeVitalsInputSchema,
    outputSchema: AnalyzeVitalsOutputSchema,
  },
  async input => {
    // Add a slight delay to simulate processing time
    await new Promise(resolve => setTimeout(resolve, 500));
    const {output} = await prompt(input);
    return output!;
  }
);

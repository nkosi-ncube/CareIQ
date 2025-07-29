'use server';

/**
 * @fileOverview Generates relevant follow-up questions based on initial symptoms and patient history.
 *
 * - generateFollowUpQuestions - A function that generates a list of questions.
 * - GenerateFollowUpQuestionsInput - The input type for the function.
 * - GenerateFollowUpQuestionsOutput - The return type for the function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const patientDetailsSchema = z.object({
    name: z.string(),
    age: z.number(),
    knownConditions: z.array(z.string()),
});

const GenerateFollowUpQuestionsInputSchema = z.object({
    symptomsDescription: z
      .string()
      .describe('A detailed description of the user\'s symptoms.'),
    patientDetails: patientDetailsSchema.describe("The patient's basic details and known conditions."),
  });
export type GenerateFollowUpQuestionsInput = z.infer<typeof GenerateFollowUpQuestionsInputSchema>;


const GenerateFollowUpQuestionsOutputSchema = z.object({
  questions: z
    .array(z.string())
    .describe(
      'A list of 3-5 relevant follow-up questions to ask the user to get more clarity on their symptoms.'
    ),
});
export type GenerateFollowUpQuestionsOutput = z.infer<
  typeof GenerateFollowUpQuestionsOutputSchema
>;

export async function generateFollowUpQuestions(
  input: GenerateFollowUpQuestionsInput
): Promise<GenerateFollowUpQuestionsOutput> {
  return generateFollowUpQuestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateFollowUpQuestionsPrompt',
  input: {schema: GenerateFollowUpQuestionsInputSchema},
  output: {schema: GenerateFollowUpQuestionsOutputSchema},
  prompt: `You are an AI assistant in a healthcare app. Your role is to help gather more information from a user based on their initial symptoms.

The user has provided the following details:
- Name: {{patientDetails.name}}
- Age: {{patientDetails.age}}
- Known Conditions: {{#each patientDetails.knownConditions}}{{{this}}}{{#unless @last}}, {{/unless}}{{/each}}
- Initial Symptoms: {{{symptomsDescription}}}

Based on this information, generate a list of 3-5 specific, relevant follow-up questions to better understand their condition. The questions should be clear and for a non-medical person to answer. Do not ask for information already provided.
`,
});

const generateFollowUpQuestionsFlow = ai.defineFlow(
  {
    name: 'generateFollowUpQuestionsFlow',
    inputSchema: GenerateFollowUpQuestionsInputSchema,
    outputSchema: GenerateFollowUpQuestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);

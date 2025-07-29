import { z } from 'zod';

export const patientDetailsSchema = z.object({
    name: z.string(),
    age: z.number(),
    knownConditions: z.array(z.string()),
});

export const GenerateFollowUpQuestionsInputSchema = z.object({
    symptomsDescription: z
      .string()
      .describe('A detailed description of the user\'s symptoms.'),
    patientDetails: patientDetailsSchema.describe("The patient's basic details and known conditions."),
  });
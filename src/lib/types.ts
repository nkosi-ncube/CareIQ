import { z } from 'zod';
import { GenerateFollowUpQuestionsInputSchema } from './schemas';

export type Consultation = {
  id: string;
  date: string;
  doctor: string;
  specialty: string;
  symptoms: string;
  diagnosis: string;
};

export type GenerateFollowUpQuestionsInput = z.infer<typeof GenerateFollowUpQuestionsInputSchema>;

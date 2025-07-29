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

export type Patient = {
    id: string;
    name: string;
    age: number;
    lastConsultation: string;
    riskLevel: 'Low' | 'Medium' | 'High';
    symptoms: string;
    avatarUrl: string;
};

export type HCP = {
    name: string;
    email: string;
    practiceNumber: string;
}

export type UserSession = {
    id: string;
    name: string;
    email: string;
    role: 'patient' | 'hcp';
}

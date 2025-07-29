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
    id: string;
    name: string;
    email?: string;
    practiceNumber?: string;
    specialty: string;
}

export type UserSession = {
    id: string;
    name: string;
    email: string;
    role: 'patient' | 'hcp';
}

export type WaitingRoomData = {
    consultationId: string;
    status: 'waiting' | 'active' | 'completed' | 'cancelled';
    symptomsSummary: string;
    hcp: {
        name: string;
        specialty: string;
    },
    patient: {
        name: string;
    }
}

export interface WaitingPatient {
    consultationId: string;
    patientId: string;
    patientName: string;
    patientAge: number;
    symptoms: string;
}

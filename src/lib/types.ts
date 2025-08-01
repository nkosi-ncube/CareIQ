import { z } from 'zod';
import type { GenerateFollowUpQuestionsInput } from '@/ai/flows/generate-follow-up-questions';
import type { AnalyzeSymptomsOutput } from '@/ai/flows/analyze-symptoms';

export type Consultation = {
  id: string;
  date: string;
  doctor: string;
  specialty: string;
  symptoms: string;
  diagnosis: string;
};

// Re-exporting for use in client components
export type { GenerateFollowUpQuestionsInput };

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
    specialty?: string;
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
    urgencyLevel: 'Low' | 'Medium' | 'High';
}

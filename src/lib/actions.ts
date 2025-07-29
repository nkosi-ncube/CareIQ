'use server';

import { analyzeSymptomsForConsultation } from '@/ai/flows/analyze-symptoms';
import { generateFollowUpQuestions } from '@/ai/flows/generate-follow-up-questions';
import { summarizeConsultationHistory } from '@/ai/flows/summarize-consultation';
import { patientDetails } from './mock-data';
import type { Consultation } from './types';

export async function getAIMatch(symptoms: string, photoDataUri?: string | null) {
  if (!symptoms) {
    return { success: false, error: 'Symptoms description cannot be empty.' };
  }
  try {
    const result = await analyzeSymptomsForConsultation({
      symptomsDescription: symptoms,
      photoDataUri: photoDataUri || undefined,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error analyzing symptoms:', error);
    return { success: false, error: 'Failed to analyze symptoms due to a server error. Please try again.' };
  }
}

export async function getFollowUpQuestions(symptoms: string) {
    if (!symptoms) {
      return { success: false, error: 'Symptoms description cannot be empty.' };
    }
    try {
      const result = await generateFollowUpQuestions({
        symptomsDescription: symptoms,
        patientDetails: patientDetails,
      });
      return { success: true, data: result };
    } catch (error)
    {
      console.error('Error generating follow-up questions:', error);
      return { success: false, error: 'Failed to generate follow-up questions due to a server error. Please try again.' };
    }
}

export async function getAISummary(consultations: Consultation[]) {
  if (!consultations || consultations.length === 0) {
    return { success: false, error: 'No consultation history provided.' };
  }
  try {
    const history = consultations
      .map(
        (c) => `Date: ${c.date}\nDoctor: ${c.doctor} (${c.specialty})\nSymptoms: ${c.symptoms}\nDiagnosis: ${c.diagnosis}`
      )
      .join('\n\n---\n\n');
    
    const result = await summarizeConsultationHistory({
      consultationHistory: history,
    });
    return { success: true, data: result };
  } catch (error) {
    console.error('Error summarizing history:', error);
    return { success: false, error: 'Failed to generate summary due to a server error. Please try again.' };
  }
}

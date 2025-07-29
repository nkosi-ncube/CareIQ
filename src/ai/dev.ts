import { config } from 'dotenv';
config();

import '@/ai/flows/summarize-consultation.ts';
import '@/ai/flows/analyze-symptoms.ts';
import '@/ai/flows/generate-follow-up-questions.ts';
import '@/ai/flows/transcribe-audio.ts';
import '@/ai/flows/generate-diagnosis.ts';
import '@/ai/flows/generate-prescription.ts';
import '@/ai/flows/analyze-vitals.ts';
import '@/ai/flows/translate-text.ts';

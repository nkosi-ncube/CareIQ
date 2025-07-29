'use server';

import { analyzeSymptomsForConsultation } from '@/ai/flows/analyze-symptoms';
import { generateFollowUpQuestions } from '@/ai/flows/generate-follow-up-questions';
import { summarizeConsultationHistory } from '@/ai/flows/summarize-consultation';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { patientDetails } from './mock-data';
import type { Consultation } from './types';
import dbConnect from './db';
import User, { IUser } from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { z } from 'zod';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = '1d';


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
      // TODO: Get patient details from logged in user
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

export async function transcribeAudioAction(audioDataUri: string) {
    if (!audioDataUri) {
        return { success: false, error: 'Audio data cannot be empty.' };
    }
    try {
        const result = await transcribeAudio({ audioDataUri });
        return { success: true, data: result };
    } catch (error) {
        console.error('Error transcribing audio:', error);
        return { success: false, error: 'Failed to transcribe audio due to a server error. Please try again.' };
    }
}

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['patient', 'hcp']),
    practiceNumber: z.string().optional(),
    paymentMethod: z.enum(['cash', 'medicalAid']).optional(),
    medicalAidName: z.string().optional(),
    medicalAidMemberNumber: z.string().optional(),
});

export async function registerUser(data: z.infer<typeof registerSchema>) {
    try {
        await dbConnect();

        const existingUser = await User.findOne({ email: data.email });
        if (existingUser) {
            return { success: false, error: 'User with this email already exists.' };
        }

        const hashedPassword = await bcrypt.hash(data.password, 10);

        const userData: Partial<IUser> = {
            name: data.name,
            email: data.email,
            password: hashedPassword,
            role: data.role,
        };

        if (data.role === 'hcp') {
            userData.practiceNumber = data.practiceNumber;
        } else {
            userData.paymentMethod = data.paymentMethod;
            if (data.paymentMethod === 'medicalAid') {
                userData.medicalAidInfo = {
                    name: data.medicalAidName!,
                    memberNumber: data.medicalAidMemberNumber!,
                };
            }
        }

        const newUser = new User(userData);
        await newUser.save();

        return { success: true, data: { userId: newUser._id } };
    } catch (error: any) {
        console.error('Registration error:', error);
        return { success: false, error: error.message || 'An unexpected error occurred.' };
    }
}

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1),
});

export async function loginUser(data: z.infer<typeof loginSchema>) {
    try {
        await dbConnect();
        
        const user = await User.findOne({ email: data.email }).select('+password');

        if (!user) {
            return { success: false, error: 'Invalid email or password.' };
        }

        const isMatch = await bcrypt.compare(data.password, user.password!);
        if (!isMatch) {
            return { success: false, error: 'Invalid email or password.' };
        }

        const payload = {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        };

        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

        cookies().set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV !== 'development',
            maxAge: 60 * 60 * 24, // 1 day
            path: '/',
        });

        return { success: true, data: { name: user.name, email: user.email, role: user.role } };
    } catch (error: any) {
        console.error('Login error:', error);
        return { success: false, error: 'An unexpected error occurred during login.' };
    }
}

export async function getSession() {
    const token = cookies().get('token')?.value;
    if (!token) return null;
  
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      return decoded as { id: string; name: string; email: string; role: 'patient' | 'hcp' };
    } catch (error) {
      return null;
    }
}

export async function logoutUser() {
    cookies().delete('token');
}
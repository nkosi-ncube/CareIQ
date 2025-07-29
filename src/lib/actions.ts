
'use server';

import { analyzeSymptomsForConsultation } from '@/ai/flows/analyze-symptoms';
import { generateFollowUpQuestions } from '@/ai/flows/generate-follow-up-questions';
import { summarizeConsultationHistory } from '@/ai/flows/summarize-consultation';
import { transcribeAudio } from '@/ai/flows/transcribe-audio';
import { generateDiagnosis } from '@/ai/flows/generate-diagnosis';
import type { GeneratePrescriptionInput } from '@/ai/flows/generate-prescription';
import { generatePrescription } from '@/ai/flows/generate-prescription';
import { translateText } from '@/ai/flows/translate-text';
import { patientDetails } from './mock-data';
import type { UserSession, WaitingPatient } from './types';
import dbConnect from './db';
import User, { IUser } from '@/models/User';
import ConsultationModel, { IConsultation } from '@/models/Consultation';
import AlertModel, { IAlert } from '@/models/Alert';
import DiagnosticTestModel, { IDiagnosticTest } from '@/models/DiagnosticTest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';
const JWT_EXPIRES_IN = '1d';


export async function getAIMatch(symptoms: string, photoDataUri?: string | null, followUpAnswers?: string) {
  if (!symptoms) {
    return { success: false, error: 'Symptoms description cannot be empty.' };
  }
  try {
    const result = await analyzeSymptomsForConsultation({
      symptomsDescription: symptoms,
      photoDataUri: photoDataUri || undefined,
      followUpAnswers: followUpAnswers || undefined,
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
    }
    catch (error)
    {
      console.error('Error generating follow-up questions:', error);
      return { success: false, error: 'Failed to generate follow-up questions due to a server error. Please try again.' };
    }
}

export async function getAISummary(consultations: IConsultation[]) {
  if (!consultations || consultations.length === 0) {
    return { success: false, error: 'No consultation history provided.' };
  }
  try {
    const historyText = consultations
      .map(
        (c) => {
          const diagnosisSummary = (c.aiDiagnosis as any)?.diagnosisSummary || 'N/A';
          return `Date: ${new Date(c.createdAt).toLocaleDateString()}\nDoctor: ${(c.hcp as any).name} (${(c.hcp as any).specialty})\nSymptoms: ${c.symptomsSummary}\nDiagnosis: ${diagnosisSummary}`
        }
      )
      .join('\n\n---\n\n');
    
    const result = await summarizeConsultationHistory({
      consultationHistory: historyText,
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
    } catch (error: any) {
        console.error('Error transcribing audio:', error);
        return { success: false, error: error.message || 'Failed to transcribe audio due to a server error.' };
    }
}

const registerSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['patient', 'hcp']),
    practiceNumber: z.string().optional(),
    specialty: z.string().optional(),
    paymentMethod: z.enum(['card', 'medicalAid']).optional(),
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
            userData.specialty = data.specialty;
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

        const payload: UserSession = {
            id: user._id.toString(),
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
      if (typeof decoded === 'string') return null;

      // Fetch user from DB to get latest info like specialty
      await dbConnect();
      const user = await User.findById( (decoded as any).id ).lean();
      if (!user) return null;

      const sessionData: UserSession = {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        specialty: user.specialty,
      }
      
      return sessionData;
    } catch (error) {
      return null;
    }
}

export async function logoutUser() {
    cookies().delete('token');
}

export async function findAvailableHCPs(specialties: string[]) {
    try {
        await dbConnect();

        // For now, we assume all HCPs are "available". 
        // In a real app, this would check a status field.
        const hcps = await User.find({
            role: 'hcp',
            // specialty: { $in: specialties } // Temporarily disabled to ensure results
        }).lean();
        
        if (!hcps || hcps.length === 0) {
            return { success: false, error: 'No specialists found for the given criteria.' };
        }
        
        const result = hcps.map(hcp => ({
            id: hcp._id.toString(),
            name: hcp.name,
            specialty: hcp.specialty!,
        }));

        return { success: true, data: result };
    } catch (error) {
        console.error('Error finding HCPs:', error);
        return { success: false, error: 'A server error occurred while searching for specialists.' };
    }
}

export async function createConsultation(hcpId: string, symptoms: string, aiResult: any) {
    const session = await getSession();
    if (!session || session.role !== 'patient') {
      return { success: false, error: 'You must be logged in as a patient to book a consultation.' };
    }
  
    try {
      await dbConnect();
  
      const newConsultation = new ConsultationModel({
        patient: session.id,
        hcp: hcpId,
        status: 'waiting',
        symptomsSummary: symptoms,
        aiAnalysis: aiResult,
      });
  
      await newConsultation.save();
      revalidatePath('/'); // To update the HCP's queue
      
      return { success: true, data: { consultationId: newConsultation._id.toString() }};

    } catch (error) {
      console.error('Error creating consultation:', error);
      return { success: false, error: 'A server error occurred while booking the consultation.' };
    }
}

export async function getWaitingRoomData(consultationId: string) {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    try {
        await dbConnect();

        const consultation = await ConsultationModel.findById(consultationId)
            .populate('hcp', 'name specialty')
            .populate('patient', 'name')
            .lean();

        if (!consultation) {
            return { success: false, error: 'Consultation not found.' };
        }
        
        // Ensure only the patient or the assigned HCP can view this page
        if (session.id !== (consultation.patient as any)._id.toString() && session.id !== (consultation.hcp as any)._id.toString()) {
             return { success: false, error: 'You are not authorized to view this consultation.' };
        }

        return { 
            success: true, 
            data: {
                consultationId: consultation._id.toString(),
                status: consultation.status,
                symptomsSummary: consultation.symptomsSummary,
                hcp: {
                    name: (consultation.hcp as any).name,
                    specialty: (consultation.hcp as any).specialty,
                },
                patient: {
                    name: (consultation.patient as any).name,
                }
            } 
        };

    } catch (error) {
        console.error('Error fetching waiting room data:', error);
        return { success: false, error: 'A server error occurred.' };
    }
}

export async function getHcpDashboardData() {
    const session = await getSession();
    if (!session || session.role !== 'hcp') {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await dbConnect();
        const waitingPatients = await ConsultationModel.find({ hcp: session.id, status: 'waiting' })
            .populate('patient', 'name age')
            .sort({ createdAt: 1 }) // Oldest first
            .lean();
        
        const plainPatients = waitingPatients.map(p => ({
            consultationId: p._id.toString(),
            patientId: (p.patient as any)._id.toString(),
            patientName: (p.patient as any).name,
            patientAge: (p.patient as any).age,
            symptoms: p.symptomsSummary,
            urgencyLevel: (p.aiAnalysis as any)?.urgencyLevel || 'Low'
        }));

        // Sort by urgency: High -> Medium -> Low
        plainPatients.sort((a, b) => {
            const urgencyOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
            return urgencyOrder[a.urgencyLevel] - urgencyOrder[b.urgencyLevel];
        });
        
        return { success: true, data: plainPatients };

    } catch (error) {
        console.error('Error fetching HCP dashboard data:', error);
        return { success: false, error: 'Server error' };
    }
}

export async function updateConsultationStatus(consultationId: string, status: 'active' | 'completed' | 'cancelled') {
    const session = await getSession();
    if (!session || session.role !== 'hcp') {
      return { success: false, error: 'Only the assigned HCP can update the consultation status.' };
    }
  
    try {
      await dbConnect();
  
      const consultation = await ConsultationModel.findById(consultationId);
  
      if (!consultation) {
        return { success: false, error: 'Consultation not found.' };
      }
  
      if (consultation.hcp.toString() !== session.id) {
        return { success: false, error: 'You are not authorized to update this consultation.' };
      }
  
      consultation.status = status;
      await consultation.save();
      
      // Revalidate the waiting room page for the patient and the HCP dashboard
      revalidatePath(`/consultation/${consultationId}/waiting`);
      revalidatePath(`/`); // For HCP dashboard
  
      return { success: true, data: { status: consultation.status } };
    } catch (error) {
      console.error('Error updating consultation status:', error);
      return { success: false, error: 'A server error occurred while updating the consultation.' };
    }
  }


  export async function getAIDiagnosis(symptomsSummary: string, consultationNotes: string) {
    const session = await getSession();
    if (!session || session.role !== 'hcp') {
        return { success: false, error: 'Unauthorized' };
    }
    if (!consultationNotes) {
        return { success: false, error: 'Consultation notes cannot be empty.' };
    }
    try {
        const result = await generateDiagnosis({ symptomsSummary, consultationNotes });
        return { success: true, data: result };
    } catch (error) {
        console.error('Error generating diagnosis:', error);
        return { success: false, error: 'Failed to generate AI diagnosis.' };
    }
}

export async function saveDiagnosis(consultationId: string, diagnosis: any) {
    const session = await getSession();
    if (!session || session.role !== 'hcp') {
        return { success: false, error: 'Unauthorized' };
    }
    try {
        await dbConnect();
        const consultation = await ConsultationModel.findById(consultationId);
        if (!consultation) {
            return { success: false, error: 'Consultation not found.' };
        }
        if (consultation.hcp.toString() !== session.id) {
            return { success: false, error: 'You are not authorized to update this consultation.' };
        }
        consultation.aiDiagnosis = diagnosis;
        consultation.postConsultationSummary = diagnosis.diagnosisSummary;
        await consultation.save();
        return { success: true };
    } catch (error) {
        console.error('Error saving diagnosis:', error);
        return { success: false, error: 'Failed to save diagnosis.' };
    }
}

export async function getAIPrescription(input: GeneratePrescriptionInput) {
    const session = await getSession();
    if (!session || session.role !== 'hcp') {
        return { success: false, error: 'Unauthorized' };
    }
    try {
        const result = await generatePrescription(input);
        return { success: true, data: result };
    } catch (error) {
        console.error('Error generating prescription:', error);
        return { success: false, error: 'Failed to generate AI prescription suggestion.' };
    }
}

export async function approvePrescription(consultationId: string, prescription: any) {
    const session = await getSession();
    if (!session || session.role !== 'hcp') {
        return { success: false, error: 'Unauthorized' };
    }
    try {
        await dbConnect();
        const consultation = await ConsultationModel.findById(consultationId);
        if (!consultation) {
            return { success: false, error: 'Consultation not found.' };
        }
        if (consultation.hcp.toString() !== session.id) {
            return { success: false, error: 'You are not authorized to update this consultation.' };
        }
        consultation.aiPrescription = prescription;
        await consultation.save();
        revalidatePath(`/consultation/${consultationId}/live`);
        revalidatePath(`/`); // For patient prescriptions tab
        return { success: true };
    } catch (error) {
        console.error('Error approving prescription:', error);
        return { success: false, error: 'Failed to save prescription.' };
    }
}

export async function getPatientPrescriptions() {
    const session = await getSession();
    if (!session || session.role !== 'patient') {
      return { success: false, error: 'You must be logged in as a patient to view prescriptions.' };
    }
  
    try {
      await dbConnect();
  
      const consultations = await ConsultationModel.find({ 
        patient: session.id,
        aiPrescription: { $exists: true, $ne: null } 
      })
      .sort({ createdAt: -1 })
      .lean();
  
      const prescriptions = consultations.map(c => ({
        consultationId: c._id.toString(),
        aiPrescription: c.aiPrescription,
      }));
  
      return { success: true, data: prescriptions };
    } catch (error) {
      console.error('Error fetching patient prescriptions:', error);
      return { success: false, error: 'A server error occurred while fetching your prescriptions.' };
    }
  }


export async function getPatientConsultationHistory() {
    const session = await getSession();
    if (!session || session.role !== 'patient') {
      return { success: false, error: 'You must be logged in as a patient.' };
    }
  
    try {
      await dbConnect();
  
      const history = await ConsultationModel.find({ 
        patient: session.id,
        status: 'completed' 
      })
      .populate('hcp', 'name specialty')
      .sort({ createdAt: -1 })
      .lean();
      
      // Manually serialize to convert ObjectId to string
      const serializableHistory = history.map(doc => {
        const plainObject = doc as any;
        plainObject._id = doc._id.toString();
        plainObject.patient = doc.patient.toString();
        if (doc.hcp && (doc.hcp as any)._id) {
            (plainObject.hcp as any)._id = (doc.hcp as any)._id.toString();
        }
        return plainObject;
      });

      return { success: true, data: serializableHistory };
    } catch (error) {
      console.error('Error fetching patient consultation history:', error);
      return { success: false, error: 'A server error occurred while fetching your history.' };
    }
}

export async function getHcpConsultationHistory() {
    const session = await getSession();
    if (!session || session.role !== 'hcp') {
      return { success: false, error: 'You must be logged in as an HCP.' };
    }
  
    try {
      await dbConnect();
  
      const history = await ConsultationModel.find({ 
        hcp: session.id,
        status: 'completed' 
      })
      .populate('patient', 'name')
      .populate('hcp', 'name specialty')
      .sort({ createdAt: -1 })
      .lean();
  
      return { success: true, data: JSON.parse(JSON.stringify(history)) };
    } catch (error) {
      console.error('Error fetching HCP consultation history:', error);
      return { success: false, error: 'A server error occurred while fetching your history.' };
    }
}

export async function getConsultationSummary(consultationId: string) {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    try {
        await dbConnect();
        const consultation = await ConsultationModel.findById(consultationId)
            .populate('hcp', 'name specialty')
            .populate('patient', 'name')
            .lean();

        if (!consultation) {
            return { success: false, error: 'Consultation not found.' };
        }

        // Ensure only the patient or the assigned HCP can view this page
        if (session.id !== (consultation.patient as any)._id.toString() && session.id !== (consultation.hcp as any)._id.toString()) {
            return { success: false, error: 'You are not authorized to view this consultation.' };
        }

        // Use toJSON to ensure all data is serializable
        return { success: true, data: JSON.parse(JSON.stringify(consultation)) };
    } catch (error: any) {
        console.error('Error getting consultation summary:', error);
        return { success: false, error: 'A server error occurred: ' + error.message };
    }
}

type Medication = {
    name: string;
    dosage: string;
    frequency: string;
    reason: string;
};

type ContentToTranslate = {
    symptomsSummary?: string;
    diagnosisSummary?: string;
    potentialConditions?: string[];
    recommendedNextSteps?: string;
    prescriptionNotes?: string;
    medications?: Medication[];
};

export async function translateContent(content: ContentToTranslate, language: string) {
    const session = await getSession();
    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        const translate = async (text: string | undefined | null) => {
            if (!text || text.trim() === '') return text || '';
            const result = await translateText({ text, targetLanguage: language });
            return result.translatedText;
        };

        const translatedContent: Record<string, any> = {};

        const translationPromises: Promise<any>[] = [];

        const process = (key: keyof ContentToTranslate, value: any) => {
            if (typeof value === 'string') {
                translationPromises.push(translate(value).then(res => translatedContent[key] = res));
            } else if (Array.isArray(value) && key === 'potentialConditions') {
                translationPromises.push(Promise.all(value.map(translate)).then(res => translatedContent[key] = res));
            } else if (Array.isArray(value) && key === 'medications') {
                translationPromises.push(Promise.all(
                    value.map(async (med) => ({
                        name: await translate(med.name),
                        dosage: await translate(med.dosage),
                        frequency: await translate(med.frequency),
                        reason: await translate(med.reason),
                    }))
                ).then(res => translatedContent[key] = res));
            }
        };

        for (const [key, value] of Object.entries(content)) {
            process(key as keyof ContentToTranslate, value);
        }
        
        await Promise.all(translationPromises);

        return { success: true, data: translatedContent };
    } catch (error) {
        console.error('Error translating content:', error);
        return { success: false, error: 'Failed to translate content.' };
    }
}


// HACKATHON-SPECIFIC ACTIONS
const profileSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  notificationsEnabled: z.boolean().optional(),
  preferredLanguage: z.string().optional(),
});


export async function getPatientProfile() {
    const session = await getSession();
    if (!session || session.role !== 'patient') {
        return { success: false, error: 'Unauthorized' };
    }
    try {
        await dbConnect();
        const user = await User.findById(session.id).lean();
        if (!user) {
            return { success: false, error: 'User not found' };
        }
        return { success: true, data: JSON.parse(JSON.stringify(user)) };
    } catch (e) {
        return { success: false, error: 'Server error' };
    }
}

export async function getHcpProfile() {
    const session = await getSession();
    if (!session || session.role !== 'hcp') {
        return { success: false, error: 'Unauthorized' };
    }
    try {
        await dbConnect();
        const user = await User.findById(session.id).lean();
        if (!user) {
            return { success: false, error: 'User not found' };
        }
        return { success: true, data: JSON.parse(JSON.stringify(user)) };
    } catch (e) {
        return { success: false, error: 'Server error' };
    }
}


export async function updateUserProfile(data: z.infer<typeof profileSchema>) {
    const session = await getSession();
    if (!session) {
        return { success: false, error: 'Unauthorized' };
    }

    try {
        await dbConnect();
        const user = await User.findById(session.id);
        if (!user) {
            return { success: false, error: 'User not found.' };
        }

        user.name = data.name;
        user.email = data.email;

        if (user.role === 'patient') {
            user.notificationsEnabled = data.notificationsEnabled;
            user.preferredLanguage = data.preferredLanguage;
        }

        await user.save();
        revalidatePath('/');
        return { success: true };
    } catch (error) {
        console.error(error);
        return { success: false, error: 'Failed to update profile.' };
    }
}

export async function getAlerts() {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };
    try {
        await dbConnect();
        const alerts = await AlertModel.find({ user: session.id }).sort({ createdAt: -1 }).lean();
        return { success: true, data: JSON.parse(JSON.stringify(alerts)) };
    } catch (e) {
        return { success: false, error: 'Failed to fetch alerts.' };
    }
}

export async function seedAlerts() {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };
    try {
        await dbConnect();
        const sampleAlerts = [
            { user: session.id, title: 'Unusual heart rate detected during sleep.', status: 'unread' },
            { user: session.id, title: 'Your prescription for Amoxicillin is ready for pickup.', status: 'unread' },
            { user: session.id, title: 'Follow-up consultation reminder for next week.', status: 'read' },
        ];
        await AlertModel.insertMany(sampleAlerts);
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Failed to create sample alerts.' };
    }
}


const testSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1),
  result: z.string().min(1),
  date: z.string(),
});

export async function createDiagnosticTest(data: z.infer<typeof testSchema>) {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    try {
        await dbConnect();
        const newTest = new DiagnosticTestModel({
            ...data,
            user: session.id,
            date: new Date(data.date),
        });
        await newTest.save();
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Failed to create test.' };
    }
}

export async function getDiagnosticTests() {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };
    try {
        await dbConnect();
        const tests = await DiagnosticTestModel.find({ user: session.id }).sort({ date: -1 }).lean();
        return { success: true, data: JSON.parse(JSON.stringify(tests)) };
    } catch (e) {
        return { success: false, error: 'Failed to fetch tests.' };
    }
}

export async function updateDiagnosticTest(data: z.infer<typeof testSchema>) {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    try {
        await dbConnect();
        const test = await DiagnosticTestModel.findById(data.id);
        if (!test || test.user.toString() !== session.id) {
            return { success: false, error: 'Test not found or unauthorized.' };
        }
        test.name = data.name;
        test.result = data.result;
        test.date = new Date(data.date);
        await test.save();
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Failed to update test.' };
    }
}

export async function deleteDiagnosticTest(id: string) {
    const session = await getSession();
    if (!session) return { success: false, error: 'Unauthorized' };

    try {
        await dbConnect();
        const test = await DiagnosticTestModel.findById(id);
        if (!test || test.user.toString() !== session.id) {
            return { success: false, error: 'Test not found or unauthorized.' };
        }
        await DiagnosticTestModel.deleteOne({ _id: id });
        revalidatePath('/');
        return { success: true };
    } catch (e) {
        return { success: false, error: 'Failed to delete test.' };
    }
}

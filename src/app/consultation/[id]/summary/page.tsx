
'use client'

import { useEffect, useState, useTransition } from 'react';
import { getConsultationSummary, translateContent } from '@/lib/actions';
import { CareIqLogo } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Stethoscope, User, FileText, Pill, AlertTriangle, Loader } from 'lucide-react';
import type { IConsultation } from '@/models/Consultation';
import type { GenerateDiagnosisOutput } from '@/ai/flows/generate-diagnosis';
import type { GeneratePrescriptionOutput } from '@/ai/flows/generate-prescription';
import PrescriptionCard from './prescription-card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TranslatableContent = {
    symptomsSummary: string;
    diagnosis?: GenerateDiagnosisOutput;
    prescription?: GeneratePrescriptionOutput;
};


function ConsultationSummaryPage({ params }: { params: { id: string } }) {
  const [consultation, setConsultation] = useState<IConsultation | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [translatedContent, setTranslatedContent] = useState<TranslatableContent | null>(null);
  const [isTranslating, startTranslateTransition] = useTransition();

  useEffect(() => {
    const fetchSummary = async () => {
        setIsLoading(true);
        const result = await getConsultationSummary(params.id);
        if (result.success) {
            const data = result.data as IConsultation;
            setConsultation(data);
            setTranslatedContent({
                symptomsSummary: data.symptomsSummary,
                diagnosis: data.aiDiagnosis as GenerateDiagnosisOutput,
                prescription: data.aiPrescription as GeneratePrescriptionOutput,
            });
        } else {
            setError(result.error as string);
        }
        setIsLoading(false);
    }
    fetchSummary();
  }, [params.id]);

  const handleLanguageChange = async (language: string) => {
    if (!consultation || language === 'en') {
        setTranslatedContent({
            symptomsSummary: consultation!.symptomsSummary,
            diagnosis: consultation!.aiDiagnosis as GenerateDiagnosisOutput,
            prescription: consultation!.aiPrescription as GeneratePrescriptionOutput,
        });
        return;
    }

    startTranslateTransition(async () => {
        const contentToTranslate = {
            symptomsSummary: consultation.symptomsSummary,
            diagnosisSummary: consultation.aiDiagnosis?.diagnosisSummary,
            potentialConditions: consultation.aiDiagnosis?.potentialConditions,
            recommendedNextSteps: consultation.aiDiagnosis?.recommendedNextSteps,
            prescriptionNotes: consultation.aiPrescription?.notes,
            medications: consultation.aiPrescription?.medications?.map(m => m.reason),
        };

        const result = await translateContent(contentToTranslate, language);
        if (result.success && result.data) {
            const translated = result.data;
            const newDiagnosis = consultation.aiDiagnosis ? {
                ...consultation.aiDiagnosis,
                diagnosisSummary: translated.diagnosisSummary || consultation.aiDiagnosis.diagnosisSummary,
                potentialConditions: translated.potentialConditions || consultation.aiDiagnosis.potentialConditions,
                recommendedNextSteps: translated.recommendedNextSteps || consultation.aiDiagnosis.recommendedNextSteps,
            } : undefined;

            const newPrescription = consultation.aiPrescription ? {
                ...consultation.aiPrescription,
                notes: translated.prescriptionNotes || consultation.aiPrescription.notes,
                medications: consultation.aiPrescription.medications.map((med, i) => ({
                    ...med,
                    reason: translated.medications?.[i] || med.reason,
                })),
            } : undefined;

            setTranslatedContent({
                symptomsSummary: translated.symptomsSummary || consultation.symptomsSummary,
                diagnosis: newDiagnosis,
                prescription: newPrescription,
            });
        } else {
            // Handle error with a toast or message
            console.error("Translation failed:", result.error);
        }
    });
  }
  
  if (isLoading) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-background">
            <Loader className="h-16 w-16 animate-spin text-primary" />
        </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!consultation) return null;


  const diagnosis = translatedContent?.diagnosis;
  const prescription = translatedContent?.prescription;
  const symptomsSummary = translatedContent?.symptomsSummary;

  const getHcpTitle = (specialty: string) => {
    if (!specialty) return '';
    if (specialty === 'General Practice') return 'Dr.';
    return specialty;
  }
  const hcpTitle = getHcpTitle((consultation.hcp as any).specialty);

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
                <CareIqLogo className="h-10 w-10 text-primary" />
                <h1 className="font-headline text-3xl font-bold text-foreground">
                    Consultation Summary
                </h1>
            </div>
            <div className="flex items-center gap-4 w-full sm:w-auto">
                 <Select onValueChange={handleLanguageChange} defaultValue="en">
                    <SelectTrigger className="w-full sm:w-[180px]">
                        <SelectValue placeholder="Language" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="en">English</SelectItem>
                        <SelectItem value="es">Spanish</SelectItem>
                        <SelectItem value="fr">French</SelectItem>
                        <SelectItem value="de">German</SelectItem>
                        <SelectItem value="zu">Zulu</SelectItem>
                        <SelectItem value="sw">Swahili</SelectItem>
                        <SelectItem value="ha">Hausa</SelectItem>
                        <SelectItem value="yo">Yoruba</SelectItem>
                        <SelectItem value="ig">Igbo</SelectItem>
                        <SelectItem value="am">Amharic</SelectItem>
                    </SelectContent>
                </Select>
                <div className="text-sm text-muted-foreground whitespace-nowrap">
                    ID: {params.id}
                </div>
            </div>
        </header>

        <Card className="shadow-lg relative">
             {isTranslating && (
                <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-10">
                    <Loader className="h-12 w-12 animate-spin text-primary"/>
                </div>
            )}
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Consultation Details</CardTitle>
                <CardDescription className="flex items-center gap-2 pt-1">
                    <Calendar className="h-4 w-4" />
                     {new Date(consultation.createdAt).toLocaleString('en-US', {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                     })}
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-base">
                    <div className="space-y-1">
                        <p className="font-semibold text-primary flex items-center gap-2"><User className="h-5 w-5"/> Patient</p>
                        <p className="text-muted-foreground ml-7">{(consultation.patient as any).name}</p>
                    </div>
                     <div className="space-y-1">
                        <p className="font-semibold text-primary flex items-center gap-2"><Stethoscope className="h-5 w-5"/> Healthcare Professional</p>
                        <p className="text-muted-foreground ml-7">{hcpTitle} {(consultation.hcp as any).name}</p>
                    </div>
                </div>
                <Separator className="my-6" />
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><FileText className="text-primary"/> Initial Symptoms Reported</h3>
                        <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground">
                            "{symptomsSummary}"
                        </blockquote>
                    </div>

                    {diagnosis && (
                        <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2 my-2"><Pill className="text-primary"/> Diagnosis</h3>
                            <Card className="w-full bg-primary/5 border-primary/20">
                                <CardHeader>
                                    <CardTitle className="font-headline text-xl text-primary">
                                        AI Generated Diagnosis
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div>
                                        <h4 className="font-semibold">Summary</h4>
                                        <p className="text-muted-foreground">{diagnosis.diagnosisSummary}</p>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Potential Conditions</h4>
                                        <ul className="list-disc list-inside text-muted-foreground">
                                        {diagnosis.potentialConditions.map((c,i) => <li key={i}>{c}</li>)}
                                        </ul>
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Recommended Next Steps</h4>
                                        <p className="text-muted-foreground">{diagnosis.recommendedNextSteps}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {prescription && (
                         <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2 my-2"><Pill className="text-primary"/> Prescription</h3>
                            <PrescriptionCard prescription={prescription} consultationId={consultation._id.toString()} />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default ConsultationSummaryPage;

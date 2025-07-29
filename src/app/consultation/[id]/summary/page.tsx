
import { getConsultationSummary } from '@/lib/actions';
import { CareIqLogo } from '@/components/icons';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Calendar, Stethoscope, User, FileText, Pill, AlertTriangle } from 'lucide-react';
import type { IConsultation } from '@/models/Consultation';
import type { GenerateDiagnosisOutput } from '@/ai/flows/generate-diagnosis';
import PrescriptionCard from './prescription-card';


async function ConsultationSummaryPage({ params }: { params: { id: string } }) {
  const result = await getConsultationSummary(params.id);

  if (!result.success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{result.error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  const consultation = result.data as IConsultation;
  const diagnosis = consultation.aiDiagnosis as GenerateDiagnosisOutput | null;

  return (
    <div className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <header className="mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <CareIqLogo className="h-10 w-10 text-primary" />
                <h1 className="font-headline text-3xl font-bold text-foreground">
                    Consultation Summary
                </h1>
            </div>
            <div className="text-sm text-muted-foreground">
                Consultation ID: {params.id}
            </div>
        </header>

        <Card className="shadow-lg">
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
                        <p className="text-muted-foreground ml-7">{(consultation.hcp as any).name} ({(consultation.hcp as any).specialty})</p>
                    </div>
                </div>
                <Separator className="my-6" />
                <div className="space-y-4">
                    <div>
                        <h3 className="font-semibold text-lg flex items-center gap-2 mb-2"><FileText className="text-primary"/> Initial Symptoms Reported</h3>
                        <blockquote className="border-l-4 border-primary/50 pl-4 italic text-muted-foreground">
                            "{consultation.symptomsSummary}"
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

                    {consultation.aiPrescription && (
                         <div>
                            <h3 className="font-semibold text-lg flex items-center gap-2 my-2"><Pill className="text-primary"/> Prescription</h3>
                            <PrescriptionCard prescription={consultation.aiPrescription} consultationId={consultation._id.toString()} />
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

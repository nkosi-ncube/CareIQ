'use client';
import { useEffect, useState, useRef } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CareIqLogo } from "@/components/icons";
import ConsultationForm from "@/components/consultation-form";
import CareHistory from "@/components/care-history";
import AuthButton from "@/components/auth-button";
import type { UserSession } from "@/lib/types";
import { FileText, User, Loader, AlertTriangle, Pill } from "lucide-react";
import { getPatientPrescriptions } from '@/lib/actions';
import type { GeneratePrescriptionOutput } from '@/ai/flows/generate-prescription';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

function PrescriptionsTab() {
    const [prescriptions, setPrescriptions] = useState<GeneratePrescriptionOutput[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const prescriptionRefs = useRef<(HTMLDivElement | null)[]>([]);
    const [isDownloading, setIsDownloading] = useState<string | null>(null);

    useEffect(() => {
        const fetchPrescriptions = async () => {
            setIsLoading(true);
            const result = await getPatientPrescriptions();
            if (result.success && result.data) {
                setPrescriptions(result.data as GeneratePrescriptionOutput[]);
                prescriptionRefs.current = prescriptionRefs.current.slice(0, result.data.length);
            } else {
                setError(result.error ?? "Failed to load prescriptions.");
            }
            setIsLoading(false);
        };
        fetchPrescriptions();
    }, []);

    const handleDownloadPdf = async (index: number, consultationId: string) => {
        const prescriptionElement = prescriptionRefs.current[index];
        if (!prescriptionElement) {
            return;
        }
        setIsDownloading(consultationId);
        try {
            const canvas = await html2canvas(prescriptionElement, {
                scale: 2, // Higher scale for better quality
            });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`prescription-${consultationId}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
            // You might want to show a toast notification here
        }
        setIsDownloading(null);
    };

    if (isLoading) {
        return (
            <Card className="shadow-lg">
                <CardHeader>
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                     <Skeleton className="h-24 w-full" />
                     <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline">Your Prescriptions</CardTitle>
                <CardDescription>
                Here you can find all the prescriptions from your past consultations.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {prescriptions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border bg-background p-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <FileText className="h-8 w-8 text-primary"/>
                        </div>
                        <h3 className="font-headline text-xl font-semibold">No prescriptions yet</h3>
                        <p className="text-muted-foreground">Your approved prescriptions will appear here after a consultation.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {prescriptions.map((presc, index) => (
                             <Card key={index} className="w-full bg-accent/10 border-accent/20" ref={el => prescriptionRefs.current[index] = el}>
                                <CardHeader>
                                    <CardTitle className="font-headline text-lg flex items-center justify-between gap-2 text-accent-foreground">
                                        <div className='flex items-center gap-2'>
                                            <Pill className='text-accent'/> Prescription Details
                                        </div>
                                        <Button variant="outline" size="sm" onClick={() => handleDownloadPdf(index, `presc-${index}`)} disabled={isDownloading === `presc-${index}`}>
                                            {isDownloading === `presc-${index}` ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : null}
                                            Download PDF
                                        </Button>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    {(presc as any).medications.map((med: any, i: number) => (
                                        <div key={i} className="p-2 border-b last:border-b-0">
                                            <p className="font-bold">{med.name}</p>
                                            <p className="text-muted-foreground">{med.dosage} - {med.frequency}</p>
                                            <p className="text-xs text-muted-foreground/80 mt-1">Reason: {med.reason}</p>
                                        </div>
                                    ))}
                                    <div>
                                        <h4 className="font-semibold mt-2">Notes from your Doctor</h4>
                                        <p className="text-muted-foreground">{(presc as any).notes}</p>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function ProfileTab({ user }: { user: UserSession | null }) {
    if (!user) return null;
    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline">Your Profile</CardTitle>
                <CardDescription>
                    Your personal information.
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center">
                    <span className="w-32 text-muted-foreground">Name</span>
                    <span>{user.name}</span>
                </div>
                 <div className="flex items-center">
                    <span className="w-32 text-muted-foreground">Email</span>
                    <span>{user.email}</span>
                </div>
                 <div className="flex items-center">
                    <span className="w-32 text-muted-foreground">Role</span>
                    <Badge variant="outline">{user.role}</Badge>
                </div>
                {/* Add more patient specific fields here from a more detailed user object */}
            </CardContent>
        </Card>
    );
}


export default function PatientDashboard({ user }: { user: UserSession | null }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-20 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:px-8">
        <div className="flex items-center gap-3">
          <CareIqLogo className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-2xl font-bold text-foreground">
            CareIQ Lite
          </h1>
        </div>
        <AuthButton user={user} />
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="font-headline text-3xl font-semibold">Welcome, {user?.name ?? 'Guest'}</h1>
          <p className="text-muted-foreground">
            Your personal AI health assistant. Get insights, find specialists, and track your health journey.
          </p>
        </div>

        <Tabs defaultValue="consultation" className="mx-auto w-full max-w-6xl">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="consultation" disabled={!user}>New Consultation</TabsTrigger>
            <TabsTrigger value="history" disabled={!user}>Care History</TabsTrigger>
            <TabsTrigger value="prescriptions" disabled={!user}>Prescriptions</TabsTrigger>
            <TabsTrigger value="profile" disabled={!user}>Profile</TabsTrigger>
          </TabsList>
          <TabsContent value="consultation">
             {user ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline">AI Symptom Analysis</CardTitle>
                  <CardDescription>
                    Describe your symptoms below, and our AI will suggest the most relevant specialists for you.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ConsultationForm />
                </CardContent>
              </Card>
             ) : (
                <Card className="shadow-lg flex flex-col items-center justify-center p-10 text-center">
                    <CardHeader>
                        <CardTitle className="font-headline">Please Log In</CardTitle>
                        <CardDescription>
                            You need to be logged in to start a new consultation.
                        </CardDescription>
                    </CardHeader>
                </Card>
             )}
          </TabsContent>
          <TabsContent value="history">
            {user ? <CareHistory /> : (
                 <Card className="shadow-lg flex flex-col items-center justify-center p-10 text-center">
                 <CardHeader>
                     <CardTitle className="font-headline">Please Log In</CardTitle>
                     <CardDescription>
                         You need to be logged in to view your care history.
                     </CardDescription>
                 </CardHeader>
             </Card>
            )}
          </TabsContent>
          <TabsContent value="prescriptions">
             {user ? <PrescriptionsTab /> : (
                <Card className="shadow-lg flex flex-col items-center justify-center p-10 text-center">
                    <CardHeader>
                        <CardTitle className="font-headline">Please Log In</CardTitle>
                        <CardDescription>
                            You need to be logged in to view your prescriptions.
                        </CardDescription>
                    </CardHeader>
                </Card>
             )}
          </TabsContent>
          <TabsContent value="profile">
            {user ? <ProfileTab user={user} /> : (
                <Card className="shadow-lg flex flex-col items-center justify-center p-10 text-center">
                    <CardHeader>
                        <CardTitle className="font-headline">Please Log In</CardTitle>
                        <CardDescription>
                            You need to be logged in to view your profile.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

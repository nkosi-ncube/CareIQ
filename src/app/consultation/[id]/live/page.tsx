'use client';
import { useEffect, useState, useRef, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { CareIqLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Mic, MicOff, Video, VideoOff, PhoneOff, User, Stethoscope, Loader, Bot, FileText, Ambulance, Sparkles, Save, Pill, Check, Pencil, Square } from "lucide-react";
import { getWaitingRoomData, updateConsultationStatus, getAIDiagnosis, saveDiagnosis, getAIPrescription, approvePrescription, transcribeAudioAction } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { WaitingRoomData } from '@/lib/types';
import type { GenerateDiagnosisOutput } from '@/ai/flows/generate-diagnosis';
import type { GeneratePrescriptionOutput } from '@/ai/flows/generate-prescription';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function LiveConsultationPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isEndingCall, setIsEndingCall] = useState(false);
  const [data, setData] = useState<WaitingRoomData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [hasCameraPermission, setHasCameraPermission] = useState(false);
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [consultationNotes, setConsultationNotes] = useState("");
  const [isGeneratingDiagnosis, startDiagnosisTransition] = useTransition();
  const [aiDiagnosis, setAiDiagnosis] = useState<GenerateDiagnosisOutput | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  const [isGeneratingPrescription, startPrescriptionTransition] = useTransition();
  const [aiPrescription, setAiPrescription] = useState<GeneratePrescriptionOutput | null>(null);
  const [isApproving, setIsApproving] = useState(false);
  const [isEditingPrescription, setIsEditingPrescription] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'transcribing'>('idle');


  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      const result = await getWaitingRoomData(params.id);
      if (result.success) {
        setData(result.data as WaitingRoomData);
      } else {
        setError(result.error ?? "An unknown error occurred.");
      }
      setIsLoading(false);
    };
    fetchData();
  }, [params.id]);

  useEffect(() => {
    const getCameraPermission = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        streamRef.current = stream;
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    getCameraPermission();

    return () => {
      // Clean up stream when component unmounts
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [toast]);

  const toggleMic = () => {
      if (streamRef.current) {
          streamRef.current.getAudioTracks().forEach(track => {
              track.enabled = !isMicOn;
          });
          setIsMicOn(!isMicOn);
      }
  };

  const toggleCamera = () => {
      if (streamRef.current) {
          streamRef.current.getVideoTracks().forEach(track => {
              track.enabled = !isCameraOn;
          });
          setIsCameraOn(!isCameraOn);
      }
  };

  const handleEndCall = async () => {
    setIsEndingCall(true);
    const result = await updateConsultationStatus(params.id, 'completed');
    if (result.success) {
      toast({
        title: "Consultation Ended",
        description: "The consultation has been marked as completed.",
      });
      router.push('/');
      router.refresh();
    } else {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: result.error,
      });
      setIsEndingCall(false);
    }
  };

  const handleGenerateDiagnosis = () => {
    if (!data) return;
    startDiagnosisTransition(async () => {
        setAiDiagnosis(null);
        setAiPrescription(null);
        const result = await getAIDiagnosis(data.symptomsSummary, consultationNotes);
        if (result.success && result.data) {
            setAiDiagnosis(result.data as GenerateDiagnosisOutput);
        } else {
            toast({
                variant: 'destructive',
                title: 'Diagnosis Failed',
                description: result.error,
            });
        }
    });
  }

  const handleSaveDiagnosis = async () => {
    if (!aiDiagnosis) return;
    setIsSaving(true);
    const result = await saveDiagnosis(params.id, aiDiagnosis);
    if (result.success) {
        toast({
            title: 'Diagnosis Saved',
            description: 'The AI-generated diagnosis has been saved to the consultation record.',
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: result.error,
        });
    }
    setIsSaving(false);
  }

  const handleGeneratePrescription = () => {
    if (!aiDiagnosis) return;
    startPrescriptionTransition(async () => {
      setAiPrescription(null);
      setIsEditingPrescription(false);
      const result = await getAIPrescription(aiDiagnosis);
      if(result.success && result.data) {
        setAiPrescription(result.data as GeneratePrescriptionOutput);
      } else {
        toast({
          variant: 'destructive',
          title: 'Prescription Failed',
          description: result.error,
        });
      }
    });
  }

  const handleApprovePrescription = async () => {
    if (!aiPrescription) return;
    setIsApproving(true);
    const result = await approvePrescription(params.id, aiPrescription);
    if(result.success) {
        toast({
            title: 'Prescription Approved',
            description: 'The prescription has been saved.',
        });
        setIsEditingPrescription(false);
    } else {
        toast({
            variant: 'destructive',
            title: 'Approval Failed',
            description: result.error,
        });
    }
    setIsApproving(false);
  }

  const handlePrescriptionChange = (index: number, field: string, value: string) => {
    if (!aiPrescription) return;
    const updatedMedications = [...aiPrescription.medications];
    (updatedMedications[index] as any)[field] = value;
    setAiPrescription({ ...aiPrescription, medications: updatedMedications });
  };
  
  const handleNotesChange = (value: string) => {
    if (!aiPrescription) return;
    setAiPrescription({ ...aiPrescription, notes: value });
  }

  const startRecording = async () => {
    try {
      // Use a separate stream for recording to not interfere with video call stream
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = async () => {
          setRecordingStatus('transcribing');
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
              const base64Audio = reader.result as string;
              const response = await transcribeAudioAction(base64Audio);
              if (response.success && response.data) {
                  setConsultationNotes(prev => `${prev}${prev ? ' ' : ''}${response.data.transcription}`);
              } else {
                  toast({
                      variant: 'destructive',
                      title: 'Transcription Failed',
                      description: response.error ?? 'Unknown error',
                  });
              }
              setRecordingStatus('idle');
              // Clean up recording stream
              stream.getTracks().forEach(track => track.stop());
          };
      };
      audioChunksRef.current = [];
      mediaRecorderRef.current.start();
      setRecordingStatus('recording');
    } catch (err) {
      console.error('Error accessing microphone:', err);
      toast({
        variant: 'destructive',
        title: 'Microphone Error',
        description: 'Could not access the microphone. Please check your browser permissions.',
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recordingStatus === 'recording') {
      mediaRecorderRef.current.stop();
    }
  };
  
  if (isLoading) {
    return (
        <div className="flex h-screen w-full flex-col bg-background p-4">
             <header className="flex h-20 items-center justify-between gap-4 border-b bg-background/80 px-4 sm:px-6">
                <Skeleton className="h-8 w-64"/>
                <Skeleton className="h-6 w-48"/>
            </header>
            <main className="flex-1 grid md:grid-cols-3 gap-4 p-4">
                <div className="md:col-span-2 h-full flex flex-col gap-4">
                    <Skeleton className="flex-1 rounded-lg"/>
                    <Skeleton className="h-24 rounded-lg"/>
                </div>
                <div className="h-full">
                    <Skeleton className="h-full rounded-lg"/>
                </div>
            </main>
        </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <Alert variant="destructive" className="max-w-lg">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) return null;


  return (
    <div className="flex h-screen w-full flex-col bg-background">
      <header className="flex h-20 items-center justify-between gap-4 border-b bg-background/80 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <CareIqLogo className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-2xl font-bold text-foreground">
            Live Consultation
          </h1>
        </div>
        <div className="text-sm text-muted-foreground">
            Consultation ID: {params.id}
        </div>
      </header>

      <main className="flex-1 grid md:grid-cols-3 gap-4 p-4 overflow-y-auto">
        {/* Main Video Area */}
        <div className="md:col-span-2 h-full flex flex-col gap-4">
          <div className="flex-1 relative bg-muted rounded-lg flex items-center justify-center">
            {/* HCP Video Feed (Placeholder) */}
             <div className="absolute top-4 left-4 h-48 w-64 bg-card rounded-lg border flex items-center justify-center text-muted-foreground">
                <VideoOff className="h-12 w-12"/>
                <p className="absolute bottom-2 left-2 text-sm font-semibold">{data.hcp.name}</p>
            </div>
            
            {/* Patient Video Feed */}
            <div className="h-full w-full bg-card rounded-lg border flex items-center justify-center text-muted-foreground flex-col gap-4 overflow-hidden">
                {isCameraOn ? (
                    <video ref={videoRef} className="w-full h-full object-cover" autoPlay muted />
                ) : (
                    <div className="flex flex-col items-center gap-4">
                        <User className="h-32 w-32"/>
                        <p className="text-xl font-semibold">{data.patient.name} (You)</p>
                    </div>
                )}
            </div>
             {!hasCameraPermission && (
                <Alert variant="destructive" className="absolute bottom-4 left-1/2 -translate-x-1/2 w-auto">
                    <AlertTitle>Camera Access Required</AlertTitle>
                    <AlertDescription>
                        Please allow camera access to use this feature.
                    </AlertDescription>
                </Alert>
            )}
          </div>
          {/* Controls */}
          <Card>
            <CardContent className="p-4 flex items-center justify-center gap-4">
                <Button variant={isMicOn ? 'secondary' : 'destructive'} size="lg" className="rounded-full h-16 w-16" onClick={toggleMic}>
                    {isMicOn ? <Mic className="h-8 w-8"/> : <MicOff className="h-8 w-8"/>}
                </Button>
                <Button variant={isCameraOn ? 'secondary' : 'destructive'} size="lg" className="rounded-full h-16 w-16" onClick={toggleCamera}>
                    {isCameraOn ? <Video className="h-8 w-8"/> : <VideoOff className="h-8 w-8"/>}
                </Button>
                 <Button variant="destructive" size="lg" className="rounded-full h-16 w-16" onClick={handleEndCall} disabled={isEndingCall}>
                    {isEndingCall ? <Loader className="h-8 w-8 animate-spin" /> : <PhoneOff className="h-8 w-8"/>}
                </Button>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar/Info Panel */}
        <div className="h-full">
            <Card className="h-full flex flex-col">
                <CardHeader>
                    <CardTitle>Consultation Details</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                    <div>
                        <h3 className="font-semibold flex items-center gap-2"><User className="text-primary"/> Patient</h3>
                        <p className="text-muted-foreground ml-6">{data.patient.name}</p>
                    </div>
                     <div>
                        <h3 className="font-semibold flex items-center gap-2"><Stethoscope className="text-primary"/> Symptoms Summary</h3>
                        <p className="text-muted-foreground ml-6 text-sm">
                            "{data.symptomsSummary}"
                        </p>
                    </div>

                    <div className="pt-4 space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="consultation-notes" className="font-semibold">Consultation Notes</Label>
                            <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={recordingStatus === 'recording' ? stopRecording : startRecording}
                                disabled={recordingStatus === 'transcribing'}
                                className="h-8 w-8"
                                >
                                {recordingStatus === 'idle' && <Mic className="h-4 w-4" />}
                                {recordingStatus === 'recording' && <Square className="h-4 w-4 animate-pulse fill-red-500 text-red-500" />}
                                {recordingStatus === 'transcribing' && <Loader className="h-4 w-4 animate-spin" />}
                                <span className="sr-only">
                                    {recordingStatus === 'recording' ? 'Stop recording' : 'Record audio notes'}
                                </span>
                            </Button>
                        </div>
                        <Textarea 
                            id="consultation-notes"
                            className="w-full h-48 p-2 border rounded-md" 
                            placeholder="HCP starts typing or dictates notes here..."
                            value={consultationNotes}
                            onChange={(e) => setConsultationNotes(e.target.value)}
                        />
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2 items-start">
                    <h3 className="font-headline text-lg font-semibold w-full">Post-Consultation Actions</h3>
                    
                    <div className="flex flex-col gap-2 w-full pt-2">
                        <Button className="w-full justify-start" variant="outline" onClick={handleGenerateDiagnosis} disabled={isGeneratingDiagnosis || !consultationNotes}>
                            {isGeneratingDiagnosis ? <Loader className="mr-2 animate-spin"/> : <Bot className="mr-2"/>} 
                            Generate AI Diagnosis
                        </Button>
                    </div>

                    {isGeneratingDiagnosis && (
                         <div className="flex items-center gap-2 text-primary w-full p-2">
                            <Loader className="animate-spin" />
                            <span>Generating diagnosis...</span>
                        </div>
                    )}
                    
                    {aiDiagnosis && (
                        <Card className="w-full bg-primary/5 border-primary/20">
                            <CardHeader>
                                <CardTitle className="font-headline text-lg flex items-center gap-2 text-primary">
                                    <Sparkles/> AI Generated Diagnosis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                <div>
                                    <h4 className="font-semibold">Summary</h4>
                                    <p className="text-muted-foreground">{aiDiagnosis.diagnosisSummary}</p>
                                </div>
                                <div>
                                    <h4 className="font-semibold">Potential Conditions</h4>
                                    <ul className="list-disc list-inside text-muted-foreground">
                                       {aiDiagnosis.potentialConditions.map((c,i) => <li key={i}>{c}</li>)}
                                    </ul>
                                </div>
                                 <div>
                                    <h4 className="font-semibold">Recommended Next Steps</h4>
                                    <p className="text-muted-foreground">{aiDiagnosis.recommendedNextSteps}</p>
                                </div>
                            </CardContent>
                            <CardFooter className='flex-col items-start gap-2'>
                                <Button size="sm" onClick={handleSaveDiagnosis} disabled={isSaving}>
                                    {isSaving ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>}
                                    Save Diagnosis
                                </Button>
                                <hr className='w-full my-2'/>
                                <Button className="w-full justify-start" variant="outline" onClick={handleGeneratePrescription} disabled={isGeneratingPrescription}>
                                    {isGeneratingPrescription ? <Loader className="mr-2 animate-spin"/> : <Pill className="mr-2"/>}
                                    Generate AI Prescription
                                </Button>
                                <Button className="w-full justify-start" variant="outline" onClick={() => toast({ title: "Referral Sent", description: "A recommendation for a physical visit has been sent to the patient."})}>
                                    <Ambulance className="mr-2"/> Recommend Physical Visit
                                </Button>
                            </CardFooter>
                        </Card>
                    )}
                    
                    {isGeneratingPrescription && (
                        <div className="flex items-center gap-2 text-primary w-full p-2">
                            <Loader className="animate-spin" />
                            <span>Generating prescription suggestion...</span>
                        </div>
                    )}

                    {aiPrescription && (
                         <Card className="w-full bg-accent/10 border-accent/20">
                            <CardHeader>
                                <CardTitle className="font-headline text-lg flex items-center gap-2 text-accent-foreground">
                                    <Pill className='text-accent'/> AI Prescription Suggestion
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3 text-sm">
                                {isEditingPrescription ? (
                                    <div className="space-y-4">
                                        {aiPrescription.medications.map((med, i) => (
                                            <div key={i} className="p-2 border-b last:border-b-0 grid grid-cols-3 gap-2 items-end">
                                                <div className="col-span-3">
                                                    <Label htmlFor={`med-name-${i}`} className="text-xs font-semibold">Medication Name</Label>
                                                    <Input id={`med-name-${i}`} value={med.name} onChange={(e) => handlePrescriptionChange(i, 'name', e.target.value)} />
                                                </div>
                                                <div>
                                                    <Label htmlFor={`med-dosage-${i}`} className="text-xs font-semibold">Dosage</Label>
                                                    <Input id={`med-dosage-${i}`} value={med.dosage} onChange={(e) => handlePrescriptionChange(i, 'dosage', e.target.value)} />
                                                </div>
                                                <div className="col-span-2">
                                                    <Label htmlFor={`med-frequency-${i}`} className="text-xs font-semibold">Frequency</Label>
                                                    <Input id={`med-frequency-${i}`} value={med.frequency} onChange={(e) => handlePrescriptionChange(i, 'frequency', e.target.value)} />
                                                </div>
                                            </div>
                                        ))}
                                         <div>
                                            <Label htmlFor="notes" className="font-semibold mt-2">Notes</Label>
                                            <Textarea id="notes" value={aiPrescription.notes} onChange={(e) => handleNotesChange(e.target.value)} />
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {aiPrescription.medications.map((med, i) => (
                                            <div key={i} className="p-2 border-b last:border-b-0">
                                                <p className="font-bold">{med.name}</p>
                                                <p className="text-muted-foreground">{med.dosage} - {med.frequency}</p>
                                                <p className="text-xs text-muted-foreground/80 mt-1">Reason: {med.reason}</p>
                                            </div>
                                        ))}
                                        <div>
                                            <h4 className="font-semibold mt-2">Notes</h4>
                                            <p className="text-muted-foreground">{aiPrescription.notes}</p>
                                        </div>
                                    </>
                                )}
                            </CardContent>
                            <CardFooter className='flex gap-2'>
                               {isEditingPrescription ? (
                                    <Button size="sm" variant="default" onClick={handleApprovePrescription} disabled={isApproving}>
                                        {isApproving ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-4 w-4"/>} 
                                        Save Changes
                                    </Button>
                               ) : (
                                    <Button size="sm" variant="default" onClick={handleApprovePrescription} disabled={isApproving}>
                                        {isApproving ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : <Check className="mr-2 h-4 w-4"/>} 
                                        Approve
                                    </Button>
                               )}
                               <Button size="sm" variant="outline" onClick={() => setIsEditingPrescription(!isEditingPrescription)}>
                                    <Pencil className="mr-2 h-4 w-4"/> {isEditingPrescription ? 'Cancel' : 'Edit'}
                                </Button>
                            </CardFooter>
                        </Card>
                    )}


                </CardFooter>
            </Card>
        </div>
      </main>
    </div>
  );
}

    
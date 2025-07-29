'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { CareIqLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Mic, MicOff, Video, VideoOff, PhoneOff, User, Stethoscope, Loader, Bot, FileText, Ambulance } from "lucide-react";
import { updateConsultationStatus, getWaitingRoomData } from '@/lib/actions';
import { useToast } from '@/hooks/use-toast';
import type { WaitingRoomData } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

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

      <main className="flex-1 grid md:grid-cols-3 gap-4 p-4">
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

                    <div className="pt-4">
                        <h3 className="font-semibold mb-2">Consultation Notes</h3>
                        <textarea className="w-full h-48 p-2 border rounded-md" placeholder="HCP starts typing notes here..."></textarea>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col gap-2">
                    <h3 className="font-headline text-lg font-semibold w-full">Post-Consultation Actions</h3>
                    <Button className="w-full justify-start" variant="outline"><Bot className="mr-2"/> Generate AI Diagnosis</Button>
                    <Button className="w-full justify-start" variant="outline"><FileText className="mr-2"/> Create Prescription</Button>
                    <Button className="w-full justify-start" variant="outline"><Ambulance className="mr-2"/> Recommend Physical Visit</Button>
                </CardFooter>
            </Card>
        </div>
      </main>
    </div>
  );
}

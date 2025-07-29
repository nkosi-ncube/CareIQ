'use client';
import { useEffect, useState } from 'react';
import { getWaitingRoomData, updateConsultationStatus } from '@/lib/actions';
import type { WaitingRoomData } from '@/lib/types';
import { CareIqLogo } from '@/components/icons';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Loader, Clock, Video } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function WaitingRoomPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [data, setData] = useState<WaitingRoomData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
  
  // Poll for status changes
  useEffect(() => {
    if (data?.status === 'waiting') {
      const interval = setInterval(async () => {
        const result = await getWaitingRoomData(params.id);
        if (result.success && result.data?.status === 'active') {
          setData(result.data);
          clearInterval(interval);
        }
      }, 5000); // Poll every 5 seconds

      return () => clearInterval(interval);
    }
  }, [data?.status, params.id]);


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
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!data) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <header className="absolute top-0 left-0 right-0 p-6 flex items-center gap-3">
        <CareIqLogo className="h-8 w-8 text-primary" />
        <h1 className="font-headline text-2xl font-bold text-foreground">
          CareIQ Lite
        </h1>
      </header>
      
      <Card className="w-full max-w-lg shadow-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
            <Clock className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="font-headline text-3xl">You're in the Waiting Room</CardTitle>
          <CardDescription className="text-lg">Your consultation will begin shortly.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-4 rounded-lg border p-4">
            <Avatar className="h-16 w-16">
              <AvatarFallback>{data.hcp.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-muted-foreground">You are waiting for</p>
              <p className="font-bold text-xl">{data.hcp.name}</p>
              <p className="text-sm text-muted-foreground">{data.hcp.specialty}</p>
            </div>
          </div>
          
          <div className="text-center">
            {data.status === 'waiting' && (
              <div className="flex items-center justify-center gap-3 text-lg text-primary">
                <Loader className="animate-spin" />
                <p>Waiting for the host to start the meeting...</p>
              </div>
            )}
             {data.status === 'active' && (
                <div className="flex flex-col items-center justify-center gap-3 text-lg text-green-600">
                    <p>Your consultation is ready!</p>
                    <Button onClick={() => router.push(`/consultation/${params.id}/live`)}>
                        <Video className="mr-2"/>
                        Join Now
                    </Button>
                </div>
            )}
          </div>

          <Alert>
            <AlertTitle className="font-headline">What to Expect</AlertTitle>
            <AlertDescription>
              Please ensure your camera and microphone are working. Find a quiet, well-lit space for your consultation. Your doctor will join soon.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}

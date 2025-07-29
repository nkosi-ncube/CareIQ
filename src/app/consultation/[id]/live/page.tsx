'use client';
import { CareIqLogo } from "@/components/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Mic, MicOff, Video, VideoOff, PhoneOff, User, Stethoscope } from "lucide-react";

// This is a placeholder for the live consultation page.
// A full WebRTC implementation is required for video/audio.
export default function LiveConsultationPage({ params }: { params: { id: string } }) {
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
            {/* HCP Video Feed */}
             <div className="absolute top-4 left-4 h-48 w-64 bg-card rounded-lg border flex items-center justify-center text-muted-foreground">
                <VideoOff className="h-12 w-12"/>
                <p className="absolute bottom-2 left-2 text-sm font-semibold">Dr. Evelyn Reed</p>
            </div>
            
             {/* Patient Video Feed */}
            <div className="h-full w-full bg-card rounded-lg border flex items-center justify-center text-muted-foreground flex-col gap-4">
                <User className="h-32 w-32"/>
                <p className="text-xl font-semibold">You</p>
            </div>
          </div>
          {/* Controls */}
          <Card>
            <CardContent className="p-4 flex items-center justify-center gap-4">
                <Button variant="secondary" size="lg" className="rounded-full h-16 w-16">
                    <Mic className="h-8 w-8"/>
                </Button>
                <Button variant="secondary" size="lg" className="rounded-full h-16 w-16">
                    <Video className="h-8 w-8"/>
                </Button>
                 <Button variant="destructive" size="lg" className="rounded-full h-16 w-16">
                    <PhoneOff className="h-8 w-8"/>
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
                        <p className="text-muted-foreground ml-6">Alex Doe</p>
                    </div>
                     <div>
                        <h3 className="font-semibold flex items-center gap-2"><Stethoscope className="text-primary"/> Symptoms Summary</h3>
                        <p className="text-muted-foreground ml-6 text-sm">
                            "For the past week, I've had a persistent dry cough, a low-grade fever, and a headache."
                        </p>
                    </div>

                    <div className="pt-4">
                        <h3 className="font-semibold mb-2">Consultation Notes</h3>
                        <textarea className="w-full h-48 p-2 border rounded-md" placeholder="HCP starts typing notes here..."></textarea>
                    </div>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}

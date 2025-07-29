'use client';

import { useState, useTransition } from "react";
import { mockConsultations } from "@/lib/mock-data";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { getAISummary } from "@/lib/actions";
import { Calendar, Sparkles, Stethoscope, User } from "lucide-react";
import type { SummarizeConsultationHistoryOutput } from "@/ai/flows/summarize-consultation";
import { Skeleton } from "./ui/skeleton";

export default function CareHistory() {
  const [isPending, startTransition] = useTransition();
  const [summary, setSummary] = useState<SummarizeConsultationHistoryOutput | null>(null);
  const { toast } = useToast();

  const handleGenerateSummary = async () => {
    startTransition(async () => {
      setSummary(null);
      const response = await getAISummary(mockConsultations);
      if (response.success && response.data) {
        setSummary(response.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Summary Failed',
          description: response.error,
        });
      }
    });
  };

  return (
    <div className="space-y-8">
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="font-headline">AI Health Summary</CardTitle>
          <CardDescription>
            Get a quick, AI-powered summary of your consultation history to see trends and progress over time.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!summary && !isPending && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border bg-background p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-8 w-8 text-primary"/>
                </div>
                <h3 className="font-headline text-xl font-semibold">Ready for your health overview?</h3>
                <p className="text-muted-foreground">Click the button to generate a personalized summary of your care history.</p>
                <Button onClick={handleGenerateSummary} disabled={isPending}>
                    {isPending ? 'Generating...' : 'Generate AI Summary'}
                    {!isPending && <Sparkles className="ml-2 h-4 w-4" />}
                </Button>
            </div>
          )}
          {isPending && (
             <div className="space-y-4 rounded-lg border border-border bg-background p-4">
                <Skeleton className="h-5 w-1/3 rounded-md"/>
                <div className="space-y-2">
                    <Skeleton className="h-4 w-full rounded-md"/>
                    <Skeleton className="h-4 w-full rounded-md"/>
                    <Skeleton className="h-4 w-3/4 rounded-md"/>
                </div>
             </div>
          )}
          {summary && (
            <Alert variant="default" className="bg-primary/5 border-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
              <AlertTitle className="font-headline text-primary">Your Health Journey Summary</AlertTitle>
              <AlertDescription className="whitespace-pre-wrap text-foreground">
                {summary.summary}
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <div className="space-y-4">
        <h2 className="font-headline text-2xl font-semibold">Past Consultations</h2>
        <div className="grid gap-4 md:grid-cols-2">
            {mockConsultations.map((consultation) => (
                <Card key={consultation.id} className="flex flex-col shadow-md">
                    <CardHeader>
                        <div className="flex items-start justify-between">
                            <div>
                                <CardTitle className="font-headline text-xl">{consultation.specialty}</CardTitle>
                                <CardDescription className="flex items-center gap-2 pt-1">
                                    <Calendar className="h-4 w-4" />
                                    {new Date(consultation.date).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}
                                </CardDescription>
                            </div>
                            <Badge variant="outline">{consultation.doctor}</Badge>
                        </div>
                    </CardHeader>
                    <CardContent className="flex-grow space-y-4">
                        <div>
                            <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><User className="h-4 w-4 text-primary"/>Symptoms Reported</h4>
                            <p className="text-muted-foreground text-sm">{consultation.symptoms}</p>
                        </div>
                        <div>
                             <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary"/>Diagnosis & Plan</h4>
                            <p className="text-muted-foreground text-sm">{consultation.diagnosis}</p>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useTransition, useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { getAISummary, getPatientConsultationHistory } from "@/lib/actions";
import { Calendar, Sparkles, Stethoscope, User, AlertTriangle, FileText } from "lucide-react";
import type { SummarizeConsultationHistoryOutput } from "@/ai/flows/summarize-consultation";
import { Skeleton } from "./ui/skeleton";
import type { IConsultation } from "@/models/Consultation";
import Link from "next/link";

export default function CareHistory() {
  const [isSummaryPending, startSummaryTransition] = useTransition();
  const [isHistoryLoading, setIsHistoryLoading] = useState(true);
  const [summary, setSummary] = useState<SummarizeConsultationHistoryOutput | null>(null);
  const [history, setHistory] = useState<IConsultation[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
        setIsHistoryLoading(true);
        setError(null);
        const response = await getPatientConsultationHistory();
        if (response.success && response.data) {
            setHistory(response.data as IConsultation[]);
        } else {
            setError(response.error ?? "Failed to load consultation history.");
        }
        setIsHistoryLoading(false);
    }
    fetchHistory();
  }, []);

  const handleGenerateSummary = async () => {
    if (history.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Cannot Generate Summary',
        description: 'You have no consultation history to summarize.',
      });
      return;
    }
    startSummaryTransition(async () => {
      setSummary(null);
      const response = await getAISummary(history);
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
          {!summary && !isSummaryPending && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border bg-background p-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="h-8 w-8 text-primary"/>
                </div>
                <h3 className="font-headline text-xl font-semibold">Ready for your health overview?</h3>
                <p className="text-muted-foreground">Click the button to generate a personalized summary of your care history.</p>
                <Button onClick={handleGenerateSummary} disabled={isSummaryPending || isHistoryLoading || history.length === 0}>
                    {isSummaryPending ? 'Generating...' : 'Generate AI Summary'}
                    {!isSummaryPending && <Sparkles className="ml-2 h-4 w-4" />}
                </Button>
            </div>
          )}
          {isSummaryPending && (
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
        {isHistoryLoading && (
            <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                    <Card key={i}>
                        <CardHeader>
                            <Skeleton className="h-6 w-1/2" />
                            <Skeleton className="h-4 w-1/3" />
                        </CardHeader>
                        <CardContent>
                           <Skeleton className="h-10 w-full" />
                        </CardContent>
                        <CardFooter>
                           <Skeleton className="h-10 w-32" />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )}
        {!isHistoryLoading && error && (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error Loading History</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )}
        {!isHistoryLoading && !error && history.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border bg-background p-8 text-center min-h-[200px]">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <FileText className="h-8 w-8 text-primary"/>
                </div>
                <h3 className="font-headline text-xl font-semibold">No Past Consultations</h3>
                <p className="text-muted-foreground">Your completed consultations will appear here.</p>
            </div>
        )}
        {!isHistoryLoading && !error && history.length > 0 && (
            <div className="space-y-4">
                {history.map((consultation) => (
                    <Card key={consultation._id} className="flex flex-col shadow-md">
                        <CardHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <CardTitle className="font-headline text-xl">Consultation with {(consultation.hcp as any).name}</CardTitle>
                                    <CardDescription className="flex items-center gap-2 pt-1">
                                        <Calendar className="h-4 w-4" />
                                        {new Date(consultation.createdAt).toLocaleDateString('en-US', { timeZone: 'UTC', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </CardDescription>
                                </div>
                                <Badge variant="outline">{(consultation.hcp as any).specialty}</Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-grow space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><User className="h-4 w-4 text-primary"/>Symptoms Reported</h4>
                                <p className="text-muted-foreground text-sm line-clamp-2">"{consultation.symptomsSummary}"</p>
                            </div>
                            <div>
                                <h4 className="font-semibold text-sm mb-1 flex items-center gap-2"><Stethoscope className="h-4 w-4 text-primary"/>Diagnosis Summary</h4>
                                <p className="text-muted-foreground text-sm line-clamp-2">{(consultation.aiDiagnosis as any)?.diagnosisSummary || "No diagnosis summary available."}</p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button asChild>
                                <Link href={`/consultation/${consultation._id}/summary`}>View Full Summary</Link>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getAIMatch, getFollowUpQuestions } from '@/lib/actions';
import { Sparkles, Stethoscope, AlertTriangle, Lightbulb, HelpCircle, Info } from 'lucide-react';
import type { AnalyzeSymptomsOutput } from '@/ai/flows/analyze-symptoms';
import type { GenerateFollowUpQuestionsOutput } from '@/ai/flows/generate-follow-up-questions';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';

const FormSchema = z.object({
  symptoms: z.string().min(20, { message: 'Please describe your symptoms in at least 20 characters.' }),
});

export default function ConsultationForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AnalyzeSymptomsOutput | null>(null);
  const [questions, setQuestions] = useState<GenerateFollowUpQuestionsOutput | null>(null);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      symptoms: '',
    },
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    startTransition(async () => {
      setResult(null);
      setQuestions(null);
      const response = await getAIMatch(data.symptoms);

      if (response.success && response.data) {
        setResult(response.data as AnalyzeSymptomsOutput);
        setIsFetchingQuestions(true);
        const questionsResponse = await getFollowUpQuestions(data.symptoms);
        if(questionsResponse.success && questionsResponse.data) {
            setQuestions(questionsResponse.data);
        }
        // Silently fail if questions fail, it's not critical path.
        setIsFetchingQuestions(false);

      } else {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: response.error,
        });
      }
    });
  }

  const UrgencyAlert = ({ result }: { result: AnalyzeSymptomsOutput }) => {
    const { urgencyLevel, recommendedAction } = result;
    const isHigh = urgencyLevel === 'High';
    const isMedium = urgencyLevel === 'Medium';
  
    const alertClasses = cn("bg-background border-accent/50", {
      "bg-yellow-100/80 border-yellow-500/50 dark:bg-yellow-900/30": isMedium,
      "bg-red-100/80 border-destructive/50 dark:bg-red-900/30": isHigh,
    });
  
    const iconClasses = cn("text-accent", {
        "text-yellow-600 dark:text-yellow-400": isMedium,
        "text-destructive": isHigh,
    });
  
    const titleClasses = cn("text-accent", {
        "text-yellow-800 dark:text-yellow-300": isMedium,
        "text-destructive": isHigh,
    });

    const Icon = isHigh ? AlertTriangle : isMedium ? Lightbulb : Info;
  
    return (
      <Alert variant="default" className={alertClasses}>
        <Icon className={cn("h-4 w-4", iconClasses)} />
        <AlertTitle className={cn("font-headline", titleClasses)}>
          Urgency Level: {urgencyLevel}
        </AlertTitle>
        <AlertDescription>
          {recommendedAction}
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="symptoms"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="font-headline text-lg">Your Symptoms</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="For example: 'For the past week, I've have a persistent dry cough, a low-grade fever, and a headache...'"
                    className="min-h-[120px] resize-none"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
            {isPending ? 'Analyzing...' : 'Find a Specialist'}
            {!isPending && <Sparkles className="ml-2 h-4 w-4" />}
          </Button>
        </form>
      </Form>

      {isPending && !result && (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-3/4 rounded-md" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-4 w-full rounded-md" />
            <Skeleton className="h-10 w-full rounded-md" />
            <Skeleton className="h-4 w-1/2 rounded-md" />
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="grid gap-6 md:grid-cols-2">
            <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                <Stethoscope className="text-primary" />
                Suggested Specialists
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                {result.suggestedProfessionals.map((prof) => (
                    <Badge key={prof} variant="secondary" className="px-3 py-1 text-base font-medium">
                    {prof}
                    </Badge>
                ))}
                </div>
                <div>
                <label htmlFor="confidence" className="text-sm font-medium text-muted-foreground">
                    Confidence Level
                </label>
                <Progress id="confidence" value={result.confidenceLevel * 100} className="mt-1 h-3" />
                </div>
                <UrgencyAlert result={result} />
            </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                        <HelpCircle className="text-primary"/>
                        Follow-up Questions
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {isFetchingQuestions && (
                        <div className="space-y-3">
                            <Skeleton className="h-5 w-5/6 rounded-md" />
                            <Skeleton className="h-5 w-full rounded-md" />
                            <Skeleton className="h-5 w-4/6 rounded-md" />
                        </div>
                    )}
                    {questions && (
                        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
                            {questions.questions.map((q, i) => (
                                <li key={i}>{q}</li>
                            ))}
                        </ul>
                    )}
                     {!isFetchingQuestions && !questions && (
                        <p className="text-sm text-muted-foreground">No follow-up questions generated.</p>
                     )}
                </CardContent>
            </Card>
        </div>
      )}
      
      {!isPending && !result && (
        <Alert variant="default" className="bg-background">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="font-headline">Disclaimer</AlertTitle>
          <AlertDescription>
            This AI analysis is for informational purposes only and is not a substitute for professional medical advice, diagnosis, or treatment. Always seek the advice of your physician or other qualified health provider with any questions you may have regarding a medical condition.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

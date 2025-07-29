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
import { getAIMatch } from '@/lib/actions';
import { Sparkles, Stethoscope, AlertTriangle, Lightbulb } from 'lucide-react';
import type { AnalyzeSymptomsOutput } from '@/ai/flows/analyze-symptoms';
import { Skeleton } from './ui/skeleton';

const FormSchema = z.object({
  symptoms: z.string().min(20, { message: 'Please describe your symptoms in at least 20 characters.' }),
});

export default function ConsultationForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AnalyzeSymptomsOutput | null>(null);
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
      const response = await getAIMatch(data.symptoms);

      if (response.success && response.data) {
        setResult(response.data);
      } else {
        toast({
          variant: 'destructive',
          title: 'Analysis Failed',
          description: response.error,
        });
      }
    });
  }

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
                    placeholder="For example: 'For the past week, I've had a persistent dry cough, a low-grade fever, and a headache...'"
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

      {isPending && (
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
            <Alert variant="default" className="bg-background border-accent/50">
              <Lightbulb className="h-4 w-4 text-accent" />
              <AlertTitle className="font-headline text-accent">Next Steps</AlertTitle>
              <AlertDescription>
                We recommend booking an appointment with one of these specialists. You can share this analysis with them during your consultation.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
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

'use client';

import { useState, useTransition, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getAIMatch, getFollowUpQuestions, transcribeAudioAction } from '@/lib/actions';
import { Sparkles, Stethoscope, AlertTriangle, Lightbulb, HelpCircle, Info, Upload, X, Mic, Square, Loader } from 'lucide-react';
import type { AnalyzeSymptomsOutput } from '@/ai/flows/analyze-symptoms';
import type { GenerateFollowUpQuestionsOutput } from '@/ai/flows/generate-follow-up-questions';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';

const FormSchema = z.object({
  symptoms: z.string().min(20, { message: 'Please describe your symptoms in at least 20 characters.' }),
});

export default function ConsultationForm() {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AnalyzeSymptomsOutput | null>(null);
  const [questions, setQuestions] = useState<GenerateFollowUpQuestionsOutput | null>(null);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);
  const [photo, setPhoto] = useState<{ file: File | null; dataUri: string | null }>({ file: null, dataUri: null });
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'transcribing'>('idle');
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      symptoms: '',
    },
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhoto({ file, dataUri: e.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setPhoto({ file: null, dataUri: null });
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };
      mediaRecorderRef.current.onstop = handleStopRecording;
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
       // Stop all media tracks
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  const handleStopRecording = async () => {
    setRecordingStatus('transcribing');
    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
    const reader = new FileReader();
    reader.readAsDataURL(audioBlob);
    reader.onloadend = async () => {
      const base64Audio = reader.result as string;
      const response = await transcribeAudioAction(base64Audio);
      if (response.success && response.data) {
        form.setValue('symptoms', response.data.transcription);
      } else {
        toast({
          variant: 'destructive',
          title: 'Transcription Failed',
          description: response.error,
        });
      }
      setRecordingStatus('idle');
    };
  };

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    startTransition(async () => {
      setResult(null);
      setQuestions(null);
      const response = await getAIMatch(data.symptoms, photo.dataUri);

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
        <form onSubmit={form.handleSubmit(onSubmit)} className="grid gap-4 md:grid-cols-2">
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="symptoms"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="font-headline text-lg">Your Symptoms</FormLabel>
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
                        {recordingStatus === 'recording' ? 'Stop recording' : 'Record audio'}
                      </span>
                    </Button>
                  </div>
                  <FormControl>
                    <Textarea
                      placeholder="For the past week, I've have a persistent dry cough, a low-grade fever, and a headache... or record your audio."
                      className="min-h-[120px] resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormItem>
                <FormLabel className="font-headline text-lg">Upload a Photo (Optional)</FormLabel>
                <FormControl>
                    <Input type="file" accept="image/*" onChange={handleFileChange} />
                </FormControl>
                <FormDescription>
                    If you have a visible symptom (e.g., a rash or swelling), you can upload a photo.
                </FormDescription>
             </FormItem>
          </div>
          <div className="space-y-2">
            <FormLabel className="font-headline text-lg text-transparent md:block hidden">Preview</FormLabel>
            <Card className={cn("flex items-center justify-center bg-background border-2 border-dashed h-full min-h-[120px]", !photo.dataUri && "py-10")}>
                {photo.dataUri ? (
                    <div className="relative w-full h-full max-h-60">
                        <Image src={photo.dataUri} alt="Symptom photo" layout="fill" objectFit="contain" className="rounded-md" />
                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={removePhoto}>
                           <X className="h-4 w-4"/>
                           <span className="sr-only">Remove photo</span>
                        </Button>
                    </div>
                ): (
                    <div className="text-center text-muted-foreground p-4">
                        <Upload className="mx-auto h-12 w-12" />
                        <p className="mt-2 text-sm">Image preview will appear here.</p>
                    </div>
                )}
            </Card>
          </div>

          <div className="md:col-span-2">
            <Button type="submit" disabled={isPending || recordingStatus !== 'idle'} className="w-full sm:w-auto">
                {isPending ? 'Analyzing...' : 'Find a Specialist'}
                {!isPending && <Sparkles className="ml-2 h-4 w-4" />}
            </Button>
          </div>
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

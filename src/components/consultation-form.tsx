'use client';

import { useState, useTransition, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { getAIMatch, getFollowUpQuestions, findAvailableHCPs, createConsultation, transcribeAudioAction } from '@/lib/actions';
import { Sparkles, Stethoscope, AlertTriangle, Lightbulb, HelpCircle, Info, Upload, X, Mic, Square, Loader, User, Video, Send } from 'lucide-react';
import type { AnalyzeSymptomsOutput } from '@/ai/flows/analyze-symptoms';
import type { GenerateFollowUpQuestionsOutput } from '@/ai/flows/generate-follow-up-questions';
import { Skeleton } from './ui/skeleton';
import { cn } from '@/lib/utils';
import { Input } from './ui/input';
import { Avatar, AvatarFallback } from './ui/avatar';
import type { HCP } from '@/lib/types';

const FormSchema = z.object({
  symptoms: z.string().min(20, { message: 'Please describe your symptoms in at least 20 characters.' }),
});

type FormStep = "symptomInput" | "questionAnswer" | "analysis" | "hcpList";

export default function ConsultationForm() {
  const router = useRouter();
  const [step, setStep] = useState<FormStep>("symptomInput");
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<AnalyzeSymptomsOutput | null>(null);
  const [questions, setQuestions] = useState<GenerateFollowUpQuestionsOutput | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false);
  const [photo, setPhoto] = useState<{ file: File | null; dataUri: string | null }>({ file: null, dataUri: null });
  const [availableHCPs, setAvailableHCPs] = useState<HCP[]>([]);
  const [isFindingHCPs, setIsFindingHCPs] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      symptoms: '',
    },
  });
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const [recordingStatus, setRecordingStatus] = useState<'idle' | 'recording' | 'transcribing'>('idle');

  const startRecording = async () => {
    try {
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
                  const currentSymptoms = form.getValues('symptoms');
                  form.setValue('symptoms', `${currentSymptoms}${currentSymptoms ? ' ' : ''}${response.data.transcription}`);
              } else {
                  toast({
                      variant: 'destructive',
                      title: 'Transcription Failed',
                      description: response.error,
                  });
              }
              setRecordingStatus('idle');
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

  async function onSymptomSubmit(data: z.infer<typeof FormSchema>) {
    setIsFetchingQuestions(true);
    setStep("questionAnswer");
    startTransition(async () => {
        const questionsResponse = await getFollowUpQuestions(data.symptoms);
        if(questionsResponse.success && questionsResponse.data) {
            setQuestions(questionsResponse.data);
            setAnswers(new Array(questionsResponse.data.questions.length).fill(''));
        } else {
            // If fetching questions fails, proceed directly to analysis
            toast({
                title: "Couldn't generate follow-up questions.",
                description: "Proceeding with initial analysis.",
                variant: "default"
            });
            await onAnswerSubmit();
        }
        setIsFetchingQuestions(false);
    });
  }

  async function onAnswerSubmit() {
    setIsFetchingQuestions(false);
    setStep('analysis');

    startTransition(async () => {
        let followUpAnswers = "";
        if (questions && answers.some(a => a.trim() !== '')) {
            followUpAnswers = questions.questions
                .map((q, i) => `Q: ${q}\nA: ${answers[i] || 'Not answered'}`)
                .join('\n\n');
        }

        const response = await getAIMatch(form.getValues('symptoms'), photo.dataUri, followUpAnswers);

        if (response.success && response.data) {
            const analysisResult = response.data as AnalyzeSymptomsOutput;
            setResult(analysisResult);
            setStep('hcpList');

            setIsFindingHCPs(true);
            findAvailableHCPs(analysisResult.suggestedProfessionals).then(hcpResponse => {
                if(hcpResponse.success && hcpResponse.data) {
                    setAvailableHCPs(hcpResponse.data);
                } else {
                    toast({ variant: 'default', title: 'Could not find HCPs', description: hcpResponse.error});
                }
                setIsFindingHCPs(false);
            });
        } else {
            toast({
                variant: 'destructive',
                title: 'Analysis Failed',
                description: response.error,
            });
            setStep('symptomInput'); // Go back to start on failure
        }
    });
  }


  const handleBookConsultation = async (hcp: HCP) => {
    setIsBooking(true);
    const response = await createConsultation(hcp.id, form.getValues('symptoms'), result);
    setIsBooking(false);

    if (response.success && response.data) {
        toast({
            title: "Consultation Booked!",
            description: `You are now in the waiting room for ${hcp.name}.`,
        });
        router.push(`/consultation/${response.data.consultationId}/waiting`);
    } else {
        toast({
            variant: 'destructive',
            title: 'Booking Failed',
            description: response.error,
        });
    }
  }
  
  const handleAnswerChange = (index: number, value: string) => {
    const newAnswers = [...answers];
    newAnswers[index] = value;
    setAnswers(newAnswers);
  };

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
      {step === "symptomInput" && (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSymptomSubmit)} className="grid gap-4 md:grid-cols-2">
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
                                {recordingStatus === 'recording' ? 'Stop recording' : 'Record audio for symptoms'}
                            </span>
                        </Button>
                    </div>
                    <FormControl>
                        <Textarea
                        placeholder="For the past week, I've have a persistent dry cough, a low-grade fever, and a headache..."
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
                <Button type="submit" disabled={isPending || isFetchingQuestions} className="w-full sm:w-auto">
                    {isPending || isFetchingQuestions ? 'Thinking...' : 'Get Follow-up Questions'}
                    {!(isPending || isFetchingQuestions) && <Sparkles className="ml-2 h-4 w-4" />}
                </Button>
            </div>
            </form>
        </Form>
      )}

      {step === "questionAnswer" && (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <HelpCircle className="text-primary"/> Just a few more questions...
                </CardTitle>
                <CardDescription>To give you the best recommendation, please answer these questions.</CardDescription>
            </CardHeader>
            <CardContent>
                {isFetchingQuestions && (
                     <div className="space-y-4">
                        <Skeleton className="h-5 w-5/6 rounded-md" />
                        <Skeleton className="h-8 w-full rounded-md" />
                        <Skeleton className="h-5 w-4/6 rounded-md" />
                        <Skeleton className="h-8 w-full rounded-md" />
                    </div>
                )}
                {questions && (
                    <form onSubmit={(e) => { e.preventDefault(); onAnswerSubmit(); }} className="space-y-4">
                        {questions.questions.map((q, i) => (
                           <FormItem key={i}>
                                <FormLabel>{q}</FormLabel>
                                <FormControl>
                                    <Input 
                                        placeholder="Your answer..."
                                        value={answers[i]}
                                        onChange={(e) => handleAnswerChange(i, e.target.value)}
                                    />
                                </FormControl>
                           </FormItem>
                        ))}
                         <Button type="submit" disabled={isPending} className="w-full sm:w-auto">
                            {isPending ? 'Analyzing...' : 'Find a Specialist'}
                            {!isPending && <Send className="ml-2 h-4 w-4" />}
                        </Button>
                    </form>
                )}
            </CardContent>
        </Card>
      )}

      {(step === 'analysis' || step === 'hcpList') && isPending && (
         <Card>
            <CardHeader>
                <CardTitle className="font-headline">Analyzing your answers...</CardTitle>
                <CardDescription>Our AI is analyzing your information to find the best specialists for you.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-center p-8">
                <Loader className="h-12 w-12 animate-spin text-primary" />
            </CardContent>
        </Card>
      )}

      {step === "hcpList" && result && (
        <div className="space-y-6">
            <Card className="bg-primary/5 border-primary/20">
                <CardHeader>
                    <CardTitle className="font-headline flex items-center gap-2">
                    <Stethoscope className="text-primary" />
                    AI Analysis Results
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
                    <CardTitle className="font-headline">Connect with a Specialist</CardTitle>
                    <CardDescription>Based on your symptoms, we suggest connecting with one of these specialists.</CardDescription>
                </CardHeader>
                <CardContent>
                    {isFindingHCPs && (
                        <div className="space-y-4">
                            {[...Array(2)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-5 w-32 rounded-md"/>
                                            <Skeleton className="h-4 w-24 rounded-md"/>
                                        </div>
                                    </div>
                                    <Skeleton className="h-10 w-28 rounded-md" />
                                </div>
                            ))}
                        </div>
                    )}
                    {!isFindingHCPs && availableHCPs.length > 0 && (
                        <div className="space-y-4">
                            {availableHCPs.map(hcp => (
                                <div key={hcp.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
                                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                        <Avatar className="h-12 w-12">
                                            <AvatarFallback>{hcp.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold">{hcp.name}</p>
                                            <p className="text-sm text-muted-foreground">{hcp.specialty}</p>
                                        </div>
                                    </div>
                                    <Button onClick={() => handleBookConsultation(hcp)} disabled={isBooking}>
                                        {isBooking ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : <Video className="mr-2 h-4 w-4"/>}
                                        {isBooking ? 'Booking...' : 'Book Now'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                     {!isFindingHCPs && availableHCPs.length === 0 && (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertTitle>No Specialists Available</AlertTitle>
                            <AlertDescription>
                                We couldn't find any available specialists matching your needs at this time. Please try again later.
                            </AlertDescription>
                        </Alert>
                     )}
                </CardContent>
            </Card>

        </div>
      )}
      
      {step === 'symptomInput' && (
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

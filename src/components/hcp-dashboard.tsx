'use client';
import { CareIqLogo } from "@/components/icons";
import AuthButton from "@/components/auth-button";
import type { UserSession, WaitingPatient } from "@/lib/types";
import { Input } from "./ui/input";
import { Search, User, Clock, Stethoscope, Video, Loader, Calendar, FileText, AlertTriangle, Edit } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Button } from "./ui/button";
import { Alert, AlertTitle, AlertDescription } from "./ui/alert";
import Link from "next/link";
import { getHcpDashboardData, updateConsultationStatus, getHcpConsultationHistory, getHcpProfile, updateUserProfile } from "@/lib/actions";
import { useEffect, useState, useTransition } from "react";
import { Skeleton } from "./ui/skeleton";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Badge } from "./ui/badge";
import type { IConsultation } from "@/models/Consultation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Label } from "./ui/label";

const profileSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email." }),
});


function ProfileTab({ user }: { user: UserSession | null }) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: { name: '', email: '' }
    });

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            const result = await getHcpProfile();
            if (result.success && result.data) {
                const hcpData = result.data as any;
                setProfileData(hcpData);
                form.reset({
                    name: hcpData.name,
                    email: hcpData.email,
                });
            }
            setIsLoading(false);
        };
        fetchProfile();
    }, [form]);

    const onSubmit = async (data: z.infer<typeof profileSchema>) => {
        setIsSubmitting(true);
        const result = await updateUserProfile(data);
        if (result.success) {
            toast({ title: "Profile Updated", description: "Your changes have been saved." });
            setIsEditing(false);
            setProfileData({ ...profileData, ...data });
        } else {
            toast({ variant: "destructive", title: "Update Failed", description: result.error });
        }
        setIsSubmitting(false);
    };

    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-32" />
                    <Skeleton className="h-4 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-8 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (!profileData) return null;

    return (
        <Card className="shadow-lg">
             <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Your Profile</CardTitle>
                    <CardDescription>
                        Your professional information.
                    </CardDescription>
                </div>
                 <Button variant="outline" size="icon" onClick={() => setIsEditing(!isEditing)}>
                    <Edit className="h-4 w-4" />
                </Button>
            </CardHeader>
            <CardContent>
                 <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Full Name</Label>
                        <Input id="name" {...form.register('name')} disabled={!isEditing} />
                        {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input id="email" type="email" {...form.register('email')} disabled={!isEditing} />
                        {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
                    </div>
                     <div className="space-y-2">
                        <Label>Practice Number</Label>
                        <Input value={profileData.practiceNumber} disabled />
                    </div>
                     <div className="space-y-2">
                        <Label>Specialty</Label>
                        <Input value={profileData.specialty} disabled />
                    </div>
                    {isEditing && (
                        <div className="flex gap-2">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                                Save Changes
                            </Button>
                             <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>Cancel</Button>
                        </div>
                    )}
                 </form>
            </CardContent>
        </Card>
    );
}

function HistoryTab() {
    const [history, setHistory] = useState<IConsultation[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchHistory = async () => {
            setIsLoading(true);
            const result = await getHcpConsultationHistory();
            if (result.success && result.data) {
                setHistory(result.data as IConsultation[]);
            } else {
                setError(result.error ?? "Failed to load history.");
            }
            setIsLoading(false);
        };
        fetchHistory();
    }, []);
    
    if (isLoading) {
        return (
             <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-48" />
                    <Skeleton className="h-4 w-64" />
                </CardHeader>
                <CardContent className="space-y-4">
                     <Skeleton className="h-24 w-full" />
                     <Skeleton className="h-24 w-full" />
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return <Alert variant="destructive"><AlertTriangle/><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>
    }

    const getPatientName = (patient: any) => {
        return patient?.name || 'Unknown Patient';
    }

    return (
        <Card>
           <CardHeader>
                <CardTitle>Consultation History</CardTitle>
                <CardDescription>A list of your past completed consultations.</CardDescription>
            </CardHeader>
            <CardContent>
                {history.length === 0 ? (
                     <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border p-8 text-center min-h-[200px]">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <FileText className="h-8 w-8 text-primary"/>
                        </div>
                        <h3 className="font-headline text-xl font-semibold">No History Found</h3>
                        <p className="text-muted-foreground">Your completed consultations will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {history.map(c => (
                            <div key={c._id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
                                <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                    <Avatar className="h-12 w-12">
                                        <AvatarFallback>{getPatientName(c.patient).charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="font-bold text-lg">Consultation with {getPatientName(c.patient)}</p>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                            <Calendar className="h-4 w-4"/> 
                                            {new Date(c.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                                <Button asChild variant="outline">
                                    <Link href={`/consultation/${c._id}/summary`}>View Details</Link>
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default function HcpDashboard({ user }: { user: UserSession }) {
  const router = useRouter();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<WaitingPatient[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isStartingConsultation, setIsStartingConsultation] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
        startTransition(async () => {
            const result = await getHcpDashboardData();
            if(result.success) {
                setData(result.data as WaitingPatient[]);
            } else {
                setError(result.error ?? "An unknown error occurred.");
            }
        });
    }, 5000); // Poll every 5 seconds
    
    // Initial fetch
    startTransition(async () => {
        const result = await getHcpDashboardData();
        if(result.success) {
            setData(result.data as WaitingPatient[]);
        } else {
            setError(result.error ?? "An unknown error occurred.");
        }
    });

    return () => clearInterval(interval);
  }, []);

  const handleStartConsultation = async (consultationId: string) => {
    setIsStartingConsultation(consultationId);
    const result = await updateConsultationStatus(consultationId, 'active');
    setIsStartingConsultation(null);
    if(result.success) {
        toast({ title: "Success", description: "Consultation started. Redirecting..."});
        router.push(`/consultation/${consultationId}/live`);
    } else {
        toast({ variant: "destructive", title: "Error", description: result.error});
    }
  }
  
  const getHcpTitle = (specialty?: string) => {
    if (!specialty) return '';
    if (specialty === 'General Practice') return 'Dr.';
    return specialty;
  }

  const title = getHcpTitle((user as any).specialty);


  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-20 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:px-8">
        <div className="flex items-center gap-3">
          <CareIqLogo className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-2xl font-bold text-foreground">
            CareIQ HCP Portal
          </h1>
        </div>
        <div className="flex items-center gap-4">
            <Button variant="outline">
                <Clock className="mr-2 h-4 w-4"/>
                Status: Available
            </Button>
            <AuthButton user={user} />
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-7xl gap-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-semibold">Welcome, {title} {user.name}</h1>
                    <p className="text-muted-foreground">
                        Here's your intelligent patient queue for today.
                    </p>
                </div>
                <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search waiting patients..." className="pl-10" />
                </div>
            </div>
        </div>

        <div className="mx-auto w-full max-w-7xl">
            <Tabs defaultValue="queue">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="queue">Patient Queue</TabsTrigger>
                    <TabsTrigger value="history">Consultation History</TabsTrigger>
                    <TabsTrigger value="profile">Profile</TabsTrigger>
                </TabsList>
                <TabsContent value="queue">
                    <Card>
                        <CardHeader>
                            <CardTitle>Waiting Room</CardTitle>
                            <CardDescription>Patients waiting for a live consultation, prioritized by AI-assessed urgency.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {isPending && !data && (
                                    [...Array(3)].map((_, i) => (
                                        <div key={i} className="flex items-center justify-between rounded-lg border p-4">
                                            <div className="flex items-center gap-4">
                                                <Skeleton className="h-12 w-12 rounded-full" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-5 w-32 rounded-md"/>
                                                    <Skeleton className="h-4 w-48 rounded-md"/>
                                                </div>
                                            </div>
                                            <Skeleton className="h-10 w-36 rounded-md" />
                                        </div>
                                    ))
                                )}
                                {error && (
                                    <Alert variant="destructive">
                                        <AlertTitle>Error</AlertTitle>
                                        <AlertDescription>{error}</AlertDescription>
                                    </Alert>
                                )}
                                {data && data.length > 0 && (
                                    data.map((patient) => (
                                        <div key={patient.consultationId} className="flex flex-col sm:flex-row sm:items-center sm:justify-between rounded-lg border p-4">
                                            <div className="flex items-center gap-4 mb-4 sm:mb-0">
                                                <Avatar className="h-12 w-12">
                                                    <AvatarFallback>{patient.patientName.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-lg">{patient.patientName}, {patient.patientAge}</p>
                                                        <Badge variant={
                                                            patient.urgencyLevel === 'High' ? 'destructive' : 
                                                            patient.urgencyLevel === 'Medium' ? 'secondary' : 'outline'
                                                        }>{patient.urgencyLevel}</Badge>
                                                    </div>

                                                    <p className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
                                                        <Stethoscope className="h-4 w-4"/> 
                                                        <span className="truncate max-w-xs">{patient.symptoms}</span>
                                                    </p>
                                                </div>
                                            </div>
                                            <Button onClick={() => handleStartConsultation(patient.consultationId)} disabled={isStartingConsultation === patient.consultationId}>
                                                {isStartingConsultation === patient.consultationId ? (
                                                    <Loader className="mr-2 h-4 w-4 animate-spin"/>
                                                ) : (
                                                    <Video className="mr-2 h-4 w-4"/>
                                                )}
                                                {isStartingConsultation === patient.consultationId ? 'Starting...' : 'Start Consultation'}
                                            </Button>
                                        </div>
                                    ))
                                )}
                                {data && data.length === 0 && (
                                    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border p-8 text-center min-h-[200px]">
                                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                            <User className="h-8 w-8 text-primary"/>
                                        </div>
                                        <h3 className="font-headline text-xl font-semibold">No Patients Waiting</h3>
                                        <p className="text-muted-foreground">Your waiting room is currently empty.</p>
                                </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                 <TabsContent value="history">
                    <HistoryTab />
                 </TabsContent>
                 <TabsContent value="profile">
                    <ProfileTab user={user} />
                 </TabsContent>
            </Tabs>
        </div>
      </main>
    </div>
  );
}

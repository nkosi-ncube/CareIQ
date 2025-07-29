'use client';
import { useEffect, useState, useRef, useTransition } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CareIqLogo } from "@/components/icons";
import ConsultationForm from "@/components/consultation-form";
import CareHistory from "@/components/care-history";
import AuthButton from "@/components/auth-button";
import type { UserSession } from "@/lib/types";
import { FileText, User, Loader, AlertTriangle, Pill, HeartPulse, Link as LinkIcon, Activity, Wind, Thermometer, Bell, TestTube, Edit } from "lucide-react";
import { getPatientPrescriptions, getPatientProfile, updateUserProfile, getAlerts, seedAlerts, getDiagnosticTests, createDiagnosticTest, updateDiagnosticTest, deleteDiagnosticTest } from '@/lib/actions';
import type { GeneratePrescriptionOutput } from '@/ai/flows/generate-prescription';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Skeleton } from './ui/skeleton';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from './ui/select';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input } from './ui/input';
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from './ui/form';
import type { IDiagnosticTest } from '@/models/DiagnosticTest';


const dummyVitalsData = [
    { heartRate: 72, bloodOxygen: 98, temperature: 36.8, status: 'Normal', analysis: 'Vitals are within the normal range.' },
    { heartRate: 75, bloodOxygen: 99, temperature: 36.9, status: 'Normal', analysis: 'Vitals are stable and healthy.' },
    { heartRate: 78, bloodOxygen: 98, temperature: 37.0, status: 'Normal', analysis: 'Excellent vitals.' },
    { heartRate: 85, bloodOxygen: 97, temperature: 37.2, status: 'Normal', analysis: 'Heart rate is slightly elevated but still in a healthy range.' }, 
    { heartRate: 82, bloodOxygen: 98, temperature: 37.1, status: 'Normal', analysis: 'Vitals are stable.' },
    { heartRate: 76, bloodOxygen: 99, temperature: 36.9, status: 'Normal', analysis: 'Vitals look great.' },
    { heartRate: 95, bloodOxygen: 99, temperature: 37.8, status: 'Warning', analysis: 'Heart rate and temperature are slightly elevated. Monitor for changes.' }, 
    { heartRate: 90, bloodOxygen: 98, temperature: 37.6, status: 'Warning', analysis: 'Heart rate is elevated. Consider resting.' },
    { heartRate: 88, bloodOxygen: 98, temperature: 37.4, status: 'Normal', analysis: 'Vitals returning to normal.' },
    { heartRate: 70, bloodOxygen: 99, temperature: 36.7, status: 'Normal', analysis: 'Vitals are back to a resting state.' },
  ];

function VitalsTab() {
    const [status, setStatus] = useState<'unlinked' | 'linking' | 'linked'>('unlinked');
    const [selectedDevice, setSelectedDevice] = useState<string>('');
    const [vitalsIndex, setVitalsIndex] = useState(0);
    const [currentVitals, setCurrentVitals] = useState(dummyVitalsData[0]);

    const handleLinkDevice = () => {
        if (!selectedDevice) return;
        setStatus('linking');
        setTimeout(() => {
            setStatus('linked');
        }, 2000); // Simulate linking delay
    };

    // Simulate real-time vitals by cycling through dummy data
    useEffect(() => {
        if (status !== 'linked') return;

        const vitalsInterval = setInterval(() => {
            setVitalsIndex(prev => {
                const nextIndex = (prev + 1) % dummyVitalsData.length
                setCurrentVitals(dummyVitalsData[nextIndex]);
                return nextIndex;
            });
        }, 2500); // Update vitals every 2.5 seconds

        return () => clearInterval(vitalsInterval);
    }, [status]);


    const VitalCard = ({ icon, value, unit, label }: { icon: React.ReactNode, value: number, unit: string, label: string }) => (
        <Card className="flex-1 bg-background/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                {icon}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">
                    {value} <span className="text-sm font-normal text-muted-foreground">{unit}</span>
                </div>
            </CardContent>
        </Card>
    );

    const AIStatusCard = ({ analysis }: { analysis: typeof dummyVitalsData[0] }) => {
        const statusStyles = {
            Normal: { icon: <Activity className="text-green-500" />, badge: 'secondary', text: 'text-green-500' },
            Warning: { icon: <AlertTriangle className="text-yellow-500" />, badge: 'default', text: 'text-yellow-500' },
            Critical: { icon: <HeartPulse className="text-red-500 animate-pulse" />, badge: 'destructive', text: 'text-red-500' },
        }
        
        const currentStatus = analysis?.status || 'Normal';
        const styles = statusStyles[currentStatus as keyof typeof statusStyles];

        return (
            <Card>
                <CardHeader>
                    <CardTitle className="font-headline">AI Analysis (CareWatch)</CardTitle>
                    <CardDescription>Our AI agent continuously monitors your vitals for anomalies.</CardDescription>
                </CardHeader>
                <CardContent className="flex items-center gap-4">
                    <div className={cn('flex h-12 w-12 items-center justify-center rounded-full', `bg-${styles.badge}/20`)}>
                        {styles.icon}
                    </div>
                    <div>
                        <p className={cn("font-bold text-lg", styles.text)}>{analysis?.status}</p>
                        <p className="text-sm text-muted-foreground">{analysis?.analysis}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (status === 'unlinked' || status === 'linking') {
         return (
            <Card className="shadow-lg">
                 <CardHeader>
                    <CardTitle className="font-headline">Connect a Device</CardTitle>
                    <CardDescription>Link a health monitoring device to see your real-time vitals.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8">
                     <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                        <HeartPulse className="h-8 w-8 text-primary"/>
                    </div>
                    <div className="w-full max-w-sm space-y-4">
                        <Select onValueChange={setSelectedDevice} disabled={status === 'linking'}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a device..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="apple-watch">Apple Watch</SelectItem>
                                <SelectItem value="fitbit">Fitbit</SelectItem>
                                <SelectItem value="garmin">Garmin</SelectItem>
                                <SelectItem value="samsung-galaxy-watch">Samsung Galaxy Watch</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button className="w-full" onClick={handleLinkDevice} disabled={!selectedDevice || status === 'linking'}>
                            {status === 'linking' ? <Loader className="animate-spin mr-2"/> : <LinkIcon className="mr-2"/>}
                            {status === 'linking' ? 'Linking Device...' : 'Link Device'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
         )
    }


    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                     <CardTitle className="font-headline">Real-time Vitals</CardTitle>
                    <CardDescription>Displaying live data from your connected {selectedDevice.replace('-', ' ')}.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col md:flex-row gap-4">
                    <VitalCard icon={<HeartPulse className="text-red-500"/>} value={currentVitals.heartRate} unit="BPM" label="Heart Rate" />
                    <VitalCard icon={<Wind className="text-blue-500"/>} value={currentVitals.bloodOxygen} unit="SpO2 %" label="Blood Oxygen" />
                    <VitalCard icon={<Thermometer className="text-orange-500"/>} value={currentVitals.temperature} unit="°C" label="Temperature" />
                </CardContent>
            </Card>
            <AIStatusCard analysis={currentVitals} />
        </div>
    )
}

function PrescriptionsTab() {
    const [prescriptions, setPrescriptions] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPrescriptions = async () => {
            setIsLoading(true);
            const result = await getPatientPrescriptions();
            if (result.success && result.data) {
                setPrescriptions(result.data as any[]);
            } else {
                setError(result.error ?? "Failed to load prescriptions.");
            }
            setIsLoading(false);
        };
        fetchPrescriptions();
    }, []);

    const handleDownloadPdf = async (prescriptionElement: HTMLElement | null, consultationId: string) => {
        if (!prescriptionElement) return;
        try {
            const canvas = await html2canvas(prescriptionElement, { scale: 2 });
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(`prescription-${consultationId}.pdf`);
        } catch (error) {
            console.error("Error generating PDF:", error);
        }
    };
    
    if (isLoading) {
        return (
            <Card className="shadow-lg">
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
        return (
            <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
            </Alert>
        )
    }

    return (
        <Card className="shadow-lg">
            <CardHeader>
                <CardTitle className="font-headline">Your Prescriptions</CardTitle>
                <CardDescription>
                Here you can find all the prescriptions from your past consultations.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {prescriptions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border bg-background p-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                            <FileText className="h-8 w-8 text-primary"/>
                        </div>
                        <h3 className="font-headline text-xl font-semibold">No prescriptions yet</h3>
                        <p className="text-muted-foreground">Your approved prescriptions will appear here after a consultation.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {prescriptions.map((presc, index) => (
                            <PrescriptionCardWrapper key={presc.consultationId || index} prescription={presc.aiPrescription} consultationId={presc.consultationId} onDownload={handleDownloadPdf} />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

function PrescriptionCardWrapper({ prescription, consultationId, onDownload }: { prescription: GeneratePrescriptionOutput, consultationId: string, onDownload: Function }) {
    const cardRef = useRef<HTMLDivElement | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const download = async () => {
        setIsDownloading(true);
        await onDownload(cardRef.current, consultationId);
        setIsDownloading(false);
    }

    return (
         <Card className="w-full bg-accent/10 border-accent/20" ref={cardRef}>
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center justify-between gap-2 text-accent-foreground">
                    <div className='flex items-center gap-2'>
                        <Pill className='text-accent'/> Prescription Details
                    </div>
                    <Button variant="secondary" size="sm" onClick={download} disabled={isDownloading}>
                        {isDownloading ? <Loader className="mr-2 h-4 w-4 animate-spin"/> : null}
                        Download PDF
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                {(prescription as any).medications.map((med: any, i: number) => (
                    <div key={i} className="p-2 border-b last:border-b-0">
                        <p className="font-bold">{med.name}</p>
                        <p className="text-muted-foreground">{med.dosage} - {med.frequency}</p>
                        <p className="text-xs text-muted-foreground/80 mt-1">Reason: {med.reason}</p>
                    </div>
                ))}
                <div>
                    <h4 className="font-semibold mt-2">Notes from your Doctor</h4>
                    <p className="text-muted-foreground">{(prescription as any).notes}</p>
                </div>
            </CardContent>
        </Card>
    )
}

const profileSchema = z.object({
    name: z.string().min(2, { message: "Name must be at least 2 characters." }),
    email: z.string().email({ message: "Please enter a valid email." }),
    notificationsEnabled: z.boolean(),
    preferredLanguage: z.string(),
});

function ProfileTab({ user }: { user: UserSession | null }) {
    const { toast } = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [profileData, setProfileData] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);

    const form = useForm<z.infer<typeof profileSchema>>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            name: '',
            email: '',
            notificationsEnabled: false,
            preferredLanguage: 'eng_Latn',
        }
    });

    useEffect(() => {
        const fetchProfile = async () => {
            setIsLoading(true);
            const result = await getPatientProfile();
            if (result.success && result.data) {
                setProfileData(result.data);
                form.reset({
                    name: result.data.name,
                    email: result.data.email,
                    notificationsEnabled: result.data.notificationsEnabled,
                    preferredLanguage: result.data.preferredLanguage,
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


    return (
        <Card className="shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Your Profile</CardTitle>
                    <CardDescription>
                        Your personal information and preferences.
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

                    <FormField
                        control={form.control}
                        name="preferredLanguage"
                        render={({ field }) => (
                            <div className="space-y-2">
                                <Label>Preferred Language</Label>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isEditing}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a language" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="eng_Latn">English</SelectItem>
                                        <SelectItem value="afr_Latn">Afrikaans</SelectItem>
                                        <SelectItem value="nso_Latn">Northern Sotho</SelectItem>
                                        <SelectItem value="sot_Latn">Southern Sotho</SelectItem>
                                        <SelectItem value="ssw_Latn">Swati</SelectItem>
                                        <SelectItem value="tsn_Latn">Tswana</SelectItem>
                                        <SelectItem value="tso_Latn">Tsonga</SelectItem>
                                        <SelectItem value="xho_Latn">Xhosa</SelectItem>
                                        <SelectItem value="zul_Latn">Zulu</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                    />
                    
                    <FormField
                        control={form.control}
                        name="notificationsEnabled"
                        render={({ field }) => (
                            <div className="flex items-center space-x-2">
                                <Switch id="notifications-enabled" checked={field.value} onCheckedChange={field.onChange} disabled={!isEditing} />
                                <Label htmlFor="notifications-enabled">Enable Email Notifications</Label>
                            </div>
                        )}
                    />

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

function AlertsTab() {
    const [alerts, setAlerts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSeeding, setIsSeeding] = useState(false);
    const { toast } = useToast();

    const fetchAlerts = async () => {
        setIsLoading(true);
        const result = await getAlerts();
        if (result.success) {
            setAlerts(result.data as any[]);
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
        setIsLoading(false);
    }

    useEffect(() => {
        fetchAlerts();
    }, []);

    const handleSeedAlerts = async () => {
        setIsSeeding(true);
        const result = await seedAlerts();
        if (result.success) {
            toast({ title: "Success", description: "Sample alerts have been created."});
            await fetchAlerts(); // Refresh the list
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
        setIsSeeding(false);
    }

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="font-headline">Alerts & Notifications</CardTitle>
                    <CardDescription>A list of important notifications about your health.</CardDescription>
                </div>
                <Button onClick={handleSeedAlerts} disabled={isSeeding} variant="outline">
                    {isSeeding && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                    Seed Sample Alerts
                </Button>
            </CardHeader>
            <CardContent>
                {alerts.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border p-8 text-center">
                        <Bell className="h-12 w-12 text-muted-foreground" />
                        <h3 className="font-headline text-xl font-semibold">No Alerts Yet</h3>
                        <p className="text-muted-foreground">Important notifications will appear here.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts.map(alert => (
                            <Alert key={alert._id} variant={alert.status === 'read' ? 'default' : 'destructive'} className="flex items-center justify-between">
                               <div>
                                 <AlertTitle>{alert.title}</AlertTitle>
                                 <AlertDescription>
                                     {new Date(alert.createdAt).toLocaleString()}
                                 </AlertDescription>
                               </div>
                               <Badge variant={alert.status === 'read' ? 'outline' : 'default'}>{alert.status}</Badge>
                            </Alert>
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}

const testSchema = z.object({
  name: z.string().min(1, "Test name is required"),
  result: z.string().min(1, "Result is required"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Invalid date" }),
});


function TestForm({ test, onSave, onCancel }: { test?: IDiagnosticTest, onSave: () => void, onCancel: () => void }) {
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<z.infer<typeof testSchema>>({
        resolver: zodResolver(testSchema),
        defaultValues: {
            name: test?.name || "",
            result: test?.result || "",
            date: test ? new Date(test.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        },
    });

    const onSubmit = async (data: z.infer<typeof testSchema>) => {
        setIsSubmitting(true);
        const action = test ? updateDiagnosticTest : createDiagnosticTest;
        const payload = test ? { ...data, id: test._id } : data;
        
        const result = await action(payload as any);

        if (result.success) {
            toast({ title: `Test ${test ? 'Updated' : 'Created'}`, description: "Your changes have been saved." });
            onSave();
        } else {
            toast({ variant: "destructive", title: "Save Failed", description: result.error });
        }
        setIsSubmitting(false);
    };

    return (
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Test Name</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., Blood Glucose" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="result"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Result</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 5.5 mmol/L" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Date</FormLabel>
                        <FormControl>
                            <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <Loader className="mr-2 h-4 w-4 animate-spin" />}
                    {test ? 'Update Test' : 'Create Test'}
                </Button>
                <Button type="button" variant="ghost" onClick={onCancel}>Cancel</Button>
            </div>
        </form>
        </Form>
    );
}

function TestsTab() {
    const { toast } = useToast();
    const [tests, setTests] = useState<IDiagnosticTest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingTest, setEditingTest] = useState<IDiagnosticTest | undefined>(undefined);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const fetchTests = async () => {
        setIsLoading(true);
        const result = await getDiagnosticTests();
        if (result.success) {
            setTests(result.data as IDiagnosticTest[]);
        } else {
            toast({ variant: 'destructive', title: "Error", description: result.error });
        }
        setIsLoading(false);
    }

    useEffect(() => {
        fetchTests();
    }, []);

    const handleFormSave = () => {
        setIsDialogOpen(false);
        setEditingTest(undefined);
        fetchTests();
    };
    
    const handleDelete = async (id: string) => {
        if(!window.confirm("Are you sure you want to delete this test?")) return;

        setIsDeleting(id);
        const result = await deleteDiagnosticTest(id);
        if (result.success) {
            toast({ title: "Test Deleted" });
            fetchTests();
        } else {
            toast({ variant: 'destructive', title: "Delete Failed", description: result.error });
        }
        setIsDeleting(null);
    };

    if (isLoading) {
        return (
            <Card>
                <CardHeader>
                    <Skeleton className="h-7 w-48" />
                </CardHeader>
                <CardContent className="space-y-4">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
             <Dialog open={isDialogOpen} onOpenChange={(open) => {
                setIsDialogOpen(open);
                if (!open) setEditingTest(undefined);
             }}>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle className="font-headline">Diagnostic Tests</CardTitle>
                        <CardDescription>A record of your diagnostic tests.</CardDescription>
                    </div>
                    <DialogTrigger asChild>
                        <Button>Add New Test</Button>
                    </DialogTrigger>
                </CardHeader>
                <CardContent>
                     {tests.length === 0 ? (
                        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border p-8 text-center">
                            <TestTube className="h-12 w-12 text-muted-foreground" />
                            <h3 className="font-headline text-xl font-semibold">No Tests Recorded</h3>
                            <p className="text-muted-foreground">Click "Add New Test" to get started.</p>
                        </div>
                    ) : (
                         <div className="space-y-2">
                            {tests.map(test => (
                                <div key={test._id} className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <p className="font-semibold">{test.name}</p>
                                        <p className="text-sm text-muted-foreground">
                                            Result: {test.result} - {new Date(test.date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <DialogTrigger asChild>
                                            <Button variant="outline" size="sm" onClick={() => setEditingTest(test)}>Edit</Button>
                                        </DialogTrigger>
                                        <Button 
                                            variant="destructive" 
                                            size="sm" 
                                            onClick={() => handleDelete(test._id)} 
                                            disabled={isDeleting === test._id}
                                        >
                                            {isDeleting === test._id && <Loader className="mr-2 h-4 w-4 animate-spin"/>}
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>

                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingTest ? 'Edit Test' : 'Add New Test'}</DialogTitle>
                    </DialogHeader>
                    <TestForm test={editingTest} onSave={handleFormSave} onCancel={() => setIsDialogOpen(false)} />
                </DialogContent>
            </Dialog>
        </Card>
    );
}

export default function PatientDashboard({ user }: { user: UserSession | null }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-20 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:px-8">
        <div className="flex items-center gap-3">
          <CareIqLogo className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-2xl font-bold text-foreground">
            CareIQ Lite
          </h1>
        </div>
        <AuthButton user={user} />
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="font-headline text-3xl font-semibold">Welcome, {user?.name ?? 'Guest'}</h1>
          <p className="text-muted-foreground">
            Your personal AI health assistant. Get insights, find specialists, and track your health journey.
          </p>
        </div>

        <Tabs defaultValue="consultation" className="mx-auto w-full max-w-6xl">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="consultation" disabled={!user}>New Consultation</TabsTrigger>
            <TabsTrigger value="history" disabled={!user}>Care History</TabsTrigger>
            <TabsTrigger value="prescriptions" disabled={!user}>Prescriptions</TabsTrigger>
            <TabsTrigger value="tests" disabled={!user}>Tests</TabsTrigger>
            <TabsTrigger value="alerts" disabled={!user}>Alerts</TabsTrigger>
            <TabsTrigger value="profile" disabled={!user}>Profile</TabsTrigger>
          </TabsList>
          <TabsContent value="consultation">
             {user ? (
              <Card className="shadow-lg">
                <CardHeader>
                  <CardTitle className="font-headline">AI Symptom Analysis</CardTitle>
                  <CardDescription>
                    Describe your symptoms below, and our AI will suggest the most relevant specialists for you.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ConsultationForm />
                </CardContent>
              </Card>
             ) : (
                <Card className="shadow-lg flex flex-col items-center justify-center p-10 text-center">
                    <CardHeader>
                        <CardTitle className="font-headline">Please Log In</CardTitle>
                        <CardDescription>
                            You need to be logged in to start a new consultation.
                        </CardDescription>
                    </CardHeader>
                </Card>
             )}
          </TabsContent>
          <TabsContent value="history">
            {user ? <CareHistory /> : (
                 <Card className="shadow-lg flex flex-col items-center justify-center p-10 text-center">
                 <CardHeader>
                     <CardTitle className="font-headline">Please Log In</CardTitle>
                     <CardDescription>
                         You need to be logged in to view your care history.
                     </CardDescription>
                 </CardHeader>
             </Card>
            )}
          </TabsContent>
          <TabsContent value="prescriptions">
             {user ? <PrescriptionsTab /> : (
                <Card className="shadow-lg flex flex-col items-center justify-center p-10 text-center">
                    <CardHeader>
                        <CardTitle className="font-headline">Please Log In</CardTitle>
                        <CardDescription>
                            You need to be logged in to view your prescriptions.
                        </CardDescription>
                    </CardHeader>
                </Card>
             )}
          </TabsContent>
          <TabsContent value="tests">
             {user ? <TestsTab /> : (
                <Card className="shadow-lg flex flex-col items-center justify-center p-10 text-center">
                    <CardHeader>
                        <CardTitle className="font-headline">Please Log In</CardTitle>
                        <CardDescription>
                            You need to be logged in to manage your diagnostic tests.
                        </CardDescription>
                    </CardHeader>
                </Card>
             )}
          </TabsContent>
           <TabsContent value="alerts">
             {user ? <AlertsTab /> : (
                <Card className="shadow-lg flex flex-col items-center justify-center p-10 text-center">
                    <CardHeader>
                        <CardTitle className="font-headline">Please Log In</CardTitle>
                        <CardDescription>
                            You need to be logged in to view your alerts.
                        </CardDescription>
                    </CardHeader>
                </Card>
             )}
          </TabsContent>
          <TabsContent value="profile">
            {user ? <ProfileTab user={user} /> : (
                <Card className="shadow-lg flex flex-col items-center justify-center p-10 text-center">
                    <CardHeader>
                        <CardTitle className="font-headline">Please Log In</CardTitle>
                        <CardDescription>
                            You need to be logged in to view your profile.
                        </CardDescription>
                    </CardHeader>
                </Card>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

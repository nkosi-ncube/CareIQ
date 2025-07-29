import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CareIqLogo } from "@/components/icons";
import ConsultationForm from "@/components/consultation-form";
import CareHistory from "@/components/care-history";
import AuthButton from "@/components/auth-button";
import type { UserSession } from "@/lib/types";
import { FileText } from "lucide-react";

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
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="consultation" disabled={!user}>New Consultation</TabsTrigger>
            <TabsTrigger value="history" disabled={!user}>Care History</TabsTrigger>
            <TabsTrigger value="prescriptions" disabled={!user}>Prescriptions</TabsTrigger>
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
             {user ? (
                  <Card className="shadow-lg">
                    <CardHeader>
                      <CardTitle className="font-headline">Your Prescriptions</CardTitle>
                      <CardDescription>
                        Here you can find all the prescriptions from your past consultations.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed border-border bg-background p-8 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                                <FileText className="h-8 w-8 text-primary"/>
                            </div>
                            <h3 className="font-headline text-xl font-semibold">No prescriptions yet</h3>
                            <p className="text-muted-foreground">Your approved prescriptions will appear here after a consultation.</p>
                        </div>
                    </CardContent>
                </Card>
             ) : (
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
        </Tabs>
      </main>
    </div>
  );
}

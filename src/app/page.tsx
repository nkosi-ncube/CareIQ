import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CareIqLogo } from "@/components/icons";
import ConsultationForm from "@/components/consultation-form";
import CareHistory from "@/components/care-history";
import { patientDetails } from "@/lib/mock-data";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-20 items-center gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:px-8">
        <div className="flex items-center gap-3">
          <CareIqLogo className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-2xl font-bold text-foreground">
            CareIQ Lite
          </h1>
        </div>
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-6xl gap-2">
          <h1 className="font-headline text-3xl font-semibold">Welcome, {patientDetails.name}</h1>
          <p className="text-muted-foreground">
            Your personal AI health assistant. Get insights, find specialists, and track your health journey.
          </p>
        </div>

        <Tabs defaultValue="consultation" className="mx-auto w-full max-w-6xl">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="consultation">New Consultation</TabsTrigger>
            <TabsTrigger value="history">Care History</TabsTrigger>
          </TabsList>
          <TabsContent value="consultation">
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
          </TabsContent>
          <TabsContent value="history">
            <CareHistory />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

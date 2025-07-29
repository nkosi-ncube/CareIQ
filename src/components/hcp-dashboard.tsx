import { CareIqLogo } from "@/components/icons";
import AuthButton from "@/components/auth-button";
import type { UserSession } from "@/lib/types";
import { mockPatients } from "@/lib/mock-data";
import PatientCard from "./patient-card";
import { Input } from "./ui/input";
import { Search } from "lucide-react";

export default function HcpDashboard({ user }: { user: UserSession }) {
  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <header className="sticky top-0 z-10 flex h-20 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:px-8">
        <div className="flex items-center gap-3">
          <CareIqLogo className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-2xl font-bold text-foreground">
            CareIQ HCP Portal
          </h1>
        </div>
        <AuthButton user={user} />
      </header>
      <main className="flex flex-1 flex-col gap-4 p-4 sm:px-6 sm:py-8 md:gap-8 md:p-10">
        <div className="mx-auto grid w-full max-w-7xl gap-2">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="font-headline text-3xl font-semibold">Welcome, {user.name}</h1>
                    <p className="text-muted-foreground">
                        Here's your intelligent patient queue for today.
                    </p>
                </div>
                <div className="relative w-full md:w-1/3">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder="Search patients..." className="pl-10" />
                </div>
            </div>
        </div>

        <div className="mx-auto w-full max-w-7xl">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {mockPatients.map((patient) => (
                    <PatientCard key={patient.id} patient={patient} />
                ))}
            </div>
        </div>
      </main>
    </div>
  );
}

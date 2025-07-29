import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Patient } from '@/lib/types';
import { AlertTriangle, User, Video } from 'lucide-react';
import Link from 'next/link';

export default function PatientCard({ patient }: { patient: Patient }) {
  const riskColor = {
    Low: 'border-green-500/50 bg-green-500/10',
    Medium: 'border-yellow-500/50 bg-yellow-500/10',
    High: 'border-red-500/50 bg-red-500/10',
  };

  const riskTextColor = {
    Low: 'text-green-600 dark:text-green-400',
    Medium: 'text-yellow-600 dark:text-yellow-400',
    High: 'text-red-600 dark:text-red-400',
  }

  return (
    <Card className={cn("flex flex-col transition-all hover:shadow-lg", riskColor[patient.riskLevel])}>
      <CardHeader>
        <div className="flex items-center gap-4">
            <Avatar className="h-12 w-12">
                <AvatarImage src={`https://placehold.co/128x128.png`} alt={patient.name} />
                <AvatarFallback>{patient.name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
                <CardTitle className="font-headline text-xl">{patient.name}</CardTitle>
                <CardDescription>{patient.age} years old</CardDescription>
            </div>
        </div>
      </CardHeader>
      <CardContent className="flex-grow space-y-3">
        <div className={cn("flex items-center gap-2 font-semibold", riskTextColor[patient.riskLevel])}>
            <AlertTriangle className="h-5 w-5" />
            <span>{patient.riskLevel} Risk</span>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground">Chief Complaint</h4>
          <p className="text-sm">{patient.symptoms}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground">Last Visit</h4>
          <p className="text-sm">{new Date(patient.lastConsultation).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </CardContent>
      <CardFooter className="flex gap-2">
        <Button className="flex-1">View Details</Button>
        <Button variant="outline" className="flex-1" asChild>
            <Link href="/consultation/live">
                <Video className="mr-2 h-4 w-4"/>
                Start Consult
            </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}

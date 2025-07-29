'use client';

import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Pill, Loader } from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export default function PrescriptionCard({ prescription, consultationId }: { prescription: any, consultationId: string }) {
    const prescriptionRef = useRef<HTMLDivElement | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    const handleDownloadPdf = async () => {
        const prescriptionElement = prescriptionRef.current;
        if (!prescriptionElement) {
            return;
        }
        setIsDownloading(true);
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
        setIsDownloading(false);
    };

    return (
        <Card className="w-full bg-accent/10 border-accent/20" ref={prescriptionRef}>
            <CardHeader>
                <CardTitle className="font-headline text-lg flex items-center justify-between gap-2 text-accent-foreground">
                    <div className='flex items-center gap-2'>
                        <Pill className='text-accent' /> Prescription Details
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadPdf} disabled={isDownloading}>
                        {isDownloading ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                        Download PDF
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
                {prescription.medications.map((med: any, i: number) => (
                    <div key={i} className="p-2 border-b last:border-b-0">
                        <p className="font-bold">{med.name}</p>
                        <p className="text-muted-foreground">{med.dosage} - {med.frequency}</p>
                        <p className="text-xs text-muted-foreground/80 mt-1">Reason: {med.reason}</p>
                    </div>
                ))}
                <div>
                    <h4 className="font-semibold mt-2">Notes from your Doctor</h4>
                    <p className="text-muted-foreground">{prescription.notes}</p>
                </div>
            </CardContent>
        </Card>
    );
}

'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CareIqLogo } from '@/components/icons';
import { useToast } from '@/hooks/use-toast';
import { registerUser } from '@/lib/actions';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import Link from 'next/link';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const southAfricanMedicalAids = [
  "Discovery Health", "Bonitas", "Momentum Health", "Fedhealth", 
  "Medihelp", "Bestmed", "Profmed", "Keyhealth", "Sizwe-Hosmed", "Netcare Medical Scheme"
];

const registerSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    email: z.string().email({ message: 'Invalid email address.' }),
    password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
    role: z.enum(['patient', 'hcp']),
    practiceNumber: z.string().optional(),
    paymentMethod: z.enum(['cash', 'medicalAid']).optional(),
    medicalAidName: z.string().optional(),
    medicalAidMemberNumber: z.string().optional(),
}).superRefine((data, ctx) => {
    if (data.role === 'hcp' && !data.practiceNumber) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['practiceNumber'],
            message: 'Practice number is required for HCPs.',
        });
    }
    if (data.role === 'patient' && !data.paymentMethod) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['paymentMethod'],
            message: 'Payment method is required for patients.',
        });
    }
    if (data.paymentMethod === 'medicalAid' && !data.medicalAidName) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['medicalAidName'],
            message: 'Medical aid name is required.',
        });
    }
    if (data.paymentMethod === 'medicalAid' && !data.medicalAidMemberNumber) {
        ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ['medicalAidMemberNumber'],
            message: 'Medical aid member number is required.',
        });
    }
});

type RegisterSchema = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterSchema>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
        role: 'patient',
    }
  });

  const role = watch('role');
  const paymentMethod = watch('paymentMethod');

  const onSubmit = async (data: RegisterSchema) => {
    setIsLoading(true);
    const result = await registerUser(data);
    setIsLoading(false);

    if (result.success) {
      toast({
        title: 'Registration Successful',
        description: 'You can now log in.',
      });
      router.push('/login');
    } else {
      toast({
        variant: 'destructive',
        title: 'Registration Failed',
        description: result.error,
      });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
      <div className="mb-6 flex flex-col items-center text-center">
            <Link href="/" className="flex items-center gap-2 mb-4">
                <CareIqLogo className="h-10 w-10 text-primary" />
                <span className="text-2xl font-bold font-headline">CareIQ Lite</span>
            </Link>
            <h1 className="text-3xl font-bold font-headline">Create an Account</h1>
            <p className="text-muted-foreground">Join CareIQ to manage your health intelligently.</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Sign Up</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label>I am a...</Label>
                <RadioGroup
                  defaultValue="patient"
                  className="flex gap-4"
                  onValueChange={(value: 'patient' | 'hcp') => setValue('role', value)}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="patient" id="r1" />
                    <Label htmlFor="r1">Patient</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="hcp" id="r2" />
                    <Label htmlFor="r2">Healthcare Professional</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input id="name" {...register('name')} />
                {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="name@example.com" {...register('email')} />
                {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" {...register('password')} />
                {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
              </div>

              {role === 'hcp' && (
                <div className="space-y-2">
                  <Label htmlFor="practiceNumber">Practice Number</Label>
                  <Input id="practiceNumber" {...register('practiceNumber')} />
                  {errors.practiceNumber && <p className="text-sm text-destructive">{errors.practiceNumber.message}</p>}
                </div>
              )}

              {role === 'patient' && (
                <>
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <RadioGroup
                      className="flex gap-4"
                      onValueChange={(value: 'cash' | 'medicalAid') => setValue('paymentMethod', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="cash" id="pm1" />
                        <Label htmlFor="pm1">Cash</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="medicalAid" id="pm2" />
                        <Label htmlFor="pm2">Medical Aid</Label>
                      </div>
                    </RadioGroup>
                    {errors.paymentMethod && <p className="text-sm text-destructive">{errors.paymentMethod.message}</p>}
                  </div>
                  {paymentMethod === 'medicalAid' && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="medicalAidName">Medical Aid</Label>
                        <Select onValueChange={(value) => setValue('medicalAidName', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a medical aid" />
                          </SelectTrigger>
                          <SelectContent>
                            {southAfricanMedicalAids.map((aid) => (
                              <SelectItem key={aid} value={aid}>{aid}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {errors.medicalAidName && <p className="text-sm text-destructive">{errors.medicalAidName.message}</p>}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="medicalAidMemberNumber">Member Number</Label>
                        <Input id="medicalAidMemberNumber" {...register('medicalAidMemberNumber')} />
                        {errors.medicalAidMemberNumber && <p className="text-sm text-destructive">{errors.medicalAidMemberNumber.message}</p>}
                      </div>
                    </>
                  )}
                </>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </Button>
            </form>
          </CardContent>
        </Card>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          {'Already have an account? '}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign In
          </Link>
        </p>
      </div>
    </div>
  );
}

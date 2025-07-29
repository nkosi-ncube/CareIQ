
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CareIqLogo } from '@/components/icons';
import { ArrowRight } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-background">
      <header className="sticky top-0 z-10 flex h-20 items-center justify-between gap-4 border-b bg-background/80 px-4 backdrop-blur-sm sm:px-6 md:px-8">
        <div className="flex items-center gap-3">
          <CareIqLogo className="h-8 w-8 text-primary" />
          <h1 className="font-headline text-2xl font-bold text-foreground">
            CareIQ Lite
          </h1>
        </div>
        <div className="flex items-center gap-2">
            <Button asChild variant="outline">
                <Link href="/login">Login</Link>
            </Button>
            <Button asChild>
                <Link href="/register">Sign Up</Link>
            </Button>
        </div>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32">
          <div className="container mx-auto px-4 md:px-6">
            <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
              <div className="flex flex-col justify-center space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl font-headline text-primary">
                    Intelligent Care, Personalised Health.
                  </h1>
                  <p className="max-w-[600px] text-muted-foreground md:text-xl">
                    CareIQ Lite uses AI to analyze your symptoms, connect you with the right specialists, and help you manage your health journey intelligently.
                  </p>
                </div>
                <div className="flex flex-col gap-2 min-[400px]:flex-row">
                  <Button asChild size="lg">
                    <Link href="/register">
                      Get Started Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="flex items-center justify-center">
                <img
                  alt="Hero"
                  className="mx-auto aspect-video overflow-hidden rounded-xl object-cover sm:w-full"
                  height="310"
                  src="https://placehold.co/550x310.png"
                  data-ai-hint="doctor patient telehealth"
                  width="550"
                />
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex items-center justify-center p-6 border-t">
        <p className="text-sm text-muted-foreground">&copy; {new Date().getFullYear()} CareIQ Lite. All rights reserved.</p>
      </footer>
    </div>
  );
}

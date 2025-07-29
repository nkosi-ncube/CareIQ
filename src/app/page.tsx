import { getSession } from "@/lib/actions";
import Dashboard from "@/components/dashboard";
import LandingPage from "@/components/landing-page";

//h
export default async function Home() {
  const session = await getSession();

  if (!session) {
    return <LandingPage />;
  }

  return <Dashboard user={session} />;
}

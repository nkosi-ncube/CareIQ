import { getSession } from "@/lib/actions";
import PatientDashboard from "@/components/patient-dashboard";
import HcpDashboard from "@/components/hcp-dashboard";

//hhh
export default async function Home() {
  const session = await getSession();

  if (!session) {
    // Render patient dashboard in logged-out state, which shows login prompts
    return <PatientDashboard user={null} />;
  }

  if (session.role === 'hcp') {
    return <HcpDashboard user={session} />;
  }
  
  // Default to patient dashboard
  return <PatientDashboard user={session} />;
}

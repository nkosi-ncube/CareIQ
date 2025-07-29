'use client';

import type { UserSession } from "@/lib/types";
import PatientDashboard from "@/components/patient-dashboard";
import HcpDashboard from "@/components/hcp-dashboard";

export default function Dashboard({ user }: { user: UserSession | null }) {
  if (!user) {
    // Render patient dashboard in logged-out state, which shows login prompts
    return <PatientDashboard user={null} />;
  }

  if (user.role === 'hcp') {
    return <HcpDashboard user={user} />;
  }

  // Default to patient dashboard
  return <PatientDashboard user={user} />;
}

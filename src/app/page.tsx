import { getSession } from "@/lib/actions";
import Dashboard from "@/components/dashboard";

//hhhhhhh
export default async function Home() {
  const session = await getSession();

  return <Dashboard user={session} />;
}

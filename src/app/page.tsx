import { getSession } from "@/lib/actions";
import Dashboard from "@/components/dashboard";


export default async function Home() {
  const session = await getSession();

  return <Dashboard user={session} />;
}

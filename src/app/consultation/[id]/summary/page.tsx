
import SummaryClientPage from './summary-client-page';

export default function ConsultationSummaryPage({ params }: { params: { id: string } }) {
  const { id } = params;

  return <SummaryClientPage consultationId={id} />;
}

import { ManagementLayout } from '../../components/management/ManagementLayout';
import { DashboardOverview } from '../../components/management/DashboardOverview';

export function DashboardPage() {
  return (
    <ManagementLayout
      title="Management Dashboard"
      subtitle="Executive status, event representation parameters, and future phase architecture."
    >
      <DashboardOverview />
    </ManagementLayout>
  );
}

import { ManagementLayout } from '../../components/management/ManagementLayout';
import { SettingsForm } from '../../components/management/SettingsForm';

export function SettingsPage() {
  return (
    <ManagementLayout
      title="Event & Celebrity Configuration"
      subtitle="Modify active celebrity details, event descriptions, brand palette, and support channels."
    >
      <SettingsForm />
    </ManagementLayout>
  );
}

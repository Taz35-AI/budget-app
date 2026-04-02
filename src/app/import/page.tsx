import ImportShell from '@/components/import/ImportShell';
import { AppLayout } from '@/components/layout/AppLayout';

export const metadata = { title: 'Import Transactions' };

export default function ImportPage() {
  return (
    <AppLayout>
      <ImportShell />
    </AppLayout>
  );
}

import { ProtectedRoute } from '@/components/protected-route';
import { OrganizationProvider } from '@/components/organization-provider';
import { AppChrome } from '@/components/app-chrome';

export default function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <OrganizationProvider>
        <AppChrome>{children}</AppChrome>
      </OrganizationProvider>
    </ProtectedRoute>
  );
}

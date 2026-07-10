import { ProtectedRoute } from '@/components/protected-route';
import { OrganizationProvider } from '@/components/organization-provider';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';

export default function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <OrganizationProvider>
        <div className="flex min-h-screen bg-cream">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Topbar />
            <main className="flex-1 overflow-y-auto px-8 py-8">{children}</main>
          </div>
        </div>
      </OrganizationProvider>
    </ProtectedRoute>
  );
}

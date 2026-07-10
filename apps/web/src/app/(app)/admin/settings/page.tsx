import { ModuleShell } from '@/components/module-shell';

export default function SettingsPage() {
  return <ModuleShell eyebrow="Admin" title="Settings" description="System settings shell with secret masking handled by the backend." endpoint="/admin/settings" />;
}

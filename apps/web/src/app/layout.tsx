import type { Metadata } from 'next';

import { AuthProvider } from '@/components/auth-provider';
import { ToastProvider } from '@/components/toast-provider';

import './globals.css';

export const metadata: Metadata = {
  title: 'Trackigniter8',
  description: 'Trackigniter8 fleet operations console',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-body antialiased">
        <ToastProvider>
          <AuthProvider>{children}</AuthProvider>
        </ToastProvider>
      </body>
    </html>
  );
}

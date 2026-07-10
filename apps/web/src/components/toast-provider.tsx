'use client';

import { createContext, useContext, useState } from 'react';

type Toast = {
  id: number;
  message: string;
  tone: 'success' | 'error';
};

type ToastContextValue = {
  notify: (message: string, tone?: Toast['tone']) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  function notify(message: string, tone: Toast['tone'] = 'success') {
    const id = Date.now();
    setToasts((current) => [...current, { id, message, tone }]);
    window.setTimeout(() => setToasts((current) => current.filter((toast) => toast.id !== id)), 4200);
  }

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 space-y-3">
        {toasts.map((toast) => (
          <div key={toast.id} className={toast.tone === 'error' ? 'rounded-2xl bg-ember px-4 py-3 text-sm font-semibold text-white shadow-panel' : 'rounded-2xl bg-moss px-4 py-3 text-sm font-semibold text-white shadow-panel'}>
            {toast.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const value = useContext(ToastContext);
  if (!value) {
    throw new Error('useToast must be used inside ToastProvider');
  }
  return value;
}

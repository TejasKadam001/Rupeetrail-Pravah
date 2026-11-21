'use client';

import React from 'react';
import { useAuditContext } from '@/context/AuditContext';
import { CheckCircle2, X } from 'lucide-react';

export function ToastNotification() {
  const { toastMessage, setToastMessage } = useAuditContext();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 max-w-md animate-in slide-in-from-bottom duration-200 pointer-events-none">
      <div className="rounded-lg border border-zinc-300 bg-white text-zinc-900 p-3.5 shadow-xl flex items-start gap-2.5 pointer-events-auto">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
        <div className="flex-1 text-xs font-mono leading-relaxed">
          {toastMessage}
        </div>
        <button
          onClick={() => setToastMessage(null)}
          className="text-zinc-400 hover:text-zinc-800 p-0.5 transition-colors"
          aria-label="Dismiss toast"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}

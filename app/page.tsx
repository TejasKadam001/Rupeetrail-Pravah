'use client';

import React from 'react';
import { AuditProvider } from '@/context/AuditContext';
import { Header } from '@/components/Header';
import { CitizenPortal } from '@/components/citizen/CitizenPortal';
import { ToastNotification } from '@/components/ToastNotification';
import { BottomNav } from '@/components/BottomNav';
import { ChatbotModal } from '@/components/ChatbotModal';

export default function Home() {
  return (
    <AuditProvider>
      <div className="min-h-screen flex flex-col bg-[#fbfbfa] text-stone-900 selection:bg-emerald-200">
        <Header />
        <main className="flex-1 w-full mx-auto">
          <CitizenPortal />
        </main>
        <ToastNotification />
        <BottomNav />
        <ChatbotModal />
      </div>
    </AuditProvider>
  );
}

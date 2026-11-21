'use client';

import React from 'react';
import {
  Camera,
  Users,
  FileText,
  Search,
} from 'lucide-react';
import { useAuditContext, ActivePageType } from '@/context/AuditContext';
import { TRANSLATIONS } from '@/lib/translations';

export function BottomNav() {
  const { activePage, setActivePage, lang } = useAuditContext();
  const t = TRANSLATIONS[lang];

  const navItems: { id: ActivePageType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    {
      id: 'lookup',
      label: t.navLookup,
      icon: Search,
    },
    {
      id: 'snap',
      label: t.navSnap,
      icon: Camera,
    },
    {
      id: 'roads',
      label: t.navRoads,
      icon: FileText,
    },
    {
      id: 'community',
      label: t.navCommunity,
      icon: Users,
    },
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-1/2 sm:-translate-x-1/2 sm:max-w-md sm:w-full z-40 pointer-events-auto">
      <nav className="bg-stone-900/95 backdrop-blur-md rounded-full border border-stone-800 shadow-xl px-2.5 py-1.5 flex items-center justify-around gap-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePage === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                setActivePage(item.id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex flex-col items-center justify-center gap-1 py-1.5 px-3 rounded-full transition-all ${
                isActive
                  ? 'bg-emerald-600 text-white font-bold shadow-xs'
                  : 'text-stone-400 hover:text-white hover:bg-stone-800/60 font-medium'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-[10px] tracking-tight leading-none whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}

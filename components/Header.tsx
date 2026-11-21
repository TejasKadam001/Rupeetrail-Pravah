'use client';

import React from 'react';
import Image from 'next/image';
import { useAuditContext } from '@/context/AuditContext';
import { Camera, MapPin, Globe } from 'lucide-react';
import { WardCode } from '@/lib/types';
import { REAL_WARDS } from '@/lib/roadDatabase';
import { TRANSLATIONS } from '@/lib/translations';

export function Header() {
  const { lang, setLang, setActivePage, selectedWard, setSelectedWard } = useAuditContext();
  const t = TRANSLATIONS[lang];

  return (
    <header className="bg-white/90 backdrop-blur-md sticky top-0 z-40 border-b border-stone-200/80 py-2.5">
      <div className="max-w-xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        {/* BMC Seal + App Title */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl overflow-hidden bg-white border border-stone-200 shadow-2xs flex items-center justify-center p-0.5 shrink-0">
            <Image
              src="/image.png"
              alt="BMC Seal"
              width={38}
              height={38}
              className="w-full h-full object-contain"
              priority
            />
          </div>
          <div>
            <span className="font-extrabold tracking-tight text-stone-900 text-sm font-sans block leading-tight">
              {t.appTitle}
            </span>
            <span className="text-[10px] text-stone-500 font-medium block">
              {t.appSubtitle}
            </span>
          </div>
        </div>

        {/* Right Controls: Language Switcher, Ward Selector & Camera */}
        <div className="flex items-center gap-2">
          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'mr' : 'en')}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-200 transition-colors"
            title="Switch Language / भाषा बदला"
          >
            <Globe className="w-3.5 h-3.5 text-emerald-700" />
            <span>{lang === 'en' ? 'मराठी' : 'English'}</span>
          </button>

          {/* Ward Selector */}
          <div className="flex items-center gap-1 px-2.5 py-1.5 bg-stone-100/90 border border-stone-200 rounded-full text-xs text-stone-800 transition-colors">
            <MapPin className="w-3 h-3 text-stone-500 shrink-0" />
            <select
              aria-label={t.wardSelectorLabel}
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value as WardCode)}
              className="bg-transparent text-[11px] font-bold text-stone-900 focus:outline-none cursor-pointer pr-1 max-w-[110px] truncate"
            >
              <option value="ALL">{t.allMumbai}</option>
              {REAL_WARDS.map((w) => (
                <option key={w.code} value={w.code}>
                  {t.wardPrefix} {w.code} — {w.name.split(',')[0]}
                </option>
              ))}
            </select>
          </div>

          {/* Camera Quick Button */}
          <button
            onClick={() => setActivePage('snap')}
            aria-label={t.navSnap}
            className="w-8 h-8 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white flex items-center justify-center transition-colors shrink-0 shadow-2xs"
            title={t.navSnap}
          >
            <Camera className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}

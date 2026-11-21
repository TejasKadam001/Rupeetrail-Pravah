'use client';

import React from 'react';
import { useAuditContext } from '@/context/AuditContext';
import { AuditCommandCenter } from './AuditCommandCenter';
import { ContractorScorecard } from './ContractorScorecard';
import { NextRupeePlanner } from './NextRupeePlanner';
import { AuditDrawer } from './AuditDrawer';
import { ShowCauseModal } from './ShowCauseModal';
import { ShieldAlert, Users, Compass } from 'lucide-react';

export function WardOfficerView() {
  const { officerTab, setOfficerTab } = useAuditContext();

  return (
    <div className="space-y-4">
      {/* Officer Tab Navigation Pill Strip */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setOfficerTab('command-center')}
            className={`cafe-pill flex items-center gap-1.5 whitespace-nowrap ${
              officerTab === 'command-center'
                ? 'bg-[#1c1917] text-[#f7f5f0] shadow-xs'
                : 'bg-white text-[#78716c] hover:bg-[#ede6dc]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Audit Command</span>
          </button>

          <button
            onClick={() => setOfficerTab('scorecard')}
            className={`cafe-pill flex items-center gap-1.5 whitespace-nowrap ${
              officerTab === 'scorecard'
                ? 'bg-[#1c1917] text-[#f7f5f0] shadow-xs'
                : 'bg-white text-[#78716c] hover:bg-[#ede6dc]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Contractor Scorecard</span>
          </button>

          <button
            onClick={() => setOfficerTab('next-rupee')}
            className={`cafe-pill flex items-center gap-1.5 whitespace-nowrap ${
              officerTab === 'next-rupee'
                ? 'bg-[#1c1917] text-[#f7f5f0] shadow-xs'
                : 'bg-white text-[#78716c] hover:bg-[#ede6dc]'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Next-Rupee Planner</span>
          </button>
        </div>
      </div>

      {/* Active Tab Content */}
      <div className="animate-in fade-in duration-150">
        {officerTab === 'command-center' && <AuditCommandCenter />}
        {officerTab === 'scorecard' && <ContractorScorecard />}
        {officerTab === 'next-rupee' && <NextRupeePlanner />}
      </div>

      {/* Side Drawer & Show-Cause Modal */}
      <AuditDrawer />
      <ShowCauseModal />
    </div>
  );
}

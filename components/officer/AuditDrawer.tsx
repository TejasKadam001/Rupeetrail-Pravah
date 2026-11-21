'use client';

import React from 'react';
import { useAuditContext } from '@/context/AuditContext';
import {
  X,
  AlertOctagon,
  FileText,
  CloudRain,
  MessageSquare,
  Layers,
  FileCheck,
  TrendingDown,
  CheckCircle2,
} from 'lucide-react';
import { formatINR } from '@/lib/auditEngine';

export function AuditDrawer() {
  const {
    selectedWorkOrder,
    closeAuditDrawer,
    openShowCauseModal,
    clearFlagWeatherException,
  } = useAuditContext();

  if (!selectedWorkOrder) return null;

  const wo = selectedWorkOrder;
  const t = wo.trail;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/30 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full sm:max-w-xl h-full bg-[#f7f5f0] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#ede8e1] bg-white flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded-full bg-[#f0eae1] text-[#44403c]">
                {wo.id}
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#faebe8] text-[#b93822] font-semibold border border-[#f4c6bd]">
                {wo.flagType.replace(/_/g, ' ')}
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-bold text-[#1c1917]">
              {wo.roadName}
            </h2>
            <p className="text-xs text-[#78716c]">
              Ward {wo.wardCode} • {wo.contractorName}
            </p>
          </div>
          <button
            onClick={closeAuditDrawer}
            className="w-8 h-8 rounded-full bg-[#f0eae1] flex items-center justify-center text-[#78716c] hover:bg-[#e7dfd3] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {/* Evidence Brief Card */}
          <div className="cafe-card p-4 space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#1c1917]">
              <AlertOctagon className="w-4 h-4 text-[#b93822]" />
              <span className="uppercase tracking-wider text-[11px]">
                Evidence-Backed Audit Brief
              </span>
            </div>
            <p className="text-xs text-[#44403c] leading-relaxed">
              {wo.auditBrief}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-[#ede8e1] text-xs">
              <div>
                <span className="text-[9px] text-[#a8a29e] uppercase block font-mono">
                  Billed Total
                </span>
                <span className="font-mono font-bold text-[#1c1917]">
                  {formatINR(wo.billedAmount)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-[#a8a29e] uppercase block font-mono">
                  Overbilled
                </span>
                <span className="font-mono font-bold text-[#b93822]">
                  {formatINR(wo.suspectedLeakageAmount)}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-[#a8a29e] uppercase block font-mono">
                  Actual Unit
                </span>
                <span className="font-mono font-bold text-[#1c1917]">
                  ₹{wo.actualUnitCost}
                </span>
              </div>
              <div>
                <span className="text-[9px] text-[#a8a29e] uppercase block font-mono">
                  DSR Median
                </span>
                <span className="font-mono font-bold text-[#78716c]">
                  ₹{wo.wardMedianUnitCost}
                </span>
              </div>
            </div>
          </div>

          {/* 4-Step Vertical Lineage */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716c] px-1 font-mono">
              Audit Lineage Trail
            </h3>

            {/* Step 1 */}
            <div className="cafe-card p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1c1917] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#78716c]" />
                  <span>1. Citizen Complaint Ingest</span>
                </span>
                <span className="text-[10px] font-mono text-[#a8a29e]">
                  {t.step1_complaint.timestamp}
                </span>
              </div>
              <div className="rounded-xl bg-[#f7f5f0] p-2.5 border border-[#ede8e1]">
                <span className="text-[9px] font-mono text-[#a8a29e] uppercase block">
                  Original Voice ({t.step1_complaint.language})
                </span>
                <p className="text-xs text-[#1c1917] italic font-mono mt-0.5">
                  &ldquo;{t.step1_complaint.originalText}&rdquo;
                </p>
              </div>
              <p className="text-xs text-[#78716c]">
                {t.step1_complaint.englishTranslation}
              </p>
            </div>

            {/* Step 2 */}
            <div className="cafe-card p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1c1917] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#78716c]" />
                  <span>2. Deduplicated Incident</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#fbf4e6] text-[#9a6700] font-bold">
                  {t.step2_dedupIssue.clusterSize} Reports Clustered
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs text-[#78716c]">
                <div>
                  <span className="text-[9px] uppercase font-mono block">Coordinates</span>
                  <span className="text-[#1c1917] font-mono">{t.step2_dedupIssue.geoCoordinates}</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-mono block">Depth</span>
                  <span className="text-[#b93822] font-bold font-mono">{t.step2_dedupIssue.potholeDepthCm} cm</span>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="cafe-card p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1c1917] flex items-center gap-1.5">
                  <FileCheck className="w-3.5 h-3.5 text-[#78716c]" />
                  <span>3. Work Order Payout</span>
                </span>
                <span className="font-mono text-[10px] text-[#78716c]">
                  Awarded: {t.step3_workOrder.awardedDate}
                </span>
              </div>
              <div className="text-xs">
                <span className="text-[9px] text-[#a8a29e] uppercase font-mono block">Contractor</span>
                <span className="font-bold text-[#1c1917]">{t.step3_workOrder.contractor}</span>
                <p className="text-[11px] text-[#78716c] mt-0.5">{t.step3_workOrder.workScope}</p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="cafe-card p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-[#1c1917] flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-[#b93822]" />
                  <span>4. Post-Repair Durability</span>
                </span>
                <span className="font-mono text-[10px] text-[#2c5282] bg-[#edf2f7] px-2 py-0.5 rounded-full">
                  {t.step4_outcome.rainfallDuringWindowMm} mm Rainfall
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-mono text-[#a8a29e] block">Breakdown Speed</span>
                  <span className="font-bold text-[#9a6700] font-mono">{t.step4_outcome.daysToFailure} days</span>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-mono text-[#a8a29e] block">Repeat Reports</span>
                  <span className="font-bold text-[#b93822] font-mono">{t.step4_outcome.repeatComplaintsCount30d} reports</span>
                </div>
              </div>
            </div>
          </div>

          {/* Weather Relief Banner if applied */}
          {wo.weatherExemptionReason && (
            <div className="cafe-card p-4 bg-[#edf4ee] border-[#cbe3cf]">
              <div className="flex items-center gap-1.5 text-[#2d6a3f] text-xs font-bold mb-1">
                <CheckCircle2 className="w-4 h-4" />
                <span>Weather Relief Applied (Clause 46)</span>
              </div>
              <p className="text-xs text-[#2d6a3f]">
                {wo.weatherExemptionReason}
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#ede8e1] bg-white flex items-center justify-between gap-3">
          <button
            onClick={() => clearFlagWeatherException(wo.id)}
            disabled={wo.flagStatus === 'WEATHER_EXEMPTION'}
            className="cafe-pill flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold disabled:opacity-40"
          >
            <CloudRain className="w-3.5 h-3.5 text-[#2c5282]" />
            <span>
              {wo.flagStatus === 'WEATHER_EXEMPTION'
                ? 'Weather Relief Applied'
                : 'Grant Weather Relief'}
            </span>
          </button>

          <button
            onClick={() => openShowCauseModal(wo)}
            className="cafe-btn-dark flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Draft Show-Cause Notice</span>
          </button>
        </div>
      </div>
    </div>
  );
}

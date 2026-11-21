'use client';

import React, { useState, useMemo } from 'react';
import { useAuditContext } from '@/context/AuditContext';
import { calculateAuditKPIs, formatINR } from '@/lib/auditEngine';
import { AuditFlagType, WardCode } from '@/lib/types';
import {
  ChevronDown,
  Layers,
  Clock,
  MapPin,
  Search,
} from 'lucide-react';

const WARDS_LIST: { code: WardCode; label: string }[] = [
  { code: 'ALL', label: 'All Wards (Greater Mumbai)' },
  { code: 'K/W', label: 'Ward K/W — Andheri West' },
  { code: 'H/E', label: 'Ward H/E — Santacruz E / Bandra E' },
  { code: 'G/N', label: 'Ward G/N — Dadar / Dharavi' },
  { code: 'L', label: 'Ward L — Kurla / Sakinaka' },
  { code: 'M/E', label: 'Ward M/E — Chembur / Mankhurd' },
];

export function AuditCommandCenter() {
  const { workOrders, selectedWard, setSelectedWard, openAuditDrawer } = useAuditContext();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFlagFilter, setSelectedFlagFilter] = useState<'ALL' | AuditFlagType>('ALL');

  // Compute live KPIs
  const kpis = useMemo(() => {
    return calculateAuditKPIs(workOrders, selectedWard);
  }, [workOrders, selectedWard]);

  // Filtered work orders
  const filteredWorkOrders = useMemo(() => {
    return workOrders.filter((wo) => {
      const matchesWard = selectedWard === 'ALL' || wo.wardCode === selectedWard;
      const matchesFlag = selectedFlagFilter === 'ALL' || wo.flagType === selectedFlagFilter;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        wo.id.toLowerCase().includes(q) ||
        wo.roadName.toLowerCase().includes(q) ||
        wo.contractorName.toLowerCase().includes(q) ||
        wo.wardCode.toLowerCase().includes(q);

      return matchesWard && matchesFlag && matchesSearch;
    });
  }, [workOrders, selectedWard, selectedFlagFilter, searchQuery]);

  return (
    <div className="space-y-4 max-w-2xl mx-auto px-4 sm:px-6 pb-24">
      {/* CARD 1: Hero Card (matches "Daily Decoction" in Screenshot 1) */}
      <div className="cafe-card p-5 sm:p-6 flex items-center justify-between gap-4">
        <div className="space-y-3 max-w-xs">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#1c1917] tracking-tight">
              Monsoon Audit Cycle
            </h2>
            <p className="text-xs text-[#78716c] mt-0.5">
              Audited {formatINR(kpis.totalSpend)} across {kpis.totalWorkOrdersCount} road contracts.
            </p>
          </div>
          <button
            onClick={() => {
              if (filteredWorkOrders[0]) openAuditDrawer(filteredWorkOrders[0]);
            }}
            className="cafe-btn-dark inline-flex items-center gap-2"
          >
            <span>Inspect Priority Anomaly</span>
          </button>
        </div>

        {/* Right Thumbnail matching the cafe image tile */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-[#efebe4] border border-[#ede8e1] shrink-0 overflow-hidden flex flex-col items-center justify-center p-2 text-center relative shadow-xs">
          <div className="w-full h-full rounded-xl bg-gradient-to-br from-[#e8e2d8] to-[#dfd7cc] flex flex-col items-center justify-center p-2 text-[#78716c]">
            <Layers className="w-6 h-6 text-[#44403c] mb-1" />
            <span className="text-[10px] font-mono font-bold text-[#1c1917]">
              {selectedWard === 'ALL' ? 'MUMBAI' : `WARD ${selectedWard}`}
            </span>
            <span className="text-[8px] font-mono text-[#78716c]">DLP AUDIT</span>
          </div>
        </div>
      </div>

      {/* CARD 2: Active Corridor Bar (matches "Active Kadha Powder" in Screenshot 1) */}
      <div className="cafe-card p-3.5 sm:p-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-[#f0eae1] border border-[#ede8e1] flex items-center justify-center text-[#44403c] shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#a8a29e] block">
              Active Municipal Ward
            </span>
            <div className="relative">
              <select
                aria-label="Select Ward"
                value={selectedWard}
                onChange={(e) => setSelectedWard(e.target.value as WardCode)}
                className="font-bold text-xs sm:text-sm text-[#1c1917] bg-transparent focus:outline-none cursor-pointer pr-5 font-sans"
              >
                {WARDS_LIST.map((w) => (
                  <option key={w.code} value={w.code}>
                    {w.label}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-[10px] text-[#78716c] block">
              Western &amp; Eastern Suburban Corridors
            </span>
          </div>
        </div>
        <ChevronDown className="w-4 h-4 text-[#78716c]" />
      </div>

      {/* CARD 3: Audit Lifecycle & Status (matches "Extraction Cycle Reducing 4:1" in Screenshot 1) */}
      <div className="cafe-card p-5 space-y-4">
        {/* Top Header Row with Time pill */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[9px] font-mono uppercase tracking-wider text-[#a8a29e] block">
              Vigilance Leakage Monitor
            </span>
            <h3 className="text-base sm:text-lg font-bold text-[#1c1917] tracking-tight">
              Suspected: {formatINR(kpis.suspectedLeakage)}
            </h3>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#fbf4e6] border border-[#f4e2b8] text-[#9a6700] text-xs font-mono font-medium">
            <Clock className="w-3.5 h-3.5" />
            <span>{kpis.activeFlagsCount} Active Flags</span>
          </div>
        </div>

        {/* 4-Step Progress Line like the extraction cycle stages */}
        <div className="space-y-1.5 pt-1">
          <div className="w-full bg-[#ede8e1] h-1 rounded-full overflow-hidden flex">
            <div className="bg-[#1c1917] h-full w-1/4 rounded-full" />
            <div className="bg-[#1c1917] h-full w-1/4" />
            <div className="bg-[#1c1917] h-full w-1/4" />
            <div className="bg-[#a8a29e] h-full w-1/4" />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-[#a8a29e] pt-0.5">
            <span className="text-[#1c1917] font-semibold">Reported</span>
            <span className="text-[#1c1917] font-semibold">GIS Deduplicated</span>
            <span className="text-[#1c1917] font-semibold">Billed</span>
            <span>Outcome</span>
          </div>
        </div>

        {/* Dual Big Stats */}
        <div className="grid grid-cols-2 gap-4 pt-3 border-t border-[#ede8e1]/70">
          <div>
            <span className="text-[9px] font-mono uppercase text-[#a8a29e] block">
              Recoverable DLP (₹0 Cost)
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#2d6a3f]">
              {formatINR(kpis.recoverableDlp)}
            </div>
            <span className="text-[10px] text-[#78716c] block">
              Legally mandated warranty fix
            </span>
          </div>

          <div>
            <span className="text-[9px] font-mono uppercase text-[#a8a29e] block">
              Durability Benchmark
            </span>
            <div className="text-xl sm:text-2xl font-bold font-mono text-[#1c1917]">
              92.4%
            </div>
            <span className="text-[10px] text-[#78716c] block">
              Target: 36-month threshold
            </span>
          </div>
        </div>

        {/* Minimal Failure Curve Graph */}
        <div className="pt-2">
          <div className="h-10 w-full flex items-end">
            <svg
              className="w-full h-full text-[#78716c]"
              viewBox="0 0 100 20"
              preserveAspectRatio="none"
            >
              <path
                d="M 0 15 Q 25 12, 50 10 T 100 4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeDasharray="2 2"
              />
              <path
                d="M 0 16 Q 30 14, 60 11 T 100 6"
                fill="none"
                stroke="#1c1917"
                strokeWidth="2"
              />
            </svg>
          </div>
          <div className="flex justify-between text-[9px] font-mono text-[#a8a29e] pt-1">
            <span>Day 1 (Rainfall)</span>
            <span>Day 15</span>
            <span>Day 30 (Failure Audit)</span>
          </div>
        </div>
      </div>

      {/* FILTER & SEARCH STRIP */}
      <div className="pt-2 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-[#1c1917]">
            Flagged Work Orders
          </h3>
          <span className="text-xs font-mono text-[#78716c]">
            {filteredWorkOrders.length} Anomaly Reports
          </span>
        </div>

        {/* Search input styled cleanly */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-[#a8a29e] absolute left-3 top-3 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search road name, contractor, work order ID..."
            className="w-full bg-white border border-[#ede8e1] rounded-full pl-9 pr-4 py-2 text-xs text-[#1c1917] placeholder-[#a8a29e] focus:outline-none focus:border-[#78716c] font-sans shadow-xs"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 -mx-4 px-4 sm:mx-0 sm:px-0">
          <button
            onClick={() => setSelectedFlagFilter('ALL')}
            className={`cafe-pill whitespace-nowrap ${
              selectedFlagFilter === 'ALL'
                ? 'bg-[#1c1917] text-[#f7f5f0]'
                : 'bg-white hover:bg-[#ede6dc]'
            }`}
          >
            All Anomalies
          </button>
          <button
            onClick={() => setSelectedFlagFilter('INFLATED_UNIT_COST')}
            className={`cafe-pill whitespace-nowrap ${
              selectedFlagFilter === 'INFLATED_UNIT_COST'
                ? 'bg-[#1c1917] text-[#f7f5f0]'
                : 'bg-white hover:bg-[#ede6dc]'
            }`}
          >
            Inflated Cost
          </button>
          <button
            onClick={() => setSelectedFlagFilter('DUPLICATE_BILLING')}
            className={`cafe-pill whitespace-nowrap ${
              selectedFlagFilter === 'DUPLICATE_BILLING'
                ? 'bg-[#1c1917] text-[#f7f5f0]'
                : 'bg-white hover:bg-[#ede6dc]'
            }`}
          >
            Duplicate Billing
          </button>
          <button
            onClick={() => setSelectedFlagFilter('DLP_VIOLATION')}
            className={`cafe-pill whitespace-nowrap ${
              selectedFlagFilter === 'DLP_VIOLATION'
                ? 'bg-[#1c1917] text-[#f7f5f0]'
                : 'bg-white hover:bg-[#ede6dc]'
            }`}
          >
            DLP Breach
          </button>
          <button
            onClick={() => setSelectedFlagFilter('FAILED_FIX')}
            className={`cafe-pill whitespace-nowrap ${
              selectedFlagFilter === 'FAILED_FIX'
                ? 'bg-[#1c1917] text-[#f7f5f0]'
                : 'bg-white hover:bg-[#ede6dc]'
            }`}
          >
            Failed Fix
          </button>
        </div>
      </div>

      {/* FEED OF WORK ORDERS (Matches Screenshot 2 "Select Kadha Blend" Card List) */}
      <div className="space-y-3 pt-1">
        {filteredWorkOrders.map((wo) => {
          const badgeStyles = {
            INFLATED_UNIT_COST: 'bg-[#faebe8] text-[#b93822] border-[#f4c6bd]',
            DUPLICATE_BILLING: 'bg-[#faebe8] text-[#b93822] border-[#f4c6bd]',
            DLP_VIOLATION: 'bg-[#fbf4e6] text-[#9a6700] border-[#f4e2b8]',
            FAILED_FIX: 'bg-[#fff0e6] text-[#c25e00] border-[#fed7aa]',
          }[wo.flagType];

          return (
            <div
              key={wo.id}
              onClick={() => openAuditDrawer(wo)}
              className="cafe-card p-4 flex items-center justify-between gap-3 sm:gap-4 hover:border-[#d6cebf] transition-all cursor-pointer group"
            >
              {/* Left Photo Thumbnail */}
              <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-[#f0eae1] border border-[#ede8e1] shrink-0 overflow-hidden flex flex-col items-center justify-center p-1.5 text-center shadow-xs">
                <span className="text-[9px] font-mono font-bold text-[#44403c]">
                  {wo.wardCode}
                </span>
                <span className="text-[10px] font-bold text-[#1c1917] leading-tight">
                  {wo.riskScore}
                </span>
                <span className="text-[7px] font-mono text-[#a8a29e] uppercase">
                  RISK SCORE
                </span>
              </div>

              {/* Middle Information */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono text-[10px] font-semibold text-[#78716c]">
                    {wo.id}
                  </span>
                  <span
                    className={`text-[9px] font-mono px-2 py-0.2 rounded-full border ${badgeStyles}`}
                  >
                    {wo.flagType.replace(/_/g, ' ')}
                  </span>
                </div>
                <h4 className="text-xs sm:text-sm font-bold text-[#1c1917] truncate leading-snug">
                  {wo.roadName}
                </h4>
                <p className="text-[11px] text-[#78716c] truncate">
                  {wo.contractorName}
                </p>
                <div className="flex items-center gap-2 mt-1 text-[11px] font-mono">
                  <span className="font-bold text-[#1c1917]">
                    {formatINR(wo.billedAmount)}
                  </span>
                  <span className="text-[#b93822] text-[10px]">
                    Over: {formatINR(wo.suspectedLeakageAmount)}
                  </span>
                </div>
              </div>

              {/* Right Action Button (Matches "Select Blend" in Screenshot 2) */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  openAuditDrawer(wo);
                }}
                className="cafe-pill shrink-0 hover:bg-[#e7dfd3] shadow-xs text-xs font-semibold"
              >
                Audit Trail
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

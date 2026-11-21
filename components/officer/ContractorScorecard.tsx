'use client';

import React, { useState, useMemo } from 'react';
import { useAuditContext } from '@/context/AuditContext';
import { formatINR } from '@/lib/auditEngine';
import { ContractorScorecard as ContractorType } from '@/lib/types';
import {
  CloudRain,
  Scale,
  Award,
  AlertCircle,
  Info,
} from 'lucide-react';

export function ContractorScorecard() {
  const { contractors, selectedWard } = useAuditContext();

  const [sortField, setSortField] = useState<'fairScore' | 'rawScore' | 'totalSpend' | 'durabilityRate30d'>('fairScore');
  const [showFormula, setShowFormula] = useState(false);

  const filteredContractors = useMemo(() => {
    return contractors
      .filter((c) => {
        if (selectedWard === 'ALL') return true;
        return c.recentWards.includes(selectedWard);
      })
      .sort((a, b) => b[sortField] - a[sortField]);
  }, [contractors, selectedWard, sortField]);

  const getStatusBadge = (status: ContractorType['clearedStatusBadge']) => {
    switch (status) {
      case 'CLEARED_WEATHER':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-[#edf2f7] text-[#2c5282] font-semibold border border-[#cbd5e1]">
            <CloudRain className="w-3 h-3 text-[#2c5282]" />
            <span>Weather Relief Applied</span>
          </span>
        );
      case 'EXEMPLARY':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-[#edf4ee] text-[#2d6a3f] font-semibold border border-[#cbe3cf]">
            <Award className="w-3 h-3 text-[#2d6a3f]" />
            <span>Benchmark Quality</span>
          </span>
        );
      case 'FLAGGED':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-[#faebe8] text-[#b93822] font-semibold border border-[#f4c6bd]">
            <AlertCircle className="w-3 h-3 text-[#b93822]" />
            <span>Integrity Violations</span>
          </span>
        );
      case 'UNDER_REVIEW':
        return (
          <span className="inline-flex items-center gap-1 font-mono text-[10px] px-2.5 py-0.5 rounded-full bg-[#fbf4e6] text-[#9a6700] font-semibold border border-[#f4e2b8]">
            <span>DLP / Rate Review</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto px-4 sm:px-6 pb-24">
      {/* Intro Philosophy Card */}
      <div className="cafe-card p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#f0eae1] border border-[#ede8e1] flex items-center justify-center text-[#44403c] shrink-0 mt-0.5">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#1c1917] tracking-tight">
                Fair Contractor Accountability
              </h2>
              <p className="text-xs text-[#78716c] mt-0.5 leading-relaxed">
                Raw failure rates penalize contractors repairing flood-prone lowlands during 200mm+ cloudbursts. We normalize for extreme rainfall while maintaining zero tolerance for price inflation.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowFormula(!showFormula)}
            className="cafe-pill text-xs shrink-0"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>

        {showFormula && (
          <div className="rounded-xl bg-[#f7f5f0] p-3 text-xs text-[#44403c] space-y-1.5 border border-[#ede8e1] animate-in fade-in">
            <div className="font-mono font-bold text-[#1c1917]">
              FairScore = RawScore + min(25, ReworkPenalty × WeatherSeverityFactor)
            </div>
            <p className="text-[11px] text-[#78716c]">
              Where WeatherSeverityFactor discounts reworks occurring in high-tide river backflow zones under BMC GCC Clause 46.
            </p>
          </div>
        )}
      </div>

      {/* Sorting Control */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-[10px] text-[#78716c] uppercase font-mono mr-1">Sort by:</span>
        <button
          type="button"
          onClick={() => setSortField('fairScore')}
          className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-colors ${
            sortField === 'fairScore'
              ? 'bg-[#1c1917] text-[#f7f5f0]'
              : 'bg-white border border-[#ede8e1] text-[#78716c] hover:text-[#1c1917]'
          }`}
        >
          Fair Score
        </button>
        <button
          type="button"
          onClick={() => setSortField('rawScore')}
          className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-colors ${
            sortField === 'rawScore'
              ? 'bg-[#1c1917] text-[#f7f5f0]'
              : 'bg-white border border-[#ede8e1] text-[#78716c] hover:text-[#1c1917]'
          }`}
        >
          Raw Score
        </button>
        <button
          type="button"
          onClick={() => setSortField('durabilityRate30d')}
          className={`px-3 py-1 rounded-full text-[10px] font-semibold transition-colors ${
            sortField === 'durabilityRate30d'
              ? 'bg-[#1c1917] text-[#f7f5f0]'
              : 'bg-white border border-[#ede8e1] text-[#78716c] hover:text-[#1c1917]'
          }`}
        >
          30d Durability
        </button>
      </div>

      {/* Contractor Feed Cards */}
      <div className="space-y-3 pt-1">
        {filteredContractors.map((c) => (
          <div key={c.id} className="cafe-card p-4 space-y-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className="font-mono text-[10px] text-[#a8a29e]">
                    {c.tier}
                  </span>
                  {c.weatherReliefPoints > 0 && (
                    <span className="text-[9px] font-mono px-2 py-0.2 rounded-full bg-[#edf2f7] text-[#2c5282] font-semibold">
                      +{c.weatherReliefPoints} pts relief
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-[#1c1917] leading-snug">
                  {c.name}
                </h4>
                <span className="text-[11px] text-[#78716c]">
                  Total Spend: <strong className="font-mono text-[#1c1917]">{formatINR(c.totalSpend)}</strong> • {c.completedWorkOrders} work orders
                </span>
              </div>

              <div className="text-right shrink-0">
                <span className="text-lg font-bold font-mono text-[#1c1917] block">
                  {c.fairScore}/100
                </span>
                <span className="text-[10px] text-[#a8a29e] line-through font-mono">
                  Raw: {c.rawScore}
                </span>
              </div>
            </div>

            {/* Score Comparison Bar */}
            <div className="space-y-1">
              <div className="w-full h-2 bg-[#ede8e1] rounded-full overflow-hidden relative">
                <div
                  className="bg-[#a8a29e] h-full absolute left-0 top-0"
                  style={{ width: `${c.rawScore}%` }}
                />
                <div
                  className="bg-[#1c1917] h-full absolute top-0"
                  style={{
                    left: `${c.rawScore}%`,
                    width: `${Math.max(0, c.fairScore - c.rawScore)}%`,
                  }}
                />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[#a8a29e]">
                <span>30d Durability: {c.durabilityRate30d}%</span>
                <span>Avg Turnaround: {c.avgTurnaroundDays}d</span>
              </div>
            </div>

            <div className="pt-2 border-t border-[#ede8e1] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>{getStatusBadge(c.clearedStatusBadge)}</div>
              <p className="text-[11px] text-[#78716c] font-sans leading-tight">
                {c.contextNote}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

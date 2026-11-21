'use client';

import React, { useState, useMemo } from 'react';
import { useAuditContext } from '@/context/AuditContext';
import { computeNextRupeePlan, formatINR, WeightCoefficients } from '@/lib/auditEngine';
import {
  ShieldCheck,
} from 'lucide-react';

export function NextRupeePlanner() {
  const { candidateRoads, selectedWard } = useAuditContext();

  const [budget, setBudget] = useState<number>(35000000); // ₹3.5 Cr

  const [weights, setWeights] = useState<WeightCoefficients>({
    complaintDensity: 35,
    floodRisk: 25,
    trafficCriticality: 20,
    repeatFailures: 20,
  });

  const planResult = useMemo(() => {
    return computeNextRupeePlan(candidateRoads, budget, weights, selectedWard);
  }, [candidateRoads, budget, weights, selectedWard]);

  const handleWeightChange = (key: keyof WeightCoefficients, val: number) => {
    setWeights((prev) => ({
      ...prev,
      [key]: val,
    }));
  };

  return (
    <div className="space-y-4 max-w-2xl mx-auto px-4 sm:px-6 pb-24">
      {/* Simulation Controls Card */}
      <div className="cafe-card p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-[#ede8e1] pb-3">
          <div>
            <h2 className="text-base font-bold text-[#1c1917] tracking-tight">
              Next-Rupee Capital Planner
            </h2>
            <p className="text-xs text-[#78716c] mt-0.5">
              Separates zero-rupee warranty enforcement from fresh capital outlay.
            </p>
          </div>
          <div className="text-right">
            <span className="text-[9px] font-mono uppercase text-[#a8a29e] block">
              Budget
            </span>
            <span className="text-base font-bold font-mono text-[#1c1917]">
              {formatINR(budget)}
            </span>
          </div>
        </div>

        {/* Budget Slider */}
        <div className="space-y-1.5">
          <input
            type="range"
            min={5000000}
            max={100000000}
            step={2500000}
            value={budget}
            onChange={(e) => setBudget(Number(e.target.value))}
            className="w-full h-2 bg-[#ede8e1] rounded-lg appearance-none cursor-pointer accent-[#1c1917]"
          />
          <div className="flex justify-between text-[10px] font-mono text-[#a8a29e]">
            <span>₹50 Lakhs</span>
            <span>₹5.0 Cr</span>
            <span>₹10 Crores</span>
          </div>
        </div>

        {/* 4 Weights */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="rounded-xl bg-[#f7f5f0] p-2.5 border border-[#ede8e1]">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-[#78716c]">Complaints</span>
              <span className="font-bold text-[#1c1917]">{weights.complaintDensity}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={weights.complaintDensity}
              onChange={(e) => handleWeightChange('complaintDensity', Number(e.target.value))}
              className="w-full h-1 bg-[#ede8e1] rounded appearance-none cursor-pointer accent-[#1c1917]"
            />
          </div>

          <div className="rounded-xl bg-[#f7f5f0] p-2.5 border border-[#ede8e1]">
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-[#78716c]">Flood Risk</span>
              <span className="font-bold text-[#1c1917]">{weights.floodRisk}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={weights.floodRisk}
              onChange={(e) => handleWeightChange('floodRisk', Number(e.target.value))}
              className="w-full h-1 bg-[#ede8e1] rounded appearance-none cursor-pointer accent-[#1c1917]"
            />
          </div>
        </div>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 gap-3">
        <div className="cafe-card p-4 space-y-1">
          <span className="text-[9px] font-mono uppercase text-[#a8a29e] block">
            Allocated Paid
          </span>
          <div className="text-lg font-bold font-mono text-[#1c1917]">
            {formatINR(planResult.totalPaidAllocated)}
          </div>
          <span className="text-[10px] text-[#78716c] block">
            {planResult.paidAllocated.filter((r) => r.allocated).length} roads funded
          </span>
        </div>

        <div className="cafe-card p-4 space-y-1 bg-[#edf4ee] border-[#cbe3cf]">
          <span className="text-[9px] font-mono uppercase text-[#2d6a3f] block font-semibold">
            DLP Savings (Free)
          </span>
          <div className="text-lg font-bold font-mono text-[#2d6a3f]">
            {formatINR(planResult.totalDlpSavings)}
          </div>
          <span className="text-[10px] text-[#2d6a3f] block">
            Zero cost to BMC
          </span>
        </div>
      </div>

      {/* Zero Cost Warranty Roads (DLP Enforced) */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#2d6a3f] flex items-center gap-1.5 font-mono">
            <ShieldCheck className="w-4 h-4 text-[#2d6a3f]" />
            <span>Enforce Warranty (₹0 Cost)</span>
          </h3>
          <span className="text-[10px] font-mono font-bold text-[#2d6a3f]">
            Save {formatINR(planResult.totalDlpSavings)}
          </span>
        </div>

        {planResult.dlpEnforced.map((road) => (
          <div key={road.id} className="cafe-card p-4 flex items-center justify-between gap-3 bg-[#fdfbf7]">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-[#edf4ee] text-[#2d6a3f] font-semibold border border-[#cbe3cf]">
                  Warranty active until {road.dlpExpiryDate}
                </span>
              </div>
              <h4 className="text-sm font-bold text-[#1c1917]">
                {road.roadName}
              </h4>
              <p className="text-[11px] text-[#78716c]">
                Contractor: <span className="font-semibold text-[#1c1917]">{road.dlpContractorName}</span>
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono text-xs font-bold text-[#2d6a3f] block">
                ₹0 Due
              </span>
              <span className="text-[10px] text-[#a8a29e] block font-mono">
                Saves {formatINR(road.estimatedCost)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Paid Capital Allocations */}
      <div className="space-y-3 pt-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#78716c] px-1 font-mono">
          Fund Next (Paid Capital Works)
        </h3>

        {planResult.paidAllocated.map((road) => (
          <div
            key={road.id}
            className={`cafe-card p-4 flex items-center justify-between gap-3 ${
              road.allocated ? '' : 'opacity-50'
            }`}
          >
            <div>
              <h4 className="text-sm font-bold text-[#1c1917]">
                {road.roadName}
              </h4>
              <p className="text-[11px] text-[#78716c]">
                Ward {road.wardCode} • {road.pavementType}
              </p>
            </div>
            <div className="text-right shrink-0">
              <span className="font-mono text-xs font-bold text-[#1c1917] block">
                {formatINR(road.estimatedCost)}
              </span>
              <span
                className={`text-[9px] font-mono px-2 py-0.2 rounded-full inline-block mt-0.5 ${
                  road.allocated
                    ? 'bg-[#edf4ee] text-[#2d6a3f] font-bold'
                    : 'bg-[#ede8e1] text-[#78716c]'
                }`}
              >
                {road.allocated ? 'FUNDED' : 'EXCEEDS BUDGET'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

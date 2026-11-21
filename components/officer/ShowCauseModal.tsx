'use client';

import React, { useState } from 'react';
import { useAuditContext } from '@/context/AuditContext';
import { X, Copy, Check, Download, AlertTriangle, FileText } from 'lucide-react';

export function ShowCauseModal() {
  const { showNoticeModal, activeNotice, closeShowCauseModal } = useAuditContext();
  const [copied, setCopied] = useState(false);

  if (!showNoticeModal || !activeNotice) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(activeNotice.draftedBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([activeNotice.draftedBody], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BMC-ShowCause-${activeNotice.workOrderId}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white border border-zinc-300 rounded-lg max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-4 sm:px-5 py-3.5 border-b border-zinc-200 flex items-center justify-between bg-zinc-50">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded bg-red-100 border border-red-200 flex items-center justify-center text-red-700">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-zinc-900 flex items-center gap-2">
                Municipal Show-Cause Notice
                <span className="font-mono text-[10px] sm:text-xs px-2 py-0.5 rounded bg-white text-zinc-800 border border-zinc-300">
                  {activeNotice.noticeNumber}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500">
                Official summons issued pursuant to BMC GCC Clause 38 / 46
              </p>
            </div>
          </div>
          <button
            onClick={closeShowCauseModal}
            className="text-zinc-500 hover:text-zinc-900 p-1.5 rounded hover:bg-zinc-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice Meta Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 px-4 sm:px-5 py-2.5 bg-zinc-50/60 border-b border-zinc-200 text-xs">
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-mono">Respondent</span>
            <span className="font-semibold text-zinc-900 truncate block">
              {activeNotice.contractorName}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-mono">Work Order</span>
            <span className="font-mono font-bold text-zinc-900">{activeNotice.workOrderId}</span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-mono">Overbill Amount</span>
            <span className="font-mono font-bold text-red-600">
              ₹{activeNotice.overbilledAmount.toLocaleString('en-IN')}
            </span>
          </div>
          <div>
            <span className="text-[10px] text-zinc-500 block uppercase font-mono">Reply Mandate</span>
            <span className="font-mono font-bold text-amber-800">{activeNotice.deadlineDays} Calendar Days</span>
          </div>
        </div>

        {/* Content Box */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 font-mono text-xs text-zinc-800 leading-relaxed bg-zinc-50/50 whitespace-pre-wrap select-all">
          {activeNotice.draftedBody}
        </div>

        {/* Footer Actions */}
        <div className="px-4 sm:px-5 py-3 border-t border-zinc-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 bg-white">
          <div className="flex items-center gap-1.5 text-xs text-zinc-500 text-center sm:text-left">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="text-[11px]">Logged in BMC Municipal Vigilance registry</span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 rounded border border-zinc-300 bg-white hover:bg-zinc-100 text-xs text-zinc-800 font-semibold transition-colors shadow-2xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Notice</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-1.5 rounded bg-zinc-900 hover:bg-black text-white text-xs font-bold transition-colors shadow-2xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export (.txt)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

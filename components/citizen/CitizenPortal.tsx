'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useAuditContext } from '@/context/AuditContext';
import { formatINR } from '@/lib/auditEngine';
import {
  REAL_ROADS,
  RoadRecord,
  getRoadsByWard,
} from '@/lib/roadDatabase';
import { TRANSLATIONS } from '@/lib/translations';
import {
  Search,
  Camera,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  ThumbsUp,
  Check,
  ChevronDown,
  ChevronUp,
  Wrench,
  X,
  ArrowRight,
  Clock,
  Award,
  CloudRain,
  Activity,
  Layers,
  PhoneCall,
  Flame,
} from 'lucide-react';

interface SubmittedGrievance {
  id: string;
  roadName: string;
  wardCode: string;
  notes: string;
  imageUrl?: string | null;
  submittedAt: string;
  stage: 1 | 2 | 3 | 4;
  stageLabel: string;
  progressPercent: number;
  slaRemaining: string;
}

export function CitizenPortal() {
  const {
    lang,
    activePage,
    setActivePage,
    selectedWard,
    citizenComplaints,
    submitCitizenFailedFixReport,
    boostMeTooComplaint,
    addNewCitizenComplaint,
  } = useAuditContext();

  const t = TRANSLATIONS[lang];

  // 1. Roads available for currently selected ward
  const wardRoads = useMemo(() => {
    return getRoadsByWard(selectedWard);
  }, [selectedWard]);

  // 2. Active selected road state
  const [selectedRoadId, setSelectedRoadId] = useState<string>(() => {
    return wardRoads[0]?.id || 'RD0143';
  });

  const [roadSearchQuery, setRoadSearchQuery] = useState('');

  const filteredRoads = useMemo(() => {
    const q = roadSearchQuery.toLowerCase().trim();
    if (!q) return wardRoads;
    return wardRoads.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.contractor_name.toLowerCase().includes(q) ||
        r.id.toLowerCase().includes(q)
    );
  }, [wardRoads, roadSearchQuery]);

  const activeRoad: RoadRecord | undefined = useMemo(() => {
    return (
      REAL_ROADS.find((r) => r.id === selectedRoadId) ||
      wardRoads[0] ||
      REAL_ROADS[0]
    );
  }, [selectedRoadId, wardRoads]);

  // Expandable Maintenance details inside receipt
  const [showWorkOrderDetails, setShowWorkOrderDetails] = useState(false);

  // Real Photo Upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImagePreview, setUploadedImagePreview] = useState<string | null>(null);
  const [uploadedImageName, setUploadedImageName] = useState<string>('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedImagePreview(url);
      setUploadedImageName(file.name);
    }
  };

  const handleRemovePhoto = () => {
    setUploadedImagePreview(null);
    setUploadedImageName('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Snap & Report form state
  const [snapRoadName, setSnapRoadName] = useState('');
  const [snapNotes, setSnapNotes] = useState('');
  const [snapSubmitted, setSnapSubmitted] = useState(false);

  // Citizen Submitted Claims List with Live Municipal Progress
  const [submittedClaims, setSubmittedClaims] = useState<SubmittedGrievance[]>([
    {
      id: 'BMC-GRV-8142',
      roadName: 'SV Road (Bandra West to Khar Junction)',
      wardCode: 'H/W',
      notes: '12cm deep trench near junction. Water accumulation during evening showers.',
      imageUrl: '/logo.png',
      submittedAt: 'Today, 1:45 PM',
      stage: 2,
      stageLabel: lang === 'mr' ? 'प्रभाग रस्ता निरीक्षक पडताळणी सुरू' : 'Ward Road Inspector Verification in Progress',
      progressPercent: 50,
      slaRemaining: '24h SLA remaining',
    },
  ]);

  // Warranty breach report modal state
  const [showWarrantyModal, setShowWarrantyModal] = useState(false);
  const [failureType, setFailureType] = useState('Surface peeled off after first rain');
  const [failureNotes, setFailureNotes] = useState('');
  const [reportedResult, setReportedResult] = useState<{ newWorkOrderId: string; roadName: string } | null>(null);

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleWarrantySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoad) return;
    const res = submitCitizenFailedFixReport(activeRoad.id, failureType, failureNotes);
    setReportedResult(res);
    setShowWarrantyModal(false);
    setFailureNotes('');
  };

  const handleSnapSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeRoad) return;

    const targetRoad = snapRoadName || activeRoad.name;
    const noteText = snapNotes || (uploadedImageName ? `Photo evidence attached: ${uploadedImageName}` : 'Pothole damage reported by citizen.');
    
    // Add to global context complaints
    addNewCitizenComplaint({
      roadName: targetRoad,
      wardCode: activeRoad.ward_code,
      issueType: 'Citizen Photo Report',
      description: noteText,
    });

    // Add to citizen's live tracking claims with real uploaded image
    const nowStr = new Intl.DateTimeFormat('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      day: 'numeric',
      month: 'short',
    }).format(new Date());

    const newClaim: SubmittedGrievance = {
      id: `BMC-GRV-${Math.floor(1000 + Math.random() * 9000)}`,
      roadName: targetRoad,
      wardCode: activeRoad.ward_code,
      notes: noteText,
      imageUrl: uploadedImagePreview || null,
      submittedAt: nowStr,
      stage: 2,
      stageLabel: lang === 'mr' ? 'प्रभाग अभियंता पडताळणी प्रगतीत आहे' : 'Ward Inspector Verification in Progress',
      progressPercent: 45,
      slaRemaining: '46h SLA remaining',
    };

    setSubmittedClaims((prev) => [newClaim, ...prev]);
    setSnapSubmitted(true);
    handleRemovePhoto();
    setSnapNotes('');
    setTimeout(() => setSnapSubmitted(false), 5000);

    // Scroll to the newly added claim card
    setTimeout(() => {
      const el = document.getElementById('my-claims-section');
      el?.scrollIntoView({ behavior: 'smooth' });
    }, 200);
  };

  return (
    <div className="max-w-xl mx-auto px-4 sm:px-6 py-5 space-y-6 pb-28">
      {/* Notice Confirmation Alert */}
      {reportedResult && (
        <div className="rounded-3xl bg-amber-50 border border-amber-300 p-4 animate-in fade-in shadow-xs">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                  {t.noticeLoggedTitle}
                </h4>
                <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                  {t.noticeLoggedDesc} (<strong>{reportedResult.roadName}</strong> &bull; {activeRoad?.contractor_name})
                </p>
              </div>
            </div>
            <button
              onClick={() => setReportedResult(null)}
              className="text-xs text-amber-900 hover:text-black font-semibold p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PAGE 1: WHO BUILT THIS ROAD (CONTRACTOR AUDIT)                 */}
      {/* ============================================================== */}
      {activePage === 'lookup' && (
        <div className="space-y-5 animate-in fade-in">
          {/* Headline */}
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {t.lookupTitle}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-normal mt-1 leading-relaxed">
              {t.lookupSubtitle}
            </p>
          </div>

          {/* Road Selection Box */}
          <div className="rounded-3xl bg-white border border-stone-200/90 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-stone-700">
              <span>{t.selectRoadLabel}</span>
              <span className="font-mono text-[10px] text-stone-500">
                {wardRoads.length} {t.roadsCountSuffix} {selectedWard === 'ALL' ? 'Mumbai' : selectedWard}
              </span>
            </div>

            <div className="relative">
              <select
                aria-label={t.selectRoadLabel}
                value={activeRoad?.id || ''}
                onChange={(e) => setSelectedRoadId(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3 text-xs sm:text-sm font-bold text-stone-900 focus:outline-none focus:border-emerald-600 cursor-pointer appearance-none pr-9"
              >
                {filteredRoads.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} (Seg {r.segment_no} &bull; {t.wardPrefix} {r.ward_code})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-stone-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={roadSearchQuery}
                onChange={(e) => setRoadSearchQuery(e.target.value)}
                placeholder={t.searchRoadPlaceholder}
                className="w-full bg-stone-50/70 border border-stone-200 rounded-2xl pl-9 pr-3.5 py-2 text-xs text-stone-800 placeholder-stone-400 focus:outline-none focus:border-emerald-600"
              />
            </div>
          </div>

          {/* Primary Contractor Receipt Card */}
          {activeRoad && (
            <div className="rounded-3xl bg-white border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-4">
              {/* Top Banner: Contractor & Warranty Status */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 border-b border-stone-100 pb-4">
                <div>
                  <span className="font-mono text-[10px] uppercase font-bold text-stone-400 tracking-wider block">
                    {t.assignedContractor}
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-emerald-950 leading-tight mt-0.5">
                    {activeRoad.contractor_name}
                  </h2>
                  <div className="flex items-center gap-2 mt-1 text-xs text-stone-500">
                    <span className="font-semibold text-stone-800">{activeRoad.name}</span>
                    <span>&bull;</span>
                    <span>{t.wardPrefix} {activeRoad.ward_code}</span>
                  </div>
                </div>

                <div className="shrink-0">
                  {activeRoad.under_dlp ? (
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs px-3.5 py-1.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-300 shadow-2xs">
                      <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{t.dlpActiveBadge}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs px-3.5 py-1.5 rounded-full bg-stone-100 text-stone-700 font-semibold border border-stone-200">
                      <span>{t.dlpRoutineBadge}</span>
                    </span>
                  )}
                </div>
              </div>

              {/* 3 Clean Stat Tiles */}
              <div className="grid grid-cols-3 gap-2.5 text-center">
                <div className="rounded-2xl bg-stone-50 p-3 border border-stone-200/60">
                  <span className="text-[10px] text-stone-400 block font-medium">{t.surface}</span>
                  <span className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5 block truncate">
                    {activeRoad.surface}
                  </span>
                </div>
                <div className="rounded-2xl bg-stone-50 p-3 border border-stone-200/60">
                  <span className="text-[10px] text-stone-400 block font-medium">{t.length}</span>
                  <span className="font-bold text-stone-900 text-xs sm:text-sm mt-0.5 block">
                    {activeRoad.length_m}m
                  </span>
                </div>
                <div className="rounded-2xl bg-stone-50 p-3 border border-stone-200/60">
                  <span className="text-[10px] text-stone-400 block font-medium">{t.spend}</span>
                  <span className="font-mono font-bold text-stone-900 text-xs sm:text-sm mt-0.5 block">
                    {formatINR(activeRoad.total_spent_inr || 85000)}
                  </span>
                </div>
              </div>

              {/* Expandable Maintenance Record */}
              {activeRoad.latest_work_order && (
                <div className="rounded-2xl bg-stone-50 border border-stone-200/80 overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowWorkOrderDetails(!showWorkOrderDetails)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left text-xs font-semibold text-stone-700 hover:bg-stone-100/60 transition-colors"
                  >
                    <span className="flex items-center gap-2">
                      <Wrench className="w-3.5 h-3.5 text-stone-500" />
                      <span>{t.latestWorkOrder} ({activeRoad.latest_work_order.work_order_id})</span>
                    </span>
                    {showWorkOrderDetails ? (
                      <ChevronUp className="w-4 h-4 text-stone-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-500" />
                    )}
                  </button>

                  {showWorkOrderDetails && (
                    <div className="p-4 pt-1 border-t border-stone-200/60 text-xs space-y-2 animate-in fade-in">
                      <div className="flex justify-between text-stone-700">
                        <span>{activeRoad.latest_work_order.work_type} ({activeRoad.latest_work_order.repair_method})</span>
                        <span className="font-mono font-bold text-stone-900">{formatINR(activeRoad.latest_work_order.cost_inr)}</span>
                      </div>
                      {activeRoad.latest_work_order.engineer_remark && (
                        <p className="text-[11px] text-stone-500 italic bg-white p-2.5 rounded-xl border border-stone-200/60">
                          {t.engineerNote}: &ldquo;{activeRoad.latest_work_order.engineer_remark}&rdquo;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setSnapRoadName(activeRoad.name);
                    setActivePage('snap');
                  }}
                  className="flex-1 py-3 px-4 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold border border-stone-300 transition-colors shadow-2xs text-center"
                >
                  {t.reportPotholeBtn}
                </button>
                <button
                  type="button"
                  onClick={() => setShowWarrantyModal(true)}
                  className="flex-1 py-3 px-4 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors shadow-xs text-center"
                >
                  {t.enforceDlpBtn}
                </button>
              </div>
            </div>
          )}

          {/* NEW SECTION 1A: DEFECT LIABILITY PERIOD (DLP) CLOCK */}
          <div className="rounded-3xl bg-white border border-stone-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                  {t.dlpClockTitle}
                </h3>
              </div>
              <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                {t.dlpRemainingDays}
              </span>
            </div>

            {/* Visual Clock Bar */}
            <div className="space-y-1">
              <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                <div className="bg-emerald-600 h-2.5 rounded-full w-[62%]" />
              </div>
              <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                <span>Month 0 (Handover)</span>
                <span>Month 22 (Current)</span>
                <span>Month 36 (Expiry)</span>
              </div>
            </div>

            <p className="text-[11px] text-stone-600 bg-stone-50 p-3 rounded-2xl border border-stone-200/60 leading-relaxed">
              {t.dlpClockDetail}
            </p>
          </div>

          {/* NEW SECTION 1B: CONTRACTOR WARD TRACK RECORD */}
          <div className="rounded-3xl bg-white border border-stone-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                {t.contractorPerformance}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-stone-50 p-3.5 border border-stone-200/60 space-y-0.5">
                <span className="text-[10px] text-stone-400 block font-medium">
                  {t.durabilityScore}
                </span>
                <span className="text-lg font-black text-emerald-950 font-mono block">
                  94.2%
                </span>
                <span className="text-[10px] text-stone-500 block">
                  30-Day Zero Rework Rate
                </span>
              </div>

              <div className="rounded-2xl bg-stone-50 p-3.5 border border-stone-200/60 space-y-0.5">
                <span className="text-[10px] text-stone-400 block font-medium">
                  {t.repeatComplaints}
                </span>
                <span className="text-lg font-black text-emerald-800 font-mono block">
                  {t.lowRisk}
                </span>
                <span className="text-[10px] text-stone-500 block">
                  1 breach in 12 months
                </span>
              </div>
            </div>
          </div>

          {/* NEW SECTION 1C: MONSOON FLOOD RESILIENCE INDEX */}
          <div className="rounded-3xl bg-white border border-stone-200/90 p-5 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CloudRain className="w-4 h-4 text-emerald-700" />
                <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                  {t.floodResilience}
                </h3>
              </div>
              <span className="font-mono text-[10px] text-stone-500">
                {t.rainfallContext}
              </span>
            </div>

            <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/60 flex items-center justify-between text-xs">
              <div className="space-y-0.5">
                <span className="font-semibold text-stone-800 block">
                  Sub-surface Drainage Status
                </span>
                <span className="text-[11px] text-stone-500 block">
                  Stormwater drain adjacent &bull; Gravity runoff clear
                </span>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[10px]">
                Low Flood Risk
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PAGE 2: SNAP & REPORT POTHOLE (DEDICATED FULL SCREEN)          */}
      {/* ============================================================== */}
      {activePage === 'snap' && (
        <div className="space-y-5 animate-in fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {t.snapTitle}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-normal mt-1 leading-relaxed">
              {t.snapSubtitle}
            </p>
          </div>

          <form onSubmit={handleSnapSubmit} className="rounded-3xl bg-white border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-4">
            {snapSubmitted && (
              <div className="rounded-2xl bg-emerald-50 border border-emerald-300 p-3 text-xs text-emerald-800 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{t.ticketRegistered}</span>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 block">
                {t.roadLocationLabel}:
              </label>
              <input
                type="text"
                value={snapRoadName || activeRoad?.name || ''}
                onChange={(e) => setSnapRoadName(e.target.value)}
                placeholder={t.roadLocationPlaceholder}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-2.5 text-xs text-stone-900 focus:outline-none focus:border-emerald-600"
                required
              />
            </div>

            {/* REAL PHOTO UPLOAD DROPZONE */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 block">
                {t.photoLabel}:
              </label>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                className="hidden"
                id="real-photo-input"
              />

              {uploadedImagePreview ? (
                <div className="rounded-2xl border border-stone-200 overflow-hidden bg-stone-50 p-3 space-y-2">
                  <div className="relative w-full h-48 rounded-xl overflow-hidden bg-stone-200">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={uploadedImagePreview}
                      alt="Uploaded Pothole"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="absolute top-2 right-2 w-7 h-7 rounded-full bg-stone-900/80 hover:bg-stone-900 text-white flex items-center justify-center transition-colors shadow-xs"
                      title="Remove"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-stone-600 px-1">
                    <span className="flex items-center gap-1 font-medium text-emerald-700">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>{uploadedImageName}</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-emerald-700 font-bold hover:underline"
                    >
                      {t.changePhoto}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-2xl border-2 border-dashed border-stone-300 hover:border-emerald-600 bg-stone-50/70 hover:bg-stone-50 p-6 text-center cursor-pointer transition-colors space-y-2"
                >
                  <div className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto">
                    <Camera className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">
                      {t.photoUploadPrompt}
                    </span>
                    <span className="text-[11px] text-stone-400 block mt-0.5">
                      {t.photoUploadSub}
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-700 block">
                {t.notesLabel}:
              </label>
              <textarea
                value={snapNotes}
                onChange={(e) => setSnapNotes(e.target.value)}
                rows={3}
                placeholder={t.notesPlaceholder}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-3 text-xs text-stone-900 focus:outline-none focus:border-emerald-600"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 px-4 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors shadow-xs"
            >
              {t.submitGrievanceBtn}
            </button>
          </form>

          {/* SUBMITTED CLAIMS SECTION WITH IMAGE & PROGRESS BAR */}
          <div id="my-claims-section" className="space-y-3.5">
            <div className="flex items-center justify-between px-1">
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                  {t.myGrievancesTitle}
                </h3>
                <p className="text-xs text-stone-500">
                  {t.myGrievancesSub}
                </p>
              </div>
              <span className="font-mono text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                {submittedClaims.length} Active
              </span>
            </div>

            <div className="space-y-3">
              {submittedClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="rounded-3xl bg-white border border-stone-200/90 p-5 shadow-xs space-y-4 animate-in fade-in"
                >
                  {/* Top claim metadata */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-emerald-800 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200">
                          {claim.id}
                        </span>
                        <span className="font-mono text-[10px] text-stone-400">
                          {claim.submittedAt}
                        </span>
                      </div>
                      <h4 className="text-sm font-bold text-stone-900 mt-1">
                        {claim.roadName} ({t.wardPrefix} {claim.wardCode})
                      </h4>
                    </div>

                    <span className="font-mono text-[10px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 font-bold border border-amber-200">
                      {claim.slaRemaining}
                    </span>
                  </div>

                  {/* Image and Notes preview */}
                  <div className="flex items-start gap-3.5 bg-stone-50 p-3 rounded-2xl border border-stone-200/60">
                    {claim.imageUrl ? (
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-stone-200 shrink-0 border border-stone-300">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={claim.imageUrl}
                          alt="Grievance evidence"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-20 h-20 rounded-xl bg-stone-200 text-stone-400 flex items-center justify-center shrink-0">
                        <Camera className="w-6 h-6" />
                      </div>
                    )}

                    <div className="space-y-1 text-xs text-stone-700 min-w-0 flex-1">
                      <span className="text-[10px] uppercase font-bold text-stone-400 block tracking-wider">
                        {t.notesLabel}:
                      </span>
                      <p className="italic text-stone-800 line-clamp-3">
                        &ldquo;{claim.notes}&rdquo;
                      </p>
                    </div>
                  </div>

                  {/* PROGRESS BAR SECTION */}
                  <div className="space-y-2 pt-1 border-t border-stone-100">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-stone-800 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                        <span>{claim.stageLabel}</span>
                      </span>
                      <span className="font-mono font-bold text-emerald-800">
                        {claim.progressPercent}%
                      </span>
                    </div>

                    {/* Progress Track */}
                    <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-2.5 rounded-full transition-all duration-500"
                        style={{ width: `${claim.progressPercent}%` }}
                      />
                    </div>

                    {/* Step indicator pills */}
                    <div className="grid grid-cols-4 gap-1 text-[9px] text-center font-medium pt-0.5">
                      <span className="text-emerald-800 font-bold">{t.stage1}</span>
                      <span className="text-emerald-800 font-bold">{t.stage2}</span>
                      <span className="text-stone-400">{t.stage3}</span>
                      <span className="text-stone-400">{t.stage4}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NEW SECTION 2A: SIMULATED AI GEO-TRIAGE PREVIEW */}
          <div className="rounded-3xl bg-white border border-stone-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                {t.aiTriageTitle}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl bg-stone-50 p-3 border border-stone-200/60 space-y-0.5">
                <span className="text-[10px] text-stone-400 block font-medium">
                  {t.detectedDepth}
                </span>
                <span className="font-bold text-stone-900 block">
                  {t.depthValue}
                </span>
              </div>
              <div className="rounded-2xl bg-stone-50 p-3 border border-stone-200/60 space-y-0.5">
                <span className="text-[10px] text-stone-400 block font-medium">
                  {t.failureMode}
                </span>
                <span className="font-bold text-stone-900 block truncate">
                  {t.failureModeValue}
                </span>
              </div>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs">
              <span className="font-semibold text-emerald-900">
                {t.slaTarget}
              </span>
              <span className="font-bold font-mono text-emerald-900">
                {t.slaValue}
              </span>
            </div>
          </div>

          {/* NEW SECTION 2B: 4-STEP ESCALATION TRAIL */}
          <div className="rounded-3xl bg-white border border-stone-200/90 p-5 shadow-xs space-y-3.5">
            <h3 className="text-xs sm:text-sm font-bold text-stone-900">
              {t.escalationTrailTitle}
            </h3>

            <div className="space-y-3 text-xs pl-2 border-l-2 border-emerald-700 ml-1">
              <div className="pl-3 space-y-0.5">
                <h4 className="font-bold text-stone-900">{t.step1Title}</h4>
                <p className="text-[11px] text-stone-500 leading-relaxed">{t.step1Desc}</p>
              </div>
              <div className="pl-3 space-y-0.5">
                <h4 className="font-bold text-stone-900">{t.step2Title}</h4>
                <p className="text-[11px] text-stone-500 leading-relaxed">{t.step2Desc}</p>
              </div>
              <div className="pl-3 space-y-0.5">
                <h4 className="font-bold text-stone-900">{t.step3Title}</h4>
                <p className="text-[11px] text-stone-500 leading-relaxed">{t.step3Desc}</p>
              </div>
              <div className="pl-3 space-y-0.5">
                <h4 className="font-bold text-stone-900">{t.step4Title}</h4>
                <p className="text-[11px] text-stone-500 leading-relaxed">{t.step4Desc}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PAGE 3: WARD ROAD DIRECTORY (DEDICATED FULL SCREEN)            */}
      {/* ============================================================== */}
      {activePage === 'roads' && (
        <div className="space-y-5 animate-in fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {t.roadsTitle}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-normal mt-1 leading-relaxed">
              {wardRoads.length} {t.roadsSubtitle} ({t.wardPrefix} {selectedWard})
            </p>
          </div>

          {/* NEW SECTION 3A: WARD INFRASTRUCTURE OVERVIEW */}
          <div className="rounded-3xl bg-white border border-stone-200/90 p-5 shadow-xs space-y-3">
            <h3 className="text-xs sm:text-sm font-bold text-stone-900">
              {t.wardSummaryTitle}
            </h3>

            <div className="grid grid-cols-3 gap-2.5 text-center">
              <div className="rounded-2xl bg-stone-50 p-3 border border-stone-200/60">
                <span className="text-[10px] text-stone-400 block font-medium">{t.totalKilometers}</span>
                <span className="text-sm font-black text-stone-900 mt-0.5 block font-mono">{t.totalKilometersVal}</span>
              </div>
              <div className="rounded-2xl bg-stone-50 p-3 border border-stone-200/60">
                <span className="text-[10px] text-stone-400 block font-medium">{t.warrantyCoverage}</span>
                <span className="text-sm font-black text-emerald-800 mt-0.5 block font-mono">{t.warrantyCoverageVal}</span>
              </div>
              <div className="rounded-2xl bg-stone-50 p-3 border border-stone-200/60">
                <span className="text-[10px] text-stone-400 block font-medium">{t.activePotholesTracked}</span>
                <span className="text-sm font-black text-stone-900 mt-0.5 block font-mono">{t.activePotholesVal}</span>
              </div>
            </div>
          </div>

          {/* NEW SECTION 3B: SURFACE MATERIAL DISTRIBUTION */}
          <div className="rounded-3xl bg-white border border-stone-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                {t.surfaceDistributionTitle}
              </h3>
            </div>

            <div className="space-y-2">
              <div className="w-full bg-stone-100 rounded-full h-3 flex overflow-hidden">
                <div className="bg-emerald-800 h-full w-[54%]" title="Cement Concrete (CC) 54%" />
                <div className="bg-emerald-600 h-full w-[36%]" title="Mastic Asphalt 36%" />
                <div className="bg-stone-400 h-full w-[10%]" title="Paver Blocks 10%" />
              </div>

              <div className="flex justify-between text-[10px] text-stone-600 font-medium pt-1">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-800" />
                  <span>{t.surfaceCC} (54%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>{t.surfaceMastic} (36%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-stone-400" />
                  <span>{t.surfacePaver} (10%)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Ward Roads List */}
          <div className="rounded-3xl bg-white border border-stone-200/90 p-4 sm:p-5 shadow-xs space-y-3">
            <div className="space-y-2.5">
              {wardRoads.map((road) => (
                <div
                  key={road.id}
                  onClick={() => {
                    setSelectedRoadId(road.id);
                    setActivePage('lookup');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="p-3.5 rounded-2xl border border-stone-200/90 bg-stone-50/50 hover:bg-stone-50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-bold text-stone-900 text-xs sm:text-sm truncate">
                      {road.name}
                    </div>
                    <div className="text-[11px] text-stone-500 mt-0.5 truncate">
                      {t.contractorPrefix}: <strong className="text-emerald-950">{road.contractor_name}</strong>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      {road.under_dlp ? (
                        <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                          {t.freeFixTag}
                        </span>
                      ) : (
                        <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-600 font-medium">
                          {t.routineTag}
                        </span>
                      )}
                      <span className="font-mono text-[10px] text-stone-500 block mt-1">
                        {formatINR(road.total_spent_inr)}
                      </span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-stone-400 group-hover:text-emerald-700 transition-colors" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* PAGE 4: CITIZEN COMMUNITY GRIEVANCES (DEDICATED FULL SCREEN)   */}
      {/* ============================================================== */}
      {activePage === 'community' && (
        <div className="space-y-5 animate-in fade-in">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-stone-900 tracking-tight">
              {t.communityTitle}
            </h1>
            <p className="text-xs sm:text-sm text-stone-500 font-normal mt-1 leading-relaxed">
              {t.communitySubtitle}
            </p>
          </div>

          {/* NEW SECTION 4A: RESOLUTION & SAVINGS KPI STRIP */}
          <div className="rounded-3xl bg-white border border-stone-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                {t.resolutionTitle}
              </h3>
            </div>

            <div className="grid grid-cols-2 gap-3 text-center">
              <div className="rounded-2xl bg-stone-50 p-3.5 border border-stone-200/60 space-y-0.5">
                <span className="text-[10px] text-stone-400 block font-medium">
                  {t.potholesFixed}
                </span>
                <span className="text-lg font-black text-emerald-950 font-mono block">
                  {t.potholesFixedVal}
                </span>
              </div>

              <div className="rounded-2xl bg-stone-50 p-3.5 border border-stone-200/60 space-y-0.5">
                <span className="text-[10px] text-stone-400 block font-medium">
                  {t.warrantySavings}
                </span>
                <span className="text-lg font-black text-emerald-800 font-mono block">
                  {t.warrantySavingsVal}
                </span>
              </div>
            </div>
          </div>

          {/* Citizen Complaints Feed */}
          <div className="space-y-3">
            {citizenComplaints.map((c) => (
              <div
                key={c.id}
                className="rounded-3xl border border-stone-200/90 bg-white p-4 sm:p-5 space-y-2.5 text-xs shadow-xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[9px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-bold">
                        {t.wardPrefix} {c.wardCode}
                      </span>
                      <span className="font-mono text-[10px] text-stone-400">
                        {t.reportedOn}: {c.reportedDate}
                      </span>
                    </div>
                    <div className="font-bold text-stone-900 mt-1 text-sm sm:text-base">
                      {c.roadName}
                    </div>
                  </div>
                  <button
                    onClick={() => handleCopy(c.id)}
                    className="text-stone-400 hover:text-stone-700 font-mono text-[10px] flex items-center gap-1"
                  >
                    {copiedId === c.id ? 'Copied' : c.id}
                  </button>
                </div>

                <p className="text-stone-700 italic bg-stone-50 p-3 rounded-2xl border border-stone-100 leading-relaxed">
                  &ldquo;{c.originalText}&rdquo;
                </p>

                <div className="flex items-center justify-between pt-1 border-t border-stone-100 text-[11px]">
                  <span className="font-semibold text-emerald-950">
                    {t.statusLabel}: {c.statusLabel}
                  </span>
                  <button
                    onClick={() => boostMeTooComplaint(c.id)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-bold border border-emerald-200 transition-colors"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{t.meTooBtn} ({c.meTooCount})</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* NEW SECTION 4B: BMC 24x7 EMERGENCY DESKS */}
          <div className="rounded-3xl bg-white border border-stone-200/90 p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <PhoneCall className="w-4 h-4 text-emerald-700" />
              <h3 className="text-xs sm:text-sm font-bold text-stone-900">
                {t.emergencyContactTitle}
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/60 flex items-center justify-between">
                <span className="text-stone-700 font-medium">{t.disasterCell}</span>
                <span className="font-bold text-emerald-900 font-mono">1916</span>
              </div>
              <div className="p-3 bg-stone-50 rounded-2xl border border-stone-200/60 flex items-center justify-between">
                <span className="text-stone-700 font-medium">{t.wardOfficeDesk}</span>
                <span className="font-bold text-stone-900 font-mono">022-26182233</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* WARRANTY ENFORCEMENT MODAL (BILINGUAL)                         */}
      {/* ============================================================== */}
      {showWarrantyModal && activeRoad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/60 backdrop-blur-2xs animate-in fade-in">
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border border-stone-200 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <span className="font-mono text-[10px] uppercase font-bold text-emerald-700 tracking-wider">
                  {t.modalTag}
                </span>
                <h3 className="text-base sm:text-lg font-extrabold text-stone-900 mt-0.5">
                  {t.modalTitle}
                </h3>
              </div>
              <button
                onClick={() => setShowWarrantyModal(false)}
                className="w-8 h-8 rounded-full bg-stone-100 hover:bg-stone-200 flex items-center justify-center text-stone-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              {t.modalDesc}
              <br />
              <strong className="text-stone-900">{activeRoad.name}</strong> &bull;{' '}
              <strong className="text-emerald-950">{activeRoad.contractor_name}</strong>
            </p>

            <form onSubmit={handleWarrantySubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 block">
                  {t.defectCategory}:
                </label>
                <select
                  value={failureType}
                  onChange={(e) => setFailureType(e.target.value)}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-2.5 text-xs text-stone-900 focus:outline-none"
                >
                  <option value="Surface peeled off after first rain">
                    {lang === 'mr' ? 'पहिल्या पावसात डांबर उखडले' : 'Surface peeled off after first rain'}
                  </option>
                  <option value="Pothole crater at joint / edge">
                    {lang === 'mr' ? 'जोडावर किंवा कडेवर खड्डा पडला' : 'Pothole crater at joint / edge'}
                  </option>
                  <option value="Uneven paver settlement / trench sinking">
                    {lang === 'mr' ? 'पेव्हर ब्लॉक खचले / समतल राहिले नाही' : 'Uneven paver settlement / trench sinking'}
                  </option>
                  <option value="Aggregates dislodged / loose gravel">
                    {lang === 'mr' ? 'खडी सुटी झाली / खडी पसरली' : 'Aggregates dislodged / loose gravel'}
                  </option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-stone-700 block">
                  {t.locationSpecifics}:
                </label>
                <textarea
                  value={failureNotes}
                  onChange={(e) => setFailureNotes(e.target.value)}
                  rows={2}
                  placeholder={t.locationSpecificsPlaceholder}
                  className="w-full bg-stone-50 border border-stone-200 rounded-2xl p-2.5 text-xs text-stone-900 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowWarrantyModal(false)}
                  className="flex-1 py-2.5 rounded-full bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold transition-colors"
                >
                  {t.cancelBtn}
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold transition-colors"
                >
                  {t.summonBtn}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

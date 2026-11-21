'use client';

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react';
import {
  WardCode,
  WorkOrderAudit,
  ContractorScorecard,
  NextRupeeRoad,
  CitizenRoadReceipt,
  CitizenComplaint,
  ShowCauseNotice,
} from '@/lib/types';
import {
  INITIAL_WORK_ORDERS,
  INITIAL_CONTRACTORS,
  INITIAL_NEXT_RUPEE_ROADS,
  INITIAL_CITIZEN_RECEIPTS,
  INITIAL_CITIZEN_COMPLAINTS,
} from '@/lib/mockData';
import { generateShowCauseNotice } from '@/lib/auditEngine';
import { Language } from '@/lib/translations';

export type CitizenTabType = 'snap' | 'community' | 'reports' | 'development';
export type ActivePageType = 'lookup' | 'snap' | 'roads' | 'community';

interface AuditContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  activePage: ActivePageType;
  setActivePage: (page: ActivePageType) => void;

  userRole: 'officer' | 'citizen';
  setUserRole: (role: 'officer' | 'citizen') => void;
  citizenTab: CitizenTabType;
  setCitizenTab: (tab: CitizenTabType) => void;
  selectedWard: WardCode;
  setSelectedWard: (ward: WardCode) => void;
  officerTab: 'command-center' | 'scorecard' | 'next-rupee';
  setOfficerTab: (tab: 'command-center' | 'scorecard' | 'next-rupee') => void;

  workOrders: WorkOrderAudit[];
  contractors: ContractorScorecard[];
  candidateRoads: NextRupeeRoad[];
  citizenReceipts: CitizenRoadReceipt[];
  citizenComplaints: CitizenComplaint[];

  selectedWorkOrder: WorkOrderAudit | null;
  openAuditDrawer: (wo: WorkOrderAudit) => void;
  closeAuditDrawer: () => void;

  showNoticeModal: boolean;
  activeNotice: ShowCauseNotice | null;
  openShowCauseModal: (wo: WorkOrderAudit) => void;
  closeShowCauseModal: () => void;

  clearFlagWeatherException: (workOrderId: string, reason?: string) => void;
  submitCitizenFailedFixReport: (
    roadId: string,
    failureType: string,
    notes: string
  ) => { newWorkOrderId: string; roadName: string };
  boostMeTooComplaint: (complaintId: string) => void;
  addNewCitizenComplaint: (data: {
    roadName: string;
    wardCode: string;
    issueType: string;
    description: string;
    imageUrl?: string;
  }) => string;

  toastMessage: string | null;
  setToastMessage: (msg: string | null) => void;
}

const AuditContext = createContext<AuditContextType | undefined>(undefined);

export function AuditProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Language>('en');
  const [activePage, setActivePage] = useState<ActivePageType>('lookup');
  const [userRole, setUserRole] = useState<'officer' | 'citizen'>('citizen');
  const [citizenTab, setCitizenTab] = useState<CitizenTabType>('snap');
  const [selectedWard, setSelectedWard] = useState<WardCode>('ALL');
  const [officerTab, setOfficerTab] = useState<'command-center' | 'scorecard' | 'next-rupee'>('command-center');

  const [workOrders, setWorkOrders] = useState<WorkOrderAudit[]>(INITIAL_WORK_ORDERS);
  const [contractors, setContractors] = useState<ContractorScorecard[]>(INITIAL_CONTRACTORS);
  const [candidateRoads, setCandidateRoads] = useState<NextRupeeRoad[]>(INITIAL_NEXT_RUPEE_ROADS);
  const [citizenReceipts, setCitizenReceipts] = useState<CitizenRoadReceipt[]>(INITIAL_CITIZEN_RECEIPTS);
  const [citizenComplaints, setCitizenComplaints] = useState<CitizenComplaint[]>(INITIAL_CITIZEN_COMPLAINTS);

  const [selectedWorkOrder, setSelectedWorkOrder] = useState<WorkOrderAudit | null>(null);
  const [showNoticeModal, setShowNoticeModal] = useState<boolean>(false);
  const [activeNotice, setActiveNotice] = useState<ShowCauseNotice | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((curr) => (curr === msg ? null : curr));
    }, 6000);
  }, []);

  const openAuditDrawer = useCallback((wo: WorkOrderAudit) => {
    setSelectedWorkOrder(wo);
  }, []);

  const closeAuditDrawer = useCallback(() => {
    setSelectedWorkOrder(null);
  }, []);

  const openShowCauseModal = useCallback((wo: WorkOrderAudit) => {
    const notice = generateShowCauseNotice(wo);
    setActiveNotice(notice);
    setShowNoticeModal(true);

    // Update status to SHOW_CAUSE_ISSUED in work order list
    setWorkOrders((prev) =>
      prev.map((item) =>
        item.id === wo.id
          ? {
              ...item,
              flagStatus: 'SHOW_CAUSE_ISSUED',
              showCauseNoticeText: notice.draftedBody,
              lastUpdated: 'Just now',
            }
          : item
      )
    );

    // If currently inspecting this in drawer, update state
    setSelectedWorkOrder((curr) =>
      curr && curr.id === wo.id
        ? {
            ...curr,
            flagStatus: 'SHOW_CAUSE_ISSUED',
            showCauseNoticeText: notice.draftedBody,
          }
        : curr
    );

    showToast(`Notice ${notice.noticeNumber} formally drafted and registered for ${wo.contractorName}.`);
  }, [showToast]);

  const closeShowCauseModal = useCallback(() => {
    setShowNoticeModal(false);
  }, []);

  const clearFlagWeatherException = useCallback((workOrderId: string, reason?: string) => {
    setWorkOrders((prev) => {
      const target = prev.find((w) => w.id === workOrderId);
      if (!target) return prev;

      const exceptionReason =
        reason ||
        `Monsoon exception granted under GCC Clause 46: 24h rainfall exceeded 150mm threshold (${target.rainfallWindowMm}mm logged with high-tide surge). Surface failure classified as catastrophic hydraulic displacement rather than contractor defect.`;

      return prev.map((wo) =>
        wo.id === workOrderId
          ? {
              ...wo,
              flagStatus: 'WEATHER_EXEMPTION',
              weatherExemptionReason: exceptionReason,
              riskScore: Math.round(wo.riskScore * 0.3),
              lastUpdated: 'Just now (Weather Exemption)',
            }
          : wo
      );
    });

    setContractors((prev) =>
      prev.map((c) => {
        return {
          ...c,
          clearedStatusBadge: 'CLEARED_WEATHER',
          weatherReliefPoints: c.weatherReliefPoints + 15,
          fairScore: Math.min(98, c.fairScore + 10),
          contextNote: `Cleared on ${workOrderId}: Official weather exception recorded for heavy precipitation.`,
        };
      })
    );

    setSelectedWorkOrder((curr) =>
      curr && curr.id === workOrderId
        ? {
            ...curr,
            flagStatus: 'WEATHER_EXEMPTION',
            weatherExemptionReason:
              reason ||
              `Monsoon exception granted under GCC Clause 46: 24h rainfall exceeded 150mm threshold.`,
            riskScore: Math.round(curr.riskScore * 0.3),
          }
        : curr
    );

    showToast(`Flag cleared: Weather exception logged for ${workOrderId}.`);
  }, [showToast]);

  const submitCitizenFailedFixReport = useCallback((
    roadId: string,
    failureType: string,
    notes: string
  ) => {
    let roadName = 'Reported Mumbai Road';
    let wardCode: 'K/W' | 'H/E' | 'G/N' | 'L' | 'M/E' = 'K/W';
    let contractorName = 'Responsible Contractor';
    let isUnderDlp = true;
    let totalBilled = 4200000;
    let dlpExpiryDate = '2026-12-31';
    let completionDate = '2024-07-01';
    let repeatCount = 1;

    setCitizenReceipts((prev) => {
      const receipt = prev.find((r) => r.id === roadId);
      if (receipt) {
        roadName = receipt.roadName;
        wardCode = receipt.wardCode;
        contractorName = receipt.contractorName;
        isUnderDlp = receipt.isUnderWarranty;
        totalBilled = receipt.totalBilled;
        dlpExpiryDate = receipt.dlpExpiryDate;
        completionDate = receipt.completionDate;
        repeatCount = receipt.repeatComplaintsCount + 1;
      }
      return prev.map((r) =>
        r.id === roadId
          ? {
              ...r,
              repeatComplaintsCount: r.repeatComplaintsCount + 1,
              grade: r.grade === 'A+' ? 'B' : r.grade === 'A' ? 'C' : 'D',
            }
          : r
      );
    });

    const newId = `WO-2024-${wardCode.replace('/', '')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newAuditItem: WorkOrderAudit = {
      id: newId,
      roadName,
      wardCode,
      contractorId: 'CTR-REPORTED',
      contractorName,
      flagType: isUnderDlp ? 'DLP_VIOLATION' : 'FAILED_FIX',
      flagStatus: 'ACTIVE',
      billedAmount: totalBilled,
      suspectedLeakageAmount: totalBilled,
      isDlpViolated: isUnderDlp,
      dlpExpiryDate,
      riskScore: 95,
      completionDate,
      actualUnitCost: 2850,
      wardMedianUnitCost: 1850,
      unitMetric: '₹/sq.m (Failed Surface)',
      rainfallWindowMm: 110,
      auditBrief: `Citizen verified failure report submitted: "${failureType} - ${notes}". Road is under active DLP until ${dlpExpiryDate}. Contractor is legally obligated to repair at ₹0 cost under warranty.`,
      trail: {
        step1_complaint: {
          id: `CMP-${Date.now().toString().slice(-4)}`,
          originalText: notes || `${failureType} reported by citizen right after monsoon spell.`,
          language: 'English',
          englishTranslation: notes || `${failureType} reported by citizen right after monsoon spell.`,
          timestamp: 'Just now',
          citizenCategory: 'Citizen Audit Verification',
        },
        step2_dedupIssue: {
          issueId: `DEDUP-${Math.floor(100 + Math.random() * 900)}`,
          clusterSize: repeatCount,
          location: roadName,
          geoCoordinates: '19.1102° N, 72.8421° E',
          potholeDepthCm: 15,
          priorityAssigned: 'Critical',
        },
        step3_workOrder: {
          orderId: newId,
          awardedDate: completionDate,
          contractor: contractorName,
          billedAmount: totalBilled,
          actualUnitCost: 2850,
          baselineMedianUnitCost: 1850,
          unit: '₹/sq.m',
          workScope: 'Defective section requiring immediate ₹0 DLP warranty enforcement',
        },
        step4_outcome: {
          repeatComplaintsCount30d: repeatCount,
          daysToFailure: 7,
          rainfallDuringWindowMm: 110,
          status: 'Contractor summoned for immediate zero-cost rectification',
          warrantyStatus: 'Defect Liability Period active; zero expense to BMC',
        },
      },
    };

    // Prepend to work orders list
    setWorkOrders((prev) => [newAuditItem, ...prev]);

    // Update candidate road priority
    setCandidateRoads((prev) =>
      prev.map((c) =>
        c.roadName.toLowerCase().includes(roadName.toLowerCase())
          ? {
              ...c,
              repeatFailuresScore: Math.min(100, c.repeatFailuresScore + 10),
              complaintDensityScore: Math.min(100, c.complaintDensityScore + 8),
            }
          : c
      )
    );

    showToast(
      `Citizen report logged: Added [${isUnderDlp ? 'DLP Violation' : 'Failed Fix'}] flag to Ward Officer Command Center!`
    );

    return { newWorkOrderId: newId, roadName };
  }, [showToast]);

  const boostMeTooComplaint = useCallback((complaintId: string) => {
    setCitizenComplaints((prev) =>
      prev.map((c) => {
        if (c.id === complaintId) {
          return {
            ...c,
            meTooCount: c.meTooCount + 1,
            isUserSupported: true,
          };
        }
        return c;
      })
    );
    showToast(`+1 Me Too registered. Complaint priority boosted without creating duplicate waste.`);
  }, [showToast]);

  const addNewCitizenComplaint = useCallback((data: {
    roadName: string;
    wardCode: string;
    issueType: string;
    description: string;
    imageUrl?: string;
  }) => {
    const newId = `CMP-${data.wardCode.replace('/', '')}-${Math.floor(1000 + Math.random() * 9000)}`;
    const newComplaint: CitizenComplaint = {
      id: newId,
      queryTags: [
        data.roadName.toLowerCase(),
        data.wardCode.toLowerCase(),
        data.issueType.toLowerCase(),
        'pothole',
      ],
      originalText: data.description,
      language: 'English',
      englishSummary: `${data.issueType} on ${data.roadName}`,
      roadName: data.roadName,
      wardCode: data.wardCode,
      reportedDate: 'Today',
      statusStep: 1,
      statusLabel: 'Reported & Triaged (Priority: High)',
      statusBadgeColor: 'amber',
      meTooCount: 1,
      isUserSupported: true,
    };

    setCitizenComplaints((prev) => [newComplaint, ...prev]);
    showToast(`New incident ${newId} triaged and routed to Ward ${data.wardCode} road engineers.`);
    return newId;
  }, [showToast]);

  const value = useMemo(
    () => ({
      lang,
      setLang,
      activePage,
      setActivePage,
      userRole,
      setUserRole,
      citizenTab,
      setCitizenTab,
      selectedWard,
      setSelectedWard,
      officerTab,
      setOfficerTab,
      workOrders,
      contractors,
      candidateRoads,
      citizenReceipts,
      citizenComplaints,
      selectedWorkOrder,
      openAuditDrawer,
      closeAuditDrawer,
      showNoticeModal,
      activeNotice,
      openShowCauseModal,
      closeShowCauseModal,
      clearFlagWeatherException,
      submitCitizenFailedFixReport,
      boostMeTooComplaint,
      addNewCitizenComplaint,
      toastMessage,
      setToastMessage,
    }),
    [
      lang,
      activePage,
      userRole,
      citizenTab,
      selectedWard,
      officerTab,
      workOrders,
      contractors,
      candidateRoads,
      citizenReceipts,
      citizenComplaints,
      selectedWorkOrder,
      showNoticeModal,
      activeNotice,
      toastMessage,
      openAuditDrawer,
      closeAuditDrawer,
      openShowCauseModal,
      closeShowCauseModal,
      clearFlagWeatherException,
      submitCitizenFailedFixReport,
      boostMeTooComplaint,
      addNewCitizenComplaint,
    ]
  );

  return <AuditContext.Provider value={value}>{children}</AuditContext.Provider>;
}

export function useAuditContext() {
  const context = useContext(AuditContext);
  if (!context) {
    throw new Error('useAuditContext must be used within an AuditProvider');
  }
  return context;
}

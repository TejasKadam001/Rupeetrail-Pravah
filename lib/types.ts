export type WardCode = string;

export interface WardInfo {
  code: 'K/W' | 'H/E' | 'G/N' | 'L' | 'M/E';
  name: string;
  neighborhoods: string;
  zone: string;
  floodRiskCategory: 'Critical' | 'High' | 'Moderate';
  monsoonRainfallMm: number;
  activeComplaintsCount: number;
}

export type AuditFlagType =
  | 'INFLATED_UNIT_COST'
  | 'DUPLICATE_BILLING'
  | 'DLP_VIOLATION'
  | 'FAILED_FIX';

export type AuditFlagStatus =
  | 'ACTIVE'
  | 'SHOW_CAUSE_ISSUED'
  | 'WEATHER_EXEMPTION'
  | 'VERIFIED';

export interface TrailStep {
  step1_complaint: {
    id: string;
    originalText: string;
    language: 'Marathi' | 'Hindi' | 'Hinglish' | 'English';
    englishTranslation: string;
    timestamp: string;
    citizenCategory: string;
  };
  step2_dedupIssue: {
    issueId: string;
    clusterSize: number;
    location: string;
    geoCoordinates: string;
    potholeDepthCm: number;
    priorityAssigned: 'High' | 'Critical';
  };
  step3_workOrder: {
    orderId: string;
    awardedDate: string;
    contractor: string;
    billedAmount: number;
    actualUnitCost: number;
    baselineMedianUnitCost: number;
    unit: string;
    workScope: string;
  };
  step4_outcome: {
    repeatComplaintsCount30d: number;
    daysToFailure: number;
    rainfallDuringWindowMm: number;
    status: string;
    warrantyStatus: string;
  };
}

export interface WorkOrderAudit {
  id: string;
  roadName: string;
  wardCode: 'K/W' | 'H/E' | 'G/N' | 'L' | 'M/E';
  contractorId: string;
  contractorName: string;
  flagType: AuditFlagType;
  flagStatus: AuditFlagStatus;
  billedAmount: number;
  suspectedLeakageAmount: number;
  isDlpViolated: boolean;
  dlpExpiryDate: string;
  riskScore: number; // 0 - 100
  completionDate: string;
  actualUnitCost: number;
  wardMedianUnitCost: number;
  unitMetric: string;
  rainfallWindowMm: number;
  trail: TrailStep;
  auditBrief: string;
  showCauseNoticeText?: string;
  weatherExemptionReason?: string;
  lastUpdated?: string;
}

export interface ContractorScorecard {
  id: string;
  name: string;
  tier: string;
  totalSpend: number;
  completedWorkOrders: number;
  avgTurnaroundDays: number;
  durabilityRate30d: number; // percentage
  dlpViolations: number;
  rawScore: number; // 0 - 100
  fairScore: number; // 0 - 100 (context-adjusted for heavy rainfall & flood zones)
  weatherReliefPoints: number;
  contextNote: string;
  clearedStatusBadge: 'CLEARED_WEATHER' | 'EXEMPLARY' | 'FLAGGED' | 'UNDER_REVIEW';
  recentWards: string[];
}

export interface NextRupeeRoad {
  id: string;
  roadName: string;
  wardCode: 'K/W' | 'H/E' | 'G/N' | 'L' | 'M/E';
  estimatedCost: number;
  complaintDensityScore: number; // 0 - 100
  floodRiskScore: number; // 0 - 100
  trafficCriticalityScore: number; // 0 - 100
  repeatFailuresScore: number; // 0 - 100
  compositeScore?: number;
  isUnderDlp: boolean;
  dlpContractorName: string;
  dlpExpiryDate: string;
  pavementType: 'Mastic Asphalt' | 'Dense Bituminous Macadam' | 'Cement Concrete';
  chainageKm: string;
}

export interface CitizenRoadReceipt {
  id: string;
  roadName: string;
  wardCode: 'K/W' | 'H/E' | 'G/N' | 'L' | 'M/E';
  contractorName: string;
  contractorId: string;
  grade: 'A+' | 'A' | 'B' | 'C' | 'D';
  totalBilled: number;
  completionDate: string;
  dlpExpiryDate: string;
  isUnderWarranty: boolean;
  warrantyYears: number;
  materialType: string;
  repeatComplaintsCount: number;
  lastRepairedReason: string;
}

export interface CitizenComplaint {
  id: string;
  queryTags: string[];
  originalText: string;
  language: 'Marathi' | 'Hindi' | 'Hinglish' | 'English';
  englishSummary: string;
  roadName: string;
  wardCode: string;
  reportedDate: string;
  workOrderId?: string;
  contractorName?: string;
  billedAmount?: number;
  statusStep: 1 | 2 | 3;
  statusLabel: string;
  statusBadgeColor: 'red' | 'amber' | 'emerald';
  meTooCount: number;
  isUserSupported?: boolean;
}

export interface ShowCauseNotice {
  noticeNumber: string;
  workOrderId: string;
  contractorName: string;
  roadName: string;
  wardCode: string;
  billedAmount: number;
  overbilledAmount: number;
  dlpExpiryDate: string;
  violationClauses: string[];
  issuedAt: string;
  deadlineDays: number;
  draftedBody: string;
}

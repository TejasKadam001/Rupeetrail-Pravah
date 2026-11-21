import {
  WorkOrderAudit,
  NextRupeeRoad,
  ShowCauseNotice,
  WardCode,
} from './types';

export interface AuditKPIs {
  totalSpend: number;
  suspectedLeakage: number;
  recoverableDlp: number;
  activeFlagsCount: number;
  totalWorkOrdersCount: number;
}

export function calculateAuditKPIs(
  workOrders: WorkOrderAudit[],
  wardFilter: WardCode = 'ALL'
): AuditKPIs {
  const filtered =
    wardFilter === 'ALL'
      ? workOrders
      : workOrders.filter((wo) => wo.wardCode === wardFilter);

  const totalSpend = filtered.reduce((acc, wo) => acc + wo.billedAmount, 0);

  // Leakage is counted for active or show-cause issued flags (weather exempted items are excluded)
  const leakageItems = filtered.filter(
    (wo) => wo.flagStatus === 'ACTIVE' || wo.flagStatus === 'SHOW_CAUSE_ISSUED'
  );

  const suspectedLeakage = leakageItems.reduce(
    (acc, wo) => acc + wo.suspectedLeakageAmount,
    0
  );

  const recoverableDlp = leakageItems
    .filter((wo) => wo.flagType === 'DLP_VIOLATION' || wo.isDlpViolated)
    .reduce((acc, wo) => acc + wo.suspectedLeakageAmount, 0);

  const activeFlagsCount = filtered.filter(
    (wo) => wo.flagStatus === 'ACTIVE'
  ).length;

  return {
    totalSpend,
    suspectedLeakage,
    recoverableDlp,
    activeFlagsCount,
    totalWorkOrdersCount: filtered.length,
  };
}

export interface WeightCoefficients {
  complaintDensity: number; // 0 - 100
  floodRisk: number; // 0 - 100
  trafficCriticality: number; // 0 - 100
  repeatFailures: number; // 0 - 100
}

export interface NextRupeePlanResult {
  paidAllocated: (NextRupeeRoad & { allocated: boolean; cumulativeSpend: number })[];
  dlpEnforced: NextRupeeRoad[];
  totalBudgetProvided: number;
  totalPaidAllocated: number;
  totalDlpSavings: number;
  remainingBudget: number;
}

export function computeNextRupeePlan(
  candidates: NextRupeeRoad[],
  budget: number,
  weights: WeightCoefficients,
  wardFilter: WardCode = 'ALL'
): NextRupeePlanResult {
  const filtered =
    wardFilter === 'ALL'
      ? candidates
      : candidates.filter((c) => c.wardCode === wardFilter);

  // Normalize weights to sum to 1
  const sumWeights =
    weights.complaintDensity +
    weights.floodRisk +
    weights.trafficCriticality +
    weights.repeatFailures;

  const wComplaints = sumWeights > 0 ? weights.complaintDensity / sumWeights : 0.25;
  const wFlood = sumWeights > 0 ? weights.floodRisk / sumWeights : 0.25;
  const wTraffic = sumWeights > 0 ? weights.trafficCriticality / sumWeights : 0.25;
  const wRepeat = sumWeights > 0 ? weights.repeatFailures / sumWeights : 0.25;

  // Compute composite score for all
  const scored = filtered.map((road) => {
    const compositeScore = Math.round(
      road.complaintDensityScore * wComplaints +
        road.floodRiskScore * wFlood +
        road.trafficCriticalityScore * wTraffic +
        road.repeatFailuresScore * wRepeat
    );
    return { ...road, compositeScore };
  });

  // Group 1: DLP Warranty Enforcement (Contractor legally mandated to fix for ₹0)
  const dlpEnforced = scored
    .filter((road) => road.isUnderDlp)
    .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0));

  const totalDlpSavings = dlpEnforced.reduce(
    (acc, road) => acc + road.estimatedCost,
    0
  );

  // Group 2: Paid Allocation (Warranty expired or unassigned public works)
  const paidCandidates = scored
    .filter((road) => !road.isUnderDlp)
    .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0));

  let currentSpend = 0;
  const paidAllocated = paidCandidates.map((road) => {
    const fitsInBudget = currentSpend + road.estimatedCost <= budget;
    if (fitsInBudget) {
      currentSpend += road.estimatedCost;
      return {
        ...road,
        allocated: true,
        cumulativeSpend: currentSpend,
      };
    } else {
      return {
        ...road,
        allocated: false,
        cumulativeSpend: currentSpend,
      };
    }
  });

  return {
    paidAllocated,
    dlpEnforced,
    totalBudgetProvided: budget,
    totalPaidAllocated: currentSpend,
    totalDlpSavings,
    remainingBudget: Math.max(0, budget - currentSpend),
  };
}

export function generateShowCauseNotice(wo: WorkOrderAudit): ShowCauseNotice {
  const noticeNumber = `BMC/ENG/VIG/2024/${wo.wardCode.replace('/', '')}/${wo.id.slice(-4)}`;
  const clauses: string[] = [];

  if (wo.flagType === 'INFLATED_UNIT_COST') {
    clauses.push('BMC GCC Clause 38: Pricing Irregularity & Schedule of Rates Violation');
    clauses.push('Vigilance Manual Sec 14(b): Disproportionate Unit Markup without Technical Sanction');
  } else if (wo.flagType === 'DUPLICATE_BILLING') {
    clauses.push('BMC GCC Clause 44: Duplicate Measurement & Spatial GIS Overlap');
    clauses.push('Prevention of Corruption in Municipal Contracts Sec 21: Redundant Measurement Book Entry');
  } else if (wo.flagType === 'DLP_VIOLATION') {
    clauses.push('BMC Standard Contract Condition 20: Defect Liability Period (DLP) Default');
    clauses.push('Executive Engineer Circular 2022/P-89: Prohibition of Fresh Tenders on Active DLP Assets');
  } else {
    clauses.push('BMC GCC Clause 46: Substandard Workmanship & Early Binder Stripping');
    clauses.push('IRC 110-2005: Premature Pavement Disintegration Under Standard Traffic Conditions');
  }

  const draftedBody = `
MUNICIPAL CORPORATION OF GREATER MUMBAI (BMC)
OFFICE OF THE CHIEF ENGINEER (ROADS & TRAFFIC)
MUNICIPAL HEAD OFFICE, ANNEX BUILDING, FORT, MUMBAI - 400 001

SHOW-CAUSE NOTICE & EXPLANATION SUMMONS
Ref No: ${noticeNumber}
Date of Dispatch: ${new Date().toISOString().slice(0, 10)}

To,
M/s ${wo.contractorName}
Contractor Registration: Class ${wo.contractorId}
Address: Municipal Contractor Enclave, Mumbai

SUBJECT: SHOW-CAUSE NOTICE FOR UNLAWFUL BILLING / DEFECT LIABILITY BREACH
REGARDING WORK ORDER NO: ${wo.id}
LOCATION: ${wo.roadName} (Ward ${wo.wardCode})

1. PREAMBLE & AUDIT FINDINGS:
An algorithmic integrity audit conducted on BMC monsoon road repair expenditures has flagged Work Order ${wo.id} for severe irregularities categorized as [${wo.flagType.replace(/_/g, ' ')}].

Total Billed Amount: ₹${wo.billedAmount.toLocaleString('en-IN')}
Calculated Leakage / Overbilled Claim: ₹${wo.suspectedLeakageAmount.toLocaleString('en-IN')}
Unit Cost Billed: ₹${wo.actualUnitCost} ${wo.unitMetric}
Ward Median Benchmark: ₹${wo.wardMedianUnitCost} ${wo.unitMetric}
DLP Warranty Expiry on Record: ${wo.dlpExpiryDate}

2. SPECIFIC CHARGES & CLAUSES INVOKED:
${clauses.map((c, i) => `   (${i + 1}) ${c}`).join('\n')}

Audit Evidence Summary:
"${wo.auditBrief}"

3. DIRECTIVE & 72-HOUR MANDATE:
You are hereby called upon to show cause in writing within seventy-two (72) hours of receipt of this notice as to why:
(a) The disputed sum of ₹${wo.suspectedLeakageAmount.toLocaleString('en-IN')} should not be summarily deducted and forfeited from your Security Deposit / Pending RA Bills.
(b) Your firm should not be debarred / blacklisted from participating in BMC Road & Pavement Tenders for a period of up to three (3) calendar years.
(c) Immediate zero-cost remedial repair under your binding Defect Liability Period (DLP) obligations should not be initiated within 48 hours.

Failure to furnish a substantiated technical justification signed by your Authorized Technical Director will result in unilateral recovery and disciplinary de-registration without further reference.

BY ORDER OF THE MUNICIPAL COMMISSIONER,
Brihanmumbai Municipal Corporation (BMC)
Chief Engineer (Roads & Pavements Audit Cell)
  `.trim();

  return {
    noticeNumber,
    workOrderId: wo.id,
    contractorName: wo.contractorName,
    roadName: wo.roadName,
    wardCode: wo.wardCode,
    billedAmount: wo.billedAmount,
    overbilledAmount: wo.suspectedLeakageAmount,
    dlpExpiryDate: wo.dlpExpiryDate,
    violationClauses: clauses,
    issuedAt: new Date().toISOString(),
    deadlineDays: 3,
    draftedBody,
  };
}

export function formatINR(val: number): string {
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} L`;
  }
  return `₹${val.toLocaleString('en-IN')}`;
}

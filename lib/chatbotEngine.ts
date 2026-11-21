import { REAL_ROADS, REAL_CONTRACTORS, REAL_WARDS, RoadRecord } from './roadDatabase';

// Normalizes strings for typo-tolerant fuzzy matching
function cleanString(str: string): string {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Compute simple similarity score (Dice coefficient + word overlap + substring boost)
function calculateMatchScore(query: string, roadName: string): number {
  const q = cleanString(query);
  const r = cleanString(roadName);

  if (q.includes(r) || r.includes(q)) return 1.0;

  const qWords = q.split(' ').filter((w) => w.length > 2);
  const rWords = r.split(' ').filter((w) => w.length > 2);

  let wordMatches = 0;
  for (const qw of qWords) {
    if (rWords.some((rw) => rw.includes(qw) || qw.includes(rw))) {
      wordMatches++;
    }
  }

  if (qWords.length > 0 && wordMatches > 0) {
    return (wordMatches / qWords.length) * 0.8;
  }

  // Levenshtein character distance for typos like "sv rod" -> "sv road"
  let dist = 0;
  const minLen = Math.min(q.length, r.length);
  for (let i = 0; i < minLen; i++) {
    if (q[i] === r[i]) dist++;
  }

  return dist / Math.max(q.length, r.length);
}

export function findMatchingRoad(query: string): RoadRecord | null {
  let bestRoad: RoadRecord | null = null;
  let highestScore = 0;

  for (const road of REAL_ROADS) {
    const score = calculateMatchScore(query, road.name);
    if (score > highestScore && score > 0.45) {
      highestScore = score;
      bestRoad = road;
    }
  }

  return bestRoad;
}

export function generateLocalRoadAnswer(query: string): string {
  const road = findMatchingRoad(query);

  if (!road) {
    return `I couldn't identify the specific Mumbai road from your query. Could you please specify the road name (e.g., "SV Road", "Veer Nariman Road", "Colaba Causeway", "LBS Marg")?`;
  }

  const contractor = REAL_CONTRACTORS.find((c) => c.id === road.contractor_id);
  const ward = REAL_WARDS.find((w) => w.code === road.ward_code);

  const dlpStatus = road.under_dlp
    ? `Yes, this road is currently under a mandatory Defect Liability Period (DLP) warranty. The contractor is legally obligated under BMC GCC Clause 20 to repair any potholes or defects for ₹0 at zero cost to citizens.`
    : `This corridor is currently outside its active DLP warranty and is covered under routine BMC ward maintenance.`;

  const workOrderInfo = road.latest_work_order
    ? `The latest recorded maintenance was Work Order ${road.latest_work_order.work_order_id} (${road.latest_work_order.work_type} via ${road.latest_work_order.repair_method}) at a cost of ₹${road.latest_work_order.cost_inr.toLocaleString('en-IN')}. Engineer remark: "${road.latest_work_order.engineer_remark || 'Completed as per site conditions'}".`
    : `Total recorded monsoon expenditure on this segment is ₹${road.total_spent_inr.toLocaleString('en-IN')}.`;

  return `The contractor responsible for **${road.name}** (Segment ${road.segment_no}, Ward ${road.ward_code}${ward ? ` — ${ward.name.split(',')[0]}` : ''}) is **${road.contractor_name}**${contractor ? ` (Empanelled since ${contractor.empanelled_since})` : ''}.

**Pavement Details:**
- **Surface Material:** ${road.surface}
- **Length & Lanes:** ${road.length_m} meters, ${road.lanes} lanes
- **Warranty Status:** ${dlpStatus}

**Recent Maintenance History:**
${workOrderInfo}`;
}

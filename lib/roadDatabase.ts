import roadsData from './data/roads.json';
import wardsData from './data/wards.json';
import contractorsData from './data/contractors.json';

export interface WorkOrderRecord {
  work_order_id: string;
  contractor_id: string;
  contractor_name: string;
  work_type: string;
  repair_method: string;
  cost_inr: number;
  area_sqm: number;
  completed_at: string;
  sla_met: boolean;
  reopened_within_30d: boolean;
  engineer_remark: string;
}

export interface RoadRecord {
  id: string;
  name: string;
  segment_no: number;
  ward_code: string;
  road_type: string;
  surface: string;
  lanes: number;
  length_m: number;
  last_resurfaced: string;
  under_dlp: boolean;
  bus_route: boolean;
  contractor_name: string;
  contractor_id: string;
  total_spent_inr: number;
  work_orders_count: number;
  reopened_count: number;
  latest_work_order?: WorkOrderRecord | null;
}

export interface WardRecord {
  code: string;
  name: string;
  zone: string;
  office: string;
  area_km2: number;
  population: number;
  budget_inr: number;
  localities: string[];
}

export interface ContractorRecord {
  id: string;
  name: string;
  empanelled_since: number;
  active_wards: string[];
}

export const REAL_WARDS: WardRecord[] = wardsData as WardRecord[];
export const REAL_ROADS: RoadRecord[] = roadsData as RoadRecord[];
export const REAL_CONTRACTORS: ContractorRecord[] = contractorsData as ContractorRecord[];

export function getAllWards(): WardRecord[] {
  return REAL_WARDS;
}

export function getWardsList(): { code: string; label: string; localities: string }[] {
  return REAL_WARDS.map((w) => ({
    code: w.code,
    label: `Ward ${w.code} — ${w.name.split(',')[0]}`,
    localities: w.localities.slice(0, 3).join(', '),
  }));
}

export function getRoadsByWard(wardCode: string): RoadRecord[] {
  if (wardCode === 'ALL') return REAL_ROADS;
  return REAL_ROADS.filter((r) => r.ward_code === wardCode);
}

export function getRoadById(roadId: string): RoadRecord | undefined {
  return REAL_ROADS.find((r) => r.id === roadId);
}

export function searchRoads(query: string, wardCode: string = 'ALL'): RoadRecord[] {
  const q = query.toLowerCase().trim();
  let list = REAL_ROADS;
  if (wardCode !== 'ALL') {
    list = list.filter((r) => r.ward_code === wardCode);
  }
  if (!q) return list;
  return list.filter(
    (r) =>
      r.name.toLowerCase().includes(q) ||
      r.contractor_name.toLowerCase().includes(q) ||
      r.id.toLowerCase().includes(q)
  );
}

export function getContractor(contractorId: string): ContractorRecord | undefined {
  return REAL_CONTRACTORS.find((c) => c.id === contractorId);
}

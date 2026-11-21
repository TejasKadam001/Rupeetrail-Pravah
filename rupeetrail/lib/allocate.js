export const defaultScenario = {budget: '10', rule: 'ward'};
export const ruleNames = {ward: 'Respect ward headroom', pool: 'Commissioner’s pooled scenario'};
export const maxCeiling = 100000 * 100000;

export function ceilingFromLakh(input) {
  if (input == null || String(input).trim() === '') return null;
  const value = Number(input) * 100000;
  return Number.isFinite(value) && value >= 0 && value <= maxCeiling ? Math.round(value) : null;
}

export function allocate(candidates, budgets, ceiling, respectHeadroom) {
  const room = Object.fromEntries(budgets.map(w => [w.ward, Math.max(0, w.budget - w.billed)]));
  const funded = [], disposition = {};
  let left = ceiling, dlp = 0, cap = 0, overCeiling = 0;
  for (const road of candidates) {
    if (road.tier === 'Routine') { disposition[road.id]='routine'; continue; }
    if (road.dlp) { disposition[road.id]='dlp'; dlp++; continue; }
    if (respectHeadroom && road.estimate > room[road.ward]) { disposition[road.id]='headroom'; cap++; continue; }
    if (road.estimate > left) { disposition[road.id]='ceiling'; overCeiling++; continue; }
    disposition[road.id]='funded';
    funded.push(road);
    left -= road.estimate;
    room[road.ward] -= road.estimate;
  }
  return {funded, disposition, left, allocated: ceiling - left, dlp, cap, overCeiling};
}

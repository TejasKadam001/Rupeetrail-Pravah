import {allocate, ruleNames} from './allocate.js';

export const number = value => new Intl.NumberFormat('en-IN').format(value);
export const rupees = value => '₹' + number(value);
export const segmentCount = count => number(count) + (count === 1 ? ' segment' : ' segments');
const countOf = (value, singular, plural = singular + 's') => number(value) + ' ' + (value === 1 ? singular : plural);

export function riskEvidence(road) {
  const flood = road.hotspot_name
    ? 'Within 1 km of ' + road.hotspot_name + ', with ' + countOf(road.wet_days, 'rainfall threshold day') + ' at the matched station'
    : countOf(road.heavy, 'heavy-rain day') + ' at the matched station';
  const factors = [
    [road.flood_points, flood],
    [road.traffic_points, number(road.vehicles) + ' peak-hour vehicles'],
    [road.safety_points, countOf(road.road_accidents, 'incident') + ' with a recorded road-related cause'],
    [road.access_points, 'Access to ' + countOf(road.hospitals, 'hospital') + ' and ' + countOf(road.schools, 'school')],
    [road.history_points, countOf(road.reopened, 'reopening') + ' across ' + countOf(road.orders, 'work order')]
  ];
  return factors.filter(([points]) => points > 0).sort((a,b) => b[0] - a[0]).slice(0,2).map(([,label]) => label);
}

export function makeBudgetProposal(data, settings, now = new Date()) {
  const {ward, ceiling, rule, detail, note} = settings;
  const plan = allocate(data.candidates, data.budgets, ceiling, rule === 'ward');
  const scope = ward ? 'Ward ' + ward : 'All Mumbai wards';
  const scopeName = ward ? data.budgets[0].name : 'Mumbai';
  const budget = data.budgets.reduce((sum,w) => sum + w.budget, 0);
  const billed = data.budgets.reduce((sum,w) => sum + w.billed, 0);
  const headroom = data.budgets.reduce((sum,w) => sum + Math.max(0,w.budget - w.billed), 0);
  const rows = plan.funded.map(road => ({
    id: road.id, name: road.name, ward: road.ward, segment: road.segment,
    method: road.method, action: road.action, estimate: road.estimate, score: road.score, tier: road.tier,
    evidence: riskEvidence(road), basis: road.unit === 'per sqm'
      ? number(road.qty) + ' m² at ' + rupees(road.rate) + ' per m²'
      : 'One job at ' + rupees(road.rate)
  }));
  const total = rows.length;
  const scopeText = ward ? scope + ' (' + scopeName + ')' : 'Mumbai';
  const decision = total
    ? 'I recommend field verification of ' + segmentCount(total) + ' in ' + scopeText + ' for works estimated at ' + rupees(plan.allocated) + '. The proposal leaves ' + rupees(plan.left) + ' of the ' + rupees(ceiling) + ' ceiling unallocated.'
    : 'I recommend retaining the ' + rupees(ceiling) + ' ceiling for ' + scopeText + '. No eligible road intervention fits the current funding conditions.';
  const ruleText = rule === 'ward'
    ? 'Each proposed job fits within its ward’s remaining modeled headroom.'
    : 'This pooled scenario uses the entered ceiling across the selection. Finance must confirm a funding source and the Commissioner’s authority for any transfer.';
  const controls = [
    countOf(plan.dlp, 'high or elevated segment') + (plan.dlp === 1 ? ' is' : ' are') + ' held for a defect liability period (DLP) scope check.',
    rule === 'ward' ? countOf(plan.cap, 'candidate') + (plan.cap === 1 ? ' exceeded its' : ' exceeded the applicable') + ' ward balance at the point of allocation.' : ruleText,
    countOf(plan.overCeiling, 'remaining candidate') + ' exceeded the unallocated ceiling at the point of review.'
  ];
  const release = total
    ? 'Ask the ward engineer to confirm the location, measure the proposed quantity and check the schedule rate before seeking expenditure approval.'
    : 'Review warranty coverage and the available ward balance before changing the ceiling or proposing a new scope.';
  return {
    ...settings, scope, scopeName, ruleName: ruleNames[rule], date: new Intl.DateTimeFormat('en-IN', {dateStyle:'long',timeZone:'Asia/Kolkata'}).format(now),
    title: detail === 'brief' ? 'Monsoon road repair budget brief' : 'Monsoon road repair budget proposal',
    decision, allocated: plan.allocated, left: plan.left, total, budget, billed, headroom, ruleText,
    eligible: data.candidates.filter(road => road.tier !== 'Routine').length, controls, release, note,
    rows: detail === 'brief' ? rows.slice(0,3) : rows,
    shownLabel: detail === 'brief' && total > 3 ? 'First 3 of ' + number(total) + ' proposed segments' : segmentCount(total) + ' proposed',
    model: 'Estimates use the standard rate for one job or the historical median repair area for an area-based method. Priorities combine flood exposure, traffic, road-related incidents, facility access and repair history. Each segment appears once.',
    baseline: 'The 1 June to 30 September 2025 baseline records ' + rupees(budget) + ' in ward budgets and ' + rupees(billed) + ' billed for work completed in the period. Positive ward balances total ' + rupees(headroom) + '.'
  };
}

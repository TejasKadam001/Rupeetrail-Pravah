import {ceilingFromLakh} from './allocate.js';
import {number, riskEvidence, rupees, segmentCount} from './budget-proposal.js';

const unitValues = {lakh:1e5,lakhs:1e5,lac:1e5,lacs:1e5,l:1e5,crore:1e7,crores:1e7,cr:1e7,k:1000};
const monetary = /(?:₹|\binr\b|\brs\.?)\s*(-?\d[\d,]*(?:\.\d+)?)\s*(lakhs?|lacs?|crores?|cr|k|l)?\b|(-?\d[\d,]*(?:\.\d+)?)\s*(lakhs?|lacs?|crores?|cr|k|rupees?)\b/gi;
const regexpEscape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

function mentionedWards(text, wards) {
  if (/\b(all (?:mumbai|wards)|citywide|across mumbai)\b/i.test(text)) return [''];
  const codes = [...text.matchAll(/\bward\s+([a-z](?:\s*[/-]\s*[a-z])?)(?=\s|[.!?,)]|$)/gi)]
    .map(m => m[1].replaceAll(' ','').replace('-','/').toUpperCase());
  const matches = wards.filter(w => w.name.split(',').some(area => new RegExp('\\b' + regexpEscape(area.trim()) + '\\b','i').test(text)));
  return [...new Set([...codes,...matches.map(w => w.code)])];
}

export function planningIntent(question, active, wards, previous, lastTopic) {
  const noteMatch = question.match(/\b(?:add|include|append|set|replace)\s+(?:(?:a|an|the|my)\s+)?(?:(?:ward )?officer(?:’s|'s)?\s+|field\s+)?note\s*(?::|saying\b|that says\b)\s*([\s\S]+)$/i);
  const text = noteMatch ? question.slice(0,noteMatch.index) : question;
  const note = noteMatch ? noteMatch[1].trim() : /(?:remove|clear|delete) (?:the |my |officer )*note/i.test(text) ? '' : previous?.note || '';
  const scopes = mentionedWards(text,wards);
  if (scopes.length > 1) return {error:'Choose one ward for this draft, or ask for all Mumbai wards.'};
  const ward = scopes[0] ?? active.ward;
  if (ward && !wards.some(w => w.code === ward)) return {error:'Ward '+ward+' is outside this dataset. Choose one of the 24 wards in the planner.'};
  const matches = [...text.matchAll(monetary)];
  const amounts = matches.map(m => Number((m[1] || m[3]).replaceAll(',','')) * (unitValues[(m[2] || m[4] || '').toLowerCase()] || 1));
  if (!matches.length) {
    const plain = text.match(/\b(?:budget|ceiling)\s*(?:(?:to|of|is|at)\s+|=\s*)?(-?\d[\d,]*(?:\.\d+)?)\b/i);
    if (plain) amounts.push(Number(plain[1].replaceAll(',','')));
  }
  const pool = !/\b(no|without|avoid|disable) (?:funding )?pool(?:ed funds|ing)?\b/i.test(text) && /\bpool(?:ed|ing)?\b/i.test(text);
  const wardRule = /\b(?:no|without|avoid|disable) (?:funding )?pool(?:ed funds|ing)?\b|\b(?:respect|within|use|retain|keep)\s+(?:the\s+)?ward (?:balances?|cap|headroom)|ward[- ]capped/i.test(text);
  const rule = wardRule ? 'ward' : pool ? 'pool' : active.rule;
  const brief = /\b(brief|shorter|shorten|short|concise|summary only|executive summary)\b/i.test(text);
  const full = /\b(full|detailed|complete|all segments|full schedule)\b/i.test(text);
  const detail = brief ? 'brief' : full ? 'full' : previous?.detail || 'full';
  const roadId = text.match(/\bRD\d{4}\b/i)?.[0].toUpperCase();
  const explicitDraft = /\b(draft|redraft|regenerate|write|generate|memo|proposal|docx|word|download|prepare a (?:budget|note)|budget note|funding note)\b/i.test(text);
  const explanatory = /^(?:why|how|which|what (?:caused|explains|is left|remains)|explain|show)\b/i.test(text.trim());
  const askingAboutBalance = /headroom|balance|unallocated|remaining|left over/i.test(text) && explanatory;
  // A figure quoted in a question about an existing decision is evidence, not a new ceiling.
  const keepCeiling = explanatory && (askingAboutBalance || roadId) && !/\b(?:at|under|with) (?:a |an )?(?:new )?(?:budget|ceiling)\b/i.test(text);
  const budget = amounts.length && !keepCeiling ? String(amounts[0] / 100000) : active.budget;
  const ceiling = ceilingFromLakh(budget);
  if (ceiling === null || amounts.some(v => ceilingFromLakh(v / 100000) === null))
    return {error:'Enter a budget from ₹0 to ₹1,00,000 lakh, then try again.'};
  let kind;
  if (amounts.length > 1) {
    if (amounts.length !== 2 || !/compar|versus|\bvs\b|difference/i.test(text)) return {error:'Use one ceiling per draft, or ask me to compare two budgets.'};
    kind = 'compare';
  } else if (roadId && !noteMatch && (!explicitDraft || explanatory)) kind='road';
  else if (askingAboutBalance && !noteMatch) kind='balance';
  else if (explanatory && /warranty|\bdlp\b|holds?|held/i.test(text)) kind='warranty';
  else if (explanatory && /rank|priorit|risk|why (?:these|this) road/i.test(text)) kind='risk';
  else if (noteMatch || explicitDraft || (previous && (/\b(revise|update it|redo|note)\b/i.test(text) || brief || full || amounts.length || pool || wardRule))) kind='draft';
  else if (/warranty|\bdlp\b|liability|holds?|held/i.test(text)) kind='warranty';
  else if (/headroom|balance|unallocated|remaining|left over/i.test(text)) kind='balance';
  else if (/risk|priorit|why these|top road|highest/i.test(text)) kind='risk';
  else if (amounts.length || pool || wardRule || /allocat|budget|fund|spend|ceiling|where|which roads/i.test(text)) kind='allocation';
  else if (/^(why|how so|tell me more|explain|show me more)\b/i.test(text)) kind=['draft','road','compare'].includes(lastTopic) ? 'allocation' : lastTopic || 'allocation';
  else kind='general';
  return {kind,ward,budget,rule,ceiling,detail,note,amounts,roadId};
}

export function planningAnswer(kind,plan,data,settings) {
  const {rule,ceiling} = settings;
  const entry = plan.funded[0];
  const ruleText = rule === 'ward' ? 'The plan respects each ward’s remaining modeled headroom.' : 'This pooled estimate assumes the Commissioner can authorise funding transfers.';
  if (kind === 'road') {
    const road = data.candidates.find(r => r.id === settings.roadId);
    if (!road) return {text:settings.roadId+' is outside this ward selection. Choose its ward or select all Mumbai wards to inspect the segment.',roads:[]};
    const status = {funded:'The scenario includes this segment.',routine:'The segment is in the routine tier, below the priority threshold for this scenario.',
      dlp:'The scenario holds this segment for a warranty scope check.',headroom:'At its place in the ranking, the ward balance could not cover the estimated job.',
      ceiling:'At its place in the ranking, the remaining ceiling could not cover the estimated job.'}[plan.disposition[road.id]];
    return {text:road.name+' ('+road.id+', Ward '+road.ward+') has an estimated risk score of '+road.score.toFixed(1)+'/100. '+riskEvidence(road).join('. ')+'. '+status+' The modeled scope is '+road.method+' at '+rupees(road.estimate)+'.',roads:[road]};
  }
  if (kind === 'warranty') {
    const held = data.candidates.filter(v => v.tier !== 'Routine' && v.dlp);
    return {text:segmentCount(held.length) + (held.length === 1 ? ' is' : ' are') + ' held for a defect liability period check. The plan assigns ₹0 to those segments. Review each road’s recorded warranty status and contractor scope before budgeting another repair.',roads:held.slice(0,3)};
  }
  if (kind === 'balance') return {text:rupees(plan.left)+' remains from the '+rupees(ceiling)+' ceiling. '+number(plan.dlp)+' candidates were held for warranty review, '+number(plan.overCeiling)+' exceeded the remaining ceiling'+(rule==='ward'?' and '+number(plan.cap)+' exceeded the applicable ward balance':'')+'. Each candidate is counted at its first exclusion.',roads:[]};
  if (kind === 'risk') {
    const roads = data.candidates.slice(0,3);
    return {text:roads.length ? roads.map(r => r.name+' ('+r.id+') has an estimated risk score of '+r.score.toFixed(1)+'/100. '+riskEvidence(r).join('. ')+'.'+(r.dlp?' Hold for warranty review.':'')).join('\n\n') : 'There are no assessed road segments in this selection.',roads};
  }
  if (kind === 'allocation') return {text:'The estimated allocation is '+rupees(plan.allocated)+' across '+segmentCount(plan.funded.length)+', leaving '+rupees(plan.left)+'. '+ruleText+(entry?' The first funded segment is '+entry.name+' ('+entry.id+'). '+riskEvidence(entry).join('. ')+'.':' No eligible intervention fits this scenario.'),roads:plan.funded.slice(0,3)};
  return {text:'I can draft a Word budget proposal, compare two ceilings, explain the first road in the plan, or identify warranty holds. Try “Draft a ₹5 lakh proposal for Ward T”.',roads:[]};
}

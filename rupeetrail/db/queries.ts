import meta from './import/meta.json';
import {db,rows,first} from './runtime';
export type Role='pm'|'finance'|'sponsor';
const roleOf=(s:string|null):Role=>s==='sponsor'||s==='finance'?s:'pm';
const source={pm:'accountability',finance:'traceability',sponsor:'next_rupee'};
const fields={
 pm:'id,ward,road,road_name,contractor,contractor_name,issue,method,assigned,completed,area,qty,unit,rate,billed,benchmark,variance,variance_pct,price_flag,sla_met,sla_hours,elapsed,reopened,dlp,duplicate,linked,rain_mm',
 finance:'id,ward,ward_source,locality,locality_text,received,issue,status,channel,linked,followup,work_ids',
 sponsor:'id,ward,name,segment,orders,reopened,billed,dlp,score,tier,method,action,estimate,facilities,hotspot_name'};
const measure={
 pm:'COUNT(*) orders,SUM(billed) billed,SUM(benchmark) benchmark,SUM(sla_met) timely,SUM(reopened) reopened,SUM(price_flag) price,COUNT(duplicate) repeats,SUM(dlp) dlp,SUM(CASE WHEN duplicate IS NOT NULL THEN billed ELSE 0 END) repeat_bill,SUM(CASE WHEN price_flag=1 THEN variance ELSE 0 END) price_gap,SUM(dlp*billed) warranty_bill',
 finance:'COUNT(*) complaints,SUM(linked>0) linked,SUM(linked=0) unmatched,SUM(followup) followup',
 sponsor:"COUNT(*) roads,SUM(tier='High') high,SUM(tier='Elevated') elevated"};
const allFilters:Record<Role,Record<string,string>>={pm:{duplicate:'duplicate IS NOT NULL',price:'price_flag=1',dlp:'dlp=1',reopened:'reopened=1',late:'sla_met=0',ontime:'sla_met=1',review:'(duplicate IS NOT NULL OR price_flag=1 OR dlp=1)'},finance:{unmatched:'linked=0',linked:'linked>0',followup:'followup=1',other:'(linked=0 AND followup=0)',grouped:"status='Closed - Duplicate'"},sponsor:{high:"tier='High'",elevated:"tier='Elevated'",routine:"tier='Routine'",dlp:'dlp=1',flood:'hotspot IS NOT NULL'}};
function scope(ward:string|null){return {where:ward==='__unknown'?' WHERE ward IS NULL':ward?' WHERE ward=?':'',args:ward&&ward!=='__unknown'?[ward]:[]}}
export async function dashboard(p:URLSearchParams){
 if(p.get('role')==='lineage')return lineage();
 const role=roleOf(p.get('role')),ward=p.get('ward'),{where,args}=scope(ward);
 const [summary,wards,map]=await Promise.all([first('SELECT '+measure[role]+' FROM '+source[role]+where,...args),rows('SELECT ward_code code,ward_name name FROM wards ORDER BY ward_code'),rows('SELECT id,name,ward,lat1,lon1,lat2,lon2,orders,linked,reopened,score,tier FROM next_rupee'+where+' ORDER BY id',...args)]);
 const result:Record<string,unknown>={role,summary,wards,map};
 if(role==='pm'){
  const agg='COUNT(*) n,SUM(sla_met) timely,SUM(reopened) reopened,SUM(billed) billed,SUM(price_flag) price,SUM(sla_met=1 AND reopened=0 AND price_flag=0) delivered,SUM(CASE WHEN sla_met=1 AND reopened=0 AND price_flag=0 THEN billed ELSE 0 END) delivered_billed,ROUND(MIN(100,MAX(0,?+SUM(raw_score-case_score)/(COUNT(*)+20.0))),1) score';
  const [contractors,wardScores,example]=await Promise.all([rows('SELECT contractor id,contractor_name name,'+agg+' FROM accountability'+where+' GROUP BY contractor ORDER BY score DESC,id',meta.cityScore,...args),rows('SELECT ward id,(SELECT ward_name FROM wards WHERE ward_code=a.ward) name,'+agg+' FROM accountability a'+where+' GROUP BY ward ORDER BY score DESC,id',meta.cityScore,...args),first('SELECT '+fields.pm+' FROM accountability'+where+(where?' AND ':' WHERE ')+'duplicate IS NOT NULL ORDER BY billed DESC,id LIMIT 1',...args)]);
  Object.assign(result,{contractors,wardScores,example});
 }
 if(role==='finance'){
  const [gaps,example]=await Promise.all([rows('SELECT ward,COUNT(*) n FROM traceability'+where+(where?' AND ':' WHERE ')+'linked=0 GROUP BY ward ORDER BY n DESC,ward LIMIT 3',...args),first("SELECT t.id,t.locality_text FROM traceability t JOIN complaint_links l ON l.complaint_id=t.id JOIN accountability a ON a.id=l.work_order_id WHERE t.status='Resolved' AND EXISTS(SELECT 1 FROM accountability later WHERE later.duplicate=a.id)"+(ward==='__unknown'?' AND t.ward IS NULL':ward?' AND t.ward=?':'')+' ORDER BY a.billed DESC,t.id LIMIT 1',...args)]);Object.assign(result,{gaps,example});
 }
 if(role==='sponsor')Object.assign(result,await budgetInputs(ward));
 return result;
}
export async function budgetInputs(ward:string|null){
 const {where,args}=scope(ward);
 const riskFields='vehicles,heavy,wet_days,compound,road_accidents,hospitals,schools,flood_points,traffic_points,safety_points,access_points,history_points,qty,unit,rate';
 const [candidates,budgets]=await Promise.all([
  rows('SELECT '+fields.sponsor+','+riskFields+' FROM next_rupee'+where+' ORDER BY score DESC,estimate,id',...args),
  rows("SELECT w.ward_code ward,w.ward_name name,w.monsoon_repair_budget_inr_2025 budget,COALESCE(SUM(a.billed),0) billed FROM wards w LEFT JOIN accountability a ON a.ward=w.ward_code AND a.completed>='2025-06-01' AND a.completed<'2025-10-01'"+(ward?' WHERE w.ward_code=?':'')+' GROUP BY w.ward_code ORDER BY w.ward_code',...(ward?[ward]:[]))
 ]);
 return {candidates,budgets};
}
export async function register(p:URLSearchParams){
 const role=roleOf(p.get('role')),condition:string[]=[],params:(string|number)[]=[],ward=p.get('ward'),f=p.get('filter')||'';
 if(ward==='__unknown')condition.push('ward IS NULL');else if(ward){condition.push('ward=?');params.push(ward)}
 if(Object.hasOwn(allFilters[role],f))condition.push(allFilters[role][f]);
 for(const key of role==='pm'?['contractor','road']:role==='finance'?['status']:[]){const v=p.get(key);if(v){condition.push(key+'=?');params.push(v)}}
 const q=(p.get('q')||'').trim().toLowerCase().slice(0,150);if(q){condition.push("search LIKE ? ESCAPE '!'");params.push('%'+q.replace(/[!%_]/g,c=>'!'+c)+'%')}
 const where=condition.length?' WHERE '+condition.join(' AND '):'',size=12;
 const total=(await first<{n:number}>('SELECT COUNT(*) n FROM '+source[role]+where,...params))!.n;
 const page=Math.min(Math.max(1,Math.ceil(total/size)),Math.max(1,Math.floor(Number(p.get('page')))||1));
 const sort=role==='pm'?(f==='price'?'variance_pct DESC,id':f==='duplicate'?'billed DESC,id':'assigned DESC,id DESC'):role==='finance'?'received DESC,id DESC':'score DESC,estimate,id';
 return {total,size,page,rows:await rows('SELECT '+fields[role]+' FROM '+source[role]+where+' ORDER BY '+sort+' LIMIT ? OFFSET ?',...params,size,(page-1)*size)};
}
export async function record(kind:string|null,id:string|null){
 if(!id||id.length>40)return null;
 if(kind==='order'){
  const item=await first('SELECT '+fields.pm+' FROM accountability WHERE id=?',id);if(!item)return null;
  const [source,road,ward,complaints,pairs]=await Promise.all([first('SELECT work_started_at,engineer_remark FROM work_orders WHERE work_order_id=?',id),first('SELECT last_resurfaced,under_dlp,surface FROM roads WHERE road_id=?',item.road),first('SELECT ward_name,low_lying_index FROM wards WHERE ward_code=?',item.ward),rows('SELECT t.id,t.issue,t.status,t.received FROM complaint_links l JOIN traceability t ON t.id=l.complaint_id WHERE l.work_order_id=? ORDER BY t.received',id),rows('SELECT '+fields.pm+' FROM accountability WHERE id=? OR duplicate=? ORDER BY assigned',item.duplicate,id)]);return {kind,item,source,road,ward,complaints,pairs};
 }
 if(kind==='complaint'){
  const item=await first('SELECT '+fields.finance+' FROM traceability WHERE id=?',id);if(!item)return null;
  const [source,ward,works,related]=await Promise.all([first('SELECT description,photo_description,language,resolved_at FROM complaints WHERE complaint_id=?',id),first('SELECT ward_name FROM wards WHERE ward_code=?',item.ward),rows('SELECT a.id,a.road,a.road_name,a.contractor_name,a.issue,a.method,a.billed,a.completed FROM complaint_links l JOIN accountability a ON a.id=l.work_order_id WHERE l.complaint_id=? ORDER BY a.assigned',id),rows('SELECT DISTINCT t.id,t.status,t.locality_text FROM complaint_links l JOIN complaint_links l2 ON l2.work_order_id=l.work_order_id JOIN traceability t ON t.id=l2.complaint_id WHERE l.complaint_id=? AND t.id<>? ORDER BY t.id',id,id)]);return {kind,item,source,ward,works,related};
 }
 if(kind==='road'){
  const item=await first('SELECT * FROM next_rupee WHERE id=?',id);if(!item)return null;delete item.search;
  const [source,ward,works,accidents,facilities,flood,weather]=await Promise.all([first('SELECT * FROM roads WHERE road_id=?',id),first('SELECT ward_name,low_lying_index FROM wards WHERE ward_code=?',item.ward),rows('SELECT '+fields.pm+' FROM accountability WHERE road=? ORDER BY completed DESC,id',id),rows('SELECT accident_id,occurred_at,severity,probable_cause FROM accidents WHERE road_id=? ORDER BY occurred_at DESC',id),rows('SELECT facility_id,type,name FROM facilities WHERE ambulance_entry_road=? ORDER BY type,name',id),first('SELECT * FROM flood_hotspots WHERE hotspot_id=?',item.hotspot),rows('SELECT r.date,r.rainfall_mm,MAX(t.height_m) tide_m FROM rainfall_daily r JOIN tides t ON t.date=r.date WHERE r.station=? AND r.rainfall_mm>=(SELECT flood_threshold_mm_per_day FROM flood_hotspots WHERE hotspot_id=?) GROUP BY r.date ORDER BY r.rainfall_mm DESC LIMIT 5',item.station,item.hotspot)]);return {kind,item,source,ward,works,accidents,facilities,flood,weather};
 }return null;
}
async function lineage(){
 const raw=Object.keys(meta.counts).filter(t=>!['complaint_links','traceability','accountability','next_rupee','source_catalog','import_state'].includes(t));
 const checks=[
 'SELECT COUNT(*) complaints FROM complaints',
 'SELECT COUNT(*) traces,COUNT(DISTINCT id) trace_keys,SUM(linked>0) linked,SUM(linked=0) unmatched,SUM(linked) trace_edges FROM traceability',
 'SELECT COUNT(*) edges FROM complaint_links',
 'SELECT COUNT(*) orders,SUM(cost_inr) raw_billed FROM work_orders',
 'SELECT COUNT(*) order_rows,COUNT(DISTINCT id) order_keys,SUM(billed) billed,SUM(linked) finance_edges,SUM(linked=0) unlinked_orders FROM accountability',
 'SELECT COUNT(*) roads FROM roads',
 'SELECT COUNT(*) road_rows,COUNT(DISTINCT id) road_keys,SUM(billed) road_billed,SUM(accidents) road_accidents,SUM(facilities) road_facilities,SUM(orders=0) no_history,SUM(hotspot IS NOT NULL) hotspot_roads FROM next_rupee',
 'SELECT COUNT(*) accidents FROM accidents','SELECT COUNT(*) facilities FROM facilities'];
 const conn=db();const [sources,counts,results]=await Promise.all([rows('SELECT * FROM source_catalog ORDER BY file'),conn.batch<{n:number}>(raw.map(t=>conn.prepare('SELECT COUNT(*) n FROM '+t))),conn.batch(checks.map(s=>conn.prepare(s)))]);
 return {sources,counts:Object.fromEntries(raw.map((t,i)=>[t,counts[i].results[0].n])),checks:Object.assign({},...results.map(x=>x.results[0])),commit:meta.commit};
}

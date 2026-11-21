'use client';
import {useState} from 'react';
import {FilePenLine,MessagesSquare} from 'lucide-react';
import {n} from './civic';

const prompts={
 pm:['Which charges need review?','How did contractors perform?'],
 finance:['Which complaints need follow-up?','How many reports link to repairs?']
};
function evidence(role,q,data,open,records){
 const s=data.summary, actions=[];
 const register=(label,filter)=>actions.push({label,run:()=>records(filter)});
 let answer;
 if(role==='pm' && /contractor|perform|deliver|sla|time|reopen/i.test(q)){
  answer=n(s.timely)+' of '+n(s.orders)+' orders met the reported SLA. '+n(s.reopened)+' reopened within 30 days. '+data.contractors.slice(0,3).map(v=>v.name+' scored '+v.score+'/100 across '+n(v.n)+' orders').join('. ')+'. Scores adjust for work mix.';
  for(const v of data.contractors.slice(0,2)) actions.push({label:v.name,run:()=>records('',v.id)});
 }else if(role==='pm' && /charge|bill|review|rate|duplicate|warranty|cost|dlp/i.test(q)){
  answer=n(s.price)+' orders exceeded the rate benchmark by more than 30%. '+n(s.repeats)+' carried a repeat-charge flag and '+n(s.dlp)+' require a warranty scope check. These flags can overlap. Compare the linked order and recorded scope before drawing a conclusion.';
  register('Review rate exceptions','price');if(data.example)actions.push({label:data.example.id,run:()=>open('order',data.example.id)});
 }else if(role==='finance' && /complaint|follow|report|link|repair|work/i.test(q)){
  answer=n(s.linked)+' of '+n(s.complaints)+' complaints have a recorded work-order link. '+n(s.unmatched)+' have no link, including '+n(s.followup)+' open or in-progress complaints. '+(data.gaps[0]?'The largest unlinked group is '+(data.gaps[0].ward?'Ward '+data.gaps[0].ward:'the unassigned ward group')+' with '+n(data.gaps[0].n)+' complaints.':'');
  register('Inspect unlinked complaints','unmatched');register('Inspect linked complaints','linked');
 }else answer='I need a more specific dashboard question. Try “'+prompts[role][0]+'” or “'+prompts[role][1]+'”.';
 return {answer,actions};
}
export default function Chat({role,ward,data,open,records}){
 const [q,setQ]=useState(''),[turns,setTurns]=useState([]),[busy,setBusy]=useState(false);
 async function ask(question){
  const input=question.trim();if(!input||busy)return;
  setQ('');setBusy(true);
  const previous=turns.at(-1);
  const context=previous&&/^(why|explain|tell me more|and what|what about|show me more)/i.test(input)?previous.q+' '+input:input;
  const local=evidence(role,context,data,open,records);
  let answer=local.answer,engine='Dashboard data';
  try{const response=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({question:input,previous:previous?.answer,role,ward:ward||'All Mumbai',summary:data.summary,evidence:answer})});const result=await response.json();if(result.answer){answer=result.answer;engine='Claude'}}catch{}
  setTurns(v=>[...v.slice(-7),{q:input,answer,engine,actions:local.actions}]);setBusy(false);
 }
 return <div className="evidence-tools"><details className="panel trail-chat"><summary><MessagesSquare size={19}/> {role==='pm'?'Ask about contractor delivery':'Ask about citizen complaints'} <small>{ward==='__unknown'?'Unassigned ward':ward?'Ward '+ward:'All Mumbai'}</small></summary><div className="chat-inner"><div className="chat-actions">{prompts[role].map(v=><button disabled={busy} key={v} onClick={()=>ask(v)}>{v}</button>)}</div><div aria-live="polite">{turns.map((v,i)=><article key={i}><b>{v.q}</b><p>{v.answer}</p><small>{v.engine} · Synthetic records</small><div className="chat-actions">{v.actions.map(a=><button key={a.label} onClick={a.run}>{a.label}</button>)}</div></article>)}{busy&&<p>Checking ward evidence…</p>}</div><form onSubmit={e=>{e.preventDefault();ask(q)}}><input aria-label="Question for RupeeTrail" value={q} maxLength={500} onChange={e=>setQ(e.target.value)} placeholder="Ask about this dashboard…"/><button disabled={busy||!q.trim()}>Ask</button></form></div></details><a className="planner-entry" href={'/sponsor'+(ward&&ward!=='__unknown'?'?ward='+encodeURIComponent(ward):'')+'#ward-assistant'}><FilePenLine size={18}/> Draft a ward budget</a></div>
}

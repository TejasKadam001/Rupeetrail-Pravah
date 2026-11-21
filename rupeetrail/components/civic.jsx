'use client';
import {useEffect,useState} from 'react';
import {BriefcaseBusiness,Compass,Route,MapPin,Network,ChevronDown,Search,Database,Activity} from 'lucide-react';
export const n=v=>new Intl.NumberFormat('en-IN').format(Number(v)||0);
export const money=v=>{const a=Math.round(Number(v)||0);return (a<0?'−':'')+'₹'+n(Math.abs(a))};
export const short=v=>{const a=Number(v)||0,b=Math.abs(a),s=a<0?'−':'';return b>=1e7?s+'₹'+(b/1e7).toFixed(2)+' cr':b>=1e5?s+'₹'+(b/1e5).toFixed(2)+' L':money(a)};
export const pc=(a,b)=>b?(a*100/b).toFixed(1)+'%':'—';
export const date=(s,time=false)=>{if(!s)return 'Not recorded';const [dt,clock]=s.split(' ');return new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'}).format(new Date(dt+'T00:00:00Z'))+(time&&clock?' · '+clock+' IST':'')};
export const config={pm:['Contractor Value Delivery','Contractor delivery & value','Evaluate billed work, delivery against SLA and repairs that reopened.','/',BriefcaseBusiness],finance:['Citizen Feedback Analysis','Complaint-to-repair traceability','Follow a citizen report to its work order, contractor and road segment.','/finance',Route],sponsor:['Ward Officer Budget Planner','Next rupee intelligence','Prioritise road segments for the MCGM Commissioner’s next funding decision.','/sponsor',Compass]};
export const qs=(url,params)=>{const p=new URLSearchParams;for(const [k,v] of Object.entries(params))if(v!==''&&v!=null)p.set(k,String(v));return url+'?'+p};
export function useAPI(url,initial=null,initialUrl=null){
 const [state,save]=useState({url:null}),[attempt,bump]=useState(0);
 useEffect(()=>{if(!url||(initial&&url===initialUrl&&!attempt))return;const c=new AbortController;
 (async()=>{try{for(let i=0;i<25;i++){const r=await fetch(url,{cache:'no-store',signal:c.signal}),d=await r.json();if(r.status===202&&d.initializing){await new Promise(a=>setTimeout(a,100));continue}if(!r.ok)throw Error(d.error||'Data unavailable.');save({url,data:d});return}throw Error('Data preparation is still finishing. Please retry.')}catch(e){if(!c.signal.aborted)save({url,error:e.message})}})();
 return()=>c.abort()},[url,attempt,initial,initialUrl]);return {data:state.url===url?state.data:url===initialUrl?initial:null,error:state.url===url?state.error:null,retry:()=>{save({url:null});bump(v=>v+1)}}
}
export function Head({role,ward=''}){
 return <header className="top"><div className="navbox"><div className="brandbox"><a className="brand" aria-label="RupeeTrail home" href="/"><svg viewBox="0 0 40 40" width="36" height="36" aria-hidden="true"><rect width="40" height="40" rx="11" fill="#096a60"/><path d="m8 29 9-13q2-3 4 .2l2 3q2 3 4-1l5-8" fill="none" stroke="white" strokeWidth="3.2" strokeLinecap="round"/><circle cx="8" cy="29" r="3" fill="#b8efc6"/><circle cx="32" cy="10" r="2.5" fill="#b8efc6"/></svg><b>Rupee<em>Trail</em></b></a><span className="brand-loc"><MapPin size={14}/>Mumbai</span></div><nav aria-label="Dashboard navigation">{Object.entries(config).map(([id,[label,,,url,Icon]])=><a key={id} aria-current={id===role?'page':undefined} href={url+(ward&&ward!=='__unknown'?'?ward='+encodeURIComponent(ward):'')}><Icon size={16}/>{label}</a>)}</nav><a href="/lineage" className="nav-source" aria-current={role==='lineage'?'page':undefined}><Network size={17}/>Source lineage</a></div></header>
}
export function Foot(){return <footer><div><b>RupeeTrail</b> Synthetic civic data · Mumbai monsoon 2025</div><a href="/lineage"><Database size={14}/> Sources &amp; methodology</a></footer>}
export function Select({name,value,onChange,children,icon:Icon}){return <label className="select">{Icon&&<Icon size={16}/>}<select aria-label={name} value={value} onChange={e=>onChange(e.target.value)}>{children}</select><ChevronDown size={14}/></label>}
export function Find({value,change,name='Search records',placeholder}){return <label className="search"><Search size={16}/><input type="search" aria-label={name} placeholder={placeholder} value={value} onChange={e=>change(e.target.value)}/></label>}
export function Badge({children,tone=''}){return <span className={'badge '+tone}>{children}</span>}
export function Kpi({icon:Icon,label,value,detail,tone='teal',title}){return <div className="kpi"><div className="kpi-label"><i className={'iconbox '+tone}><Icon size={17}/></i>{label}</div><strong title={title}>{value}</strong><small>{detail}</small></div>}
export function CardHead({title,desc,right}){return <div className="card-head"><div><h2>{title}</h2>{desc&&<p>{desc}</p>}</div>{right}</div>}
export function Loading({error,retry}){return <div className="empty" role="status">{error?<><p>{error}</p><button className="btn" onClick={retry}>Retry</button></>:<><i className="spinner"/>Loading records…</>}</div>}
export function Empty({title='No matching records',desc='Try a different search or filter.',clear}){return <div className="empty"><Activity size={23}/><b>{title}</b><p>{desc}</p>{clear&&<button className="link" onClick={clear}>Clear filters</button>}</div>}
export function Facts({data}){return <dl className="facts">{data.map(([k,v])=><div key={k}><dt>{k}</dt><dd>{v??'Not recorded'}</dd></div>)}</dl>}
export function Tabs({items,tab,onChange}){return <div className="tabs" role="tablist">{items.map(([id,label])=><button key={id} role="tab" aria-selected={id===tab} onClick={()=>onChange(id)}>{label}</button>)}</div>}

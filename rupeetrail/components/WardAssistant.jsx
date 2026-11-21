'use client';
import {useEffect, useRef, useState} from 'react';
import {Download, FilePenLine, FileText, MapPin, MessageSquareText, Send, Sparkles} from 'lucide-react';
import {allocate, ceilingFromLakh, ruleNames} from '../lib/allocate';
import {number, rupees, segmentCount} from '../lib/budget-proposal';
import {planningAnswer, planningIntent} from '../lib/planning-chat';

const wordType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

async function generate(settings, signal) {
  const parameters = Object.fromEntries(['ward','ceiling','rule','detail','note'].map(key => [key,settings[key]]));
  for (let attempt = 0; attempt < 25; attempt++) {
    const response = await fetch('/api/budget-draft',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(parameters),signal});
    const result = await response.json();
    if (response.status === 202 && result.initializing) continue;
    if (!response.ok || !result.file) throw Error(result.error || 'The Word draft could not be prepared. Please retry.');
    const bytes = Uint8Array.from(atob(result.file),char => char.charCodeAt(0));
    return {draft:result.draft,filename:result.filename,engine:result.engine,blob:new Blob([bytes],{type:wordType})};
  }
  throw Error('Ward records are still loading. Please retry in a moment.');
}

function DraftCard({file, stale, open, revise}) {
  const {draft,filename,url} = file;
  return <section className="draft-file" aria-label="Generated Word draft">
    <div className="draft-file-head">
      <span className="word-icon" aria-hidden="true"><FileText size={26}/></span>
      <div className="draft-file-title"><small>{stale?'Earlier scenario':'Word draft ready'} · .docx</small><h3>{draft.title}</h3>
        <p>{draft.scope} · {rupees(draft.ceiling)} ceiling · {draft.ruleName}</p></div>
      <a className="word-download" download={filename} href={url}><Download size={16}/>Download Word</a>
    </div>
    {stale && <p className="draft-status">The planner settings have changed. <button type="button" onClick={revise}>Generate the current draft</button></p>}
    <details className="draft-preview">
      <summary>Preview draft</summary>
      <div className="draft-paper"><small>{draft.date} · Synthetic planning estimates</small><h3>{draft.title}</h3>
        <p className="draft-addressee">To the Municipal Commissioner, MCGM</p><h4>Decision requested</h4><p>{draft.decision}</p>
        <h4>Funding basis</h4><p>{draft.ruleText} {draft.baseline}</p>
         {draft.detail==='full' && draft.rows[0] && <><h4>First priority</h4><p>{draft.rows[0].name} ({draft.rows[0].id}) · {draft.rows[0].score.toFixed(1)}/100 estimated risk. {draft.rows[0].evidence.join('. ')}. {draft.rows[0].action}.</p></>}
        <h4>Checks before approval</h4><p>{draft.controls.filter((_,i) => !(draft.rule==='pool' && i===1)).join(' ')} {draft.release} {draft.fieldNote}</p>
        {draft.note && <><h4>Ward officer note</h4><p className="officer-note">{draft.note}</p></>}
        {draft.rows.length>0 && <><h4>Proposed road works</h4><p>{draft.shownLabel}</p>
          <div className="draft-road-list">{draft.rows.map(road => <button key={road.id} onClick={() => open('road',road.id)}>
            <span><b>{road.name} · {road.id}</b><small>Ward {road.ward} · {road.method} · {road.score.toFixed(1)}/100</small></span><strong>{rupees(road.estimate)}</strong></button>)}</div></>}
        <h4>Evidence and assumptions</h4><p>{draft.model}</p><a href="/lineage">Source lineage and join checks</a>
      </div>
    </details>
  </section>;
}

export default function WardAssistant({ward, data, scenario, setScenario, request, requestInPlanner, open}) {
  const [question,setQuestion]=useState(''),[turns,setTurns]=useState([]),[file,setFile]=useState(null),[busy,setBusy]=useState('');
  const input=useRef(null), lastRequest=useRef(null), active=useRef(null), objectUrl=useRef(null), log=useRef(null);
  const ceiling=ceilingFromLakh(scenario.budget);
  const scope=ward ? 'Ward '+ward : 'All Mumbai wards';
  const stale=file && (file.draft.ceiling !== ceiling || file.draft.rule !== scenario.rule || file.draft.ward !== ward);
  useEffect(() => () => {
    active.current?.abort();
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
  },[]);
  useEffect(() => { if(log.current) log.current.scrollTop=log.current.scrollHeight; },[turns,busy]);

  async function ask(raw, resolved) {
    const text=raw.trim();
    if (!text || active.current) return;
    setQuestion('');
    const intent=resolved || planningIntent(text,{...scenario,ward},data.wards,file?.draft,turns.at(-1)?.kind);
    if (intent.error) {
      setTurns(old => [...old.slice(-4),{q:text,text:intent.error,roads:[]}]);return;
    }
    if (intent.ward !== ward) {requestInPlanner({ward:intent.ward,question:text,intent});return;}
    const controller=new AbortController();
    active.current=controller;
    const kind=intent.kind;
    setBusy(kind==='draft'?'Preparing your Word draft…':'Checking the scenario…');
    setTurns(old => [...old.slice(-4),{q:text,kind,text:'',roads:[]}]);
    const respond=(answer) => {if (!controller.signal.aborted) setTurns(old => [...old.slice(0,-1),{q:text,kind,...answer}]);};
    try {
      if (kind!=='compare' && (intent.budget !== scenario.budget || intent.rule !== scenario.rule)) setScenario({budget:intent.budget,rule:intent.rule});
      if (kind==='draft') {
        const result=await generate(intent,controller.signal);
        if (controller.signal.aborted) return;
        if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
        const url=URL.createObjectURL(result.blob);
        objectUrl.current=url;
        setFile({draft:result.draft,url,filename:result.filename});
        const d=result.draft;
        respond({text:'Prepared the '+(d.detail==='brief'?'brief':'budget proposal')+' for '+scope+'. It proposes '+rupees(d.allocated)+' across '+segmentCount(d.total)+' and leaves '+rupees(d.left)+' unallocated.',engine:result.engine,roads:[]});
        return;
      }
      if (kind==='compare') {
        const rows=intent.amounts.map(amount => {
          const plan=allocate(data.candidates,data.budgets,Math.round(amount),intent.rule==='ward');
          return rupees(amount)+' ceiling: '+rupees(plan.allocated)+' proposed across '+segmentCount(plan.funded.length)+', with '+rupees(plan.left)+' unallocated.';
        });
        respond({text:rows.join('\n')+'\nBoth estimates use the same rule: '+ruleNames[intent.rule]+'.',roads:[],engine:'Scenario data'});return;
      }
      const plan=allocate(data.candidates,data.budgets,intent.ceiling,intent.rule==='ward');
      const answer=planningAnswer(kind,plan,data,intent);
      let engine='Scenario data';
      if (kind === 'general') {
        try {
          const summary={ceiling:intent.ceiling,rule:intent.rule,allocated:plan.allocated,left:plan.left,dlp:plan.dlp,
            firstProposals:plan.funded.slice(0,3).map(r => ({id:r.id,scope:r.method,estimate:r.estimate,score:r.score}))};
          const r=await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},signal:controller.signal,
            body:JSON.stringify({role:'Ward officer',ward:scope,question:text,previous:turns.at(-1)?.text,summary})});
          const d=await r.json();if(d.answer){answer.text=d.answer;engine='Claude';}
        } catch { /* The grounded planning actions also work without a model connection. */ }
      }
      respond({...answer,engine});
    } catch (error) {
      respond({text:error.message||'The request could not be completed. Please try again.',roads:[],error:true});
    } finally {
      if (active.current===controller) {active.current=null;if(!controller.signal.aborted)setBusy('');}
    }
  }

  useEffect(() => {
    if (!request || request.ward!==ward || request.id===lastRequest.current) return;
    lastRequest.current=request.id;
    ask(request.question,request.intent);
  },[request,ward]);

  return <section id="ward-assistant" className="officer-assistant" aria-labelledby="assistant-title">
    <div className="assistant-banner">
      <div className="assistant-identity"><span className="assistant-symbol"><Sparkles size={25}/></span><div><h2 id="assistant-title">Ward officer assistant</h2>
        <p>Draft the Commissioner’s budget note from the roads and costs in your plan.</p></div></div>
      <button className="generate-word" disabled={!!busy||ceiling===null} onClick={() => ask('Generate a full Word budget draft')}><FilePenLine size={18}/>Generate Word draft</button>
    </div>
    <div className="assistant-settings">
      <span className="assistant-scope"><MapPin size={15}/>{scope}</span>
      <label>Budget ceiling (₹ lakh)<input type="number" min="0" max="100000" step="any" aria-label="Scenario budget in lakh rupees" value={scenario.budget} onChange={e => setScenario({...scenario,budget:e.target.value})}/></label>
      <label>Allocation rule<select value={scenario.rule} aria-label="Allocation rule" onChange={e => setScenario({...scenario,rule:e.target.value})}>
        {Object.entries(ruleNames).map(([key,label]) => <option key={key} value={key}>{label}</option>)}</select></label>
    </div>
    {ceiling===null && <p className="assistant-validation" role="alert">Enter a budget from 0 to 1,00,000 lakh to generate a draft.</p>}
    <div className="assistant-content">
      {turns.length>0 && <div className="planner-log" role="log" aria-label="Planning conversation" ref={log}>
        {turns.map((turn,i) => <div className="planner-turn" key={i}><div className="planner-question">{turn.q}</div>
          {turn.text && <div className="planner-reply"><MessageSquareText size={17}/><div><p>{turn.text}</p>{turn.engine&&<small>{turn.engine}</small>}
            {turn.roads?.length>0 && <div className="road-refs">{turn.roads.map(r => <button type="button" key={r.id} onClick={() => open('road',r.id)}>{r.id} · {r.name}</button>)}</div>}
            {turn.error && <button className="retry-draft" disabled={!!busy} onClick={() => ask(turn.q)}>Retry request</button>}
          </div></div>}</div>)}{busy&&<p className="assistant-working" role="status">{busy}</p>}
      </div>}
      {file && <DraftCard file={file} open={open} stale={stale} revise={() => ask('Generate a full Word budget draft')}/>}
      <form className="planner-composer" onSubmit={e => {e.preventDefault();ask(question);}}>
        <MessageSquareText size={18}/><input ref={input} value={question} aria-label="Message the ward officer assistant" placeholder="Ask about this plan or request a Word draft…" maxLength={1000} onChange={e => setQuestion(e.target.value)}/>
        <button type="submit" aria-label="Send message" disabled={!!busy||!question.trim()}><Send size={17}/><span>Send</span></button>
      </form>
      <div className="planner-prompts">
        <button disabled={!!busy} onClick={() => ask('Explain this allocation')}>Explain this allocation</button>
        <button disabled={!!busy} onClick={() => ask('Show warranty holds')}>Show warranty holds</button>
        {file ? <><button disabled={!!busy} onClick={() => ask(file.draft.detail==='brief'?'Generate the full proposal':'Make it a short brief')}>{file.draft.detail==='brief'?'Generate full proposal':'Make it shorter'}</button>
          <button disabled={!!busy} onClick={() => {setQuestion('Add an officer note: ');input.current?.focus();}}>Add an officer note</button></> :
          <button disabled={!!busy} onClick={() => ask('Compare ₹5 lakh and ₹10 lakh')}>Compare ₹5L and ₹10L</button>}
      </div>
    </div>
  </section>;
}

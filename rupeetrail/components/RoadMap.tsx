'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import mapLabels from '../public/geo/labels.json'
import './road-map.css'

export type MapRoad = {
  id: string
  name: string
  ward: string
  lat1: number
  lon1: number
  lat2: number
  lon2: number
  orders: number
  linked: number
  reopened: number
  score: number
  tier: string
}

type Mode = 'pm' | 'sponsor'
type Props = { roads: MapRoad[]; onSelect: (id: string) => void; mode: Mode }
type Point = { x:number; y:number }
type Size = { w:number; h:number }
type Segment = { road:MapRoad; start:Point; end:Point; color:string; rank:number }
type Camera = { key:string; zoom:number; northUp:boolean; offset:Point }

const plane = { w:1200, h:990, west:72.55, east:73.23, north:19.36, south:18.83 }
const metresPerUnit = 111320*Math.cos(19.1*Math.PI/180)*(plane.east-plane.west)/plane.w
const clamp = (value:number, min:number, max:number)=>Math.max(min,Math.min(max,value))

function project(lon:number,lat:number):Point {
  return { x:(lon-plane.west)/(plane.east-plane.west)*plane.w, y:(plane.north-lat)/(plane.north-plane.south)*plane.h }
}
function rotate({x,y}:Point,cos:number,sin:number):Point {
  return {x:x*cos-y*sin,y:x*sin+y*cos}
}
function colorFor(road:MapRoad,mode:Mode) {
  if(mode==='sponsor') {
    if(road.tier.toLowerCase()==='high') return {color:'#b84b36',rank:2}
    if(road.tier.toLowerCase()==='elevated') return {color:'#c87d20',rank:1}
    return {color:'#167e70',rank:0}
  }
  if(road.reopened>0) return {color:'#c87d20',rank:2}
  if(road.linked>0) return {color:'#167e70',rank:1}
  return {color:'#839094',rank:0}
}
function defaultCamera(key:string):Camera {
  return {key,zoom:1,northUp:false,offset:{x:0,y:0}}
}
function fit(segments:Segment[],size:Size,degrees:number) {
  const radians=degrees*Math.PI/180
  const cos=Math.cos(radians),sin=Math.sin(radians)
  let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity
  for(const seg of segments) {
    for(const p of [seg.start,seg.end]) {
      const q=rotate(p,cos,sin)
      minX=Math.min(minX,q.x); minY=Math.min(minY,q.y)
      maxX=Math.max(maxX,q.x); maxY=Math.max(maxY,q.y)
    }
  }
  if(!segments.length) {
    minX=-388;maxX=264;minY=482;maxY=769
  }
  const center=segments.length
    ? rotate({x:(minX+maxX)/2,y:(minY+maxY)/2},cos,-sin)
    : project(72.88,19.08)
  const margin=size.w<520?54:76
  const fitScale=Math.min((size.w-margin)/Math.max(1,maxX-minX),(size.h-48)/Math.max(1,maxY-minY))
  const edgeScale=Math.max((Math.abs(cos)*size.w+Math.abs(sin)*size.h)/plane.w,(Math.abs(sin)*size.w+Math.abs(cos)*size.h)/plane.h)
  return {center,scale:Math.max(edgeScale,Math.min(fitScale,3.8)),cos,sin}
}
function clampCenter(p:Point,size:Size,cos:number,sin:number,scale:number):Point {
  const hx=Math.min(plane.w/2,(Math.abs(cos)*size.w+Math.abs(sin)*size.h)/(2*scale))
  const hy=Math.min(plane.h/2,(Math.abs(sin)*size.w+Math.abs(cos)*size.h)/(2*scale))
  return {x:clamp(p.x,hx,plane.w-hx),y:clamp(p.y,hy,plane.h-hy)}
}
function screenCoord(p:Point,center:Point,size:Size,scale:number,cos:number,sin:number):Point {
  const q=rotate({x:p.x-center.x,y:p.y-center.y},cos,sin)
  return {x:size.w/2+q.x*scale,y:size.h/2+q.y*scale}
}
function placeLabels(size:Size,position:(p:Point)=>Point,scale:number) {
  const boxes=[
    {left:5,right:49,top:4,bottom:59},
    {left:size.w-56,right:size.w,top:2,bottom:120},
    {left:0,right:size.w,top:size.h-21,bottom:size.h}
  ]
  const result:{name:string;kind:string;x:number;y:number}[]=[]
  for(const label of mapLabels) {
    if(scale<label.detail) continue
    const p=position(project(label.lon,label.lat))
    const half=label.name.length*(label.kind==='water'?3.6:3.3)+5
    const offsets=label.kind==='water'?[[0,0]]:[[0,-8],[0,14],[7,-15],[-7,20]]
    for(const [dx,dy] of offsets) {
      const x=p.x+dx,y=p.y+dy
      if(x-half<4 || x+half>size.w-4 || y<13 || y>size.h-18) continue
      const box={left:x-half,right:x+half,top:y-10,bottom:y+6}
      if(boxes.some(b=>box.left<b.right && box.right>b.left && box.top<b.bottom && box.bottom>b.top)) continue
      result.push({name:label.name,kind:label.kind,x,y})
      boxes.push(box)
      break
    }
  }
  return result
}
function ControlIcon({kind}:{kind:'plus'|'minus'|'fit'}) {
  return <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true" stroke="currentColor" strokeWidth="1.65" strokeLinecap="round" strokeLinejoin="round">
    {kind==='plus' && <path d="M4 10h12M10 4v12"/>}
    {kind==='minus' && <path d="M4 10h12"/>}
    {kind==='fit' && <><path d="M7 3H3v4m10-4h4v4M3 13v4h4m6 0h4v-4"/><circle cx="10" cy="10" r="1.6"/></>}
  </svg>
}

export default function RoadMap({roads,onSelect,mode}:Props) {
  const wrap=useRef<HTMLDivElement>(null)
  const desc=useId()
  const [size,setSize]=useState<Size>({w:760,h:320})
  useEffect(()=>{
    const node=wrap.current
    if(!node) return
    const measure=()=>{
      const {width,height}=node.getBoundingClientRect()
      if(width>0 && height>0) setSize(s=>s.w===width && s.h===height?s:{w:width,h:height})
    }
    measure()
    const observer=new ResizeObserver(measure)
    observer.observe(node)
    return ()=>observer.disconnect()
  },[])
  const segments=useMemo(()=>roads.filter(r=>[r.lat1,r.lon1,r.lat2,r.lon2].every(Number.isFinite)).map(road=>({
    road,start:project(road.lon1,road.lat1),end:project(road.lon2,road.lat2),...colorFor(road,mode)
  })).sort((a,b)=>a.rank-b.rank || a.road.id.localeCompare(b.road.id)),[roads,mode])
  const key=useMemo(()=>mode+segments.map(s=>s.road.id).join('|'),[segments,mode])
  const [saved,setSaved]=useState<Camera>(()=>defaultCamera(key))
  const camera=saved.key===key?saved:defaultCamera(key)
  const degrees=camera.northUp?0:clamp(27+15*size.w/size.h,32,77)
  const base=useMemo(()=>fit(segments,size,degrees),[segments,size,degrees])
  const scale=base.scale*camera.zoom
  const bound=(p:Point,s=scale)=>clampCenter(p,size,base.cos,base.sin,s)
  const center=bound({x:base.center.x+camera.offset.x,y:base.center.y+camera.offset.y})
  const position=(p:Point)=>screenCoord(p,center,size,scale,base.cos,base.sin)
  const origin=position({x:0,y:0})
  const matrix=`matrix(${base.cos*scale} ${base.sin*scale} ${-base.sin*scale} ${base.cos*scale} ${origin.x} ${origin.y})`
  const visible=segments.map(s=>({...s,p:position(s.start),q:position(s.end)})).filter(({p,q})=>
    Math.max(p.x,q.x)>=-14 && Math.min(p.x,q.x)<=size.w+14 && Math.max(p.y,q.y)>=-14 && Math.min(p.y,q.y)<=size.h+14)
  const labels=placeLabels(size,position,scale)
  const [active,setActive]=useState<string|null>(null)
  const selected=visible.find(s=>s.road.id===active)
  const [dragging,setDragging]=useState(false)
  const drag=useRef<{id:number;record:string|null;start:Point;center:Point;moved:boolean}|null>(null)

  function zoomBy(factor:number) {
    setActive(null)
    const zoom=clamp(camera.zoom*factor,1,8)
    const p=bound(center,base.scale*zoom)
    setSaved({...camera,zoom,offset:{x:p.x-base.center.x,y:p.y-base.center.y}})
  }
  function roadAt(target:EventTarget|null) {
    return target instanceof Element?target.closest('[data-road]')?.getAttribute('data-road')??null:null
  }
  function down(e:PointerEvent<SVGSVGElement>) {
    if(e.button!==0 || drag.current) return
    drag.current={id:e.pointerId,record:roadAt(e.target),start:{x:e.clientX,y:e.clientY},center,moved:false}
    e.currentTarget.setPointerCapture(e.pointerId)
  }
  function move(e:PointerEvent<SVGSVGElement>) {
    const d=drag.current
    if(!d) { if(e.pointerType!=='touch') setActive(roadAt(e.target)); return }
    if(d.id!==e.pointerId) return
    const dx=e.clientX-d.start.x, dy=e.clientY-d.start.y
    if(!d.moved && Math.hypot(dx,dy)<5) return
    d.moved=true;setDragging(true);setActive(null)
    const offset=rotate({x:dx/scale,y:dy/scale},base.cos,-base.sin)
    const p=bound({x:d.center.x-offset.x,y:d.center.y-offset.y})
    setSaved({...camera,offset:{x:p.x-base.center.x,y:p.y-base.center.y}})
  }
  function end(e:PointerEvent<SVGSVGElement>,cancel=false) {
    const d=drag.current
    if(!d || d.id!==e.pointerId) return
    drag.current=null;setDragging(false)
    if(e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId)
    if(!cancel && !d.moved && d.record) {setActive(d.record);onSelect(d.record)}
  }
  function keyboard(e:KeyboardEvent<SVGSVGElement>) {
    if(e.key==='Enter' || e.key===' ') {if(selected){e.preventDefault();onSelect(selected.road.id)};return}
    if(e.key==='+' || e.key==='-') {e.preventDefault();zoomBy(e.key==='+'?1.55:1/1.55);return}
    if(e.key==='Escape') {setActive(null);return}
    const dir=({ArrowRight:1,ArrowDown:1,ArrowLeft:-1,ArrowUp:-1} as Record<string,number>)[e.key]
    if(!dir || !visible.length) return
    e.preventDefault()
    const i=visible.findIndex(s=>s.road.id===active)
    const index=i<0?(dir>0?0:visible.length-1):(i+dir+visible.length)%visible.length
    setActive(visible[index].road.id)
  }
  const tipX=selected?clamp((selected.p.x+selected.q.x)/2,90,size.w-90):0
  const tipY=selected?(selected.p.y+selected.q.y)/2:0
  const bar=[100,200,500,1000,2000,5000,10000].filter(v=>v/metresPerUnit*scale<67).pop()??100
  return <div ref={wrap} className={'rt-roadmap'+(dragging?' rt-dragging':'')}>
    <svg className="rt-map-canvas" viewBox={`0 0 ${size.w} ${size.h}`} aria-label="Interactive Mumbai road segment map" aria-describedby={desc} role="group" tabIndex={0}
      onPointerDown={down} onPointerMove={move} onPointerUp={e=>end(e)} onPointerCancel={e=>end(e,true)}
      onPointerLeave={()=>{if(!drag.current)setActive(null)}} onKeyDown={keyboard}
      onFocus={e=>{if(e.target===e.currentTarget && !drag.current)setActive(visible[0]?.road.id??null)}} onBlur={()=>setActive(null)}>
      <desc id={desc}>Drag to pan. Use arrow keys to select a visible road segment and Enter to open its record. The plus and minus keys zoom. Lines connect the two endpoints in each synthetic road record.</desc>
      <image href="/geo/mumbai.webp" transform={matrix} width={plane.w} height={plane.h} preserveAspectRatio="none" aria-hidden="true"/>
      <g pointerEvents="none" fill="none" strokeLinecap="round">
        {visible.map(({road,p,q})=><line key={road.id} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke="#fffdf6" strokeWidth="6.2"/>)}
        {visible.map(({road,p,q,color})=><line key={road.id} x1={p.x} y1={p.y} x2={q.x} y2={q.y} stroke={color} strokeWidth="3.65"/>)}
      </g>
      {selected && <g pointerEvents="none" fill="none" strokeLinecap="round">
        <line x1={selected.p.x} y1={selected.p.y} x2={selected.q.x} y2={selected.q.y} stroke="#193a37" strokeWidth="7"/>
        <line x1={selected.p.x} y1={selected.p.y} x2={selected.q.x} y2={selected.q.y} stroke="#fffef8" strokeWidth="4"/>
      </g>}
      <g pointerEvents="none" aria-hidden="true" textAnchor="middle">
        {labels.map(l=><text key={l.name} className={'rt-map-place rt-place-'+l.kind} x={l.x} y={l.y}>{l.name}</text>)}
      </g>
      <g fill="none" stroke="transparent" strokeWidth="12" strokeLinecap="round" aria-hidden="true">
        {visible.map(({road,p,q})=><line key={road.id} data-road={road.id} x1={p.x} y1={p.y} x2={q.x} y2={q.y}/>)}
      </g>
    </svg>
    <button type="button" className="rt-map-compass" aria-label={camera.northUp?'Fit city orientation':'Set north up'} title={camera.northUp?'Fit city orientation':'Set north up'}
      onClick={()=>{setActive(null);setSaved({...defaultCamera(key),northUp:!camera.northUp})}}>
      <span>N</span><svg width="17" height="20" viewBox="0 0 17 20" aria-hidden="true"><g transform={`rotate(${degrees} 8.5 10)`}><path d="M8.5 1.5 13.2 17 8.5 14.2Z" fill="#203e40"/><path d="M8.5 1.5 3.8 17 8.5 14.2Z" fill="#849c9c"/></g></svg>
    </button>
    <div className="rt-map-controls">
      <button type="button" aria-label="Zoom in" title="Zoom in" disabled={camera.zoom>=8} onClick={()=>zoomBy(1.55)}><ControlIcon kind="plus"/></button>
      <button type="button" aria-label="Zoom out" title="Zoom out" disabled={camera.zoom<=1} onClick={()=>zoomBy(1/1.55)}><ControlIcon kind="minus"/></button>
      <button type="button" aria-label="Fit matching segments" title="Fit matching segments" onClick={()=>{setActive(null);setSaved(defaultCamera(key))}}><ControlIcon kind="fit"/></button>
    </div>
    {selected && !dragging && <div role="status" className={'rt-map-tip'+(tipY<72?' rt-tip-below':'')} style={{left:tipX,top:tipY+(tipY<72?10:-9)}}>
      <strong>{selected.road.name}</strong><span>{selected.road.id} · Ward {selected.road.ward}</span>
    </div>}
    {!segments.length && <div className="rt-map-empty">No matching road segments</div>}
    <div className="rt-map-scale" aria-hidden="true"><span style={{width:bar/metresPerUnit*scale}}/>{bar>=1000?bar/1000+' km':bar+' m'}</div>
    <div className="rt-map-credits"><a href="https://openmaptiles.org/" target="_blank" rel="noreferrer">© OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">© OpenStreetMap contributors</a></div>
  </div>
}

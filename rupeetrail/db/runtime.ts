import {env} from 'cloudflare:workers';
import imported from './import/seed.json';
const seed=imported as {version:string;columns:Record<string,string[]>;packs:string[][]};
export type Row=Record<string,string|number|null>;
export function db(){if(!env.DB)throw new Error('Native D1 is unavailable');return env.DB}
export async function rows<T=Row>(sql:string,...params:(string|number|null)[]){return (await db().prepare(sql).bind(...params).all<T>()).results}
export function first<T=Row>(sql:string,...params:(string|number|null)[]){return db().prepare(sql).bind(...params).first<T>()}
const quote=(s:string)=>'"'+s.replaceAll('"','""')+'"';
export async function prepareData(){
 const conn=db(),state=await conn.prepare('SELECT cursor FROM import_state WHERE version=?').bind(seed.version).first<{cursor:number}>();
 const start=state?.cursor??0;if(start>=seed.packs.length)return null;
 const end=Math.min(start+12,seed.packs.length);
 const batch=await Promise.all(seed.packs.slice(start,end).map(async ([table,pack])=>{
   const bytes=Uint8Array.from(atob(pack),c=>c.charCodeAt(0));
   const values=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
   const cols=seed.columns[table],fields=cols.map((_,i)=>"json_extract(value,'$["+i+"]')").join(',');
   return conn.prepare('INSERT OR IGNORE INTO '+quote(table)+' ('+cols.map(quote).join(',')+') SELECT '+fields+' FROM json_each(?)').bind(values);
 }));
 batch.push(conn.prepare('INSERT INTO import_state(version,cursor) VALUES(?,?) ON CONFLICT(version) DO UPDATE SET cursor=MAX(cursor,excluded.cursor)').bind(seed.version,end));
 await conn.batch(batch);return end<seed.packs.length?{prepared:end,total:seed.packs.length}:null;
}
export async function handle(req:Request,action:(p:URLSearchParams)=>Promise<unknown>){
 try{
  const progress=await prepareData();if(progress)return Response.json({initializing:progress},{status:202,headers:{'Cache-Control':'no-store'}});
  const result=await action(new URL(req.url).searchParams);
  return Response.json(result??{error:'Record not found.'},{status:result?200:404,headers:{'Cache-Control':'private, no-store'}});
 }catch(e){console.error('RupeeTrail query failed',e instanceof Error?e.message:'');return Response.json({error:'Data could not be loaded. Please retry.'},{status:503,headers:{'Cache-Control':'no-store'}})}
}

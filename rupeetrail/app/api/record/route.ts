import {handle} from '@/db/runtime';import {record} from '@/db/queries';import {env} from 'cloudflare:workers';
export const dynamic='force-dynamic';export function GET(r:Request){return handle(r,async p=>{const d=await record(p.get('kind'),p.get('id'));return d?{...d,claudeEnabled:!!(env as {ANTHROPIC_API_KEY?:string}).ANTHROPIC_API_KEY}:null})}

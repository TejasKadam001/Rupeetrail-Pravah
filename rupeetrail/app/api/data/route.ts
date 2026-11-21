import {handle} from '@/db/runtime';import {dashboard} from '@/db/queries';
export const dynamic='force-dynamic';export function GET(r:Request){return handle(r,dashboard)}

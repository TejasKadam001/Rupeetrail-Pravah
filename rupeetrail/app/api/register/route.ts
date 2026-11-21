import {handle} from '@/db/runtime';import {register} from '@/db/queries';
export const dynamic='force-dynamic';export function GET(r:Request){return handle(r,register)}

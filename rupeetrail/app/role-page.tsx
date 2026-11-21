import Dashboard from '@/components/Dashboard';
import {dashboard,type Role} from '@/db/queries';
import {prepareData} from '@/db/runtime';
export type PageProps={searchParams:Promise<Record<string,string|string[]|undefined>>};
export async function RolePage({role,searchParams}:{role:Role}&PageProps){
 const p=await searchParams,ward=typeof p.ward==='string'?p.ward:'';
 const initial=(await prepareData())?null:await dashboard(new URLSearchParams({role,ward}));
 return <Dashboard role={role} initialWard={ward} initialData={initial}/>;
}

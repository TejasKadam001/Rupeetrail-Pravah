import {RolePage,type PageProps} from '@/app/role-page';
export const dynamic='force-dynamic';
export const metadata={title:'Ward Officer Budget Planner | RupeeTrail'};
export default function Page(props:PageProps){return <RolePage role="sponsor" {...props}/>}

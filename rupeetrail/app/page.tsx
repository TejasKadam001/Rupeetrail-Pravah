import {RolePage,type PageProps} from '@/app/role-page';
export const dynamic='force-dynamic';
export const metadata={title:'PM · Contractor delivery | RupeeTrail'};
export default function Page(props:PageProps){return <RolePage role="pm" {...props}/>}

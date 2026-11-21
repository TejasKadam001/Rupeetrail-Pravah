import {RolePage,type PageProps} from '@/app/role-page';
export const dynamic='force-dynamic';
export const metadata={title:'Finance · Complaint traceability | RupeeTrail'};
export default function Page(props:PageProps){return <RolePage role="finance" {...props}/>}

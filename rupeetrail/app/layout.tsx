import './globals.css';
import type {Metadata} from 'next';
export const metadata:Metadata={title:'RupeeTrail · Mumbai road accountability',description:'Trace synthetic complaints, evaluate contractor delivery and plan the next rupee for Mumbai roads.',icons:{icon:'/favicon.svg'}};
export default function Layout({children}:Readonly<{children:React.ReactNode}>){return <html lang="en"><body>{children}</body></html>}

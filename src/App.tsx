import { lazy, Suspense, useEffect, useState } from 'react';
import { PublicPortfolio } from './pages/PublicPortfolio';
const AdminApp=lazy(()=>import('./pages/AdminApp'));

export default function App(){
  const [route,setRoute]=useState(location.hash);
  useEffect(()=>{const onHash=()=>setRoute(location.hash);addEventListener('hashchange',onHash);return()=>removeEventListener('hashchange',onHash)},[]);
  if(route.startsWith('#/admin')) return <Suspense fallback={<div className="screen-loader">Loading admin…</div>}><AdminApp/></Suspense>;
  return <PublicPortfolio route={route}/>;
}

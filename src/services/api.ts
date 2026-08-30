import type { PortfolioData } from '../types/portfolio';
import { fallbackData } from '../data/fallback';
const API_URL = import.meta.env.VITE_GAS_API_URL?.trim();
async function callApi<T>(action:string,payload:Record<string,unknown>={},token=''):Promise<T>{
  if(!API_URL) throw new Error('API is not configured');
  const response=await fetch(API_URL,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({action,payload,token})});
  const result=await response.json();
  if(!result.ok) throw new Error(result.error||'Request failed');
  return result.data as T;
}
export async function getPortfolio():Promise<PortfolioData>{ try{return await callApi<PortfolioData>('getPortfolio')}catch{return fallbackData} }
export const adminApi={login:(username:string,password:string)=>callApi<{token:string;expiresAt:string}>('login',{username,password}),logout:(token:string)=>callApi('logout',{},token),dashboard:(token:string)=>callApi('getDashboard',{},token),list:<T>(module:string,token:string)=>callApi<T[]>('adminList',{module},token),save:<T>(module:string,record:T,token:string)=>callApi<T>('adminSave',{module,record},token),remove:(module:string,id:string,token:string)=>callApi('adminDelete',{module,id},token),changePassword:(currentPassword:string,newPassword:string,token:string)=>callApi('changePassword',{currentPassword,newPassword},token)};

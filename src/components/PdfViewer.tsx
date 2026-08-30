import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Maximize, Minus, Plus, X } from 'lucide-react';
import * as pdfjs from 'pdfjs-dist';
pdfjs.GlobalWorkerOptions.workerSrc=new URL('pdfjs-dist/build/pdf.worker.min.mjs',import.meta.url).toString();

export function PdfViewer({url,title,onClose}:{url:string;title:string;onClose:()=>void}){
 const canvas=useRef<HTMLCanvasElement>(null); const [doc,setDoc]=useState<any>(); const [page,setPage]=useState(1); const [scale,setScale]=useState(1.15); const [error,setError]=useState('');
 useEffect(()=>{fetch(url).then(r=>r.text()).then(base64=>{const binary=atob(base64.trim());const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));return pdfjs.getDocument({data:bytes}).promise}).then(setDoc).catch(()=>setError('This document is unavailable or private.'));},[url]);
 useEffect(()=>{if(!doc||!canvas.current)return; let active=true; doc.getPage(page).then((p:any)=>{if(!active)return;const viewport=p.getViewport({scale});const ctx=canvas.current!.getContext('2d')!;canvas.current!.width=viewport.width;canvas.current!.height=viewport.height;p.render({canvas:canvas.current!,canvasContext:ctx,viewport});});return()=>{active=false}},[doc,page,scale]);
 return <div className="modal-backdrop" role="dialog" aria-modal="true"><div className="viewer"><header><strong>{title}</strong><div className="viewer-actions"><button onClick={()=>setScale(v=>Math.max(.6,v-.15))} aria-label="Zoom out"><Minus/></button><span>{Math.round(scale*100)}%</span><button onClick={()=>setScale(v=>Math.min(2.5,v+.15))} aria-label="Zoom in"><Plus/></button><button onClick={()=>document.querySelector('.viewer')?.requestFullscreen()} aria-label="Fullscreen"><Maximize/></button><button onClick={onClose} aria-label="Close"><X/></button></div></header>{error?<div className="empty-state">{error}</div>:<div className="canvas-wrap"><canvas ref={canvas}/></div>}<footer><button disabled={page<=1} onClick={()=>setPage(v=>v-1)}><ChevronLeft/> Previous</button><span>Page {page} of {doc?.numPages||'–'}</span><button disabled={!doc||page>=doc.numPages} onClick={()=>setPage(v=>v+1)}>Next <ChevronRight/></button></footer></div></div>
}

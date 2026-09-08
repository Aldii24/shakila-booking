"use client";
import {useEffect,useRef} from "react";
declare global{interface Window{turnstile?:{render:(el:HTMLElement,options:{sitekey:string;action:string;callback:(token:string)=>void;"expired-callback":()=>void;"error-callback":()=>void})=>string;remove:(id:string)=>void}}}
export function Turnstile({onToken,action}:{onToken:(token:string)=>void;action:"booking"|"lookup"|"payment_proof"}){
  const ref=useRef<HTMLDivElement>(null),demoDisabled=process.env.NEXT_PUBLIC_APP_MODE==="demo"&&process.env.NEXT_PUBLIC_TURNSTILE_MODE==="disabled";
  useEffect(()=>{if(demoDisabled){onToken("");return}if(process.env.NEXT_PUBLIC_TURNSTILE_LOCAL_BYPASS==="true"){onToken("local-development-bypass");return}const key=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;if(!key||!ref.current)return;const render=()=>{if(!ref.current||!window.turnstile)return;const id=window.turnstile.render(ref.current,{sitekey:key,action,callback:onToken,"expired-callback":()=>onToken(""),"error-callback":()=>onToken("")});return()=>window.turnstile?.remove(id)};if(window.turnstile)return render();const script=document.createElement("script");script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";script.async=true;script.onload=render;document.head.appendChild(script);return()=>{script.onload=null}},[action,demoDisabled,onToken]);
  return <div><div ref={ref}/>{!demoDisabled&&!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY&&process.env.NEXT_PUBLIC_TURNSTILE_LOCAL_BYPASS!=="true"?<p className="status-note error-note">Verifikasi keamanan belum dikonfigurasi.</p>:null}</div>
}

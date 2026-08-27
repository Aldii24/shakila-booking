"use client";
import {useEffect,useRef} from "react";
declare global{interface Window{turnstile?:{render:(el:HTMLElement,options:{sitekey:string;callback:(token:string)=>void;"expired-callback":()=>void})=>string;remove:(id:string)=>void}}}
export function Turnstile({onToken}:{onToken:(token:string)=>void}){
  const ref=useRef<HTMLDivElement>(null),demoDisabled=process.env.NEXT_PUBLIC_APP_MODE==="demo"&&process.env.NEXT_PUBLIC_TURNSTILE_MODE==="disabled";
  useEffect(()=>{if(demoDisabled){onToken("");return}if(process.env.NEXT_PUBLIC_TURNSTILE_LOCAL_BYPASS==="true"){onToken("local-development-bypass");return}const key=process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;if(!key||!ref.current)return;const render=()=>{if(!ref.current||!window.turnstile)return;const id=window.turnstile.render(ref.current,{sitekey:key,callback:onToken,"expired-callback":()=>onToken("")});return()=>window.turnstile?.remove(id)};if(window.turnstile)return render();const script=document.createElement("script");script.src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";script.async=true;script.onload=render;document.head.appendChild(script);return()=>{script.onload=null}},[demoDisabled,onToken]);
  return <div><div ref={ref}/>{demoDisabled?<p className="status-note">BOT PROTECTION EXPLICITLY DISABLED IN DEMO MODE.</p>:!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY&&process.env.NEXT_PUBLIC_TURNSTILE_LOCAL_BYPASS!=="true"?<p className="status-note error-note">Turnstile belum dikonfigurasi.</p>:null}</div>
}

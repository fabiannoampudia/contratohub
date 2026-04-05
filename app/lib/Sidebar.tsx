"use client";
import { useSession, signOut } from "next-auth/react";

function IGrid(){return<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;}
function IDoc(){return<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;}
function IUsers(){return<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;}
function IUpload(){return<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;}
function ILogout(){return<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;}

function NI({icon,label,active,href}:{icon:React.ReactNode;label:string;active:boolean;href?:string}){
  const content=<div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,cursor:"pointer",fontSize:"13px",fontWeight:active?500:400,color:active?"#1a1a2e":"#6b7280",background:active?"#f1f3f5":"transparent",marginBottom:2}}>{icon}{label}</div>;
  if(href&&!active)return<a href={href} style={{textDecoration:"none"}}>{content}</a>;
  return content;
}

export default function Sidebar({active}:{active:"dashboard"|"contracts"|"suppliers"|"import"}){
  const{data:session}=useSession();
  const user=session?.user;
  const name=user?.name||"Usuário";
  const initials=name.split(" ").map(n=>n[0]).join("").slice(0,2).toUpperCase();
  const role=(user as {role?:string})?.role||"Operador";

  return(
    <aside style={{width:220,background:"#fff",borderRight:"1px solid #ebedf0",padding:"20px 0",display:"flex",flexDirection:"column",flexShrink:0}}>
      <div style={{padding:"0 20px 24px",borderBottom:"1px solid #ebedf0"}}>
        <h1 style={{fontSize:"18px",fontWeight:700,color:"#1a1a2e",margin:0}}>ContratoHub</h1>
        <span style={{fontSize:"11px",color:"#9ca3af"}}>Gestão de Contratos</span>
      </div>
      <nav style={{padding:"12px 8px",flex:1}}>
        <NI icon={<IGrid/>} label="Dashboard" active={active==="dashboard"} href="/dashboard"/>
        <NI icon={<IDoc/>} label="Contratos" active={active==="contracts"} href="/"/>
        <NI icon={<IUsers/>} label="Fornecedores" active={active==="suppliers"} href="/suppliers"/>
        <NI icon={<IUpload/>} label="Importar" active={active==="import"} href="/import"/>
      </nav>
      <div style={{padding:"12px 20px",borderTop:"1px solid #ebedf0"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:"#EEEDFE",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"12px",fontWeight:600,color:"#534AB7"}}>{initials}</div>
          <div style={{flex:1}}>
            <p style={{fontSize:"13px",fontWeight:500,margin:0}}>{name}</p>
            <p style={{fontSize:"11px",color:"#9ca3af",margin:0}}>{role}</p>
          </div>
          <button onClick={()=>signOut({callbackUrl:"/login"})} style={{background:"none",border:"none",cursor:"pointer",color:"#9ca3af",padding:4,borderRadius:4}} title="Sair">
            <ILogout/>
          </button>
        </div>
      </div>
    </aside>
  );
}
"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Sidebar from "@/app/lib/Sidebar";

import { AREAS, maskCNPJ, validateCNPJ } from "@/app/lib/constants";

type Supplier={id:string;legalName:string;tradeName:string|null;cnpj:string;email:string|null;phone:string|null;commercialContact:string|null;operationalContact:string|null;responsible:string|null;area:string|null;status:string;criticality:string;notes:string|null;_count:{contracts:number}};
type Toast={message:string;type:"success"|"error"};type SortDir="asc"|"desc";
type ColKey="tradeName"|"legalName"|"cnpj"|"responsible"|"area"|"phone"|"contracts"|"criticality"|"status";

const PER_PAGE=10;const SO=["Ativo","Inativo","Bloqueado"];const CO=["Alta","Média","Baixa"];
const SCC:Record<string,{bg:string;text:string}>={Ativo:{bg:"#E1F5EE",text:"#0F6E56"},Inativo:{bg:"#F1F3F5",text:"#6b7280"},Bloqueado:{bg:"#FAEEDA",text:"#854F0B"}};
const CRC:Record<string,{bg:string;text:string}>={Alta:{bg:"#FCEBEB",text:"#A32D2D"},Média:{bg:"#FAEEDA",text:"#854F0B"},Baixa:{bg:"#E1F5EE",text:"#0F6E56"}};
const EMPTY={legalName:"",tradeName:"",cnpj:"",email:"",phone:"",commercialContact:"",operationalContact:"",responsible:"",area:"",status:"Ativo",criticality:"Média",notes:""};

function gSV(s:Supplier,k:ColKey):string|number{switch(k){case"tradeName":return(s.tradeName||s.legalName).toLowerCase();case"legalName":return s.legalName.toLowerCase();case"cnpj":return s.cnpj;case"responsible":return(s.responsible||"").toLowerCase();case"area":return(s.area||"").toLowerCase();case"phone":return(s.phone||"").toLowerCase();case"contracts":return s._count.contracts;case"criticality":return s.criticality==="Alta"?0:s.criticality==="Média"?1:2;case"status":return s.status.toLowerCase();default:return"";}}

function IGrid(){return<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;}
function IDoc(){return<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;}
function IUsers(){return<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;}
function IUpload(){return<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;}
function IDl(){return<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>;}
function IPlus(){return<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;}
function IX(){return<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>;}
function IEdit(){return<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>;}
function ITrash(){return<svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2"/></svg>;}
function IChk(){return<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;}
function IWrn(){return<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>;}
function SA({dir}:{dir:SortDir|null}){if(!dir)return<svg width="10" height="10" fill="none" stroke="#bbb" strokeWidth="2" viewBox="0 0 24 24"><path d="M7 10l5-5 5 5M7 14l5 5 5-5"/></svg>;return<svg width="10" height="10" fill="none" stroke="#1a1a2e" strokeWidth="2.5" viewBox="0 0 24 24">{dir==="asc"?<path d="M7 14l5-5 5 5"/>:<path d="M7 10l5 5 5-5"/>}</svg>;}

function SIcon({type}:{type:string}){const s="currentColor";const w="1.5";const v="0 0 24 24";switch(type){
case"building":return<svg width="18" height="18" fill="none" stroke={s} strokeWidth={w} viewBox={v}><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9h1"/><path d="M9 13h1"/><path d="M9 17h1"/></svg>;
case"phone":return<svg width="18" height="18" fill="none" stroke={s} strokeWidth={w} viewBox={v}><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 16.92z"/></svg>;
case"tag":return<svg width="18" height="18" fill="none" stroke={s} strokeWidth={w} viewBox={v}><path d="M20.59 13.41l-7.17 7.17a2 2 0 01-2.83 0L2 12V2h10l8.59 8.59a2 2 0 010 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>;
default:return null;}}

function PageContent(){
  const[suppliers,setSuppliers]=useState<Supplier[]>([]);const[showForm,setShowForm]=useState(false);const[editingId,setEditingId]=useState<string|null>(null);
  const[loading,setLoading]=useState(true);const[saving,setSaving]=useState(false);const[form,setForm]=useState(EMPTY);
  const searchParams=useSearchParams();const[search,setSearch]=useState(searchParams.get("search")||"");
  const[toast,setToast]=useState<Toast|null>(null);const[sortCol,setSortCol]=useState<ColKey>("tradeName");const[sortDir,setSortDir]=useState<SortDir>("asc");const[page,setPage]=useState(1);
  const[filterNoContracts,setFilterNoContracts]=useState(false);
  const[cnpjError,setCnpjError]=useState("");

  function showToast(m:string,t:"success"|"error"="success"){setToast({message:m,type:t});setTimeout(()=>setToast(null),4000);}
  async function loadData(){setLoading(true);const data=await fetch("/api/suppliers").then(r=>r.json());setSuppliers(data);setLoading(false);}
  useEffect(()=>{loadData();},[]);

  function openNew(){setEditingId(null);setForm(EMPTY);setShowForm(true);}
  function openEdit(s:Supplier){setEditingId(s.id);setForm({legalName:s.legalName,tradeName:s.tradeName||"",cnpj:s.cnpj,email:s.email||"",phone:s.phone||"",commercialContact:s.commercialContact||"",operationalContact:s.operationalContact||"",responsible:s.responsible||"",area:s.area||"",status:s.status,criticality:s.criticality,notes:s.notes||""});setShowForm(true);window.scrollTo({top:0,behavior:"smooth"});}
  async function handleSubmit(e:React.FormEvent){e.preventDefault();
    if(!validateCNPJ(form.cnpj)){setCnpjError("CNPJ inválido");showToast("CNPJ inválido. Verifique os dígitos.","error");return;}
    setCnpjError("");setSaving(true);try{const url=editingId?`/api/suppliers/${editingId}`:"/api/suppliers";const method=editingId?"PATCH":"POST";const res=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});const data=await res.json();if(!res.ok)throw new Error(data.error||"Erro");setForm(EMPTY);setShowForm(false);setEditingId(null);showToast(editingId?`${form.tradeName||form.legalName} atualizado`:`${form.tradeName||form.legalName} cadastrado`);loadData();}catch(err:unknown){const msg=err instanceof Error?err.message:"Erro ao salvar";showToast(msg,"error");}finally{setSaving(false);}}
  async function handleDelete(s:Supplier){if(!confirm(`Excluir ${s.tradeName||s.legalName}?\n\nEssa ação não pode ser desfeita.`))return;try{const res=await fetch(`/api/suppliers/${s.id}`,{method:"DELETE"});const data=await res.json();if(!res.ok)throw new Error(data.error||"Erro");showToast(`${s.tradeName||s.legalName} excluído`);loadData();}catch(err:unknown){const msg=err instanceof Error?err.message:"Erro ao excluir";showToast(msg,"error");}}
  function closeForm(){setShowForm(false);setEditingId(null);setForm(EMPTY);}
  function set(f:string,v:string){setForm(p=>({...p,[f]:v}));}
  function toggleSort(col:ColKey){if(sortCol===col)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortCol(col);setSortDir("asc");}setPage(1);}

  const noContractsCount=suppliers.filter(s=>s._count.contracts===0).length;

  function toggleFilterNoContracts(){setFilterNoContracts(v=>!v);setPage(1);}

  const filtered=suppliers.filter(s=>{
    if(filterNoContracts&&s._count.contracts>0)return false;
    if(!search)return true;const q=search.toLowerCase();return s.legalName.toLowerCase().includes(q)||(s.tradeName||"").toLowerCase().includes(q)||s.cnpj.includes(q)||(s.email||"").toLowerCase().includes(q)||(s.commercialContact||"").toLowerCase().includes(q);
  });
  const sorted=[...filtered].sort((a,b)=>{const va=gSV(a,sortCol);const vb=gSV(b,sortCol);if(va<vb)return sortDir==="asc"?-1:1;if(va>vb)return sortDir==="asc"?1:-1;return 0;});
  const tp=Math.ceil(sorted.length/PER_PAGE);const paged=sorted.slice((page-1)*PER_PAGE,page*PER_PAGE);
  const totalContracts=suppliers.reduce((s,sup)=>s+sup._count.contracts,0);

  function exportExcel(){const rows=sorted.map(s=>({razao_social:s.legalName,nome_fantasia:s.tradeName||"",cnpj:s.cnpj,email:s.email||"",telefone:s.phone||"",contato_comercial:s.commercialContact||"",contato_operacional:s.operationalContact||"",criticidade:s.criticality,observacoes:s.notes||"",status:s.status}));const ws=XLSX.utils.json_to_sheet(rows);ws["!cols"]=Object.keys(rows[0]||{}).map(k=>({wch:Math.max(k.length,...rows.map(r=>String((r as Record<string,unknown>)[k]||"").length))+2}));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Fornecedores");const buf=XLSX.write(wb,{bookType:"xlsx",type:"array"});saveAs(new Blob([buf],{type:"application/octet-stream"}),`fornecedores_${new Date().toISOString().slice(0,10)}.xlsx`);showToast(`${sorted.length} fornecedores exportados`);}

  const columns:{key:ColKey;label:string}[]=[{key:"tradeName",label:"Nome fantasia"},{key:"legalName",label:"Razão social"},{key:"cnpj",label:"CNPJ"},{key:"responsible",label:"Responsável T&F"},{key:"area",label:"Área"},{key:"phone",label:"Telefone"},{key:"contracts",label:"Contratos"},{key:"criticality",label:"Criticidade"},{key:"status",label:"Status"}];

  return(
    <div style={{display:"flex",minHeight:"100vh"}}>
      {toast&&(<div style={{position:"fixed",top:20,right:20,zIndex:999,display:"flex",alignItems:"center",gap:10,padding:"12px 20px",borderRadius:10,background:toast.type==="success"?"#E1F5EE":"#FCEBEB",color:toast.type==="success"?"#0F6E56":"#A32D2D",border:`1px solid ${toast.type==="success"?"#5DCAA5":"#F09595"}`,fontSize:"13px",fontWeight:500,animation:"slideIn 0.3s ease",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}>{toast.type==="success"?<IChk/>:<IWrn/>}{toast.message}</div>)}
      <style>{`@keyframes slideIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      <Sidebar active="suppliers"/>

      <main style={{flex:1,padding:"28px 32px",overflowX:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:14,marginBottom:24}}>
          <KpiCard label="Total de fornecedores" value={String(suppliers.length)} sub={`${suppliers.filter(s=>s.status==="Ativo").length} ativos`} accent="#534AB7"/>
          <KpiCard label="Contratos vinculados" value={String(totalContracts)} sub="Total de contratos" accent="#0F6E56"/>
          <KpiCard label="Criticidade alta" value={String(suppliers.filter(s=>s.criticality==="Alta").length)} sub="Fornecedores críticos" accent="#A32D2D"/>
          <KpiCard
            label="Sem contratos"
            value={String(noContractsCount)}
            sub={filterNoContracts?"Clique para limpar filtro":"Clique para filtrar"}
            accent="#854F0B"
            onClick={toggleFilterNoContracts}
            active={filterNoContracts}
          />
        </div>

        {filterNoContracts&&(
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14,padding:"8px 14px",background:"#FAEEDA",borderRadius:8,fontSize:"13px",color:"#854F0B",border:"1px solid #F0D68A"}}>
            <IWrn/>
            <span>Exibindo apenas fornecedores sem contratos vinculados</span>
            <button onClick={()=>{setFilterNoContracts(false);setPage(1);}} style={{marginLeft:"auto",background:"none",border:"none",cursor:"pointer",color:"#854F0B",fontWeight:600,fontSize:"13px",textDecoration:"underline"}}>Limpar filtro</button>
          </div>
        )}

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:12,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><h2 style={{fontSize:"18px",fontWeight:600,margin:0}}>Fornecedores</h2><span style={{fontSize:"12px",color:"#9ca3af",background:"#f1f3f5",padding:"2px 10px",borderRadius:10}}>{sorted.length}</span></div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <input placeholder="Buscar..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} style={{padding:"8px 14px",border:"1px solid #e0e2e7",borderRadius:8,fontSize:"13px",width:240,background:"#fff"}}/>
            <button onClick={exportExcel} disabled={sorted.length===0} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 14px",background:"#fff",color:"#1a1a2e",border:"1px solid #e0e2e7",borderRadius:8,cursor:"pointer",fontSize:"13px"}}><IDl/> Exportar</button>
            <button onClick={showForm?closeForm:openNew} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:showForm?"#6b7280":"#1a1a2e",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:"13px",fontWeight:500}}>{showForm?<><IX/> Cancelar</>:<><IPlus/> Novo fornecedor</>}</button>
          </div>
        </div>

        {/* FORMULÁRIO REDESENHADO */}
        {showForm&&(
          <div style={{background:"#fff",border:"1px solid #e0e2e7",borderRadius:16,marginBottom:20,overflow:"hidden"}}>
            <div style={{background:"linear-gradient(135deg,#1a1a2e 0%,#2d2b55 100%)",padding:"20px 28px",color:"#fff"}}>
              <h3 style={{fontSize:"17px",fontWeight:600,margin:0}}>{editingId?"Editar fornecedor":"Novo fornecedor"}</h3>
              <p style={{fontSize:"12px",opacity:0.7,margin:"4px 0 0"}}>Campos com * são obrigatórios</p>
            </div>
            <form onSubmit={handleSubmit} style={{padding:"0 28px 28px"}}>

              <FormSection icon="building" title="Dados da empresa" desc="Identificação e razão social do fornecedor">
                <G3>
                  <F label="Razão social" required v={form.legalName} set={v=>set("legalName",v)} ph="Razão social completa"/>
                  <F label="Nome fantasia" v={form.tradeName} set={v=>set("tradeName",v)} ph="Nome comercial"/>
                  <div><label style={fl}>CNPJ<span style={{color:"#E24B4A"}}> *</span></label><input required value={form.cnpj} onChange={e=>{const masked=maskCNPJ(e.target.value);set("cnpj",masked);if(cnpjError&&masked.replace(/\D/g,"").length===14)setCnpjError(validateCNPJ(masked)?"":"CNPJ inválido");}} onBlur={()=>{if(form.cnpj&&!validateCNPJ(form.cnpj))setCnpjError("CNPJ inválido");else setCnpjError("");}} style={{...fi,borderColor:cnpjError?"#E24B4A":"#e0e2e7"}} placeholder="00.000.000/0001-00" maxLength={18}/>{cnpjError&&<span style={{fontSize:"11px",color:"#E24B4A",marginTop:2,display:"block"}}>{cnpjError}</span>}</div>
                </G3>
              </FormSection>

              <FormSection icon="phone" title="Contato" desc="Informações para comunicação com o fornecedor">
                <G3>
                  <F label="E-mail" v={form.email} set={v=>set("email",v)} ph="contato@empresa.com"/>
                  <F label="Telefone" v={form.phone} set={v=>set("phone",v)} ph="(11) 3333-4444"/>
                  <F label="Contato comercial" v={form.commercialContact} set={v=>set("commercialContact",v)} ph="Nome do responsável"/>
                </G3>
                <G3>
                  <F label="Contato operacional" v={form.operationalContact} set={v=>set("operationalContact",v)} ph="Responsável técnico"/>
                </G3>
              </FormSection>

              <FormSection icon="tag" title="Classificação" desc="Status, criticidade e gestão interna do fornecedor">
                <G3>
                  <FS label="Status" v={form.status} set={v=>set("status",v)} opts={SO.map(o=>({v:o,l:o}))}/>
                  <FS label="Criticidade" v={form.criticality} set={v=>set("criticality",v)} opts={CO.map(o=>({v:o,l:o}))}/>
                  <F label="Responsável T&F" v={form.responsible} set={v=>set("responsible",v)} ph="Gestor interno responsável"/>
                </G3>
                <G3>
                  <FS label="Área responsável" v={form.area} set={v=>set("area",v)} opts={AREAS.map(a=>({v:a,l:a}))}/>
                </G3>
                <div style={{marginTop:6}}>
                  <label style={fl}>Observações</label>
                  <textarea value={form.notes} onChange={e=>set("notes",e.target.value)} style={{...fi,height:72,resize:"vertical"}} placeholder="Informações relevantes sobre o fornecedor"/>
                </div>
              </FormSection>

              <div style={{display:"flex",gap:12,paddingTop:20,borderTop:"1px solid #e0e2e7",marginTop:24}}>
                <button type="submit" disabled={saving} style={{padding:"11px 32px",background:saving?"#9ca3af":"#1a1a2e",color:"#fff",border:"none",borderRadius:8,cursor:saving?"not-allowed":"pointer",fontSize:"14px",fontWeight:500}}>{saving?"Salvando...":(editingId?"Salvar alterações":"Cadastrar fornecedor")}</button>
                <button type="button" onClick={closeForm} style={{padding:"11px 24px",background:"#fff",color:"#6b7280",border:"1px solid #e0e2e7",borderRadius:8,cursor:"pointer",fontSize:"14px"}}>Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {loading?(<p style={{color:"#9ca3af",padding:40,textAlign:"center"}}>Carregando...</p>
        ):sorted.length===0?(
          <div style={{textAlign:"center",padding:"60px 20px",color:"#9ca3af",background:"#fff",border:"1px dashed #e0e2e7",borderRadius:12}}><p style={{fontSize:"15px",margin:"0 0 6px",fontWeight:500}}>{suppliers.length===0?"Nenhum fornecedor cadastrado":filterNoContracts?"Todos os fornecedores possuem contratos":"Nenhum resultado"}</p><p style={{fontSize:"13px",margin:0}}>{suppliers.length===0?"Clique em \"+ Novo fornecedor\" para começar":filterNoContracts?"Limpe o filtro para ver todos":"Tente alterar a busca"}</p></div>
        ):(<>
          <div style={{background:"#fff",border:"1px solid #e0e2e7",borderRadius:12,overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px",minWidth:1100}}>
                <thead><tr style={{background:"#f8f9fb",borderBottom:"1px solid #e0e2e7"}}>
                  {columns.map(col=>(<th key={col.key} onClick={()=>toggleSort(col.key)} style={{padding:"10px",fontSize:"11px",color:"#6b7280",fontWeight:500,textAlign:col.key==="contracts"?"center":"left",whiteSpace:"nowrap",cursor:"pointer",userSelect:"none"}}><span style={{display:"inline-flex",alignItems:"center",gap:4}}>{col.label} <SA dir={sortCol===col.key?sortDir:null}/></span></th>))}
                  <th style={{padding:"10px",width:60}}></th>
                </tr></thead>
                <tbody>{paged.map(s=>{const st=SCC[s.status]||{bg:"#f1f3f5",text:"#6b7280"};const cr=CRC[s.criticality]||{bg:"#f1f3f5",text:"#6b7280"};
                  return(<tr key={s.id} style={{borderBottom:"1px solid #f1f3f5",transition:"background 0.15s"}} onMouseEnter={e=>(e.currentTarget.style.background="#f8f9fb")} onMouseLeave={e=>(e.currentTarget.style.background="transparent")}>
                    <td style={{...td,fontWeight:600,color:"#1a1a2e"}}>{s.tradeName||"—"}</td>
                    <td style={{...td,maxWidth:200,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={s.legalName}>{s.legalName}</td>
                    <td style={{...td,fontFamily:"monospace",fontSize:"12px"}}>{s.cnpj}</td>
                    <td style={td}>{s.responsible||"—"}</td><td style={td}>{s.area?<Badge bg="#EEEDFE" color="#534AB7">{s.area}</Badge>:"—"}</td><td style={td}>{s.phone||"—"}</td>
                    <td style={{...td,textAlign:"center"}}><span style={{background:s._count.contracts===0?"#FAEEDA":"#f1f3f5",color:s._count.contracts===0?"#854F0B":"inherit",padding:"2px 8px",borderRadius:8,fontSize:"12px",fontWeight:500}}>{s._count.contracts}</span></td>
                    <td style={td}><Badge bg={cr.bg} color={cr.text}>{s.criticality}</Badge></td>
                    <td style={td}><Badge bg={st.bg} color={st.text}>{s.status}</Badge></td>
                    <td style={{...td,whiteSpace:"nowrap"}}><button onClick={()=>openEdit(s)} style={ab} title="Editar"><IEdit/></button><button onClick={()=>handleDelete(s)} style={{...ab,color:"#A32D2D"}} title="Excluir"><ITrash/></button></td>
                  </tr>);})}</tbody>
              </table>
            </div>
          </div>
          <Pag page={page} totalPages={tp} total={sorted.length} perPage={PER_PAGE} onPage={setPage}/>
        </>)}
      </main>
    </div>
  );
}

export default function SuppliersPage(){return<Suspense fallback={<div style={{padding:40,textAlign:"center",color:"#9ca3af"}}>Carregando...</div>}><PageContent/></Suspense>;}

function FormSection({icon,title,desc,children}:{icon:string;title:string;desc:string;children:React.ReactNode}){
  return(<div style={{margin:"24px 0 0"}}><div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}><div style={{width:36,height:36,borderRadius:10,background:"#EEEDFE",display:"flex",alignItems:"center",justifyContent:"center",color:"#534AB7",flexShrink:0}}><SIcon type={icon}/></div><div><p style={{fontSize:"14px",fontWeight:600,color:"#1a1a2e",margin:0}}>{title}</p><p style={{fontSize:"11px",color:"#9ca3af",margin:0}}>{desc}</p></div></div><div style={{background:"#fafbfc",borderRadius:10,padding:"16px 18px",border:"1px solid #f1f3f5"}}>{children}</div></div>);
}

function G3({children}:{children:React.ReactNode}){return<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:10}}>{children}</div>;}
function F({label,v,set,ph,required}:{label:string;v:string;set:(v:string)=>void;ph?:string;required?:boolean}){return<div><label style={fl}>{label}{required&&<span style={{color:"#E24B4A"}}> *</span>}</label><input required={required} value={v} onChange={e=>set(e.target.value)} style={fi} placeholder={ph}/></div>;}
function FS({label,v,set,opts}:{label:string;v:string;set:(v:string)=>void;opts:{v:string;l:string}[]}){return<div><label style={fl}>{label}</label><select value={v} onChange={e=>set(e.target.value)} style={fi}>{opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></div>;}

function Pag({page,totalPages,total,perPage,onPage}:{page:number;totalPages:number;total:number;perPage:number;onPage:(p:number)=>void}){const from=(page-1)*perPage+1;const to=Math.min(page*perPage,total);return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 4px",fontSize:"13px",color:"#6b7280"}}><span>Mostrando {from}-{to} de {total}</span><div style={{display:"flex",gap:4}}><PB onClick={()=>onPage(1)} disabled={page===1}>{"«"}</PB><PB onClick={()=>onPage(page-1)} disabled={page===1}>{"‹"}</PB>{Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=2).reduce((acc,p,i,arr)=>{if(i>0&&p-arr[i-1]>1)acc.push(-1);acc.push(p);return acc;},[] as number[]).map((p,i)=>p===-1?<span key={`e${i}`} style={{padding:"4px",color:"#bbb"}}>...</span>:<PB key={p} onClick={()=>onPage(p)} active={p===page}>{p}</PB>)}<PB onClick={()=>onPage(page+1)} disabled={page===totalPages}>{"›"}</PB><PB onClick={()=>onPage(totalPages)} disabled={page===totalPages}>{"»"}</PB></div></div>);}
function PB({children,onClick,disabled,active}:{children:React.ReactNode;onClick:()=>void;disabled?:boolean;active?:boolean}){return<button onClick={onClick} disabled={disabled} style={{padding:"4px 10px",borderRadius:6,border:active?"1px solid #1a1a2e":"1px solid #e0e2e7",background:active?"#1a1a2e":disabled?"#f8f9fb":"#fff",color:active?"#fff":disabled?"#ccc":"#374151",cursor:disabled?"default":"pointer",fontSize:"13px",fontWeight:active?600:400,minWidth:32}}>{children}</button>;}
function NI({icon,label,active}:{icon:React.ReactNode;label:string;active:boolean}){return<div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,cursor:"pointer",fontSize:"13px",fontWeight:active?500:400,color:active?"#1a1a2e":"#6b7280",background:active?"#f1f3f5":"transparent",marginBottom:2}}>{icon}{label}</div>;}
function KpiCard({label,value,sub,accent,onClick,active}:{label:string;value:string;sub:string;accent:string;onClick?:()=>void;active?:boolean}){return<div onClick={onClick} style={{background:active?"#FFFBF0":"#fff",border:`1px solid ${active?"#F0D68A":"#e0e2e7"}`,borderRadius:12,padding:"18px 20px",borderTop:`3px solid ${accent}`,transition:"transform 0.15s, box-shadow 0.15s",cursor:onClick?"pointer":"default",boxShadow:active?"0 0 0 2px rgba(133,79,11,0.15)":"none"}} onMouseEnter={e=>{e.currentTarget.style.transform="translateY(-2px)";if(onClick)e.currentTarget.style.boxShadow=`0 4px 12px rgba(0,0,0,0.08)${active?", 0 0 0 2px rgba(133,79,11,0.15)":""}`;}} onMouseLeave={e=>{e.currentTarget.style.transform="none";e.currentTarget.style.boxShadow=active?"0 0 0 2px rgba(133,79,11,0.15)":"none";}}><p style={{fontSize:"12px",color:"#6b7280",margin:"0 0 6px"}}>{label}</p><p style={{fontSize:"22px",fontWeight:700,margin:"0 0 4px",color:"#1a1a2e"}}>{value}</p><p style={{fontSize:"11px",color:active?"#854F0B":"#9ca3af",margin:0,fontWeight:active?500:400}}>{sub}</p></div>;}
function Badge({bg,color,children}:{bg:string;color:string;children:React.ReactNode}){return<span style={{padding:"3px 10px",borderRadius:10,fontSize:"11px",fontWeight:500,background:bg,color}}>{children}</span>;}

const fl:React.CSSProperties={display:"block",fontSize:"12px",fontWeight:500,color:"#374151",marginBottom:5};
const fi:React.CSSProperties={width:"100%",padding:"9px 13px",border:"1px solid #e0e2e7",borderRadius:8,fontSize:"13px",boxSizing:"border-box",background:"#fff",color:"#1a1a2e",transition:"border-color 0.2s, box-shadow 0.2s"};
const td:React.CSSProperties={padding:"11px 10px",color:"#374151"};
const ab:React.CSSProperties={background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:4,color:"#6b7280",display:"inline-flex",alignItems:"center"};
"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import Sidebar from "@/app/lib/Sidebar";

type Company={id:string;name:string};type Supplier={id:string;legalName:string;tradeName:string|null;cnpj:string};
type Contract={id:string;contractNumber:string;description:string;status:string;startDate:string;endDate:string|null;unitValue:number|null;totalValue:number|null;paymentFrequency:string|null;adjustmentType:string|null;adjustmentMonth:number|null;adjustmentIndex:string|null;noticePeriodDays:number|null;responsible:string|null;mapping:string|null;notes:string|null;billingType:string|null;billingDetail:string|null;autoRenewal:string|null;supplier:Supplier;company:Company};
type Toast={message:string;type:"success"|"error"};type SortDir="asc"|"desc";
type ColKey="supplier"|"contractNumber"|"description"|"company"|"billingType"|"unitValue"|"totalValue"|"startDate"|"endDate"|"vigencia"|"aviso"|"autoRenewal"|"responsible"|"status";

const PER_PAGE=10;
const SC:Record<string,{bg:string;text:string}>={Novo:{bg:"#EEEDFE",text:"#534AB7"},Ativo:{bg:"#E1F5EE",text:"#0F6E56"},Cancelado:{bg:"#FCEBEB",text:"#A32D2D"},Bloqueado:{bg:"#FAEEDA",text:"#854F0B"}};
const RC:Record<string,{bg:string;text:string}>={Sim:{bg:"#E1F5EE",text:"#0F6E56"},"Não":{bg:"#FCEBEB",text:"#A32D2D"},"Sob consulta":{bg:"#FAEEDA",text:"#854F0B"}};
const MESES=["","Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const BT=["Por usuário","Por máquina","Por faturamento","Por processamento","Por ticket","Valor fixo","Outro"];
const STS=["Novo","Ativo","Cancelado","Bloqueado"];const RO=["Sim","Não","Sob consulta"];
const EF={contractNumber:"",description:"",supplierId:"",companyId:"",unitValue:"",totalValue:"",paymentFrequency:"",adjustmentType:"",adjustmentMonth:"",adjustmentIndex:"",startDate:"",endDate:"",noticePeriodDays:"",responsible:"",mapping:"",billingType:"",billingDetail:"",autoRenewal:"",notes:"",status:"Novo"};

function fD(d:string|null){if(!d)return"—";return new Date(d).toLocaleDateString("pt-BR");}
function fDI(d:string|null){if(!d)return"";return new Date(d).toISOString().split("T")[0];}
function fC(v:number|null){if(!v)return"—";return v.toLocaleString("pt-BR",{style:"currency",currency:"BRL"});}
function cV(s:string,e:string|null){if(!e)return"Indeterminado";const d=Math.ceil((new Date(e).getTime()-new Date(s).getTime())/864e5);if(d<0)return"Vencido";const m=Math.floor(d/30);if(m>=12){const y=Math.floor(m/12);const r=m%12;return r>0?`${y}a ${r}m`:`${y}a`;}return`${m}m`;}
function cDL(e:string|null){if(!e)return null;return Math.ceil((new Date(e).getTime()-Date.now())/864e5);}
function cA(e:string|null){const d=cDL(e);if(d===null)return null;if(d<0)return{t:"Vencido",bg:"#FCEBEB",c:"#A32D2D"};if(d<=30)return{t:`${d}d`,bg:"#FCEBEB",c:"#A32D2D"};if(d<=90)return{t:`${d}d`,bg:"#FAEEDA",c:"#854F0B"};return{t:`${d}d`,bg:"#E1F5EE",c:"#0F6E56"};}
function gRU(st:string,ed:string|null){if(st!=="Ativo")return{border:"transparent",bg:"transparent",bgH:"#f8f9fb"};const d=cDL(ed);if(d===null)return{border:"transparent",bg:"transparent",bgH:"#f8f9fb"};if(d<0)return{border:"#E24B4A",bg:"#FCEBEB",bgH:"#F7C1C1"};if(d<=30)return{border:"#E24B4A",bg:"#fff8f8",bgH:"#FCEBEB"};if(d<=90)return{border:"#EF9F27",bg:"#fffcf5",bgH:"#FAEEDA"};return{border:"transparent",bg:"transparent",bgH:"#f8f9fb"};}
function sN(c:Contract){return c.supplier.tradeName||c.supplier.legalName;}
function gSV(c:Contract,k:ColKey):string|number{switch(k){case"supplier":return sN(c).toLowerCase();case"contractNumber":return c.contractNumber.toLowerCase();case"description":return c.description.toLowerCase();case"company":return c.company.name.toLowerCase();case"billingType":return(c.billingType||"").toLowerCase();case"unitValue":return c.unitValue||0;case"totalValue":return c.totalValue||0;case"startDate":return c.startDate;case"endDate":return c.endDate||"9999";case"vigencia":return cDL(c.endDate)??99999;case"aviso":return cDL(c.endDate)??99999;case"autoRenewal":return(c.autoRenewal||"").toLowerCase();case"responsible":return(c.responsible||"").toLowerCase();case"status":return c.status.toLowerCase();default:return"";}}

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
case"id":return<svg width="18" height="18" fill="none" stroke={s} strokeWidth={w} viewBox={v}><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"/><rect x="9" y="3" width="6" height="4" rx="1"/></svg>;
case"money":return<svg width="18" height="18" fill="none" stroke={s} strokeWidth={w} viewBox={v}><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>;
case"refresh":return<svg width="18" height="18" fill="none" stroke={s} strokeWidth={w} viewBox={v}><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></svg>;
case"calendar":return<svg width="18" height="18" fill="none" stroke={s} strokeWidth={w} viewBox={v}><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>;
case"user":return<svg width="18" height="18" fill="none" stroke={s} strokeWidth={w} viewBox={v}><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
default:return null;}}

function PageContent(){
  const[contracts,setContracts]=useState<Contract[]>([]);const[companies,setCompanies]=useState<Company[]>([]);const[suppliers,setSuppliers]=useState<Supplier[]>([]);
  const[showForm,setShowForm]=useState(false);const[editingId,setEditingId]=useState<string|null>(null);const[loading,setLoading]=useState(true);const[saving,setSaving]=useState(false);
  const[form,setForm]=useState(EF);const searchParams=useSearchParams();const router=useRouter();
  const[filterStatus,setFilterStatus]=useState(searchParams.get("status")||"Todos");const[search,setSearch]=useState("");const[toast,setToast]=useState<Toast|null>(null);
  const[sortCol,setSortCol]=useState<ColKey>("supplier");const[sortDir,setSortDir]=useState<SortDir>("asc");const[page,setPage]=useState(1);

  function showToast(m:string,t:"success"|"error"="success"){setToast({message:m,type:t});setTimeout(()=>setToast(null),4000);}
  async function loadData(){setLoading(true);const[c,co,su]=await Promise.all([fetch("/api/contracts").then(r=>r.json()),fetch("/api/companies").then(r=>r.json()),fetch("/api/suppliers").then(r=>r.json())]);setContracts(c);setCompanies(co);setSuppliers(su);setLoading(false);}
  useEffect(()=>{loadData();},[]);

  function openNew(){setEditingId(null);setForm(EF);setShowForm(true);}
  function openEdit(c:Contract){setEditingId(c.id);setForm({contractNumber:c.contractNumber,description:c.description,supplierId:c.supplierId,companyId:c.companyId,unitValue:c.unitValue?String(c.unitValue):"",totalValue:c.totalValue?String(c.totalValue):"",paymentFrequency:c.paymentFrequency||"",adjustmentType:c.adjustmentType||"",adjustmentMonth:c.adjustmentMonth?String(c.adjustmentMonth):"",adjustmentIndex:c.adjustmentIndex||"",startDate:fDI(c.startDate),endDate:fDI(c.endDate),noticePeriodDays:c.noticePeriodDays?String(c.noticePeriodDays):"",responsible:c.responsible||"",mapping:c.mapping||"",billingType:c.billingType||"",billingDetail:c.billingDetail||"",autoRenewal:c.autoRenewal||"",notes:c.notes||"",status:c.status});setShowForm(true);window.scrollTo({top:0,behavior:"smooth"});}
  async function handleSubmit(e:React.FormEvent){e.preventDefault();setSaving(true);try{const url=editingId?`/api/contracts/${editingId}`:"/api/contracts";const method=editingId?"PATCH":"POST";const res=await fetch(url,{method,headers:{"Content-Type":"application/json"},body:JSON.stringify(form)});if(!res.ok)throw new Error();setForm(EF);setShowForm(false);setEditingId(null);showToast(editingId?`Contrato ${form.contractNumber} atualizado`:`Contrato ${form.contractNumber} criado`);loadData();}catch{showToast("Erro ao salvar.","error");}finally{setSaving(false);}}
  async function handleDelete(id:string,n:string){if(!confirm(`Excluir contrato ${n}?\n\nEssa ação não pode ser desfeita.`))return;try{const res=await fetch(`/api/contracts/${id}`,{method:"DELETE"});if(!res.ok)throw new Error();showToast(`Contrato ${n} excluído`);loadData();}catch{showToast("Erro ao excluir.","error");}}
  function closeForm(){setShowForm(false);setEditingId(null);setForm(EF);}
  function set(f:string,v:string){setForm(p=>({...p,[f]:v}));}
  function toggleSort(col:ColKey){if(sortCol===col)setSortDir(d=>d==="asc"?"desc":"asc");else{setSortCol(col);setSortDir("asc");}setPage(1);}

  const vf=searchParams.get("vencendo");
  const filtered=contracts.filter(c=>{if(filterStatus!=="Todos"&&c.status!==filterStatus)return false;if(vf){const d=cDL(c.endDate);if(d===null||d<0||d>parseInt(vf)||c.status!=="Ativo")return false;}if(search){const q=search.toLowerCase();return c.contractNumber.toLowerCase().includes(q)||c.description.toLowerCase().includes(q)||sN(c).toLowerCase().includes(q)||c.company.name.toLowerCase().includes(q)||(c.responsible||"").toLowerCase().includes(q);}return true;});
  const sorted=[...filtered].sort((a,b)=>{const va=gSV(a,sortCol);const vb=gSV(b,sortCol);if(va<vb)return sortDir==="asc"?-1:1;if(va>vb)return sortDir==="asc"?1:-1;return 0;});
  const tp=Math.ceil(sorted.length/PER_PAGE);const paged=sorted.slice((page-1)*PER_PAGE,page*PER_PAGE);
  const total=contracts.length;const ativos=contracts.filter(c=>c.status==="Ativo").length;
  const vencendo=contracts.filter(c=>{if(!c.endDate||c.status!=="Ativo")return false;const d=cDL(c.endDate);return d!==null&&d>=0&&d<=90;}).length;
  const valorTotal=contracts.reduce((s,c)=>s+(c.unitValue||0),0);

  function exportExcel(){const rows=sorted.map(c=>({numero_contrato:c.contractNumber,empresa:c.company.name,fornecedor_cnpj:c.supplier.cnpj,objeto:c.description,valor_mensal:c.unitValue||"",valor_total:c.totalValue||"",periodicidade_pagamento:c.paymentFrequency||"",tipo_cobranca:c.billingType||"",detalhe_cobranca:c.billingDetail||"",reajuste:c.adjustmentIndex||"",tipo_reajuste:c.adjustmentType||"",mes_reajuste:c.adjustmentMonth||"",data_inicio:fD(c.startDate),data_termino:fD(c.endDate),aviso_previo_dias:c.noticePeriodDays||"",renovacao_automatica:c.autoRenewal||"",responsavel:c.responsible||"",mapeamento:c.mapping||"",observacoes:c.notes||"",status:c.status}));const ws=XLSX.utils.json_to_sheet(rows);ws["!cols"]=Object.keys(rows[0]||{}).map(k=>({wch:Math.max(k.length,...rows.map(r=>String((r as Record<string,unknown>)[k]||"").length))+2}));const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,"Contratos");const buf=XLSX.write(wb,{bookType:"xlsx",type:"array"});saveAs(new Blob([buf],{type:"application/octet-stream"}),`contratos_${new Date().toISOString().slice(0,10)}.xlsx`);showToast(`${sorted.length} contratos exportados`);}

  const columns:{key:ColKey;label:string}[]=[{key:"contractNumber",label:"Nº Contrato"},{key:"description",label:"Objeto"},{key:"supplier",label:"Fornecedor"},{key:"company",label:"Empresa"},{key:"billingType",label:"Cobrança"},{key:"unitValue",label:"Valor mensal"},{key:"totalValue",label:"Valor total"},{key:"startDate",label:"Início"},{key:"endDate",label:"Término"},{key:"vigencia",label:"Vigência"},{key:"aviso",label:"Aviso"},{key:"autoRenewal",label:"Renovação"},{key:"responsible",label:"Responsável"},{key:"status",label:"Status"}];

  return(
    <div style={{display:"flex",minHeight:"100vh"}}>
      {toast&&(<div style={{position:"fixed",top:20,right:20,zIndex:999,display:"flex",alignItems:"center",gap:10,padding:"12px 20px",borderRadius:10,background:toast.type==="success"?"#E1F5EE":"#FCEBEB",color:toast.type==="success"?"#0F6E56":"#A32D2D",border:`1px solid ${toast.type==="success"?"#5DCAA5":"#F09595"}`,fontSize:"13px",fontWeight:500,animation:"slideIn 0.3s ease",boxShadow:"0 4px 12px rgba(0,0,0,0.08)"}}>{toast.type==="success"?<IChk/>:<IWrn/>}{toast.message}</div>)}
      <style>{`@keyframes slideIn{from{transform:translateX(100px);opacity:0}to{transform:translateX(0);opacity:1}}`}</style>

      <Sidebar active="contracts"/>
      <main style={{flex:1,padding:"28px 32px",overflowX:"auto"}}>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:14,marginBottom:24}}>
          <div onClick={()=>{setFilterStatus("Todos");setPage(1);router.push("/");}} style={{cursor:"pointer"}}><KpiCard label="Total de contratos" value={String(total)} sub={`${companies.length} empresas`} accent="#534AB7"/></div>
          <div onClick={()=>{setFilterStatus("Ativo");setPage(1);}} style={{cursor:"pointer"}}><KpiCard label="Contratos ativos" value={String(ativos)} sub={total?`${Math.round(ativos/total*100)}% do total`:"—"} accent="#0F6E56"/></div>
          <div onClick={()=>{setFilterStatus("Todos");setSearch("");setPage(1);router.push("/?vencendo=90");}} style={{cursor:"pointer"}}><KpiCard label="Vencem em 90 dias" value={String(vencendo)} sub={vencendo>0?"Requer atenção":"Nenhum alerta"} accent="#854F0B"/></div>
          <KpiCard label="Valor mensal total" value={fC(valorTotal)} sub="Soma dos contratos" accent="#185FA5"/>
        </div>

        <div style={{display:"flex",gap:16,marginBottom:16,fontSize:"11px",color:"#6b7280"}}><span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:12,height:12,borderRadius:2,borderLeft:"3px solid #E24B4A",background:"#FCEBEB"}}></span> Vencido</span><span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:12,height:12,borderRadius:2,borderLeft:"3px solid #E24B4A",background:"#fff8f8"}}></span> Vence em até 30d</span><span style={{display:"flex",alignItems:"center",gap:5}}><span style={{width:12,height:12,borderRadius:2,borderLeft:"3px solid #EF9F27",background:"#fffcf5"}}></span> Vence em até 90d</span></div>

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,gap:12,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}><h2 style={{fontSize:"18px",fontWeight:600,margin:0}}>Contratos</h2><span style={{fontSize:"12px",color:"#9ca3af",background:"#f1f3f5",padding:"2px 10px",borderRadius:10}}>{sorted.length}</span></div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            <input placeholder="Buscar..." value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}} style={{padding:"8px 14px",border:"1px solid #e0e2e7",borderRadius:8,fontSize:"13px",width:240,background:"#fff"}}/>
            <select value={filterStatus} onChange={e=>{setFilterStatus(e.target.value);setPage(1);}} style={{padding:"8px 12px",border:"1px solid #e0e2e7",borderRadius:8,fontSize:"13px",background:"#fff",color:"#1a1a2e"}}><option value="Todos">Todos</option>{STS.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <button onClick={exportExcel} disabled={sorted.length===0} style={{display:"flex",alignItems:"center",gap:5,padding:"8px 14px",background:"#fff",color:"#1a1a2e",border:"1px solid #e0e2e7",borderRadius:8,cursor:"pointer",fontSize:"13px"}}><IDl/> Exportar</button>
            <button onClick={showForm?closeForm:openNew} style={{display:"flex",alignItems:"center",gap:6,padding:"8px 18px",background:showForm?"#6b7280":"#1a1a2e",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:"13px",fontWeight:500}}>{showForm?<><IX/> Cancelar</>:<><IPlus/> Novo contrato</>}</button>
          </div>
        </div>

        {/* FORMULÁRIO REDESENHADO */}
        {showForm&&(
          <div style={{background:"#fff",border:"1px solid #e0e2e7",borderRadius:16,marginBottom:20,overflow:"hidden"}}>
            <div style={{background:"linear-gradient(135deg,#1a1a2e 0%,#2d2b55 100%)",padding:"20px 28px",color:"#fff"}}>
              <h3 style={{fontSize:"17px",fontWeight:600,margin:0}}>{editingId?"Editar contrato":"Novo contrato"}</h3>
              <p style={{fontSize:"12px",opacity:0.7,margin:"4px 0 0"}}>Campos com * são obrigatórios</p>
            </div>
            <form onSubmit={handleSubmit} style={{padding:"0 28px 28px"}}>


              <FormSection icon="id" title="Identificação" desc="Dados básicos do contrato">
                <G3><F label="Nº do contrato" required v={form.contractNumber} set={v=>set("contractNumber",v)} ph="CTR-2025-001"/><FS label="Empresa" required v={form.companyId} set={v=>set("companyId",v)} opts={companies.map(c=>({v:c.id,l:c.name}))}/><FS label="Fornecedor" required v={form.supplierId} set={v=>set("supplierId",v)} opts={suppliers.map(s=>({v:s.id,l:`${s.tradeName||s.legalName} — ${s.cnpj}`}))}/></G3>
                <F label="Objeto do contrato" required v={form.description} set={v=>set("description",v)} ph="Descrição do serviço ou produto contratado" full/>
              </FormSection>

              <FormSection icon="money" title="Valores e cobrança" desc="Informações financeiras e modelo de precificação">
                <G3><F label="Valor mensal (R$)" type="number" step="0.01" v={form.unitValue} set={v=>set("unitValue",v)} ph="0,00"/><F label="Valor total (R$)" type="number" step="0.01" v={form.totalValue} set={v=>set("totalValue",v)} ph="0,00"/><FS label="Periodicidade" required v={form.paymentFrequency} set={v=>set("paymentFrequency",v)} opts={["Mensal","Bimestral","Trimestral","Semestral","Anual","Pagamento único"].map(o=>({v:o,l:o}))}/></G3>
                <G3><FS label="Tipo de cobrança" required v={form.billingType} set={v=>set("billingType",v)} opts={BT.map(o=>({v:o,l:o}))}/><div style={{gridColumn:"2 / -1"}}><label style={fl}>Detalhe da cobrança</label><input value={form.billingDetail} onChange={e=>set("billingDetail",e.target.value)} style={fi} placeholder="Ex: 150 usuários a R$ 12/mês, mínimo 20 tickets"/></div></G3>
              </FormSection>

              <FormSection icon="refresh" title="Reajuste" desc="Índice e periodicidade do reajuste contratual">
                <G3><F label="Reajuste (índice)" v={form.adjustmentIndex} set={v=>set("adjustmentIndex",v)} ph="Ex: IGPM + 2%"/><FS label="Tipo de reajuste" v={form.adjustmentType} set={v=>set("adjustmentType",v)} opts={["IGPM","IPCA","INPC","IGP-DI","Fixo","Outro"].map(o=>({v:o,l:o}))}/><FS label="Mês do reajuste" v={form.adjustmentMonth} set={v=>set("adjustmentMonth",v)} opts={MESES.slice(1).map((m,i)=>({v:String(i+1),l:m}))}/></G3>
              </FormSection>

              <FormSection icon="calendar" title="Vigência" desc="Datas, prazos e renovação do contrato">
                <G3><F label="Data de início" required type="date" v={form.startDate} set={v=>set("startDate",v)}/><F label="Data de término" required type="date" v={form.endDate} set={v=>set("endDate",v)}/><F label="Aviso prévio (dias)" type="number" v={form.noticePeriodDays} set={v=>set("noticePeriodDays",v)} ph="30, 60, 90"/></G3>
                <G3><FS label="Renovação automática" v={form.autoRenewal} set={v=>set("autoRenewal",v)} opts={RO.map(o=>({v:o,l:o}))}/></G3>
              </FormSection>

              <FormSection icon="user" title="Responsável e observações" desc="Gestão e informações complementares">
                <G3><FS label="Status" v={form.status} set={v=>set("status",v)} opts={STS.map(s=>({v:s,l:s}))}/><F label="Responsável" required v={form.responsible} set={v=>set("responsible",v)} ph="Gestor do contrato"/><F label="Mapeamento" v={form.mapping} set={v=>set("mapping",v)} ph="Área, centro de custo"/></G3>
                <div><label style={fl}>Observações</label><textarea value={form.notes} onChange={e=>set("notes",e.target.value)} style={{...fi,height:72,resize:"vertical"}} placeholder="Informações adicionais sobre o contrato"/></div>
              </FormSection>

              <div style={{display:"flex",gap:12,paddingTop:20,borderTop:"1px solid #e0e2e7"}}>
                <button type="submit" disabled={saving} style={{padding:"11px 32px",background:saving?"#9ca3af":"#1a1a2e",color:"#fff",border:"none",borderRadius:8,cursor:saving?"not-allowed":"pointer",fontSize:"14px",fontWeight:500}}>{saving?"Salvando...":(editingId?"Salvar alterações":"Criar contrato")}</button>
                <button type="button" onClick={closeForm} style={{padding:"11px 24px",background:"#fff",color:"#6b7280",border:"1px solid #e0e2e7",borderRadius:8,cursor:"pointer",fontSize:"14px"}}>Cancelar</button>
              </div>
            </form>
          </div>
        )}

        {loading?(<p style={{color:"#9ca3af",padding:40,textAlign:"center"}}>Carregando...</p>
        ):sorted.length===0?(
          <div style={{textAlign:"center",padding:"60px 20px",color:"#9ca3af",background:"#fff",border:"1px dashed #e0e2e7",borderRadius:12}}><p style={{fontSize:"15px",margin:"0 0 6px",fontWeight:500}}>{contracts.length===0?"Nenhum contrato cadastrado":"Nenhum resultado"}</p><p style={{fontSize:"13px",margin:0}}>{contracts.length===0?"Clique em \"+ Novo contrato\" para começar":"Tente alterar os filtros"}</p></div>
        ):(<>
          <div style={{background:"#fff",border:"1px solid #e0e2e7",borderRadius:12,overflow:"hidden"}}>
            <div style={{overflowX:"auto"}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"13px",minWidth:1600}}>
                <thead><tr style={{background:"#f8f9fb",borderBottom:"1px solid #e0e2e7"}}><th style={{width:4,padding:0}}></th>{columns.map(col=>(<th key={col.key} onClick={()=>toggleSort(col.key)} style={{padding:"10px",fontSize:"11px",color:"#6b7280",fontWeight:500,textAlign:"left",whiteSpace:"nowrap",cursor:"pointer",userSelect:"none"}}><span style={{display:"inline-flex",alignItems:"center",gap:4}}>{col.label} <SA dir={sortCol===col.key?sortDir:null}/></span></th>))}<th style={{padding:"10px",width:60}}></th></tr></thead>
                <tbody>{paged.map(c=>{const av=cA(c.endDate);const st=SC[c.status]||{bg:"#f1f3f5",text:"#6b7280"};const urg=gRU(c.status,c.endDate);const rn=c.autoRenewal?RC[c.autoRenewal]||{bg:"#f1f3f5",text:"#6b7280"}:null;
                  return(<tr key={c.id} style={{borderBottom:"1px solid #f1f3f5",transition:"background 0.15s",background:urg.bg}} onMouseEnter={e=>(e.currentTarget.style.background=urg.bgH)} onMouseLeave={e=>(e.currentTarget.style.background=urg.bg)}>
                    <td style={{width:4,padding:0,borderLeft:`3px solid ${urg.border}`}}></td>
                    <td style={{...td,fontWeight:600,color:"#1a1a2e"}}>{c.contractNumber}</td>
                    <td style={{...td,maxWidth:180,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}} title={c.description}>{c.description}</td>
                    <td style={td}>{sN(c)}</td><td style={td}>{c.company.name}</td>
                    <td style={td} title={c.billingDetail||""}>{c.billingType?<Badge bg="#F1F3F5" color="#374151">{c.billingType}</Badge>:"—"}</td>
                    <td style={td}>{fC(c.unitValue)}</td><td style={td}>{fC(c.totalValue)}</td>
                    <td style={td}>{fD(c.startDate)}</td><td style={td}>{fD(c.endDate)}</td>
                    <td style={td}>{cV(c.startDate,c.endDate)}</td>
                    <td style={td}>{av?<Badge bg={av.bg} color={av.c}>{av.t}</Badge>:"—"}</td>
                    <td style={td}>{rn?<Badge bg={rn.bg} color={rn.text}>{c.autoRenewal}</Badge>:"—"}</td>
                    <td style={td}>{c.responsible||"—"}</td>
                    <td style={td}><Badge bg={st.bg} color={st.text}>{c.status}</Badge></td>
                    <td style={{...td,whiteSpace:"nowrap"}}><button onClick={()=>openEdit(c)} style={ab} title="Editar"><IEdit/></button><button onClick={()=>handleDelete(c.id,c.contractNumber)} style={{...ab,color:"#A32D2D"}} title="Excluir"><ITrash/></button></td>
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

export default function Home(){return<Suspense fallback={<div style={{padding:40,textAlign:"center",color:"#9ca3af"}}>Carregando...</div>}><PageContent/></Suspense>;}

function FormSection({icon,title,desc,children}:{icon:string;title:string;desc:string;children:React.ReactNode}){
  return(<div style={{margin:"24px 0 0"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:14}}>
      <div style={{width:36,height:36,borderRadius:10,background:"#EEEDFE",display:"flex",alignItems:"center",justifyContent:"center",color:"#534AB7",flexShrink:0}}><SIcon type={icon}/></div>
      <div><p style={{fontSize:"14px",fontWeight:600,color:"#1a1a2e",margin:0}}>{title}</p><p style={{fontSize:"11px",color:"#9ca3af",margin:0}}>{desc}</p></div>
    </div>
    <div style={{background:"#fafbfc",borderRadius:10,padding:"16px 18px",border:"1px solid #f1f3f5"}}>{children}</div>
  </div>);
}

function G3({children}:{children:React.ReactNode}){return<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:14,marginBottom:10}}>{children}</div>;}
function F({label,v,set,ph,type,required,step,full}:{label:string;v:string;set:(v:string)=>void;ph?:string;type?:string;required?:boolean;step?:string;full?:boolean}){
  return<div style={full?{gridColumn:"1 / -1",marginBottom:10}:undefined}><label style={fl}>{label}{required&&<span style={{color:"#E24B4A"}}> *</span>}</label><input type={type||"text"} step={step} required={required} value={v} onChange={e=>set(e.target.value)} style={fi} placeholder={ph}/></div>;
}
function FS({label,v,set,opts,required}:{label:string;v:string;set:(v:string)=>void;opts:{v:string;l:string}[];required?:boolean}){
  return<div><label style={fl}>{label}{required&&<span style={{color:"#E24B4A"}}> *</span>}</label><select required={required} value={v} onChange={e=>set(e.target.value)} style={fi}><option value="">Selecione...</option>{opts.map(o=><option key={o.v} value={o.v}>{o.l}</option>)}</select></div>;
}

function Pag({page,totalPages,total,perPage,onPage}:{page:number;totalPages:number;total:number;perPage:number;onPage:(p:number)=>void}){const from=(page-1)*perPage+1;const to=Math.min(page*perPage,total);return(<div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 4px",fontSize:"13px",color:"#6b7280"}}><span>Mostrando {from}-{to} de {total}</span><div style={{display:"flex",gap:4}}><PB onClick={()=>onPage(1)} disabled={page===1}>{"«"}</PB><PB onClick={()=>onPage(page-1)} disabled={page===1}>{"‹"}</PB>{Array.from({length:totalPages},(_,i)=>i+1).filter(p=>p===1||p===totalPages||Math.abs(p-page)<=2).reduce((acc,p,i,arr)=>{if(i>0&&p-arr[i-1]>1)acc.push(-1);acc.push(p);return acc;},[] as number[]).map((p,i)=>p===-1?<span key={`e${i}`} style={{padding:"4px",color:"#bbb"}}>...</span>:<PB key={p} onClick={()=>onPage(p)} active={p===page}>{p}</PB>)}<PB onClick={()=>onPage(page+1)} disabled={page===totalPages}>{"›"}</PB><PB onClick={()=>onPage(totalPages)} disabled={page===totalPages}>{"»"}</PB></div></div>);}
function PB({children,onClick,disabled,active}:{children:React.ReactNode;onClick:()=>void;disabled?:boolean;active?:boolean}){return<button onClick={onClick} disabled={disabled} style={{padding:"4px 10px",borderRadius:6,border:active?"1px solid #1a1a2e":"1px solid #e0e2e7",background:active?"#1a1a2e":disabled?"#f8f9fb":"#fff",color:active?"#fff":disabled?"#ccc":"#374151",cursor:disabled?"default":"pointer",fontSize:"13px",fontWeight:active?600:400,minWidth:32}}>{children}</button>;}
function NI({icon,label,active}:{icon:React.ReactNode;label:string;active:boolean}){return<div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,cursor:"pointer",fontSize:"13px",fontWeight:active?500:400,color:active?"#1a1a2e":"#6b7280",background:active?"#f1f3f5":"transparent",marginBottom:2}}>{icon}{label}</div>;}
function KpiCard({label,value,sub,accent}:{label:string;value:string;sub:string;accent:string}){return<div style={{background:"#fff",border:"1px solid #e0e2e7",borderRadius:12,padding:"18px 20px",borderTop:`3px solid ${accent}`,transition:"transform 0.15s"}} onMouseEnter={e=>(e.currentTarget.style.transform="translateY(-2px)")} onMouseLeave={e=>(e.currentTarget.style.transform="none")}><p style={{fontSize:"12px",color:"#6b7280",margin:"0 0 6px"}}>{label}</p><p style={{fontSize:"22px",fontWeight:700,margin:"0 0 4px",color:"#1a1a2e"}}>{value}</p><p style={{fontSize:"11px",color:"#9ca3af",margin:0}}>{sub}</p></div>;}
function Badge({bg,color,children}:{bg:string;color:string;children:React.ReactNode}){return<span style={{padding:"3px 10px",borderRadius:10,fontSize:"11px",fontWeight:500,background:bg,color}}>{children}</span>;}

const fl:React.CSSProperties={display:"block",fontSize:"12px",fontWeight:500,color:"#374151",marginBottom:5};
const fi:React.CSSProperties={width:"100%",padding:"9px 13px",border:"1px solid #e0e2e7",borderRadius:8,fontSize:"13px",boxSizing:"border-box",background:"#fff",color:"#1a1a2e",transition:"border-color 0.2s, box-shadow 0.2s"};
const td:React.CSSProperties={padding:"11px 10px",color:"#374151"};
const ab:React.CSSProperties={background:"none",border:"none",cursor:"pointer",padding:"4px 6px",borderRadius:4,color:"#6b7280",display:"inline-flex",alignItems:"center"};
"use client";
import { useState } from "react";
import Sidebar from "@/app/lib/Sidebar";

type RowError = { row: number; field: string; message: string };
type ValidatedRow = { data: Record<string, string>; errors: RowError[]; rowIndex: number };
type ValidationResult = { totalRows: number; validRows: number; errorRows: number; totalErrors: number; rows: ValidatedRow[] };
type ImportResult = { created: number; skipped: number; errors: number; rejected: number; total: number };
type Step = "upload" | "validating" | "preview" | "importing" | "done";

function IconGrid(){return<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;}
function IconDoc(){return<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>;}
function IconUsers(){return<svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>;}
function IconUpload(){return<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>;}
function IconCheck(){return<svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><polyline points="20 6 9 17 4 12"/></svg>;}

export default function ImportPage(){
  const[step,setStep]=useState<Step>("upload");
  const[type,setType]=useState<"suppliers"|"contracts">("suppliers");
  const[file,setFile]=useState<File|null>(null);
  const[validation,setValidation]=useState<ValidationResult|null>(null);
  const[result,setResult]=useState<ImportResult|null>(null);
  const[error,setError]=useState<string|null>(null);
  const[showOnlyErrors,setShowOnlyErrors]=useState(false);

  async function handleValidate(){
    if(!file)return;
    setStep("validating");setError(null);
    try{
      const fd=new FormData();fd.append("file",file);fd.append("type",type);fd.append("action","validate");
      const res=await fetch("/api/import",{method:"POST",body:fd});
      const data=await res.json();
      if(!res.ok){setError(data.error+(data.missingColumns?"\n\nColunas faltantes: "+data.missingColumns.join(", "):""));setStep("upload");return;}
      setValidation(data);setStep("preview");
    }catch{setError("Erro ao processar o arquivo");setStep("upload");}
  }

  async function handleImport(){
    if(!file)return;
    setStep("importing");
    try{
      const fd=new FormData();fd.append("file",file);fd.append("type",type);fd.append("action","import");
      const res=await fetch("/api/import",{method:"POST",body:fd});
      const data=await res.json();
      if(!res.ok){setError(data.error);setStep("preview");return;}
      setResult(data);setStep("done");
    }catch{setError("Erro ao importar");setStep("preview");}
  }

  function reset(){setStep("upload");setFile(null);setValidation(null);setResult(null);setError(null);setShowOnlyErrors(false);}

  const displayRows=validation?.rows.filter(r=>showOnlyErrors?r.errors.length>0:true)||[];
  const displayFields=type==="suppliers"
    ?["razao_social","nome_fantasia","cnpj","email","telefone","contato_comercial","criticidade"]
    :["numero_contrato","empresa","fornecedor_cnpj","objeto","valor_mensal","data_inicio","data_termino","tipo_cobranca","responsavel"];
  const fieldLabels:Record<string,string>={
    razao_social:"Razão social",nome_fantasia:"Nome fantasia",cnpj:"CNPJ",email:"E-mail",telefone:"Telefone",
    contato_comercial:"Contato comercial",contato_operacional:"Contato operacional",criticidade:"Criticidade",observacoes:"Obs",
    numero_contrato:"Nº Contrato",empresa:"Empresa",fornecedor_cnpj:"CNPJ Fornecedor",objeto:"Objeto",valor_mensal:"Valor mensal",
    valor_total:"Valor total",periodicidade_pagamento:"Periodicidade",tipo_cobranca:"Tipo cobrança",detalhe_cobranca:"Detalhe cobr.",
    data_inicio:"Início",data_termino:"Término",responsavel:"Responsável",mapeamento:"Mapeamento",
    tipo_reajuste:"Tipo reajuste",mes_reajuste:"Mês reajuste",reajuste:"Reajuste",aviso_previo_dias:"Aviso prévio",renovacao_automatica:"Renovação auto",
  };

  return(
    <div style={{display:"flex",minHeight:"100vh"}}>
    <Sidebar active="import"/>

      <main style={{flex:1,padding:"28px 32px",overflowX:"auto"}}>
        <h2 style={{fontSize:"20px",fontWeight:600,margin:"0 0 8px"}}>Importação em lote</h2>
        <p style={{fontSize:"13px",color:"#6b7280",margin:"0 0 24px"}}>Importe fornecedores e contratos a partir de uma planilha Excel (.xlsx)</p>

        {/* Steps indicator */}
        <div style={{display:"flex",gap:8,marginBottom:28}}>
          {[{k:"upload",l:"1. Upload"},{k:"preview",l:"2. Validação"},{k:"done",l:"3. Resultado"}].map(s=>{
            const active=s.k===step||(s.k==="preview"&&step==="validating")||(s.k==="done"&&step==="importing");
            const done=(s.k==="upload"&&["preview","validating","importing","done"].includes(step))||(s.k==="preview"&&["importing","done"].includes(step));
            return<div key={s.k} style={{padding:"8px 20px",borderRadius:8,fontSize:"13px",fontWeight:500,
              background:active?"#1a1a2e":done?"#E1F5EE":"#f1f3f5",
              color:active?"#fff":done?"#0F6E56":"#9ca3af"}}>{done?"✓ ":""}{s.l}</div>;
          })}
        </div>

        {/* Step: Upload */}
        {step==="upload"&&(
          <div style={{background:"#fff",border:"1px solid #e0e2e7",borderRadius:12,padding:32}}>
            <div style={{marginBottom:20}}>
              <label style={lbl}>O que deseja importar?</label>
              <div style={{display:"flex",gap:10,marginTop:8}}>
                {[{v:"suppliers" as const,l:"Fornecedores"},{v:"contracts" as const,l:"Contratos"}].map(o=>(
                  <button key={o.v} onClick={()=>setType(o.v)} style={{padding:"10px 24px",borderRadius:8,fontSize:"13px",fontWeight:500,cursor:"pointer",
                    border:type===o.v?"2px solid #1a1a2e":"1px solid #e0e2e7",background:type===o.v?"#f1f3f5":"#fff",color:"#1a1a2e"}}>{o.l}</button>
                ))}
              </div>
            </div>

            <div style={{border:"2px dashed #e0e2e7",borderRadius:12,padding:"40px 20px",textAlign:"center",marginBottom:20,
              background:file?"#E1F5EE":"#fafafa",borderColor:file?"#5DCAA5":"#e0e2e7"}}>
              <input type="file" accept=".xlsx,.xls,.csv" id="fileInput" style={{display:"none"}} onChange={e=>{if(e.target.files?.[0])setFile(e.target.files[0]);}}/>
              {file?(
                <div><p style={{fontSize:"14px",fontWeight:500,color:"#0F6E56",margin:"0 0 4px"}}>{file.name}</p><p style={{fontSize:"12px",color:"#6b7280",margin:0}}>{(file.size/1024).toFixed(0)} KB</p>
                  <button onClick={()=>setFile(null)} style={{marginTop:8,fontSize:"12px",color:"#A32D2D",background:"none",border:"none",cursor:"pointer",textDecoration:"underline"}}>Remover</button></div>
              ):(
                <div><IconUpload/><p style={{fontSize:"14px",color:"#6b7280",margin:"8px 0 4px"}}>Arraste o arquivo ou <label htmlFor="fileInput" style={{color:"#534AB7",cursor:"pointer",textDecoration:"underline"}}>clique para selecionar</label></p>
                  <p style={{fontSize:"12px",color:"#9ca3af",margin:0}}>Formatos aceitos: .xlsx, .xls, .csv</p></div>
              )}
            </div>

            {error&&<div style={{background:"#FCEBEB",color:"#A32D2D",padding:"12px 16px",borderRadius:8,fontSize:"13px",marginBottom:16,whiteSpace:"pre-line"}}>{error}</div>}

            <div style={{background:"#f8f9fb",borderRadius:8,padding:16,marginBottom:20}}>
              <p style={{fontSize:"13px",fontWeight:600,color:"#1a1a2e",margin:"0 0 8px"}}>Colunas esperadas para {type==="suppliers"?"fornecedores":"contratos"}:</p>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {(type==="suppliers"
                  ?[{f:"razao_social",r:true},{f:"cnpj",r:true},{f:"nome_fantasia",r:false},{f:"email",r:false},{f:"telefone",r:false},{f:"contato_comercial",r:false},{f:"contato_operacional",r:false},{f:"criticidade",r:false},{f:"observacoes",r:false}]
                  :[{f:"numero_contrato",r:true},{f:"empresa",r:true},{f:"fornecedor_cnpj",r:true},{f:"objeto",r:true},{f:"valor_mensal",r:false},{f:"valor_total",r:false},{f:"periodicidade_pagamento",r:true},{f:"tipo_cobranca",r:true},{f:"detalhe_cobranca",r:false},{f:"reajuste",r:false},{f:"tipo_reajuste",r:false},{f:"mes_reajuste",r:false},{f:"data_inicio",r:true},{f:"data_termino",r:true},{f:"aviso_previo_dias",r:false},{f:"renovacao_automatica",r:false},{f:"responsavel",r:true},{f:"mapeamento",r:false},{f:"observacoes",r:false}]
                ).map(c=>(
                  <span key={c.f} style={{padding:"3px 10px",borderRadius:10,fontSize:"11px",fontWeight:500,
                    background:c.r?"#FCEBEB":"#f1f3f5",color:c.r?"#A32D2D":"#6b7280"}}>{fieldLabels[c.f]||c.f}{c.r?" *":""}</span>
                ))}
              </div>
              <p style={{fontSize:"11px",color:"#9ca3af",margin:"8px 0 0"}}>Campos com * são obrigatórios. Os nomes das colunas no Excel devem corresponder (acentos e maiúsculas são ignorados).</p>
                <a href={`/api/template?type=${type}`} download style={{display:"inline-flex",alignItems:"center",gap:6,marginTop:10,fontSize:"12px",color:"#534AB7",textDecoration:"none",fontWeight:500}}>
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                Baixar template {type==="suppliers"?"de fornecedores":"de contratos"} (.xlsx)
                </a>
            </div>

            <button onClick={handleValidate} disabled={!file} style={{padding:"10px 28px",background:file?"#1a1a2e":"#9ca3af",color:"#fff",border:"none",borderRadius:8,cursor:file?"pointer":"not-allowed",fontSize:"13px",fontWeight:500}}>Validar arquivo</button>
          </div>
        )}

        {/* Step: Validating */}
        {step==="validating"&&(
          <div style={{background:"#fff",border:"1px solid #e0e2e7",borderRadius:12,padding:"60px 20px",textAlign:"center"}}>
            <p style={{fontSize:"15px",color:"#6b7280"}}>Validando {file?.name}...</p>
          </div>
        )}

        {/* Step: Preview */}
        {step==="preview"&&validation&&(
          <div style={{background:"#fff",border:"1px solid #e0e2e7",borderRadius:12,padding:24}}>
            <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:12,marginBottom:20}}>
              <Stat label="Total de linhas" value={validation.totalRows} color="#534AB7"/>
              <Stat label="Válidas" value={validation.validRows} color="#0F6E56"/>
              <Stat label="Com erros" value={validation.errorRows} color="#A32D2D"/>
              <Stat label="Total de erros" value={validation.totalErrors} color="#854F0B"/>
            </div>

            {validation.errorRows>0&&(
              <div style={{background:"#FAEEDA",color:"#854F0B",padding:"10px 16px",borderRadius:8,fontSize:"13px",marginBottom:16}}>
                {validation.errorRows} linha{validation.errorRows>1?"s":""} com erro{validation.errorRows>1?"s":""}. Apenas as linhas válidas serão importadas. Linhas com erro ficam destacadas em vermelho abaixo.
              </div>
            )}

            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{display:"flex",gap:10}}>
                <button onClick={()=>setShowOnlyErrors(false)} style={{...tabBtn,fontWeight:!showOnlyErrors?600:400,borderBottom:!showOnlyErrors?"2px solid #1a1a2e":"2px solid transparent"}}>Todas ({validation.totalRows})</button>
                <button onClick={()=>setShowOnlyErrors(true)} style={{...tabBtn,fontWeight:showOnlyErrors?600:400,borderBottom:showOnlyErrors?"2px solid #A32D2D":"2px solid transparent",color:showOnlyErrors?"#A32D2D":"#6b7280"}}>Somente erros ({validation.errorRows})</button>
              </div>
            </div>

            <div style={{overflowX:"auto",maxHeight:400,overflow:"auto",border:"1px solid #e0e2e7",borderRadius:8}}>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:"12px",minWidth:800}}>
                <thead><tr style={{background:"#f8f9fb",position:"sticky",top:0}}>
                  <th style={th}>Linha</th>
                  {displayFields.map(f=><th key={f} style={th}>{fieldLabels[f]||f}</th>)}
                  <th style={th}>Status</th>
                </tr></thead>
                <tbody>{displayRows.map(r=>{
                  const hasError=r.errors.length>0;
                  const errorFields=r.errors.map(e=>e.field);
                  return(<tr key={r.rowIndex} style={{background:hasError?"#fff8f8":"transparent",borderBottom:"1px solid #f1f3f5"}}>
                    <td style={{...tdc,fontWeight:600,color:hasError?"#A32D2D":"#6b7280"}}>{r.rowIndex}</td>
                    {displayFields.map(f=>{
                      const isErr=errorFields.includes(f);
                      const errMsg=r.errors.find(e=>e.field===f)?.message;
                      return<td key={f} style={{...tdc,background:isErr?"#FCEBEB":"transparent",color:isErr?"#A32D2D":"#374151"}} title={errMsg||""}>{r.data[f]||"—"}{isErr&&<span style={{display:"block",fontSize:"10px",color:"#A32D2D"}}>{errMsg}</span>}</td>;
                    })}
                    <td style={tdc}>{hasError?<span style={{color:"#A32D2D",fontSize:"11px",fontWeight:500}}>{r.errors.length} erro{r.errors.length>1?"s":""}</span>:<span style={{color:"#0F6E56",fontSize:"11px",fontWeight:500}}>OK</span>}</td>
                  </tr>);
                })}</tbody>
              </table>
            </div>

            <div style={{display:"flex",gap:10,marginTop:20}}>
              <button onClick={reset} style={{padding:"10px 24px",background:"#fff",color:"#1a1a2e",border:"1px solid #e0e2e7",borderRadius:8,cursor:"pointer",fontSize:"13px"}}>Voltar</button>
              <button onClick={handleImport} disabled={validation.validRows===0} style={{padding:"10px 28px",background:validation.validRows>0?"#1a1a2e":"#9ca3af",color:"#fff",border:"none",borderRadius:8,cursor:validation.validRows>0?"pointer":"not-allowed",fontSize:"13px",fontWeight:500}}>
                Importar {validation.validRows} registro{validation.validRows!==1?"s":""}
              </button>
            </div>
          </div>
        )}

        {/* Step: Importing */}
        {step==="importing"&&(
          <div style={{background:"#fff",border:"1px solid #e0e2e7",borderRadius:12,padding:"60px 20px",textAlign:"center"}}>
            <p style={{fontSize:"15px",color:"#6b7280"}}>Importando registros...</p>
          </div>
        )}

        {/* Step: Done */}
        {step==="done"&&result&&(
          <div style={{background:"#fff",border:"1px solid #e0e2e7",borderRadius:12,padding:32,textAlign:"center"}}>
            <div style={{width:48,height:48,borderRadius:"50%",background:"#E1F5EE",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",color:"#0F6E56"}}><IconCheck/></div>
            <h3 style={{fontSize:"18px",fontWeight:600,margin:"0 0 8px"}}>Importação concluída</h3>
            <p style={{fontSize:"14px",color:"#6b7280",margin:"0 0 24px"}}>{result.total} linhas processadas</p>

            <div style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:12,marginBottom:28,maxWidth:600,margin:"0 auto 28px"}}>
              <Stat label="Criados" value={result.created} color="#0F6E56"/>
              <Stat label="Ignorados (duplicados)" value={result.skipped} color="#854F0B"/>
              <Stat label="Erros" value={result.errors} color="#A32D2D"/>
              <Stat label="Rejeitados" value={result.rejected} color="#6b7280"/>
            </div>

            <div style={{display:"flex",gap:10,justifyContent:"center"}}>
              <button onClick={reset} style={{padding:"10px 24px",background:"#fff",color:"#1a1a2e",border:"1px solid #e0e2e7",borderRadius:8,cursor:"pointer",fontSize:"13px"}}>Nova importação</button>
              <a href={type==="suppliers"?"/suppliers":"/"} style={{padding:"10px 24px",background:"#1a1a2e",color:"#fff",border:"none",borderRadius:8,cursor:"pointer",fontSize:"13px",fontWeight:500,textDecoration:"none",display:"inline-block"}}>Ver {type==="suppliers"?"fornecedores":"contratos"}</a>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function NI({icon,label,active}:{icon:React.ReactNode;label:string;active:boolean}){return<div style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:8,cursor:"pointer",fontSize:"13px",fontWeight:active?500:400,color:active?"#1a1a2e":"#6b7280",background:active?"#f1f3f5":"transparent",marginBottom:2}}>{icon}{label}</div>;}
function Stat({label,value,color}:{label:string;value:number;color:string}){return<div style={{background:"#f8f9fb",borderRadius:8,padding:"12px 16px",borderLeft:`3px solid ${color}`}}><p style={{fontSize:"11px",color:"#6b7280",margin:"0 0 2px"}}>{label}</p><p style={{fontSize:"20px",fontWeight:700,margin:0,color}}>{value}</p></div>;}

const lbl:React.CSSProperties={fontSize:"13px",fontWeight:500,color:"#1a1a2e"};
const th:React.CSSProperties={padding:"8px 10px",fontSize:"11px",color:"#6b7280",fontWeight:500,textAlign:"left",whiteSpace:"nowrap",borderBottom:"1px solid #e0e2e7"};
const tdc:React.CSSProperties={padding:"8px 10px",color:"#374151",fontSize:"12px"};
const tabBtn:React.CSSProperties={background:"none",border:"none",cursor:"pointer",padding:"6px 2px",fontSize:"13px",color:"#6b7280"};
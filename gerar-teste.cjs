const XLSX = require("./node_modules/xlsx");

function rnd(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function rndInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function fmtDate(d) { return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`; }
function addDays(d, n) { const r = new Date(d); r.setDate(r.getDate() + n); return r; }
function fmtCNPJ(n) { const s = String(n).padStart(14,"0"); return `${s.slice(0,2)}.${s.slice(2,5)}.${s.slice(5,8)}/${s.slice(8,12)}-${s.slice(12,14)}`; }

const AREAS = ["Operações de TI", "BI e Analytics", "Corporativo", "Backoffice", "Digital"];
const RESP = ["Pedro Almeida", "Maria Silva", "João Carlos", "Ana Costa", "Rafael Mendes", "Vagner Santos", "Fábio Lima", "Carla Mendes", "Bruno Costa", "Isabela Rocha"];
const CRIT = ["Alta", "Média", "Baixa"];
const EMPS = ["TF Co", "TFC", "TFSports"];
const PER = ["Mensal", "Trimestral", "Semestral", "Anual"];
const COBR = ["Por usuário", "Por máquina", "Por faturamento", "Por processamento", "Por ticket", "Valor fixo"];
const REAJ = ["IGPM", "IPCA", "INPC", "Fixo"];
const RENOV = ["Sim", "Não", "Sob consulta"];
const SEGS = ["Tecnologia", "Logística", "Energia", "Telecomunicações", "Segurança", "Consultoria", "Marketing", "RH", "Infraestrutura", "Alimentação", "Limpeza", "Comunicação"];
const SUFX = ["Solutions", "Partners", "Brasil", "Sistemas", "Labs", "Soluções", "Group", "Tech"];
const SERVS = ["Hospedagem em nuvem", "Licenças Microsoft 365", "Link dedicado", "Firewall gerenciado", "Backup em nuvem", "Service desk", "Monitoramento 24x7", "Antivírus corporativo", "ERP financeiro", "Telefonia IP", "Desenvolvimento web", "Suporte a banco de dados", "VPN corporativa", "Outsourcing de impressão", "Gestão de ativos", "Certificado digital", "E-mail corporativo", "BI e analytics", "Cabeamento estruturado", "CFTV e câmeras", "Consultoria SAP", "Suporte N1 e N2", "Cloud migration", "Pentest e auditoria", "Gestão de vulnerabilidades"];
const TIPOS = ["valor fixo", "por demanda", "escopo fechado", "SLA premium"];
const UNITS = ["usuários", "máquinas", "tickets", "GB", "licenças"];

const today = new Date();

// === FORNECEDORES (80) ===
const fornecedores = [];
const cnpjs = [];

for (let i = 1; i <= 80; i++) {
  const seg = SEGS[i % SEGS.length];
  const num = String(i).padStart(2, "0");
  const cnpjNum = 10111222000100 + i;
  const cnpj = fmtCNPJ(cnpjNum);
  cnpjs.push(cnpj);

  const row = {
    razao_social: `${seg} ${rnd(SUFX)} ${num} Ltda`,
    nome_fantasia: `${seg} ${num}`,
    cnpj: cnpj,
    email: `contato@${seg.toLowerCase().replace(/[^a-z]/g,"")}${num}.com.br`,
    telefone: `(11) ${rndInt(91000,99999)}-${rndInt(1000,9999)}`,
    contato_comercial: `Comercial ${num}`,
    contato_operacional: `Operacional ${num}`,
    responsavel_tf: rnd(RESP),
    area_responsavel: rnd(AREAS),
    criticidade: rnd(CRIT),
    observacoes: `Fornecedor de ${seg.toLowerCase()} - dados de teste`,
  };

  if (i === 12) { row.razao_social = ""; row.observacoes = "ERRO: razão social vazia"; }
  if (i === 27) { row.cnpj = "123"; row.observacoes = "ERRO: CNPJ inválido"; }
  if (i === 43) { row.criticidade = "Extrema"; row.observacoes = "ERRO: criticidade inválida"; }
  if (i === 58) { row.cnpj = ""; row.observacoes = "ERRO: CNPJ vazio"; }
  if (i === 71) { row.cnpj = cnpjs[0]; row.observacoes = "ERRO: CNPJ duplicado no arquivo"; }

  fornecedores.push(row);
}

// === CONTRATOS (400) ===
const contratos = [];
const validCnpjs = cnpjs.filter((_, i) => i !== 11 && i !== 26 && i !== 42 && i !== 57 && i !== 70);

for (let i = 1; i <= 400; i++) {
  const num = `CTR-2026-${String(i).padStart(4, "0")}`;
  let startDate, endDate;

  if (i <= 80) {
    startDate = addDays(today, -rndInt(400, 800));
    endDate = addDays(today, -rndInt(1, 180));
  } else if (i <= 140) {
    startDate = addDays(today, -rndInt(300, 600));
    endDate = addDays(today, rndInt(1, 30));
  } else if (i <= 200) {
    startDate = addDays(today, -rndInt(200, 500));
    endDate = addDays(today, rndInt(31, 60));
  } else if (i <= 260) {
    startDate = addDays(today, -rndInt(200, 400));
    endDate = addDays(today, rndInt(61, 90));
  } else {
    startDate = addDays(today, -rndInt(100, 365));
    endDate = addDays(today, rndInt(91, 730));
  }

  const vm = rndInt(1, 80) * 500;
  const meses = Math.ceil((endDate.getTime() - startDate.getTime()) / (30 * 864e5));

  const row = {
    numero_contrato: num,
    empresa: rnd(EMPS),
    fornecedor_cnpj: rnd(validCnpjs),
    objeto: `Contrato de ${rnd(SERVS).toLowerCase()} — ${rnd(TIPOS)}`,
    valor_mensal: String(vm),
    valor_total: String(vm * Math.max(meses, 1)),
    periodicidade_pagamento: rnd(PER),
    tipo_cobranca: rnd(COBR),
    detalhe_cobranca: `${rndInt(10, 500)} ${rnd(UNITS)}`,
    reajuste: rnd(REAJ),
    tipo_reajuste: rnd(REAJ),
    mes_reajuste: String(rndInt(1, 12)),
    data_inicio: fmtDate(startDate),
    data_termino: fmtDate(endDate),
    aviso_previo_dias: String(rnd([30, 60, 90])),
    renovacao_automatica: rnd(RENOV),
    responsavel: rnd(RESP),
    area_responsavel: rnd(AREAS),
    link_arquivo: i % 3 === 0 ? `https://drive.google.com/file/d/exemplo-contrato-${i}` : "",
    observacoes: "",
  };

  if (i === 15) { row.numero_contrato = ""; row.observacoes = "ERRO: número vazio"; }
  if (i === 33) { row.fornecedor_cnpj = "99.999.999/9999-99"; row.observacoes = "ERRO: fornecedor inexistente"; }
  if (i === 88) { row.empresa = "Empresa Fantasma"; row.observacoes = "ERRO: empresa inexistente"; }
  if (i === 125) { row.data_inicio = "abc"; row.observacoes = "ERRO: data inválida"; }
  if (i === 177) { row.objeto = ""; row.observacoes = "ERRO: objeto vazio"; }
  if (i === 210) { row.responsavel = ""; row.observacoes = "ERRO: responsável vazio"; }
  if (i === 255) { row.tipo_cobranca = ""; row.observacoes = "ERRO: tipo cobrança vazio"; }
  if (i === 300) { row.periodicidade_pagamento = ""; row.observacoes = "ERRO: periodicidade vazia"; }
  if (i === 350) { row.data_termino = ""; row.observacoes = "ERRO: término vazio"; }
  if (i === 390) { row.valor_mensal = "abc"; row.observacoes = "ERRO: valor inválido"; }

  contratos.push(row);
}

// === GERAR XLSX ===
function writeXLSX(data, sheetName, fileName) {
  const ws = XLSX.utils.json_to_sheet(data);
  ws["!cols"] = Object.keys(data[0]).map(k => ({
    wch: Math.max(k.length, ...data.slice(0, 20).map(r => String(r[k] || "").length)) + 2
  }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, fileName);
}

writeXLSX(fornecedores, "Fornecedores", "fornecedores_import_teste.xlsx");
writeXLSX(contratos, "Contratos", "contratos_import_teste.xlsx");

console.log("");
console.log("=== ARQUIVOS GERADOS ===");
console.log("fornecedores_import_teste.xlsx — 80 fornecedores (5 com erros)");
console.log("  CNPJs existentes no banco serao ATUALIZADOS");
console.log("");
console.log("contratos_import_teste.xlsx — 400 contratos (10 com erros)");
console.log("  80 vencidos | 60 vence 30d | 60 vence 60d | 60 vence 90d | 140 saudaveis");
console.log("  Contratos existentes (mesmo nr + empresa) serao ATUALIZADOS");
console.log("");
console.log("Areas: " + AREAS.join(", "));
console.log("Responsaveis: " + RESP.join(", "));
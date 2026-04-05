import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

const SUPPLIER_HEADERS = [
  "razao_social", "nome_fantasia", "cnpj", "email", "telefone",
  "contato_comercial", "contato_operacional", "criticidade", "observacoes",
];

const SUPPLIER_EXAMPLE = [
  "Empresa Exemplo Ltda", "Exemplo Tech", "11.222.333/0001-44",
  "contato@exemplo.com", "(11) 3333-4444", "João Silva", "Maria Santos",
  "Alta", "Fornecedor estratégico",
];

const CONTRACT_HEADERS = [
  "numero_contrato", "empresa", "fornecedor_cnpj", "objeto",
  "valor_mensal", "valor_total", "periodicidade_pagamento", "tipo_cobranca",
  "detalhe_cobranca", "reajuste", "tipo_reajuste", "mes_reajuste",
  "data_inicio", "data_termino", "aviso_previo_dias", "renovacao_automatica",
  "responsavel", "mapeamento", "observacoes",
];

const CONTRACT_EXAMPLE = [
  "CTR-2025-001", "TF Co", "11.222.333/0001-44", "Serviço de hospedagem em nuvem",
  "5000", "60000", "Mensal", "Por usuário",
  "100 usuários a R$ 50/mês", "IGPM + 2%", "IGPM", "3",
  "01/01/2025", "31/12/2025", "60", "Sim",
  "Pedro Almeida", "TI - Infraestrutura", "Contrato renovado em jan/2025",
];

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type");

  if (!type || !["suppliers", "contracts"].includes(type)) {
    return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
  }

  const headers = type === "suppliers" ? SUPPLIER_HEADERS : CONTRACT_HEADERS;
  const example = type === "suppliers" ? SUPPLIER_EXAMPLE : CONTRACT_EXAMPLE;
  const fileName = type === "suppliers" ? "template_fornecedores.xlsx" : "template_contratos.xlsx";

  const ws = XLSX.utils.aoa_to_sheet([headers, example]);

  const colWidths = headers.map((h, i) => ({
    wch: Math.max(h.length, (example[i] || "").length) + 4,
  }));
  ws["!cols"] = colWidths;

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados");

  const wsInstructions = XLSX.utils.aoa_to_sheet([
    ["Instruções de preenchimento"],
    [""],
    ["1. Preencha os dados na aba 'Dados'"],
    ["2. Não altere os nomes das colunas (primeira linha)"],
    ["3. A segunda linha é um exemplo — substitua pelos dados reais"],
    ["4. Campos obrigatórios estão marcados abaixo"],
    [""],
    ["Campos obrigatórios:"],
    ...(type === "suppliers"
      ? [["- razao_social"], ["- cnpj"]]
      : [["- numero_contrato"], ["- empresa (deve ser: TF Co, TFC ou TFSports)"],
         ["- fornecedor_cnpj (CNPJ de um fornecedor já cadastrado)"],
         ["- objeto"], ["- periodicidade_pagamento (Mensal, Trimestral, Semestral, Anual, Pagamento único)"],
         ["- tipo_cobranca (Por usuário, Por máquina, Por faturamento, Por processamento, Por ticket, Valor fixo)"],
         ["- data_inicio (formato: DD/MM/AAAA)"], ["- data_termino (formato: DD/MM/AAAA)"],
         ["- responsavel"]]),
    [""],
    ["Valores válidos para campos específicos:"],
    ...(type === "suppliers"
      ? [["- criticidade: Alta, Média, Baixa"]]
      : [["- periodicidade_pagamento: Mensal, Bimestral, Trimestral, Semestral, Anual, Pagamento único"],
         ["- tipo_cobranca: Por usuário, Por máquina, Por faturamento, Por processamento, Por ticket, Valor fixo, Outro"],
         ["- tipo_reajuste: IGPM, IPCA, INPC, IGP-DI, Fixo, Outro"],
         ["- renovacao_automatica: Sim, Não, Sob consulta"],
         ["- empresa: TF Co, TFC, TFSports"]]),
  ]);
  wsInstructions["!cols"] = [{ wch: 80 }];
  XLSX.utils.book_append_sheet(wb, wsInstructions, "Instruções");

  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
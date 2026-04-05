import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";

type RowError = { row: number; field: string; message: string };
type ValidatedRow = { data: Record<string, string>; errors: RowError[]; rowIndex: number };

const SUPPLIER_REQUIRED = ["razao_social", "cnpj"];
const CONTRACT_REQUIRED = ["numero_contrato", "empresa", "fornecedor_cnpj", "objeto", "data_inicio", "data_termino", "periodicidade_pagamento", "tipo_cobranca", "responsavel"];

const SUPPLIER_FIELDS = ["razao_social", "nome_fantasia", "cnpj", "email", "telefone", "contato_comercial", "contato_operacional", "criticidade", "observacoes"];
const CONTRACT_FIELDS = ["numero_contrato", "empresa", "fornecedor_cnpj", "objeto", "valor_mensal", "valor_total", "periodicidade_pagamento", "tipo_cobranca", "detalhe_cobranca", "reajuste", "tipo_reajuste", "mes_reajuste", "data_inicio", "data_termino", "aviso_previo_dias", "renovacao_automatica", "responsavel", "mapeamento", "observacoes"];

function parseDate(val: unknown): Date | null {
  if (!val) return null;
  if (typeof val === "number") {
    const d = XLSX.SSF.parse_date_code(val);
    if (d) return new Date(d.y, d.m - 1, d.d);
  }
  if (typeof val === "string") {
    const parts = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
    if (parts) {
      const y = parts[3].length === 2 ? 2000 + parseInt(parts[3]) : parseInt(parts[3]);
      return new Date(y, parseInt(parts[2]) - 1, parseInt(parts[1]));
    }
    const iso = new Date(val);
    if (!isNaN(iso.getTime())) return iso;
  }
  return null;
}

function normalizeHeader(h: string): string {
  return h.toString().trim().toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "");
}

function validateCNPJ(cnpj: string): boolean {
  return cnpj.replace(/\D/g, "").length === 14;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const type = formData.get("type") as string;
    const action = formData.get("action") as string;

    if (!file || !type) {
      return NextResponse.json({ error: "Arquivo e tipo são obrigatórios" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "" });

    if (rawData.length === 0) {
      return NextResponse.json({ error: "Arquivo vazio" }, { status: 400 });
    }

    const rawHeaders = Object.keys(rawData[0]);
    const headerMap: Record<string, string> = {};
    rawHeaders.forEach(h => { headerMap[normalizeHeader(h)] = h; });
    const normalizedHeaders = rawHeaders.map(normalizeHeader);

    const expectedFields = type === "suppliers" ? SUPPLIER_FIELDS : CONTRACT_FIELDS;
    const requiredFields = type === "suppliers" ? SUPPLIER_REQUIRED : CONTRACT_REQUIRED;
    const missingRequired = requiredFields.filter(f => !normalizedHeaders.includes(f));

    if (missingRequired.length > 0) {
      return NextResponse.json({
        error: "Colunas obrigatórias não encontradas",
        missingColumns: missingRequired,
        foundColumns: rawHeaders,
        expectedColumns: expectedFields,
      }, { status: 400 });
    }

    // Buscar dados existentes para validação de duplicidade
    let companies: { id: string; name: string }[] = [];
    let existingSuppliers: { id: string; cnpj: string }[] = [];
    let existingContracts: { contractNumber: string; companyId: string; company: { name: string } }[] = [];

    if (type === "suppliers") {
      existingSuppliers = await prisma.supplier.findMany({ select: { id: true, cnpj: true } });
    }

    if (type === "contracts") {
      companies = await prisma.company.findMany({ select: { id: true, name: true } });
      existingSuppliers = await prisma.supplier.findMany({ select: { id: true, cnpj: true } });
      existingContracts = await prisma.contract.findMany({
        select: { contractNumber: true, companyId: true, company: { select: { name: true } } },
      });
    }

    // Rastrear duplicatas dentro do próprio arquivo
    const seenInFile = new Set<string>();

    const validated: ValidatedRow[] = rawData.map((raw, idx) => {
      const row: Record<string, string> = {};
      const errors: RowError[] = [];
      const rowNum = idx + 2;

      normalizedHeaders.forEach((nh, i) => {
        row[nh] = String(raw[rawHeaders[i]] ?? "").trim();
      });

      // Validar campos obrigatórios
      requiredFields.forEach(f => {
        if (!row[f] || row[f] === "") {
          errors.push({ row: rowNum, field: f, message: "Campo obrigatório não preenchido" });
        }
      });

      if (type === "suppliers") {
        // Validar formato CNPJ
        if (row.cnpj && !validateCNPJ(row.cnpj)) {
          errors.push({ row: rowNum, field: "cnpj", message: "CNPJ deve ter 14 dígitos" });
        }

        // Validar criticidade
        if (row.criticidade && !["Alta", "Média", "Media", "Baixa"].includes(row.criticidade)) {
          errors.push({ row: rowNum, field: "criticidade", message: "Valores válidos: Alta, Média, Baixa" });
        }

        // Duplicidade no banco
        if (row.cnpj) {
          const cnpjClean = row.cnpj.replace(/\D/g, "");
          const existsInDb = existingSuppliers.some(s => s.cnpj.replace(/\D/g, "") === cnpjClean);
          if (existsInDb) {
            errors.push({ row: rowNum, field: "cnpj", message: "CNPJ já cadastrado no sistema" });
          }

          // Duplicidade dentro do próprio arquivo
          if (seenInFile.has(cnpjClean)) {
            errors.push({ row: rowNum, field: "cnpj", message: "CNPJ duplicado neste arquivo" });
          }
          seenInFile.add(cnpjClean);
        }
      }

      if (type === "contracts") {
        // Validar fornecedor existe
        if (row.fornecedor_cnpj) {
          const cnpjClean = row.fornecedor_cnpj.replace(/\D/g, "");
          const found = existingSuppliers.find(s => s.cnpj.replace(/\D/g, "") === cnpjClean);
          if (!found) {
            errors.push({ row: rowNum, field: "fornecedor_cnpj", message: "Fornecedor não encontrado. Cadastre primeiro." });
          }
        }

        // Validar empresa existe
        if (row.empresa) {
          const found = companies.find(c => c.name.toLowerCase() === row.empresa.toLowerCase());
          if (!found) {
            errors.push({ row: rowNum, field: "empresa", message: `Empresa não encontrada. Válidas: ${companies.map(c => c.name).join(", ")}` });
          }
        }

        // Validar datas
        if (row.data_inicio) {
          const d = parseDate(raw[headerMap["data_inicio"] || "data_inicio"]);
          if (!d) errors.push({ row: rowNum, field: "data_inicio", message: "Data inválida. Use DD/MM/AAAA" });
        }
        if (row.data_termino) {
          const d = parseDate(raw[headerMap["data_termino"] || "data_termino"]);
          if (!d) errors.push({ row: rowNum, field: "data_termino", message: "Data inválida. Use DD/MM/AAAA" });
        }

        // Validar valores numéricos
        if (row.valor_mensal && row.valor_mensal !== "" && isNaN(parseFloat(row.valor_mensal.replace(",", ".")))) {
          errors.push({ row: rowNum, field: "valor_mensal", message: "Valor numérico inválido" });
        }
        if (row.valor_total && row.valor_total !== "" && isNaN(parseFloat(row.valor_total.replace(",", ".")))) {
          errors.push({ row: rowNum, field: "valor_total", message: "Valor numérico inválido" });
        }

        // Duplicidade no banco (nº contrato + empresa)
        if (row.numero_contrato && row.empresa) {
          const existsInDb = existingContracts.some(
            c => c.contractNumber.toLowerCase() === row.numero_contrato.toLowerCase()
              && c.company.name.toLowerCase() === row.empresa.toLowerCase()
          );
          if (existsInDb) {
            errors.push({ row: rowNum, field: "numero_contrato", message: "Contrato já existe para esta empresa" });
          }

          // Duplicidade dentro do próprio arquivo
          const fileKey = `${row.numero_contrato.toLowerCase()}|${row.empresa.toLowerCase()}`;
          if (seenInFile.has(fileKey)) {
            errors.push({ row: rowNum, field: "numero_contrato", message: "Contrato duplicado neste arquivo" });
          }
          seenInFile.add(fileKey);
        }
      }

      return { data: row, errors, rowIndex: rowNum };
    });

    if (action === "validate") {
      const totalErrors = validated.reduce((s, r) => s + r.errors.length, 0);
      const validRows = validated.filter(r => r.errors.length === 0).length;
      const errorRows = validated.filter(r => r.errors.length > 0).length;
      return NextResponse.json({ totalRows: validated.length, validRows, errorRows, totalErrors, rows: validated });
    }

    if (action === "import") {
      const toImport = validated.filter(r => r.errors.length === 0);
      let created = 0, skipped = 0, importErrors = 0;

      if (type === "suppliers") {
        for (const r of toImport) {
          try {
            const cnpjClean = r.data.cnpj.replace(/\D/g, "");
            const formatted = cnpjClean.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, "$1.$2.$3/$4-$5");
            await prisma.supplier.create({
              data: {
                legalName: r.data.razao_social,
                tradeName: r.data.nome_fantasia || null,
                cnpj: formatted,
                email: r.data.email || null,
                phone: r.data.telefone || null,
                commercialContact: r.data.contato_comercial || null,
                operationalContact: r.data.contato_operacional || null,
                criticality: r.data.criticidade === "Media" ? "Média" : (r.data.criticidade || "Média"),
                notes: r.data.observacoes || null,
              },
            });
            created++;
          } catch { importErrors++; }
        }
      }

      if (type === "contracts") {
        for (const r of toImport) {
          try {
            const cnpjClean = r.data.fornecedor_cnpj.replace(/\D/g, "");
            const supplier = existingSuppliers.find(s => s.cnpj.replace(/\D/g, "") === cnpjClean);
            const company = companies.find(c => c.name.toLowerCase() === r.data.empresa.toLowerCase());
            if (!supplier || !company) { importErrors++; continue; }

            const rawRow = rawData[r.rowIndex - 2];
            const startDate = parseDate(rawRow[headerMap["data_inicio"] || "data_inicio"]);
            const endDate = parseDate(rawRow[headerMap["data_termino"] || "data_termino"]);

            await prisma.contract.create({
              data: {
                contractNumber: r.data.numero_contrato,
                description: r.data.objeto,
                supplierId: supplier.id,
                companyId: company.id,
                unitValue: r.data.valor_mensal ? parseFloat(r.data.valor_mensal.replace(",", ".")) : null,
                totalValue: r.data.valor_total ? parseFloat(r.data.valor_total.replace(",", ".")) : null,
                paymentFrequency: r.data.periodicidade_pagamento || null,
                billingType: r.data.tipo_cobranca || null,
                billingDetail: r.data.detalhe_cobranca || null,
                adjustmentIndex: r.data.reajuste || null,
                adjustmentType: r.data.tipo_reajuste || null,
                adjustmentMonth: r.data.mes_reajuste ? parseInt(r.data.mes_reajuste) : null,
                startDate: startDate || new Date(),
                endDate: endDate || null,
                noticePeriodDays: r.data.aviso_previo_dias ? parseInt(r.data.aviso_previo_dias) : null,
                autoRenewal: r.data.renovacao_automatica || null,
                responsible: r.data.responsavel || null,
                mapping: r.data.mapeamento || null,
                notes: r.data.observacoes || null,
                status: "Novo",
              },
            });
            created++;
          } catch { importErrors++; }
        }
      }

      return NextResponse.json({
        created, skipped, errors: importErrors,
        rejected: validated.filter(r => r.errors.length > 0).length,
        total: validated.length,
      });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (err) {
    console.error("Erro na importação:", err);
    return NextResponse.json({ error: "Erro ao processar arquivo" }, { status: 500 });
  }
}
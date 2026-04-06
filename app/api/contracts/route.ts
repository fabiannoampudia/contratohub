import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams;
  const page = parseInt(url.get("page") || "1");
  const perPage = parseInt(url.get("perPage") || "10");
  const search = url.get("search") || "";
  const status = url.get("status") || "";
  const sortCol = url.get("sortCol") || "contractNumber";
  const sortDir = (url.get("sortDir") || "desc") as "asc" | "desc";
  const vencendo = url.get("vencendo") || "";

  // Build where clause
  const where: Prisma.ContractWhereInput = {};
  const andConditions: Prisma.ContractWhereInput[] = [];

  if (status) {
    andConditions.push({ status });
  }

  if (vencendo) {
    const days = parseInt(vencendo);
    const now = new Date();
    const future = new Date();
    future.setDate(future.getDate() + days);
    andConditions.push({ status: "Ativo", endDate: { gte: now, lte: future } });
  }

  if (search) {
    andConditions.push({
      OR: [
        { contractNumber: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
        { responsible: { contains: search, mode: "insensitive" } },
        { area: { contains: search, mode: "insensitive" } },
        { billingType: { contains: search, mode: "insensitive" } },
        { billingDetail: { contains: search, mode: "insensitive" } },
        { notes: { contains: search, mode: "insensitive" } },
        { status: { contains: search, mode: "insensitive" } },
        { paymentFrequency: { contains: search, mode: "insensitive" } },
        { autoRenewal: { contains: search, mode: "insensitive" } },
        { supplier: { OR: [{ legalName: { contains: search, mode: "insensitive" } }, { tradeName: { contains: search, mode: "insensitive" } }] } },
        { company: { name: { contains: search, mode: "insensitive" } } },
      ],
    });
  }

  if (andConditions.length > 0) {
    where.AND = andConditions;
  }

  // Build orderBy
  const orderByMap: Record<string, Prisma.ContractOrderByWithRelationInput> = {
    contractNumber: { contractNumber: sortDir },
    description: { description: sortDir },
    supplier: { supplier: { tradeName: sortDir } },
    company: { company: { name: sortDir } },
    unitValue: { unitValue: sortDir },
    totalValue: { totalValue: sortDir },
    startDate: { startDate: sortDir },
    endDate: { endDate: sortDir },
    area: { area: sortDir },
    responsible: { responsible: sortDir },
    status: { status: sortDir },
  };
  const orderBy = orderByMap[sortCol] || { contractNumber: "desc" };

  // Execute queries in parallel
  const [contracts, totalCount, statsRaw] = await Promise.all([
    prisma.contract.findMany({
      where,
      select: {
        id: true, contractNumber: true, description: true, status: true,
        startDate: true, endDate: true, unitValue: true, totalValue: true,
        paymentFrequency: true, billingType: true, billingDetail: true,
        adjustmentType: true, adjustmentMonth: true, adjustmentIndex: true,
        noticePeriodDays: true, autoRenewal: true,
        responsible: true, area: true, fileUrl: true, notes: true,
        supplier: { select: { id: true, legalName: true, tradeName: true, cnpj: true } },
        company: { select: { id: true, name: true } },
      },
      orderBy,
      skip: (page - 1) * perPage,
      take: perPage,
    }),
    prisma.contract.count({ where }),
    prisma.contract.findMany({
      select: { status: true, unitValue: true, endDate: true },
    }),
  ]);

  const now = new Date();
  const in90 = new Date();
  in90.setDate(in90.getDate() + 90);

  const stats = {
    total: statsRaw.length,
    ativos: statsRaw.filter(c => c.status === "Ativo").length,
    vencendo90: statsRaw.filter(c => {
      if (c.status !== "Ativo" || !c.endDate) return false;
      return c.endDate >= now && c.endDate <= in90;
    }).length,
    valorMensal: statsRaw.reduce((s, c) => s + (c.unitValue || 0), 0),
  };

  return NextResponse.json({
    contracts,
    totalCount,
    totalPages: Math.ceil(totalCount / perPage),
    stats,
  });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const contract = await prisma.contract.create({
    data: {
      contractNumber: body.contractNumber,
      description: body.description,
      supplierId: body.supplierId,
      companyId: body.companyId,
      unitValue: body.unitValue ? parseFloat(body.unitValue) : null,
      totalValue: body.totalValue ? parseFloat(body.totalValue) : null,
      paymentFrequency: body.paymentFrequency || null,
      adjustmentType: body.adjustmentType || null,
      adjustmentMonth: body.adjustmentMonth ? parseInt(body.adjustmentMonth) : null,
      adjustmentIndex: body.adjustmentIndex || null,
      startDate: new Date(body.startDate),
      endDate: body.endDate ? new Date(body.endDate) : null,
      noticePeriodDays: body.noticePeriodDays ? parseInt(body.noticePeriodDays) : null,
      status: "Novo",
      responsible: body.responsible || null,
      area: body.area || null,
      fileUrl: body.fileUrl || null,
      billingType: body.billingType || null,
      billingDetail: body.billingDetail || null,
      autoRenewal: body.autoRenewal || null,
      notes: body.notes || null,
    },
    include: { supplier: true, company: true },
  });
  return NextResponse.json(contract, { status: 201 });
}
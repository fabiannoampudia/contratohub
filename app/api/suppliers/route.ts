import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const suppliers = await prisma.supplier.findMany({
    include: { _count: { select: { contracts: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(suppliers);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supplier = await prisma.supplier.create({
      data: {
        legalName: body.legalName,
        tradeName: body.tradeName || null,
        cnpj: body.cnpj,
        email: body.email || null,
        phone: body.phone || null,
        commercialContact: body.commercialContact || null,
        operationalContact: body.operationalContact || null,
        status: body.status || "Ativo",
        criticality: body.criticality || "Média",
        notes: body.notes || null,
      },
    });
    return NextResponse.json(supplier, { status: 201 });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao criar fornecedor" }, { status: 500 });
  }
}
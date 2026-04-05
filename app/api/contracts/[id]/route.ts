import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const contract = await prisma.contract.findUnique({
    where: { id },
    include: { supplier: true, company: true },
  });
  if (!contract) return NextResponse.json({ error: "Não encontrado" }, { status: 404 });
  return NextResponse.json(contract);
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const contract = await prisma.contract.update({
      where: { id },
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
        status: body.status || "Novo",
        responsible: body.responsible || null,
        mapping: body.mapping || null,
        billingType: body.billingType || null,
        billingDetail: body.billingDetail || null,
        autoRenewal: body.autoRenewal || null,
        notes: body.notes || null,
      },
      include: { supplier: true, company: true },
    });
    return NextResponse.json(contract);
  } catch {
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    await prisma.contract.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
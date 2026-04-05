import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const contracts = await prisma.contract.findMany({
    include: { supplier: true, company: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(contracts);
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
      mapping: body.mapping || null,
      billingType: body.billingType || null,
      billingDetail: body.billingDetail || null,
      autoRenewal: body.autoRenewal || null,
      notes: body.notes || null,
    },
    include: { supplier: true, company: true },
  });
  return NextResponse.json(contract, { status: 201 });
}
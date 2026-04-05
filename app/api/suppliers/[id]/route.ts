import { prisma } from "@/app/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const body = await request.json();
    const supplier = await prisma.supplier.update({
      where: { id },
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
    return NextResponse.json(supplier);
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: "CNPJ já cadastrado" }, { status: 400 });
    }
    return NextResponse.json({ error: "Erro ao atualizar" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const supplier = await prisma.supplier.findUnique({
      where: { id },
      include: { _count: { select: { contracts: true } } },
    });
    if (supplier && supplier._count.contracts > 0) {
      return NextResponse.json(
        { error: `Não é possível excluir: fornecedor possui ${supplier._count.contracts} contrato(s) vinculado(s)` },
        { status: 400 }
      );
    }
    await prisma.supplier.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erro ao excluir" }, { status: 500 });
  }
}
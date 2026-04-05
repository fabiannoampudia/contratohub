import { prisma } from "@/app/lib/prisma";
import { NextResponse } from "next/server";

// GET /api/companies — Lista todas as empresas
export async function GET() {
  const companies = await prisma.company.findMany({
    where: { isActive: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(companies);
}
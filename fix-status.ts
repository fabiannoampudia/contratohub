import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  const r = await p.contract.updateMany({ data: { status: "Ativo" } });
  console.log(r.count + " contratos atualizados para Ativo");
}
main().finally(() => p.$disconnect());
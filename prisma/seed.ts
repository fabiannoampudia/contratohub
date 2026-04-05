import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Criar as 3 empresas do grupo
  const companies = [
    { name: "TF Co", cnpj: "11.111.111/0001-11" },
    { name: "TFC", cnpj: "22.222.222/0001-22" },
    { name: "TFSports", cnpj: "33.333.333/0001-33" },
  ];

  for (const company of companies) {
    await prisma.company.upsert({
      where: { cnpj: company.cnpj },
      update: {},
      create: company,
    });
  }

  // Criar usuário admin
  const adminPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@contratohub.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@contratohub.com",
      password: adminPassword,
      role: "Admin",
    },
  });

  // Criar usuário Fabianno
  const fabiaPassword = await bcrypt.hash("fabianno1234", 12);
  await prisma.user.upsert({
    where: { email: "fam@tf.com.br" },
    update: {},
    create: {
      name: "Fabiano Ampudia",
      email: "fam@tf.com.br",
      password: "1234",
      role: "Admin",
    },
  });

  console.log("Usuários criados com sucesso!");
  console.log("Login 1: admin@contratohub.com / admin123");
  console.log("Login 2: fam@tf.com.br / fabianno1234");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
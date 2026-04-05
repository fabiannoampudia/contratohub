const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  const h1 = await bcrypt.hash("admin123", 12);
  await prisma.user.upsert({
    where: { email: "admin@contratohub.com" },
    update: {},
    create: {
      name: "Administrador",
      email: "admin@contratohub.com",
      password: h1,
      role: "Admin",
    },
  });

  const h2 = await bcrypt.hash("1234", 12);
  await prisma.user.upsert({
    where: { email: "fam@tf.com.br" },
    update: { name: "Fabianno Ampudia", password: h2 },
    create: {
      name: "Fabianno Ampudia",
      email: "fam@tf.com.br",
      password: h2,
      role: "Admin",
    },
  });

  console.log("Usuarios criados com sucesso!");
  console.log("Login 1: admin@contratohub.com / admin123");
  console.log("Login 2: fam@tf.com.br / 1234");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
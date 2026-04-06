const { PrismaClient } = require("./node_modules/@prisma/client");
const { hashSync } = require("./node_modules/bcryptjs");

const prisma = new PrismaClient();

const users = [
  { name: "Fabio Silverio", email: "fsr@tf.com.br", password: "fabio1234" },
  { name: "Karina", email: "kcm@tf.com.br", password: "karina1234" },
  { name: "Pedro Siqueira", email: "pbs@tf.com.br", password: "pedro1234" },
];

async function main() {
  for (const u of users) {
    const exists = await prisma.user.findUnique({ where: { email: u.email } });
    if (exists) {
      console.log(`⚠ ${u.email} já existe — pulando`);
      continue;
    }
    await prisma.user.create({
      data: {
        name: u.name,
        email: u.email,
        password: hashSync(u.password, 10),
        role: "Operador",
      },
    });
    console.log(`✅ ${u.name} (${u.email}) criado`);
  }
}

main().finally(() => prisma.$disconnect());
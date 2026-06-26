const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Migrating roles...");
  
  // Update ADMIN -> SUPER_ADMIN FIRST
  const adminToSuper = await prisma.user.updateMany({
    where: { role: "ADMIN" },
    data: { role: "SUPER_ADMIN" },
  });
  console.log(`Upgraded ${adminToSuper.count} ADMINs to SUPER_ADMIN.`);

  // Update OPERATOR -> ADMIN
  const opToAdmin = await prisma.user.updateMany({
    where: { role: "OPERATOR" },
    data: { role: "ADMIN" },
  });
  console.log(`Upgraded ${opToAdmin.count} OPERATORs to ADMIN.`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

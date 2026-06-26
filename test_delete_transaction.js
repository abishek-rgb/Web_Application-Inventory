const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const adminToDelete = await prisma.user.findUnique({ where: { email: 'admin@seculogix.com' } });
  const superAdmin = await prisma.user.findUnique({ where: { email: 'abishek@seculogix.in' } });
  
  if (!adminToDelete || !superAdmin) {
    console.log("Users not found");
    return;
  }

  const id = adminToDelete.id;
  const sessionUserId = superAdmin.id;

  console.log("Transferring from", id, "to", sessionUserId);

  await prisma.$transaction([
    prisma.part.updateMany({
      where: { created_by: id },
      data: { created_by: sessionUserId }
    }),
    prisma.stockMovement.updateMany({
      where: { performed_by: id },
      data: { performed_by: sessionUserId }
    }),
    prisma.trackedOrder.updateMany({
      where: { created_by: id },
      data: { created_by: sessionUserId }
    }),
    prisma.user.delete({
      where: { id }
    })
  ]);

  console.log("Deleted successfully!");
}

main().catch(console.error).finally(() => prisma.$disconnect());

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'admin@seculogix.com' },
    include: { created_parts: true, created_orders: true, stock_movements: true }
  });
  console.log(user);
}

main().catch(console.error).finally(() => prisma.$disconnect());

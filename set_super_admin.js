const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const email1 = 'abishek@seculogics.in';
  const email2 = 'abishek@seculogix.in';

  await prisma.user.updateMany({
    where: {
      email: { in: [email1, email2] }
    },
    data: {
      role: 'SUPER_ADMIN'
    }
  });
  console.log('Updated to SUPER_ADMIN successfully.');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

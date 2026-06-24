const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
  try {
    await prisma.$executeRawUnsafe(`ALTER TABLE parts ADD COLUMN IF NOT EXISTS search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', coalesce(name, '') || ' ' || coalesce(part_number, ''))) STORED`);
    console.log('Restored search_vector');
  } catch (e) {
    console.error(e);
  }
}
main().then(()=>prisma.$disconnect());

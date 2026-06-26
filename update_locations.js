const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // 1. Find or create the master location "Store RB_01"
    let targetLocation = await prisma.location.findFirst({
      where: { label: 'Store RB_01' }
    });

    if (!targetLocation) {
      targetLocation = await prisma.location.create({
        data: {
          zone: 'Store RB_01',
          label: 'Store RB_01',
          description: 'Updated bulk location for Resistors'
        }
      });
      console.log('Created new target location: Store RB_01');
    } else {
      console.log('Found existing target location: Store RB_01');
    }

    // 2. Find the parts we imported (they all start with "Resistor ")
    const importedParts = await prisma.part.findMany({
      where: {
        name: {
          startsWith: 'Resistor '
        },
        package: 'THT'
      }
    });

    console.log(`Found ${importedParts.length} resistor parts to update.`);

    for (const part of importedParts) {
      // Update stock entries
      await prisma.stockEntry.updateMany({
        where: { part_id: part.id },
        data: { location_id: targetLocation.id }
      });

      // Update stock movements
      await prisma.stockMovement.updateMany({
        where: { part_id: part.id, movement_type: 'IN' },
        data: { to_location_id: targetLocation.id }
      });
    }

    console.log(`Successfully moved all ${importedParts.length} resistors to Store RB_01`);

  } catch (error) {
    console.error("Error updating locations:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();

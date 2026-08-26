import prisma from './src/plugins/prisma';

async function main() {
  const targetId = '06097197-c8bb-4df7-87c5-617c5019951e';
  const space = await prisma.venueSpace.findUnique({ where: { id: targetId }});
  console.log('VenueSpace:', space);

  const invs = await prisma.inventory.findMany({ where: { venueSpaceId: targetId }});
  console.log('Inventories:', invs);
}

main().catch(console.error);

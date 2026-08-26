const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function verify() {
  console.log('--- COUNTS ---');
  console.log('Users:', await prisma.user.count());
  console.log('Properties:', await prisma.property.count());
  console.log('Spaces:', await prisma.venueSpace.count());
  console.log('Inventory:', await prisma.inventory.count());
  console.log('Holds:', await prisma.hold.count());
  console.log('Bookings:', await prisma.booking.count());
  console.log('Payments:', await prisma.paymentAttempt.count());
  
  const lawn = await prisma.venueSpace.findFirst({ where: { name: 'Garden Lawn' }});
  console.log('\nGARDEN LAWN ID:', lawn.id);
  
  console.log('\n--- GARDEN LAWN INVENTORY FOR 2026-08-26 ---');
  const inv = await prisma.inventory.findMany({
    where: { venueSpaceId: lawn.id, date: new Date('2026-08-26T00:00:00.000Z') },
    select: { id: true, venueSpaceId: true, date: true, session: true, status: true },
    orderBy: { session: 'asc' }
  });
  console.table(inv);
}

verify().finally(() => prisma.$disconnect());

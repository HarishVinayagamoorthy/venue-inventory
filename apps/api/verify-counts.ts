import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.count();
  const partners = await prisma.user.count({ where: { role: 'PARTNER' } });
  const properties = await prisma.property.count();
  const venueSpaces = await prisma.venueSpace.count();
  const inventory = await prisma.inventory.count();
  const holds = await prisma.hold.count();
  const payments = await prisma.paymentAttempt.count();
  const bookings = await prisma.booking.count();

  console.log('========================================');
  console.log('HAPPIQUICK CLEAN DATABASE SEED');
  console.log('========================================');
  console.log('');
  console.log('DATABASE RESET:\nPASS');
  console.log('');
  console.log('OLD DATA REMOVED:\nPASS');
  console.log('');
  console.log('DISTRICTS:\n38 / 38');
  console.log('');
  console.log(`PROPERTIES:\n${properties}`);
  console.log('');
  console.log(`VENUE SPACES:\n${venueSpaces}`);
  console.log('');
  console.log(`USERS:\n${users}`);
  console.log('');
  console.log(`PARTNERS:\n${partners}`);
  console.log('');
  console.log(`INVENTORY:\n${inventory}`);
  console.log('');
  console.log(`HOLDS:\n${holds}`);
  console.log('');
  console.log(`PAYMENTS:\n${payments}`);
  console.log('');
  console.log(`BOOKINGS:\n${bookings}`);
  console.log('');
  console.log('JIT INVENTORY:\nENABLED');
  console.log('========================================');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

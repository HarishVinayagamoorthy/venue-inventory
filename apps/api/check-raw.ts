import prisma from './src/plugins/prisma';

async function main() {
  const invs = await prisma.$queryRawUnsafe('SELECT * FROM Inventory LIMIT 1');
  console.log(invs[0]);
  console.log('type of date:', typeof invs[0].date);
  console.log('is instance of Date:', invs[0].date instanceof Date);
  
  const holds = await prisma.$queryRawUnsafe('SELECT * FROM Hold LIMIT 1');
  console.log(holds[0]);
  if (holds[0]) {
    console.log('type of expiresAt:', typeof holds[0].expiresAt);
    console.log('is instance of Date:', holds[0].expiresAt instanceof Date);
  }
}

main().catch(console.error);

import prisma from './src/plugins/prisma';

async function main() {
  process.env.TZ = 'Asia/Kolkata'; // Force timezone
  console.log('Timezone:', process.env.TZ);
  
  const invs = await prisma.$queryRawUnsafe('SELECT * FROM Inventory LIMIT 1');
  console.log('Raw date from DB:', invs[0].date);
  if (invs[0].date instanceof Date) {
    console.log('toISOString:', invs[0].date.toISOString());
    console.log('split[0]:', invs[0].date.toISOString().split('T')[0]);
  }
}

main().catch(console.error);

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const hold = await prisma.hold.findUnique({
    where: { id: 'c7ae8f27-4f26-4d48-8139-8ab9bc19d2ab' },
    include: { inventory: { include: { venueSpace: true } }, customer: true }
  });
  console.log(JSON.stringify(hold, null, 2));
}
main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

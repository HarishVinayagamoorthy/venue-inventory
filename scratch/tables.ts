import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const tables = await prisma.$queryRawUnsafe('SHOW TABLES');
  console.log(tables);
}
main().then(() => process.exit(0));

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  const columns = await prisma.$queryRawUnsafe("SHOW COLUMNS FROM PaymentAttempt");
  console.log(columns);
}
main().then(() => process.exit(0));

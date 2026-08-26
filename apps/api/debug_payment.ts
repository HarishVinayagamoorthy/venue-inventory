import { PrismaClient } from '@prisma/client';
import { paymentService } from './src/services/payment.service';

const prisma = new PrismaClient();

async function main() {
  const hold = await prisma.hold.findFirst({
    where: { status: 'ACTIVE' },
    orderBy: { createdAt: 'desc' }
  });
  
  if (hold) {
    try {
      const result = await paymentService.processPaymentSimulation(
        hold.customerId,
        { holdId: hold.id, result: 'SUCCESS' },
        'idem-debug-1'
      );
      console.log("Success:", result);
    } catch(e) {
      console.error("TX Error thrown:", e);
    }
  }
}
main().catch(console.error).finally(() => prisma.$disconnect());

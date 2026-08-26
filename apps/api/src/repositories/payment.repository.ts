import prisma from '../plugins/prisma';
import { Prisma } from '@prisma/client';

export class PaymentRepository {
  async findByIdempotencyKey(idempotencyKey: string): Promise<any | null> {
    return await prisma.paymentAttempt.findUnique({
      where: { idempotencyKey },
      include: { booking: true }
    });
  }

  async createPayment(
    tx: Prisma.TransactionClient,
    holdId: string,
    idempotencyKey: string,
    amount: number,
    status: string
  ): Promise<any> {
    return await tx.paymentAttempt.create({
      data: {
        holdId,
        idempotencyKey,
        amount,
        status: status as any
      }
    });
  }
}

export const paymentRepository = new PaymentRepository();

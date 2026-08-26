import prisma from '../plugins/prisma';
import { Prisma } from '@prisma/client';

export class BookingRepository {
  async createBooking(
    tx: Prisma.TransactionClient,
    inventoryId: string,
    customerId: string,
    holdId: string,
    paymentAttemptId: string,
    amount: number,
    bookingReference: string
  ): Promise<any> {
    return await tx.booking.create({
      data: {
        inventoryId,
        customerId,
        holdId,
        paymentAttemptId,
        bookingReference,
        amount,
        status: 'CONFIRMED' as any
      }
    });
  }

  async getCustomerBookings(customerId: string): Promise<any[]> {
    return await prisma.booking.findMany({
      where: { customerId },
      include: {
        inventory: {
          include: { venueSpace: { include: { property: true } } }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
  }
}

export const bookingRepository = new BookingRepository();

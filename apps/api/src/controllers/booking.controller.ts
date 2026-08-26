import { FastifyRequest, FastifyReply } from 'fastify';
import { bookingRepository } from '../repositories/booking.repository';
import prisma from '../plugins/prisma';

export class BookingController {
  async getMyBookings(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;
    try {
      const bookings = await bookingRepository.getCustomerBookings(user.id);
      
      const response = bookings.map(b => ({
        id: b.id,
        bookingReference: b.bookingReference,
        venueName: b.inventory.venueSpace.property.name,
        spaceName: b.inventory.venueSpace.name,
        date: b.inventory.date.toISOString().split('T')[0],
        session: b.inventory.session,
        amount: Number(b.amount),
        status: b.status,
        createdAt: b.createdAt.toISOString()
      }));
      return reply.send({ success: true, data: response });
    } catch (error) {
      throw error;
    }
  }

  async getBooking(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = (request as any).user;
    const { id } = request.params;
    
    try {
      const booking = await prisma.booking.findUnique({
        where: { id },
        include: { inventory: { include: { venueSpace: { include: { property: true } } } } }
      });

      if (!booking || booking.customerId !== user.id) {
        return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Booking not found' } });
      }

      const response = {
        bookingReference: booking.bookingReference,
        venueName: booking.inventory.venueSpace.property.name,
        spaceName: booking.inventory.venueSpace.name,
        date: booking.inventory.date.toISOString().split('T')[0],
        session: booking.inventory.session,
        amount: Number(booking.amount),
        status: booking.status,
        createdAt: booking.createdAt.toISOString()
      };

      return reply.send({ success: true, data: response });
    } catch (error) {
      throw error;
    }
  }
}

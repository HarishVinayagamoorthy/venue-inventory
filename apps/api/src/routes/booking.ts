import { FastifyInstance } from 'fastify';
import { BookingController } from '../controllers/booking.controller';
import { requireAuth } from '../plugins/auth';

export async function bookingRoutes(fastify: FastifyInstance) {
  const bookingController = new BookingController();

  fastify.addHook('onRequest', requireAuth);

  fastify.get('/', {
    schema: { tags: ['Bookings'] }
  }, bookingController.getMyBookings.bind(bookingController));

  fastify.get('/:id', {
    schema: {
      tags: ['Bookings'],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } }
      }
    }
  }, bookingController.getBooking.bind(bookingController));
}

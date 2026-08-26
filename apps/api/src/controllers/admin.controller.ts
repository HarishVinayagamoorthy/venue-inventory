import { FastifyRequest, FastifyReply } from 'fastify';
import prisma from '../plugins/prisma';

export class AdminController {
  private getPaginationParams(request: FastifyRequest) {
    const query = request.query as any;
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    return { skip: (page - 1) * limit, take: limit };
  }

  async getHolds(request: FastifyRequest, reply: FastifyReply) {
    const { skip, take } = this.getPaginationParams(request);
    
    try {
      const [holds, total] = await prisma.$transaction([
        prisma.hold.findMany({
          skip, take,
          include: { customer: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.hold.count()
      ]);

      return reply.send({ success: true, data: { holds, total, skip, take } });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch holds' } });
    }
  }

  async getBookings(request: FastifyRequest, reply: FastifyReply) {
    const { skip, take } = this.getPaginationParams(request);

    try {
      const [bookings, total] = await prisma.$transaction([
        prisma.booking.findMany({
          skip, take,
          include: { customer: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' }
        }),
        prisma.booking.count()
      ]);

      return reply.send({ success: true, data: { bookings, total, skip, take } });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch bookings' } });
    }
  }

  async getInventory(request: FastifyRequest, reply: FastifyReply) {
    const { skip, take } = this.getPaginationParams(request);

    try {
      const [inventory, total] = await prisma.$transaction([
        prisma.inventory.findMany({
          skip, take,
          orderBy: { createdAt: 'desc' }
        }),
        prisma.inventory.count()
      ]);

      return reply.send({ success: true, data: { inventory, total, skip, take } });
    } catch (error) {
      request.log.error(error);
      return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Failed to fetch inventory' } });
    }
  }
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { holdRepository } from '../repositories/hold.repository';
import prisma from '../plugins/prisma';
import { InvStatus } from 'shared-types';

export class PartnerController {
  async getInventory(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;
    const query = request.query as any;
    const page = Math.max(1, parseInt(query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit) || 20));
    const skip = (page - 1) * limit;
    
    try {
      const [inventory, total] = await prisma.$transaction([
        prisma.inventory.findMany({
          skip, take: limit,
          where: {
            venueSpace: {
              property: {
                ownerId: user.id
              }
            }
          },
          include: {
            venueSpace: {
              include: {
                property: true
              }
            }
          },
          orderBy: { date: 'asc' }
        }),
        prisma.inventory.count({
          where: {
            venueSpace: {
              property: {
                ownerId: user.id
              }
            }
          }
        })
      ]);
      return reply.send({ success: true, data: { inventory, total, skip, limit } });
    } catch (error) {
      throw error;
    }
  }

  async blockInventory(request: FastifyRequest<{ Params: { inventoryId: string } }>, reply: FastifyReply) {
    const user = (request as any).user;
    const { inventoryId } = request.params;

    try {
      // Begin transaction for safe state transition
      await prisma.$transaction(async (tx: any) => {
        // Lock the inventory row
        const inventory = (await tx.$queryRawUnsafe(`
          SELECT * FROM Inventory WHERE id = '${inventoryId}' FOR UPDATE
        `))[0] as any;

        if (!inventory) throw new Error('NOT_FOUND');

        // Check ownership (Admin can override, Partner must own)
        if (user.role === 'PARTNER') {
          const venueSpace = await tx.venueSpace.findUnique({
            where: { id: inventory.venueSpaceId },
            include: { property: true }
          });
          if (!venueSpace || venueSpace.property.ownerId !== user.id) {
            throw new Error('FORBIDDEN');
          }
        }

        // Must be AVAILABLE to be BLOCKED
        if (inventory.status !== InvStatus.AVAILABLE) {
          throw new Error('INVALID_STATE');
        }

        await holdRepository.updateInventoryStatus(tx, inventoryId, InvStatus.BLOCKED);
      });

      return reply.send({ success: true, data: { message: 'Inventory blocked successfully' } });
    } catch (error: any) {
      if (error.message === 'NOT_FOUND') return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Inventory not found' } });
      if (error.message === 'FORBIDDEN') return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      if (error.message === 'INVALID_STATE') return reply.status(409).send({ success: false, error: { code: 'INVALID_STATE', message: 'Can only block AVAILABLE inventory' } });
      throw error;
    }
  }

  async unblockInventory(request: FastifyRequest<{ Params: { inventoryId: string } }>, reply: FastifyReply) {
    const user = (request as any).user;
    const { inventoryId } = request.params;

    try {
      await prisma.$transaction(async (tx: any) => {
        const inventory = (await tx.$queryRawUnsafe(`
          SELECT * FROM Inventory WHERE id = '${inventoryId}' FOR UPDATE
        `))[0] as any;

        if (!inventory) throw new Error('NOT_FOUND');

        // Check ownership
        if (user.role === 'PARTNER') {
          const venueSpace = await tx.venueSpace.findUnique({
            where: { id: inventory.venueSpaceId },
            include: { property: true }
          });
          if (!venueSpace || venueSpace.property.ownerId !== user.id) {
            throw new Error('FORBIDDEN');
          }
        }

        // Must be BLOCKED to be AVAILABLE
        if (inventory.status !== InvStatus.BLOCKED) {
          throw new Error('INVALID_STATE');
        }

        await holdRepository.updateInventoryStatus(tx, inventoryId, InvStatus.AVAILABLE);
      });

      return reply.send({ success: true, data: { message: 'Inventory unblocked successfully' } });
    } catch (error: any) {
      if (error.message === 'NOT_FOUND') return reply.status(404).send({ success: false, error: { code: 'NOT_FOUND', message: 'Inventory not found' } });
      if (error.message === 'FORBIDDEN') return reply.status(403).send({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied' } });
      if (error.message === 'INVALID_STATE') return reply.status(409).send({ success: false, error: { code: 'INVALID_STATE', message: 'Can only unblock BLOCKED inventory' } });
      throw error;
    }
  }
}

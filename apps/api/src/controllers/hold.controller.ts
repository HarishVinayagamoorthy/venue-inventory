import { FastifyRequest, FastifyReply } from 'fastify';
import { holdCreationSchema } from 'shared-validation';
import { holdService } from '../services/hold.service';
import { holdRepository } from '../repositories/hold.repository';
import { HoldResponseDTO } from 'shared-types';

export class HoldController {
  async createHold(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;
    if (!user) {
      return reply.status(401).send({ success: false, error: { code: 'UNAUTHORIZED', message: 'Unauthorized' } });
    }

    const parsed = holdCreationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.errors }
      });
    }

    try {
      // Execute the authoritative transaction
      const { hold, targetRow } = await holdService.createHold(user.id, parsed.data);
      
      // Post-transaction: Schedule expiration
      await holdService.scheduleExpirationJob(hold.id);

      const response: HoldResponseDTO = {
        holdId: hold.id,
        inventoryId: hold.inventoryId,
        venueSpaceId: targetRow.venueSpaceId,
        date: targetRow.date.toISOString().split('T')[0],
        session: targetRow.session as any,
        status: hold.status as any,
        expiresAt: hold.expiresAt.toISOString()
      };

      return reply.status(201).send({
        success: true,
        data: response
      });
    } catch (error: any) {
      if (error.message === 'INVENTORY_UNAVAILABLE') {
        return reply.status(409).send({
          success: false,
          error: { code: 'INVENTORY_UNAVAILABLE', message: 'The selected venue is no longer available.' }
        });
      }
      if (error.message === 'INVENTORY_NOT_FOUND') {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Venue inventory not found for that date and session.' }
        });
      }

      // Handle Prisma Foreign Key constraint violations
      if (error.code === 'P2003') {
        const fieldName = error.meta?.field_name;
        if (typeof fieldName === 'string' && fieldName.includes('customerId')) {
          return reply.status(401).send({
            success: false,
            error: { code: 'UNAUTHORIZED', message: 'Invalid or deleted customer identity.' }
          });
        }
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'The referenced resource was not found.' }
        });
      }

      // Handle Prisma Unique Constraint violations inside the transaction
      if (error.code === 'P2002') {
        return reply.status(409).send({
          success: false,
          error: { code: 'CONFLICT', message: 'A duplicate record already exists.' }
        });
      }

      throw error;
    }
  }

  async getHold(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = (request as any).user;
    const { id } = request.params;

    const hold = await holdRepository.getHoldById(id);
    if (!hold || hold.customerId !== user.id) {
      return reply.status(404).send({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Hold not found' }
      });
    }

    const remainingSeconds = Math.max(0, Math.floor((hold.expiresAt.getTime() - Date.now()) / 1000));

    const response: HoldResponseDTO = {
      holdId: hold.id,
      inventoryId: hold.inventoryId,
      venueSpaceId: hold.inventory.venueSpaceId,
      date: hold.inventory.date.toISOString().split('T')[0],
      session: hold.inventory.session as any,
      status: hold.status as any,
      expiresAt: hold.expiresAt.toISOString(),
      remainingSeconds
    };

    return reply.send({ success: true, data: response });
  }

  async getActiveHolds(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;
    const holds = await holdRepository.getActiveHoldsByCustomer(user.id);

    const now = Date.now();
    const data = holds.map(hold => ({
      holdId: hold.id,
      inventoryId: hold.inventoryId,
      venueSpaceId: hold.inventory.venueSpaceId,
      date: hold.inventory.date.toISOString().split('T')[0],
      session: hold.inventory.session as any,
      status: hold.status as any,
      expiresAt: hold.expiresAt.toISOString(),
      remainingSeconds: Math.max(0, Math.floor((hold.expiresAt.getTime() - now) / 1000))
    }));

    // Filter out expired ones theoretically still in ACTIVE status if worker delayed
    const activeData = data.filter(h => h.remainingSeconds > 0);

    return reply.send({ success: true, data: activeData });
  }

  async cancelHold(request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) {
    const user = (request as any).user;
    const { id } = request.params;

    try {
      const result = await holdService.cancelHold(user.id, id);
      return reply.send({ success: true, data: result });
    } catch (error: any) {
      if (error.message === 'HOLD_NOT_FOUND' || error.message === 'FORBIDDEN') {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Hold not found' }
        });
      }
      if (error.message === 'HOLD_ALREADY_CONVERTED') {
        return reply.status(409).send({
          success: false,
          error: { code: 'HOLD_ALREADY_CONVERTED', message: 'This hold has already been converted into a booking.' }
        });
      }
      if (error.message === 'HOLD_EXPIRED') {
        return reply.status(409).send({
          success: false,
          error: { code: 'HOLD_EXPIRED', message: 'The hold has already expired.' }
        });
      }
      if (error.message === 'HOLD_NOT_ACTIVE') {
        return reply.status(409).send({
          success: false,
          error: { code: 'HOLD_NOT_ACTIVE', message: 'The hold is not active.' }
        });
      }

      throw error;
    }
  }
}

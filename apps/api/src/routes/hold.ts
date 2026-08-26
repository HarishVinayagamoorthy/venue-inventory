import { FastifyInstance } from 'fastify';
import { HoldController } from '../controllers/hold.controller';
import { requireAuth } from '../plugins/auth';

export async function holdRoutes(fastify: FastifyInstance) {
  const holdController = new HoldController();

  // All hold routes require authentication
  fastify.addHook('onRequest', requireAuth);

  fastify.post('/', {
    schema: {
      tags: ['Holds'],
      body: {
        type: 'object',
        required: ['venueSpaceId', 'date', 'session'],
        properties: {
          venueSpaceId: { type: 'string' },
          date: { type: 'string' },
          session: { type: 'string', enum: ['MORNING', 'EVENING', 'FULL_DAY'] }
        }
      }
    }
  }, holdController.createHold.bind(holdController));

  fastify.get('/active', {
    schema: { tags: ['Holds'] }
  }, holdController.getActiveHolds.bind(holdController));

  fastify.get('/:id', {
    schema: {
      tags: ['Holds'],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } }
      }
    }
  }, holdController.getHold.bind(holdController));

  fastify.delete('/:id', {
    schema: {
      tags: ['Holds'],
      params: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string' } }
      }
    }
  }, holdController.cancelHold.bind(holdController));
}

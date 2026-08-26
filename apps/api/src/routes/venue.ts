import { FastifyInstance } from 'fastify';
import { VenueController } from '../controllers/venue.controller';

export async function venueRoutes(fastify: FastifyInstance) {
  const venueController = new VenueController();

  fastify.get('/search', {
    schema: {
      tags: ['Venues'],
      querystring: {
        type: 'object',
        properties: {
          city: { type: 'string' },
          area: { type: 'string' },
          date: { type: 'string' },
          guests: { type: 'integer' },
          session: { type: 'string', enum: ['MORNING', 'EVENING', 'FULL_DAY'] },
          maxBudget: { type: 'number' }
        }
      }
    }
  }, venueController.search.bind(venueController));

  fastify.get('/:id', {
    schema: {
      tags: ['Venues'],
      params: {
        type: 'object',
        required: ['id'],
        properties: {
          id: { type: 'string' }
        }
      },
      querystring: {
        type: 'object',
        properties: {
          date: { type: 'string' }
        }
      }
    }
  }, venueController.getDetails.bind(venueController));
}

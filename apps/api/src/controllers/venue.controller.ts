import { FastifyRequest, FastifyReply } from 'fastify';
import { venueSearchSchema } from 'shared-validation';
import { venueService } from '../services/venue.service';

export class VenueController {
  async search(request: FastifyRequest, reply: FastifyReply) {
    const parsed = venueSearchSchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid search parameters',
          details: parsed.error.errors
        }
      });
    }

    try {
      const result = await venueService.searchVenues(parsed.data);
      return reply.send({
        success: true,
        data: result
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred during search', details: [] }
      });
    }
  }

  async getDetails(request: FastifyRequest<{ Params: { id: string }, Querystring: { date?: string } }>, reply: FastifyReply) {
    const { id } = request.params;
    const { date } = request.query;

    if (date && isNaN(Date.parse(date))) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid calendar date format', details: [] }
      });
    }

    try {
      const details = await venueService.getVenueDetails(id, date);
      if (!details) {
        return reply.status(404).send({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Venue space not found', details: [] }
        });
      }

      return reply.send({
        success: true,
        data: details
      });
    } catch (error: any) {
      request.log.error(error);
      return reply.status(500).send({
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'An error occurred fetching venue details', details: [] }
      });
    }
  }
}

import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export async function healthRoutes(fastify: FastifyInstance) {
  fastify.get('/health', async (request: FastifyRequest, reply: FastifyReply) => {
    return reply.send({ status: 'ok' });
  });

  fastify.get('/ready', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const { default: prisma } = (await import('../plugins/prisma.js')) as any;
      const { holdExpirationQueue } = (await import('../jobs/hold-expiration.queue.js')) as any;
      
      // Check MySQL
      await prisma.$queryRaw`SELECT 1`;
      
      // Check Redis (via BullMQ client)
      const client = await holdExpirationQueue.client;
      await (client as any).ping();
      
      return reply.send({ status: 'ok' });
    } catch (error) {
      request.log.error({ err: error }, 'Readiness check failed');
      return reply.status(503).send({ status: 'error', message: 'Service Unavailable' });
    }
  });
}

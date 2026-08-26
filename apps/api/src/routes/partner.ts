import { FastifyInstance } from 'fastify';
import { PartnerController } from '../controllers/partner.controller';
import { requireAuth } from '../plugins/auth';
import { requireRole } from '../plugins/rbac';

export async function partnerRoutes(fastify: FastifyInstance) {
  const partnerController = new PartnerController();

  fastify.addHook('onRequest', requireAuth);
  // Only ADMIN and PARTNER can access these routes
  fastify.addHook('onRequest', requireRole(['ADMIN', 'PARTNER']));

  fastify.get('/inventory', partnerController.getInventory.bind(partnerController));
  fastify.post('/inventory/:inventoryId/block', partnerController.blockInventory.bind(partnerController));
  fastify.post('/inventory/:inventoryId/unblock', partnerController.unblockInventory.bind(partnerController));
}

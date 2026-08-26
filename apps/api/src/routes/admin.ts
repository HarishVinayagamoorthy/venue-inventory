import { FastifyInstance } from 'fastify';
import { AdminController } from '../controllers/admin.controller';
import { requireAuth } from '../plugins/auth';
import { requireRole } from '../plugins/rbac';

export async function adminRoutes(fastify: FastifyInstance) {
  const adminController = new AdminController();

  fastify.addHook('onRequest', requireAuth);
  // Only ADMIN can access these routes
  fastify.addHook('onRequest', requireRole(['ADMIN']));

  fastify.get('/holds', adminController.getHolds.bind(adminController));
  fastify.get('/bookings', adminController.getBookings.bind(adminController));
  fastify.get('/inventory', adminController.getInventory.bind(adminController));
}

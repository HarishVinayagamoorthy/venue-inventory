import { FastifyInstance } from 'fastify';
import { PaymentController } from '../controllers/payment.controller';
import { requireAuth } from '../plugins/auth';

export async function paymentRoutes(fastify: FastifyInstance) {
  const paymentController = new PaymentController();

  fastify.addHook('onRequest', requireAuth);

  fastify.post('/', {
    schema: {
      tags: ['Payments'],
      headers: {
        type: 'object',
        required: ['idempotency-key'],
        properties: {
          'idempotency-key': { type: 'string' }
        }
      },
      body: {
        type: 'object',
        required: ['holdId', 'result'],
        properties: {
          holdId: { type: 'string' },
          result: { type: 'string', enum: ['SUCCESS', 'FAILED'] }
        }
      }
    }
  }, paymentController.simulatePayment.bind(paymentController));
}

import { FastifyRequest, FastifyReply } from 'fastify';
import { paymentSimulationSchema } from 'shared-validation';
import { paymentService } from '../services/payment.service';

export class PaymentController {
  async simulatePayment(request: FastifyRequest, reply: FastifyReply) {
    const user = (request as any).user;
    
    // Idempotency key from header
    const idempotencyKey = request.headers['idempotency-key'] as string;
    if (!idempotencyKey) {
      return reply.status(400).send({
        success: false,
        error: { code: 'MISSING_IDEMPOTENCY_KEY', message: 'Idempotency-Key header is required' }
      });
    }

    const parsed = paymentSimulationSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid input', details: parsed.error.errors }
      });
    }

    try {
      const result = await paymentService.processPaymentSimulation(user.id, parsed.data, idempotencyKey);
      return reply.status(200).send({
        success: true,
        data: result
      });
    } catch (error: any) {
      switch (error.message) {
        case 'NOT_FOUND':
        case 'FORBIDDEN':
          return reply.status(404).send({
            success: false,
            error: { code: 'NOT_FOUND', message: 'Hold not found' }
          });
        case 'HOLD_EXPIRED':
          return reply.status(409).send({
            success: false,
            error: { code: 'HOLD_EXPIRED', message: 'The hold has expired and can no longer be booked.' }
          });
        case 'ALREADY_CONVERTED':
          return reply.status(409).send({
            success: false,
            error: { code: 'ALREADY_CONVERTED', message: 'This hold has already been converted into a booking.' }
          });
        default:
          throw error;
      }
    }
  }
}

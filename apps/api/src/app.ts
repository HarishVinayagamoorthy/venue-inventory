import Fastify from 'fastify';
import cors from '@fastify/cors';
import { env } from './config/env';
import swaggerPlugin from './plugins/swagger';
import { healthRoutes } from './routes/health';
import { authRoutes } from './routes/auth';
import { venueRoutes } from './routes/venue';
import { holdRoutes } from './routes/hold';
import { paymentRoutes } from './routes/payment';
import { bookingRoutes } from './routes/booking';
import { partnerRoutes } from './routes/partner';
import { adminRoutes } from './routes/admin';
import crypto from 'crypto';
import rateLimit from '@fastify/rate-limit';

export function buildApp() {
  const app = Fastify({
    logger: {
      level: 'info',
      transport: env.NODE_ENV === 'development' ? { target: 'pino-pretty' } : undefined,
    },
    // Use Fastify's native request id
    genReqId: () => crypto.randomUUID(),
  });

  app.register(cors, { origin: env.CORS_ORIGIN });
  app.register(swaggerPlugin);

  // Rate Limiting
  app.register(rateLimit, {
    max: 100, // 100 requests per minute
    timeWindow: '1 minute'
  });

  // Global Error Handler
  app.setErrorHandler((error, request, reply) => {
    console.error('GLOBAL ERROR:', error);
    request.log.error({ reqId: request.id, err: error }, 'Unhandled Error');
    
    if (error.statusCode === 429) {
      return reply.status(429).send({ success: false, error: { code: 'RATE_LIMIT', message: 'Too many requests' } });
    }

    const isDeadlock = 
      (error as any).code === 'P2034' || 
      (error.message && error.message.toLowerCase().includes('deadlock')) || 
      (error.message && error.message.includes('1213')) ||
      (error.message && error.message.includes('1205'));

    if (isDeadlock) {
      return reply.status(409).send({
        success: false,
        error: { code: 'RETRYABLE_CONFLICT', message: 'The venue was just booked or held by someone else. Please try again.' }
      });
    }

    if (error.statusCode) {
      return reply.status(error.statusCode).send({ success: false, error: { code: error.name ? error.name.toUpperCase() : 'API_ERROR', message: error.message } });
    }

    // Default to 500 without leaking details
    return reply.status(500).send({ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred' } });
  });

  // Request Tracking Hook
  app.addHook('onRequest', async (request, reply) => {
    request.log.info({ reqId: request.id, method: request.method, url: request.url }, 'Incoming request');
  });

  // Health Checks
  app.get('/health', async () => ({ status: 'OK' }));
  app.get('/ready', async () => ({ status: 'OK', message: 'API ready' }));

  // Routes
  app.register(authRoutes, { prefix: '/api/v1/auth' });
  app.register(venueRoutes, { prefix: '/api/v1/venues' });
  app.register(holdRoutes, { prefix: '/api/v1/holds' });
  app.register(paymentRoutes, { prefix: '/api/v1/payments' });
  app.register(bookingRoutes, { prefix: '/api/v1/bookings' });
  app.register(partnerRoutes, { prefix: '/api/v1/partner' });
  app.register(adminRoutes, { prefix: '/api/v1/admin' });

  return app;
}

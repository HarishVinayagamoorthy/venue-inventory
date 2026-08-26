import { Queue } from 'bullmq';
import { env } from '../config/env';

export const holdExpirationQueue = new Queue('hold-expiration', {
  connection: {
    url: env.REDIS_URL
  }
});

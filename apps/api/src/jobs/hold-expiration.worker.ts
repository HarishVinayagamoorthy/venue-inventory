import { Worker, Job } from 'bullmq';
import { env } from '../config/env';
import { holdService } from '../services/hold.service';

export const holdExpirationWorker = new Worker('hold-expiration', async (job: Job) => {
  console.log(`Processing hold expiration for job: ${job.id}`);
  const { holdId } = job.data;
  if (holdId) {
    await holdService.processExpirationJob(holdId);
  }
}, {
  connection: {
    url: env.REDIS_URL
  }
});

holdExpirationWorker.on('completed', job => {
  console.log(`${job.id} has completed!`);
});

holdExpirationWorker.on('failed', (job, err) => {
  console.log(`${job?.id} has failed with ${err.message}`);
});

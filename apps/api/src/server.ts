import { buildApp } from './app';
import { env } from './config/env';
import { startReconciliationCron } from './jobs/hold-reconciliation.cron';

const start = async () => {
  const app = buildApp();
  try {
    startReconciliationCron();
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Server listening on http://localhost:${env.PORT}`);
    app.log.info(`Swagger docs at http://localhost:${env.PORT}/docs`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

start();

import prisma from '../plugins/prisma';
import { holdService } from '../services/hold.service';
import { HoldStatus } from 'shared-types';

export const startReconciliationCron = () => {
  // Run every 5 minutes
  const INTERVAL_MS = 5 * 60 * 1000;
  
  setInterval(async () => {
    try {
      console.log('Running hold reconciliation cron job...');
      const now = new Date();
      
      // Batch query to prevent memory explosion
      // Only get ACTIVE holds that have expired
      const expiredHolds = await prisma.hold.findMany({
        where: {
          status: HoldStatus.ACTIVE,
          expiresAt: { lt: now }
        },
        take: 50,
        select: { id: true }
      });

      if (expiredHolds.length === 0) {
        return;
      }

      console.log(`Found ${expiredHolds.length} expired holds to reconcile.`);

      // Process sequentially to avoid DB connection pool exhaustion or heavy lock contention
      for (const hold of expiredHolds) {
        try {
          await holdService.processExpirationJob(hold.id);
          console.log(`Reconciled hold ${hold.id}`);
        } catch (error: any) {
          console.error(`Failed to reconcile hold ${hold.id}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Hold reconciliation cron job failed:', error);
    }
  }, INTERVAL_MS);
};

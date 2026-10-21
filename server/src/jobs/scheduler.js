import cron from 'node-cron';
import { CloudAccount } from '../models/CloudAccount.js';
import { runSecurityScan } from '../services/assessment/scanService.js';
import { config } from '../config/env.js';

let cronTask = null;

/**
 * Initializes single-instance periodic background assessment scan using node-cron.
 * Architectural Note: An in-process scheduler is appropriate for single-instance or local
 * simulation environments. In horizontally scaled multi-container cloud deployments,
 * replace this with an external persistent job queue (e.g., BullMQ with Redis or AWS EventBridge).
 */
export function initScheduler() {
  if (!config.enableCronSchedule) {
    console.log('[Scheduler] Cron scheduling is disabled by configuration.');
    return;
  }

  if (cronTask) {
    console.warn('[Scheduler] Cron scheduler is already running in this process.');
    return;
  }

  // Run periodic automated scan every hour (e.g. at minute 0)
  // Can be configured via standard 5-part cron syntax
  const cronExpression = '0 * * * *';

  cronTask = cron.schedule(
    cronExpression,
    async () => {
      console.log(`[Scheduler] [${new Date().toISOString()}] Executing scheduled assessment pass...`);
      try {
        const activeAccounts = await CloudAccount.find({ status: 'active' });
        for (const account of activeAccounts) {
          try {
            console.log(`[Scheduler] Scanning account: ${account.name} (${account._id})`);
            await runSecurityScan({
              accountId: account._id,
              organizationId: account.organization,
              scanType: 'scheduled',
            });
          } catch (accountErr) {
            console.error(`[Scheduler] Error during scheduled scan for ${account.name}:`, accountErr.message);
          }
        }
      } catch (err) {
        console.error('[Scheduler] Fatal error during scheduled assessment pass:', err);
      }
    },
    {
      timezone: 'UTC',
    }
  );

  console.log(`[Scheduler] Scheduled assessment job registered with schedule: "${cronExpression}" (UTC)`);
}

export function stopScheduler() {
  if (cronTask) {
    cronTask.stop();
    cronTask = null;
    console.log('[Scheduler] Background scheduler stopped.');
  }
}

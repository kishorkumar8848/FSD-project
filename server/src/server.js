import app from './app.js';
import { config } from './config/env.js';
import { connectDB, disconnectDB } from './config/database.js';
import { initScheduler, stopScheduler } from './jobs/scheduler.js';
import { seedDatabase } from './seed/seed.js';
import { User } from './models/User.js';

let server = null;

async function startServer() {
  try {
    await connectDB();

    // Check if initial seeding is needed
    const userCount = await User.countDocuments();
    if (userCount === 0 && config.demoMode) {
      console.log('[Server] Empty database detected with DEMO_MODE enabled. Running initial seed...');
      await seedDatabase();
    }

    // Start background cron scheduler
    initScheduler();

    server = app.listen(config.port, () => {
      console.log('====================================================');
      console.log(`🛡️  CloudGuard CSPM Backend Server Online`);
      console.log(`📡 Port: ${config.port}`);
      console.log(`🌐 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API Base: http://localhost:${config.port}/api/v1`);
      console.log(`🩺 Health: http://localhost:${config.port}/api/health`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('[Server] Fatal startup failure:', err);
    process.exit(1);
  }
}

async function shutdown() {
  console.log('\n[Server] Graceful shutdown initiated...');
  stopScheduler();
  if (server) {
    server.close(() => {
      console.log('[Server] HTTP listener terminated.');
    });
  }
  await disconnectDB();
  console.log('[Server] Database connections closed. Process terminating.');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

startServer();

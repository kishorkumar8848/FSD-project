import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from root or server directory
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongodbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cloudguard',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'cloudguard_enterprise_dev_jwt_secret_key_89237482',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '24h',
  cookieSecure: process.env.COOKIE_SECURE === 'true',
  demoMode: process.env.DEMO_MODE !== 'false',
  enableCronSchedule: process.env.ENABLE_CRON_SCHEDULE !== 'false',
  seedAdminEmail: process.env.SEED_ADMIN_EMAIL || 'admin@cloudguard.io',
  seedAdminPassword: process.env.SEED_ADMIN_PASSWORD || 'CloudGuard@2026Admin!',
  seedAnalystEmail: process.env.SEED_ANALYST_EMAIL || 'analyst@cloudguard.io',
  seedAnalystPassword: process.env.SEED_ANALYST_PASSWORD || 'CloudGuard@2026Analyst!',
};

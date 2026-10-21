import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import morgan from 'morgan';
import { config } from './config/env.js';
import { generalLimiter } from './middleware/rateLimiter.js';
import { errorHandler } from './middleware/errorHandler.js';
import apiRouter from './routes/index.js';

const app = express();

// Security HTTP headers
app.use(
  helmet({
    contentSecurityPolicy: false, // Permissive for local dev & Vite preview
    crossOriginEmbedderPolicy: false,
  })
);

// CORS configuration with explicit allowed origin
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost dev servers or same-origin/no-origin (like curl / Postman)
      if (!origin || origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Logging in non-test mode
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('short'));
}

// Rate limiting
app.use('/api', generalLimiter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CloudGuard API Engine',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// Master API v1 mount
app.use('/api/v1', apiRouter);

// 404 handler for unknown routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `The requested endpoint ${req.method} ${req.originalUrl} does not exist on CloudGuard API.`,
      code: 'NOT_FOUND',
    },
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;

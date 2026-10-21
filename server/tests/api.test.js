import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../src/app.js';
import { connectDB, disconnectDB } from '../src/config/database.js';
import { User } from '../src/models/User.js';
import { Organization } from '../src/models/Organization.js';

describe('CloudGuard API Integration Suite', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('GET /api/health should return healthy status', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('healthy');
    expect(res.body.service).toContain('CloudGuard');
  });

  it('POST /api/v1/auth/register should create a user and return JWT token', async () => {
    const res = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Test Security Engineer',
        email: 'testengineer@cloudguard.io',
        password: 'Password123!',
        organizationName: 'Test SecOrg',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('testengineer@cloudguard.io');
    // First user in fresh org should have role admin or analyst
    expect(res.body.data.user.role).toBeDefined();
  });

  it('POST /api/v1/auth/login with valid credentials should succeed', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testengineer@cloudguard.io',
        password: 'Password123!',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
  });

  it('POST /api/v1/auth/login with invalid password should return 401', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: 'testengineer@cloudguard.io',
        password: 'WrongPassword!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Protected routes should reject unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/v1/dashboard/summary');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });
});

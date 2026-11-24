import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';

const app = createApp();

describe('Auth Module Integration Tests', () => {
  it('Should reject login with incorrect credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'WrongPassword@999' });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('Should successfully authenticate admin user with valid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin', password: 'Admin@123' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('refreshToken');
    expect(res.body.data.user.username).toBe('admin');
    expect(res.body.data.user.role).toBe('ADMIN');
  });

  it('Should rotate refresh token and issue new token pair', async () => {
    // 1. Login
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'cashier1', password: 'Staff@123' });

    expect(loginRes.status).toBe(200);
    const { refreshToken } = loginRes.body.data;

    // 2. Refresh Token
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh-token')
      .send({ refreshToken });

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data).toHaveProperty('accessToken');
    expect(refreshRes.body.data).toHaveProperty('refreshToken');
    expect(refreshRes.body.data.refreshToken).not.toBe(refreshToken);
  });
});

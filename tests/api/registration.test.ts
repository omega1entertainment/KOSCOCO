import { describe, it, expect } from 'vitest';
import request from 'supertest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

describe('Registration API', () => {
  describe('POST /api/registrations', () => {
    it('should require authentication', async () => {
      const response = await request(BASE_URL)
        .post('/api/registrations')
        .send({
          categoryIds: ['category-1'],
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/registrations/user', () => {
    it('should require authentication', async () => {
      const response = await request(BASE_URL)
        .get('/api/registrations/user')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('GET /api/registrations/status', () => {
    it('should return registration status without auth', async () => {
      const response = await request(BASE_URL)
        .get('/api/registrations/status')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('enabled');
      expect(typeof response.body.enabled).toBe('boolean');
    });
  });
});

describe('Payment API', () => {
  describe('POST /api/payments/verify', () => {
    it('should require authentication', async () => {
      const response = await request(BASE_URL)
        .post('/api/payments/verify')
        .send({
          transaction_id: 'test-123',
          registrationId: 'reg-123',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('POST /api/payments/webhook', () => {
    it('should reject requests without signature', async () => {
      const response = await request(BASE_URL)
        .post('/api/payments/webhook')
        .send({
          event: 'charge.completed',
          data: { status: 'successful' },
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('should reject requests with invalid signature', async () => {
      const response = await request(BASE_URL)
        .post('/api/payments/webhook')
        .set('verif-hash', 'invalid-hash')
        .send({
          event: 'charge.completed',
          data: { status: 'successful' },
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('message', 'Invalid signature');
    });
  });
});

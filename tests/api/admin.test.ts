import { describe, it, expect } from 'vitest';
import request from 'supertest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

describe('Admin API Security', () => {
  describe('User Management', () => {
    it('GET /api/admin/users - should require authentication', async () => {
      const response = await request(BASE_URL)
        .get('/api/admin/users')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Phase Management', () => {
    it('POST /api/admin/phases/:id/activate - should require authentication', async () => {
      const response = await request(BASE_URL)
        .post('/api/admin/phases/test-phase/activate')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('POST /api/admin/phases/:id/complete - should require authentication', async () => {
      const response = await request(BASE_URL)
        .post('/api/admin/phases/test-phase/complete')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Registration Management', () => {
    it('POST /api/admin/registrations/toggle - should require authentication', async () => {
      const response = await request(BASE_URL)
        .post('/api/admin/registrations/toggle')
        .send({ enabled: true })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Top 500 Selection', () => {
    it('POST /api/admin/select-top-500 - should require authentication', async () => {
      const response = await request(BASE_URL)
        .post('/api/admin/select-top-500')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('SMS Management', () => {
    it('POST /api/admin/sms/send - should require authentication', async () => {
      const response = await request(BASE_URL)
        .post('/api/admin/sms/send')
        .send({
          phoneNumber: '+237612345678',
          message: 'Test message',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });

  describe('Storage Management', () => {
    it('GET /api/storage/status - returns storage configuration status', async () => {
      // Note: This endpoint is currently public (returns storage config status)
      const response = await request(BASE_URL)
        .get('/api/storage/status')
        .expect('Content-Type', /json/);

      // Returns 200 with configured status or 401 if protected
      expect([200, 401]).toContain(response.status);
    });

    it('GET /api/storage/files - should require authentication', async () => {
      const response = await request(BASE_URL)
        .get('/api/storage/files')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});

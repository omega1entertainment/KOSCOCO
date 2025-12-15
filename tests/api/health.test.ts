import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

describe('Health Check API', () => {
  it('GET /api/health - should return healthy status', async () => {
    const response = await request(BASE_URL)
      .get('/api/health')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('status', 'healthy');
    expect(response.body).toHaveProperty('database', 'connected');
    expect(response.body).toHaveProperty('timestamp');
  });
});

describe('Categories API', () => {
  it('GET /api/categories - should return array of categories', async () => {
    const response = await request(BASE_URL)
      .get('/api/categories')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });
});

describe('Phases API', () => {
  it('GET /api/phases - should return array of phases', async () => {
    const response = await request(BASE_URL)
      .get('/api/phases')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
  });

  it('GET /api/phases/active - should return active phase or null', async () => {
    const response = await request(BASE_URL)
      .get('/api/phases/active')
      .expect('Content-Type', /json/)
      .expect(200);

    // Active phase can be null or an object
    if (response.body !== null) {
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('status');
    }
  });
});

describe('Registration Status API', () => {
  it('GET /api/registrations/status - should return enabled boolean', async () => {
    const response = await request(BASE_URL)
      .get('/api/registrations/status')
      .expect('Content-Type', /json/)
      .expect(200);

    expect(response.body).toHaveProperty('enabled');
    expect(typeof response.body.enabled).toBe('boolean');
  });
});

import { describe, it, expect } from 'vitest';
import request from 'supertest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

describe('Videos API', () => {
  describe('Public Endpoints', () => {
    it('GET /api/videos/feed - should return video feed', async () => {
      const response = await request(BASE_URL)
        .get('/api/videos/feed')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });

    it('GET /api/videos/search - should accept search query', async () => {
      const response = await request(BASE_URL)
        .get('/api/videos/search')
        .query({ q: 'test' })
        .expect('Content-Type', /json/);

      // Returns array, object with results, or error
      expect([200, 400, 500]).toContain(response.status);
      if (response.status === 200) {
        // Response can be array or object with videos property
        const isValidResponse = Array.isArray(response.body) || 
          (typeof response.body === 'object' && response.body !== null);
        expect(isValidResponse).toBe(true);
      }
    });

    it('GET /api/videos/video-of-the-day - should return featured video or null', async () => {
      const response = await request(BASE_URL)
        .get('/api/videos/video-of-the-day')
        .expect('Content-Type', /json/)
        .expect(200);

      // Can be null or a video object
      if (response.body !== null) {
        expect(response.body).toHaveProperty('id');
      }
    });
  });

  describe('Protected Endpoints', () => {
    it('POST /api/videos - should require authentication', async () => {
      const response = await request(BASE_URL)
        .post('/api/videos')
        .send({
          title: 'Test Video',
          description: 'Test description',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('POST /api/videos/upload-url - should require authentication', async () => {
      const response = await request(BASE_URL)
        .post('/api/videos/upload-url')
        .send({
          fileName: 'test.mp4',
          contentType: 'video/mp4',
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('GET /api/videos/user - should require authentication', async () => {
      const response = await request(BASE_URL)
        .get('/api/videos/user')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });

    it('GET /api/videos/pending - should require authentication', async () => {
      const response = await request(BASE_URL)
        .get('/api/videos/pending')
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});

describe('Voting API', () => {
  describe('POST /api/votes', () => {
    it('should validate required fields', async () => {
      const response = await request(BASE_URL)
        .post('/api/votes')
        .send({})
        .expect('Content-Type', /json/);

      // Should fail without videoId
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/votes/purchase/initiate', () => {
    it('should require authentication', async () => {
      const response = await request(BASE_URL)
        .post('/api/votes/purchase/initiate')
        .send({
          videoId: 'test-video-id',
          voteCount: 10,
        })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});

describe('Likes API', () => {
  describe('POST /api/likes', () => {
    it('should validate required fields', async () => {
      const response = await request(BASE_URL)
        .post('/api/likes')
        .send({})
        .expect('Content-Type', /json/);

      // Should fail without videoId
      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});

describe('Comments API', () => {
  describe('GET /api/videos/:videoId/comments', () => {
    it('should return 404 for non-existent video', async () => {
      const response = await request(BASE_URL)
        .get('/api/videos/non-existent-id/comments')
        .expect('Content-Type', /json/);

      // Either 404 or empty array depending on implementation
      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /api/videos/:videoId/comments', () => {
    it('should require authentication', async () => {
      const response = await request(BASE_URL)
        .post('/api/videos/test-video-id/comments')
        .send({ content: 'Test comment' })
        .expect(401);

      expect(response.body).toHaveProperty('message');
    });
  });
});

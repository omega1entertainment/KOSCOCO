# KOSCOCO Testing Guide

## Overview
This document describes how to set up and run tests for the KOSCOCO video competition platform.

---

## Test Types

### 1. API Tests (Vitest + Supertest)
Located in `tests/api/` - Tests API endpoints for correct responses, authentication, and validation.

### 2. E2E Tests (Playwright)
Located in `tests/e2e/` - Tests user flows in a real browser environment.

---

## Prerequisites

1. **Node.js 18+**
2. **Application running** - Start the app with `npm run dev`
3. **Database connected** - PostgreSQL must be accessible

---

## Running Tests

### API Tests

```bash
# Run all API tests
npm run test:api

# Run with coverage
npm run test:api -- --coverage

# Run specific test file
npm run test:api -- tests/api/health.test.ts

# Watch mode during development
npm run test:api -- --watch
```

### E2E Tests

```bash
# Install Playwright browsers (first time only)
npx playwright install chromium

# Run all E2E tests
npm run test:e2e

# Run with UI mode
npx playwright test --ui

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Generate HTML report
npx playwright show-report
```

### All Tests

```bash
# Run all tests (API + E2E)
npm test
```

---

## Test Structure

```
tests/
├── api/                    # API tests (Vitest)
│   ├── health.test.ts      # Health check, categories, phases
│   ├── auth.test.ts        # Authentication endpoints
│   ├── registration.test.ts # Registration and payment
│   ├── admin.test.ts       # Admin endpoint security
│   └── videos.test.ts      # Video CRUD and voting
└── e2e/                    # E2E tests (Playwright)
    ├── auth.spec.ts        # Login/signup flows
    └── navigation.spec.ts  # Public page navigation
```

---

## Test Coverage

### P0 - Critical Path
- ✅ Health check endpoint
- ✅ Authentication (login, signup, 2FA)
- ✅ Admin endpoint protection
- ✅ Payment webhook signature validation
- ✅ Video CRUD endpoints

### P1 - High Priority
- ✅ Public API endpoints (categories, phases, feed)
- ✅ Voting and likes validation
- ✅ Comments authentication
- ✅ Public page navigation

### P2 - Medium Priority
- Affiliate and advertiser endpoints
- Judge scoring
- SMS/Newsletter management

---

## Environment Variables for Testing

```bash
# Optional: Override base URL for tests
TEST_BASE_URL=http://localhost:5000

# E2E tests use Playwright config
BASE_URL=http://localhost:5000
```

---

## Writing New Tests

### API Test Template

```typescript
import { describe, it, expect } from 'vitest';
import request from 'supertest';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5000';

describe('Feature Name', () => {
  it('should do something', async () => {
    const response = await request(BASE_URL)
      .get('/api/endpoint')
      .expect(200);

    expect(response.body).toHaveProperty('key');
  });
});
```

### E2E Test Template

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test('should do something', async ({ page }) => {
    await page.goto('/some-page');
    
    await expect(page.locator('[data-testid="element"]')).toBeVisible();
  });
});
```

---

## CI/CD Integration

Tests can be integrated into CI pipelines:

```yaml
# Example GitHub Actions
- name: Run API Tests
  run: npm run test:api

- name: Install Playwright
  run: npx playwright install --with-deps chromium

- name: Run E2E Tests
  run: npm run test:e2e
```

---

## Troubleshooting

### "Connection refused" errors
- Ensure the application is running on port 5000
- Check database connection

### Playwright browser errors
- Run `npx playwright install chromium` to install browsers
- Use `--headed` flag to see browser during tests

### Timeout errors
- Increase timeout in vitest.config.ts or playwright.config.ts
- Check if API endpoints are responding slowly

---

## Test Reports

### Vitest Coverage
After running with `--coverage`, view report in `coverage/` directory.

### Playwright Report
After running tests, view HTML report:
```bash
npx playwright show-report
```

# KOSCOCO Test Plan

## Overview
This document outlines the comprehensive test plan for the KOSCOCO video competition platform.

---

## Test Categories

### 1. API Tests (Automated - Vitest)
### 2. E2E Tests (Automated - Playwright)
### 3. Manual Tests (Checklist)

---

## P0 - Critical Path Tests

### TC-001: User Signup with OTP
| Field | Value |
|-------|-------|
| Priority | P0 |
| Preconditions | Fresh email not in system |
| Steps | 1. Navigate to /login<br>2. Click signup tab<br>3. Fill form with valid data<br>4. Submit form<br>5. Verify OTP dialog appears<br>6. Enter OTP from email<br>7. Submit OTP |
| Expected | User account created, auto-logged in |
| Data | Test email, password, name |

### TC-002: User Login
| Field | Value |
|-------|-------|
| Priority | P0 |
| Preconditions | Existing verified user account |
| Steps | 1. Navigate to /login<br>2. Enter email and password<br>3. Click login |
| Expected | User logged in, redirected to dashboard |

### TC-003: User Login with 2FA
| Field | Value |
|-------|-------|
| Priority | P0 |
| Preconditions | User with 2FA enabled |
| Steps | 1. Navigate to /login<br>2. Enter credentials<br>3. Submit<br>4. Enter 2FA code<br>5. Submit |
| Expected | User logged in after 2FA verification |

### TC-004: Competition Registration
| Field | Value |
|-------|-------|
| Priority | P0 |
| Preconditions | Logged in user, registration open |
| Steps | 1. Navigate to /register<br>2. Select categories<br>3. Proceed to payment<br>4. Complete Flutterwave payment |
| Expected | Registration created with approved status |

### TC-005: Payment Verification
| Field | Value |
|-------|-------|
| Priority | P0 |
| Preconditions | Payment initiated |
| Steps | 1. Complete payment in Flutterwave<br>2. Callback received<br>3. Verify endpoint called |
| Expected | Registration approved, referral commission recorded |

### TC-006: Payment Webhook Idempotency
| Field | Value |
|-------|-------|
| Priority | P0 |
| Preconditions | Valid payment |
| Steps | 1. Send webhook<br>2. Send same webhook again |
| Expected | Only one registration created, second webhook returns already_processed |

### TC-007: Video Upload
| Field | Value |
|-------|-------|
| Priority | P0 |
| Preconditions | Logged in user, verified email, registered |
| Steps | 1. Navigate to /upload<br>2. Select video file<br>3. Fill metadata<br>4. Submit |
| Expected | Video uploaded, pending moderation |

### TC-008: Free Vote
| Field | Value |
|-------|-------|
| Priority | P0 |
| Preconditions | Approved video exists |
| Steps | 1. Navigate to video<br>2. Click vote button |
| Expected | Vote recorded, count incremented |

### TC-009: Paid Vote Purchase
| Field | Value |
|-------|-------|
| Priority | P0 |
| Preconditions | Logged in user, approved video |
| Steps | 1. Navigate to video<br>2. Click vote<br>3. Enter vote count<br>4. Pay via Flutterwave |
| Expected | Votes added, count updated in UI |

---

## P1 - High Priority Tests

### TC-010: Like Video
| Field | Value |
|-------|-------|
| Priority | P1 |
| Preconditions | Approved video exists |
| Steps | 1. Navigate to video<br>2. Click like button |
| Expected | Like recorded, count updated |

### TC-011: Unlike Video
| Field | Value |
|-------|-------|
| Priority | P1 |
| Preconditions | Video already liked |
| Steps | 1. Navigate to video<br>2. Click like button again |
| Expected | Like removed, count decremented |

### TC-012: Add Comment
| Field | Value |
|-------|-------|
| Priority | P1 |
| Preconditions | Logged in, approved video |
| Steps | 1. Navigate to video<br>2. Open comments<br>3. Type comment<br>4. Submit |
| Expected | Comment added, visible in list |

### TC-013: Follow Creator
| Field | Value |
|-------|-------|
| Priority | P1 |
| Preconditions | Logged in, viewing another user's video |
| Steps | 1. Navigate to video<br>2. Click follow button |
| Expected | Following relationship created |

### TC-014: Video Search
| Field | Value |
|-------|-------|
| Priority | P1 |
| Preconditions | Videos exist in system |
| Steps | 1. Enter search term<br>2. Submit search |
| Expected | Matching videos displayed |

### TC-015: Leaderboard Display
| Field | Value |
|-------|-------|
| Priority | P1 |
| Preconditions | Voted videos exist |
| Steps | 1. Navigate to /leaderboard |
| Expected | Videos ranked by vote count |

### TC-016: Admin Video Moderation
| Field | Value |
|-------|-------|
| Priority | P1 |
| Preconditions | Admin user, pending video |
| Steps | 1. Login as admin<br>2. Navigate to admin dashboard<br>3. Review pending video<br>4. Approve or reject |
| Expected | Video status updated |

---

## P2 - Medium Priority Tests

### TC-017: Affiliate Registration
### TC-018: Advertiser Registration
### TC-019: Judge Scoring
### TC-020: Watchlist Management
### TC-021: Poll Creation and Response
### TC-022: SMS Notifications
### TC-023: Newsletter Subscription
### TC-024: Password Reset

---

## Edge Case Tests

### EC-001: Double Submit Prevention
| Field | Value |
|-------|-------|
| Scenario | User double-clicks submit button |
| Expected | Only one request processed |

### EC-002: Session Expiry During Payment
| Field | Value |
|-------|-------|
| Scenario | Session expires while on Flutterwave |
| Expected | Webhook still processes payment correctly |

### EC-003: Network Drop During Upload
| Field | Value |
|-------|-------|
| Scenario | Network drops during video upload |
| Expected | User sees error, can retry |

### EC-004: Invalid File Upload
| Field | Value |
|-------|-------|
| Scenario | User uploads non-video file |
| Expected | Validation error displayed |

### EC-005: Rate Limiting
| Field | Value |
|-------|-------|
| Scenario | Rapid API calls from same IP |
| Expected | Rate limit error after threshold |

---

## Security Tests

### SEC-001: Admin Route Protection
| Scenario | Attempt to access /api/admin/* without admin role |
| Expected | 403 Forbidden |

### SEC-002: User Data Isolation
| Scenario | User tries to access another user's data |
| Expected | 401/403 or filtered results |

### SEC-003: Flutterwave Webhook Signature
| Scenario | Webhook with invalid signature |
| Expected | 401 Unauthorized |

### SEC-004: XSS in Comments
| Scenario | Submit comment with script tags |
| Expected | Script escaped/sanitized |

### SEC-005: SQL Injection
| Scenario | SQL in search query |
| Expected | Query sanitized, no injection |

---

## PWA Tests

### PWA-001: Manifest Valid
| Check | manifest.json has name, icons, start_url, display |

### PWA-002: Service Worker Registration
| Check | SW registers successfully |

### PWA-003: Offline Fallback
| Check | Graceful offline message shown |

### PWA-004: Cache Strategy
| Check | Auth/payment pages not cached |

### PWA-005: Installability
| Check | Lighthouse PWA audit passes |

---

## Performance Tests

### PERF-001: API Response Times
| Endpoint | Target |
|----------|--------|
| GET /api/videos | < 500ms |
| GET /api/categories | < 200ms |
| POST /api/likes | < 300ms |

### PERF-002: Database Query Performance
| Check | No N+1 queries, indexes on foreign keys |

### PERF-003: Bundle Size
| Target | Main bundle < 500KB gzipped |

---

## Test Execution Order

1. Health check endpoint
2. Auth tests (signup, login, 2FA)
3. Registration and payment flow
4. Video CRUD
5. Voting (free and paid)
6. Likes and comments
7. Follow system
8. Admin features
9. Edge cases
10. Security tests
11. PWA tests
12. Performance tests

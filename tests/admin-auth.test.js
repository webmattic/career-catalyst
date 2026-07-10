import test from 'node:test';
import assert from 'node:assert/strict';

import {
  createAdminSessionCookie,
  createAdminSessionToken,
  hasAdminSession,
  parseCookies,
  requireAdminSession,
  validateAdminCredentials,
  verifyAdminSessionToken,
} from '../functions/lib/admin-auth.js';

test('validateAdminCredentials accepts matching credentials', () => {
  assert.equal(
    validateAdminCredentials({
      username: 'admin',
      password: 'secret123',
      expectedUsername: 'admin',
      expectedPassword: 'secret123',
    }),
    true
  );
});

test('createAdminSessionToken and verifyAdminSessionToken work together', () => {
  const token = createAdminSessionToken({
    username: 'admin',
    secret: 'session-secret',
    maxAgeSeconds: 3600,
    now: 1000,
  });

  assert.equal(
    verifyAdminSessionToken({
      token,
      secret: 'session-secret',
      expectedUsername: 'admin',
      now: 2000,
    }),
    true
  );
});

test('verifyAdminSessionToken rejects expired token', () => {
  const token = createAdminSessionToken({
    username: 'admin',
    secret: 'session-secret',
    maxAgeSeconds: 1,
    now: 1000,
  });

  assert.equal(
    verifyAdminSessionToken({
      token,
      secret: 'session-secret',
      expectedUsername: 'admin',
      now: 5000,
    }),
    false
  );
});

test('parseCookies extracts session token', () => {
  const cookies = parseCookies('foo=bar; pragnya_admin_session=abc123; theme=dark');
  assert.equal(cookies.pragnya_admin_session, 'abc123');
});

test('hasAdminSession accepts valid signed cookie', () => {
  const cookie = createAdminSessionCookie({
    username: 'admin',
    secret: 'session-secret',
    now: 1000,
  });

  const request = new Request('https://example.com/admin', {
    headers: {
      cookie,
    },
  });

  assert.equal(
    hasAdminSession({
      request,
      env: {
        ADMIN_USERNAME: 'admin',
        ADMIN_PASSWORD: 'secret123',
        ADMIN_SESSION_SECRET: 'session-secret',
      },
      now: 2000,
    }),
    true
  );
});

test('requireAdminSession redirects page requests to login when session is missing', () => {
  const response = requireAdminSession({
    request: new Request('https://example.com/admin'),
    env: {
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'secret123',
      ADMIN_SESSION_SECRET: 'session-secret',
    },
  });

  assert.equal(response.status, 302);
  assert.equal(response.headers.get('location'), 'https://example.com/admin/login');
});

test('requireAdminSession returns 401 json for api requests when session is missing', async () => {
  const response = requireAdminSession({
    request: new Request('https://example.com/admin/api/leads'),
    env: {
      ADMIN_USERNAME: 'admin',
      ADMIN_PASSWORD: 'secret123',
      ADMIN_SESSION_SECRET: 'session-secret',
    },
    isApiRoute: true,
  });

  assert.equal(response.status, 401);
  const body = await response.json();
  assert.equal(body.error, 'Unauthorized.');
});

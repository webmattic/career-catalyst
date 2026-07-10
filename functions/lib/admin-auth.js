import { createHmac, timingSafeEqual } from 'node:crypto';

const SESSION_COOKIE_NAME = 'pragnya_admin_session';
const DEFAULT_SESSION_MAX_AGE = 60 * 60 * 12;

const forbiddenConfigResponse = () =>
  new Response('Admin credentials are not configured.', {
    status: 503,
    headers: {
      'cache-control': 'no-store',
    },
  });

const safeEqual = (left, right) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
};

const signPayload = ({ payloadBase64Url, secret }) =>
  createHmac('sha256', secret).update(payloadBase64Url).digest('base64url');

export const parseCookies = (cookieHeader = '') =>
  Object.fromEntries(
    cookieHeader
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separatorIndex = part.indexOf('=');
        if (separatorIndex === -1) {
          return [part, ''];
        }

        return [part.slice(0, separatorIndex), decodeURIComponent(part.slice(separatorIndex + 1))];
      })
  );

export const validateAdminCredentials = ({
  username,
  password,
  expectedUsername,
  expectedPassword,
}) => {
  if (!expectedUsername || !expectedPassword) {
    return false;
  }

  return safeEqual(username || '', expectedUsername) && safeEqual(password || '', expectedPassword);
};

export const createAdminSessionToken = ({
  username,
  secret,
  maxAgeSeconds = DEFAULT_SESSION_MAX_AGE,
  now = Date.now(),
}) => {
  const payloadBase64Url = Buffer.from(
    JSON.stringify({
      username,
      exp: now + maxAgeSeconds * 1000,
    }),
    'utf8'
  ).toString('base64url');

  const signature = signPayload({ payloadBase64Url, secret });
  return `${payloadBase64Url}.${signature}`;
};

export const verifyAdminSessionToken = ({
  token,
  secret,
  expectedUsername,
  now = Date.now(),
}) => {
  if (!token || !secret || !expectedUsername) {
    return false;
  }

  const [payloadBase64Url, providedSignature] = token.split('.');

  if (!payloadBase64Url || !providedSignature) {
    return false;
  }

  const expectedSignature = signPayload({ payloadBase64Url, secret });
  if (!safeEqual(providedSignature, expectedSignature)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64Url, 'base64url').toString('utf8'));
    if (!payload?.username || !payload?.exp) {
      return false;
    }

    if (!safeEqual(payload.username, expectedUsername)) {
      return false;
    }

    return now < Number(payload.exp);
  } catch {
    return false;
  }
};

export const createAdminSessionCookie = ({
  username,
  secret,
  maxAgeSeconds = DEFAULT_SESSION_MAX_AGE,
  now = Date.now(),
}) => {
  const token = createAdminSessionToken({
    username,
    secret,
    maxAgeSeconds,
    now,
  });

  return `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAgeSeconds}`;
};

export const clearAdminSessionCookie = () =>
  `${SESSION_COOKIE_NAME}=; Path=/admin; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;

export const hasAdminSession = ({ request, env, now = Date.now() }) => {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) {
    return false;
  }

  const cookies = parseCookies(request.headers.get('cookie') || '');
  const token = cookies[SESSION_COOKIE_NAME];

  return verifyAdminSessionToken({
    token,
    secret: env.ADMIN_SESSION_SECRET,
    expectedUsername: env.ADMIN_USERNAME,
    now,
  });
};

export const requireAdminSession = ({ request, env, isApiRoute = false }) => {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) {
    return forbiddenConfigResponse();
  }

  if (hasAdminSession({ request, env })) {
    return null;
  }

  if (isApiRoute) {
    return new Response(JSON.stringify({ error: 'Unauthorized.' }), {
      status: 401,
      headers: {
        'content-type': 'application/json; charset=utf-8',
        'cache-control': 'no-store',
      },
    });
  }

  const url = new URL(request.url);
  return Response.redirect(`${url.origin}/admin/login`, 302);
};

export { SESSION_COOKIE_NAME, DEFAULT_SESSION_MAX_AGE };

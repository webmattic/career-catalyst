import {
  createAdminSessionCookie,
  validateAdminCredentials,
} from '../../lib/admin-auth.js';
import { json, noStoreHeaders } from '../../lib/http.js';

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_USERNAME || !env.ADMIN_PASSWORD || !env.ADMIN_SESSION_SECRET) {
    return json({ error: 'Admin credentials are not configured.' }, { status: 503, headers: noStoreHeaders });
  }

  const body = await request.json().catch(() => null);
  const username = typeof body?.username === 'string' ? body.username.trim() : '';
  const password = typeof body?.password === 'string' ? body.password : '';

  const isValid = validateAdminCredentials({
    username,
    password,
    expectedUsername: env.ADMIN_USERNAME,
    expectedPassword: env.ADMIN_PASSWORD,
  });

  if (!isValid) {
    return json({ error: 'Invalid username or password.' }, { status: 401, headers: noStoreHeaders });
  }

  return json(
    {
      ok: true,
    },
    {
      headers: {
        ...noStoreHeaders,
        'set-cookie': createAdminSessionCookie({
          username: env.ADMIN_USERNAME,
          secret: env.ADMIN_SESSION_SECRET,
        }),
      },
    }
  );
}

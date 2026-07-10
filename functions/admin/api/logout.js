import { clearAdminSessionCookie } from '../../lib/admin-auth.js';
import { json, noStoreHeaders } from '../../lib/http.js';

export async function onRequestPost() {
  return json(
    {
      ok: true,
    },
    {
      headers: {
        ...noStoreHeaders,
        'set-cookie': clearAdminSessionCookie(),
      },
    }
  );
}

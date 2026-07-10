import test from 'node:test';
import assert from 'node:assert/strict';

import { json, noStoreHeaders } from '../functions/lib/http.js';

test('json response preserves content-type while merging no-store headers', async () => {
  const response = json({ ok: true }, { status: 201, headers: noStoreHeaders });

  assert.equal(response.status, 201);
  assert.equal(response.headers.get('content-type'), 'application/json; charset=utf-8');
  assert.equal(response.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await response.json(), { ok: true });
});

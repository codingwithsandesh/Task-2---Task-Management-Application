import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { parseJsonResponse } from './api';

describe('parseJsonResponse', () => {
  it('returns null for empty responses', async () => {
    const res = new Response('', { status: 200 });
    const data = await parseJsonResponse(res);
    assert.equal(data, null);
  });

  it('parses valid JSON payloads', async () => {
    const res = new Response(JSON.stringify({ success: true, data: { ok: true } }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

    const data = await parseJsonResponse(res);
    assert.deepEqual(data, { success: true, data: { ok: true } });
  });
});

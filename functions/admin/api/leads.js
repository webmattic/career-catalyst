import { getLeadStatusCounts, listAdminLeads } from '../../lib/db.js';
import { json, noStoreHeaders } from '../../lib/http.js';

export async function onRequestGet({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Lead database is not configured.' }, { status: 500, headers: noStoreHeaders });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get('limit') || '200');

  const [leads, statusCounts] = await Promise.all([
    listAdminLeads(env.DB, limit),
    getLeadStatusCounts(env.DB),
  ]);

  return json(
    {
      ok: true,
      leads,
      summary: {
        total: leads.length,
        statusCounts,
      },
    },
    { headers: noStoreHeaders }
  );
}

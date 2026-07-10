import { json, noStoreHeaders } from '../../lib/http.js';
import { getLeadById, markPaymentStarted } from '../../lib/db.js';

export async function onRequestPost({ request, env }) {
  try {
    if (!env.DB) {
      return json({ error: 'Lead database is not configured.' }, { status: 500, headers: noStoreHeaders });
    }

    const body = await request.json().catch(() => null);
    const leadId = Number(body?.leadId);

    if (!leadId) {
      return json({ error: 'Lead ID is required.' }, { status: 400, headers: noStoreHeaders });
    }

    const lead = await getLeadById(env.DB, leadId);
    if (!lead) {
      return json({ error: 'Lead not found.' }, { status: 404, headers: noStoreHeaders });
    }

    await markPaymentStarted(env.DB, { leadId });

    return json({ ok: true }, { headers: noStoreHeaders });
  } catch (error) {
    console.error('Payment start failed', error);
    return json(
      { error: 'Payment step could not be opened. Please try again or message us on WhatsApp.' },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

import { getLeadById, markPaymentPaid } from '../../../lib/db.js';
import { json, noStoreHeaders } from '../../../lib/http.js';
import { webinarConfig } from '../../../../src/data/webinar.js';

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

    if (lead.payment_status === 'paid') {
      return json({ ok: true, leadId, paymentStatus: 'paid' }, { headers: noStoreHeaders });
    }

    await markPaymentPaid(env.DB, {
      leadId,
      paymentId: `manual-${Date.now()}`,
      signature: null,
      paymentProvider: webinarConfig.paymentMode,
    });

    return json(
      {
        ok: true,
        leadId,
        paymentStatus: 'paid',
      },
      { headers: noStoreHeaders }
    );
  } catch (error) {
    console.error('Manual payment verification failed', error);
    return json(
      { error: 'Payment could not be marked as paid. Please try again.' },
      { status: 500, headers: noStoreHeaders }
    );
  }
}

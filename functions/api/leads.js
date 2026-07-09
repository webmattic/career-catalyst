import { insertLead, updateLeadOrder } from '../lib/db.js';
import { json, noStoreHeaders } from '../lib/http.js';
import { createRazorpayOrder, isRazorpayConfigured } from '../lib/razorpay.js';
import { createRazorpayReceipt, sanitizeLeadPayload } from '../lib/registration.js';
import { webinarConfig } from '../../src/data/webinar.js';

export async function onRequestGet() {
  return new Response(null, {
    status: 303,
    headers: {
      Location: '/#webinar-form',
    },
  });
}

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Lead database is not configured.' }, { status: 500, headers: noStoreHeaders });
  }

  const body = await request.json().catch(() => null);

  if (!body) {
    return json({ error: 'Invalid submission payload.' }, { status: 400, headers: noStoreHeaders });
  }

  const { lead, errors } = sanitizeLeadPayload(body);

  if (errors.length > 0) {
    return json({ error: errors[0], errors }, { status: 400, headers: noStoreHeaders });
  }

  const leadId = await insertLead(env.DB, lead);

  if (!isRazorpayConfigured(env)) {
    return json(
      {
        ok: true,
        mode: 'lead_capture',
        leadId,
        message:
          'Your details have been saved. We will share the payment link on WhatsApp once checkout is enabled for this session.',
      },
      { status: 202, headers: noStoreHeaders }
    );
  }

  const order = await createRazorpayOrder({
    env,
    leadId,
    receipt: createRazorpayReceipt(leadId),
    notes: {
      webinar_date: webinarConfig.dateLabel,
      webinar_time: webinarConfig.timeLabel,
    },
  });

  await updateLeadOrder(env.DB, {
    leadId,
    orderId: order.id,
  });

  return json(
    {
      ok: true,
      mode: 'payment',
      leadId,
      keyId: env.RAZORPAY_KEY_ID,
      orderId: order.id,
      amount: webinarConfig.amountInPaise,
      currency: webinarConfig.currency,
      prefill: {
        name: lead.parent_name,
        email: lead.email,
        contact: lead.whatsapp,
      },
      notes: {
        parent_name: lead.parent_name,
        child_class: lead.child_class,
      },
    },
    { headers: noStoreHeaders }
  );
}

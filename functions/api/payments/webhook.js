import { getLeadByOrderId, markPaymentFailed, markPaymentPaid } from '../../lib/db.js';
import { json, noStoreHeaders } from '../../lib/http.js';
import { isCapturedPaymentStatus, verifyWebhookSignature } from '../../lib/registration.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Lead database is not configured.' }, { status: 500, headers: noStoreHeaders });
  }

  if (!env.RAZORPAY_WEBHOOK_SECRET) {
    return json({ error: 'Razorpay webhook secret is not configured.' }, { status: 503, headers: noStoreHeaders });
  }

  const signature = request.headers.get('x-razorpay-signature');
  const rawBody = await request.text();

  if (!verifyWebhookSignature({ body: rawBody, signature, secret: env.RAZORPAY_WEBHOOK_SECRET })) {
    return json({ error: 'Invalid webhook signature.' }, { status: 401, headers: noStoreHeaders });
  }

  const payload = JSON.parse(rawBody);
  const entity = payload?.payload?.payment?.entity ?? payload?.payload?.order?.entity ?? null;
  const orderId = entity?.order_id ?? entity?.id ?? null;

  if (!orderId) {
    return json({ ok: true, ignored: true }, { headers: noStoreHeaders });
  }

  const lead = await getLeadByOrderId(env.DB, orderId);
  if (!lead) {
    return json({ ok: true, ignored: true }, { headers: noStoreHeaders });
  }

  if (payload.event === 'payment.failed') {
    await markPaymentFailed(env.DB, { leadId: lead.id, reason: entity?.error_description || 'payment_failed' });
    return json({ ok: true }, { headers: noStoreHeaders });
  }

  if (payload.event === 'payment.captured' || payload.event === 'order.paid' || isCapturedPaymentStatus(entity?.status)) {
    await markPaymentPaid(env.DB, {
      leadId: lead.id,
      paymentId: entity?.id ?? lead.provider_payment_id ?? null,
      signature: signature ?? null,
    });
  }

  return json({ ok: true }, { headers: noStoreHeaders });
}

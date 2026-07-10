import { getLeadById, markPaymentPaid } from '../../lib/db.js';
import { json, noStoreHeaders } from '../../lib/http.js';
import { verifyRazorpayPaymentSignature } from '../../lib/registration.js';
import { webinarConfig } from '../../../src/data/webinar.js';

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Lead database is not configured.' }, { status: 500, headers: noStoreHeaders });
  }

  const body = await request.json().catch(() => null);
  const leadId = Number(body?.leadId);
  const orderId = body?.razorpay_order_id;
  const paymentId = body?.razorpay_payment_id;
  const signature = body?.razorpay_signature;

  if (!leadId || !orderId || !paymentId || !signature) {
    return json({ error: 'Payment verification payload is incomplete.' }, { status: 400, headers: noStoreHeaders });
  }

  const lead = await getLeadById(env.DB, leadId);
  if (!lead) {
    return json({ error: 'Lead not found.' }, { status: 404, headers: noStoreHeaders });
  }

  if (lead.provider_order_id !== orderId) {
    return json({ error: 'Order mismatch.' }, { status: 400, headers: noStoreHeaders });
  }

  const isValidSignature = verifyRazorpayPaymentSignature({
    orderId,
    paymentId,
    signature,
    secret: env.RAZORPAY_KEY_SECRET,
  });

  if (!isValidSignature) {
    return json({ error: 'Payment signature verification failed.' }, { status: 400, headers: noStoreHeaders });
  }

  await markPaymentPaid(env.DB, { leadId, paymentId, signature });

  return json(
    {
      ok: true,
      paymentStatus: 'paid',
      message:
        'Your webinar seat is confirmed. We have received your ₹99 payment. Your webinar confirmation and joining details will be sent to your WhatsApp number.',
    },
    { headers: noStoreHeaders }
  );
}

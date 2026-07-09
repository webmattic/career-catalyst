import { webinarConfig } from '../../src/data/webinar.js';

const RAZORPAY_API_URL = 'https://api.razorpay.com/v1/orders';

const getRazorpayAuthHeader = (env) => {
  const keyId = env.RAZORPAY_KEY_ID;
  const keySecret = env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return null;
  }

  return `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
};

export const isRazorpayConfigured = (env) => Boolean(getRazorpayAuthHeader(env));

export const createRazorpayOrder = async ({ env, leadId, receipt, notes = {} }) => {
  const authHeader = getRazorpayAuthHeader(env);

  if (!authHeader) {
    return null;
  }

  const response = await fetch(RAZORPAY_API_URL, {
    method: 'POST',
    headers: {
      authorization: authHeader,
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      amount: webinarConfig.amountInPaise,
      currency: webinarConfig.currency,
      receipt,
      notes: {
        lead_id: String(leadId),
        ...notes,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Razorpay order creation failed: ${response.status} ${errorText}`);
  }

  return response.json();
};

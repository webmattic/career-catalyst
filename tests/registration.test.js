import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';

import {
  sanitizeLeadPayload,
  shouldMarkAbandoned,
  shouldSend1HourReminder,
  shouldSend24HourReminder,
  verifyRazorpayPaymentSignature,
  verifyWebhookSignature,
} from '../functions/lib/registration.js';

test('sanitizeLeadPayload normalizes valid lead payload', () => {
  const { errors, lead } = sanitizeLeadPayload({
    parent_name: '  Asha Shah  ',
    email: '  Parent@Example.com ',
    whatsapp: '+91 98765 43210',
    class: 'Class 9',
    preferred_batch: ' Sunday, 19 July 2026 • 4:00 PM IST ',
    child_board: ' CBSE ',
    area_locality: ' Andheri West ',
    biggest_concern: 'Need aptitude-based guidance',
  });

  assert.deepEqual(errors, []);
  assert.equal(lead.parent_name, 'Asha Shah');
  assert.equal(lead.email, 'parent@example.com');
  assert.equal(lead.whatsapp, '9876543210');
  assert.equal(lead.child_class, 'Class 9');
  assert.equal(lead.preferred_batch, 'Sunday, 19 July 2026 • 4:00 PM IST');
  assert.equal(lead.child_board, 'CBSE');
  assert.equal(lead.area_locality, 'Andheri West');
});

test('sanitizeLeadPayload rejects invalid class, whatsapp, batch, and board', () => {
  const { errors } = sanitizeLeadPayload({
    parent_name: 'Parent',
    email: 'parent@example.com',
    whatsapp: '12345',
    class: 'Class 11',
    preferred_batch: 'Later',
    child_board: 'State Board',
  });

  assert.ok(errors.some((error) => error.includes('10-digit WhatsApp')));
  assert.ok(errors.some((error) => error.includes('Class 8')));
  assert.ok(errors.some((error) => error.includes('available webinar batch')));
  assert.ok(errors.some((error) => error.includes('valid board option')));
});

test('sanitizeLeadPayload accepts optional email and locality', () => {
  const { errors, lead } = sanitizeLeadPayload({
    parent_name: 'Parent',
    email: '',
    whatsapp: '9876543210',
    class: 'Class 8',
    preferred_batch: 'Sunday, 19 July 2026 • 4:00 PM IST',
    child_board: '',
    area_locality: '',
  });

  assert.deepEqual(errors, []);
  assert.equal(lead.email, '');
  assert.equal(lead.area_locality, '');
});

test('verifyRazorpayPaymentSignature matches Razorpay HMAC format', () => {
  const secret = 'secret_123';
  const orderId = 'order_123';
  const paymentId = 'pay_123';
  const signature = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest('hex');

  assert.equal(
    verifyRazorpayPaymentSignature({
      orderId,
      paymentId,
      signature,
      secret,
    }),
    true
  );
});

test('verifyWebhookSignature validates raw-body hmac', () => {
  const body = JSON.stringify({ event: 'payment.captured' });
  const secret = 'hook_123';
  const signature = createHmac('sha256', secret).update(body).digest('hex');

  assert.equal(verifyWebhookSignature({ body, signature, secret }), true);
  assert.equal(verifyWebhookSignature({ body, signature: 'deadbeef', secret }), false);
});

test('reminder windows trigger in the expected ranges', () => {
  const session = '2026-07-19T16:00:00+05:30';
  const reminder24 = new Date('2026-07-18T16:05:00+05:30').getTime();
  const reminder1 = new Date('2026-07-19T15:05:00+05:30').getTime();

  assert.equal(shouldSend24HourReminder(reminder24, session), true);
  assert.equal(shouldSend1HourReminder(reminder1, session), true);
});

test('shouldMarkAbandoned flips after fifteen minutes', () => {
  const startedAt = '2026-07-09T12:00:00.000Z';
  const beforeWindow = new Date('2026-07-09T12:10:00.000Z').getTime();
  const afterWindow = new Date('2026-07-09T12:16:00.000Z').getTime();

  assert.equal(shouldMarkAbandoned(startedAt, beforeWindow), false);
  assert.equal(shouldMarkAbandoned(startedAt, afterWindow), true);
});

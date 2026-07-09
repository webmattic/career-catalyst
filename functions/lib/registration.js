import { createHmac, timingSafeEqual } from 'node:crypto';

import { biggestConcernOptions, webinarConfig } from '../../src/data/webinar.js';

const VALID_CLASSES = new Set(['Class 8', 'Class 9', 'Class 10']);
const VALID_CONCERNS = new Set(biggestConcernOptions);
const PAYMENT_SUCCESS_STATUSES = new Set(['paid', 'captured']);

const normalizeText = (value) => (typeof value === 'string' ? value.trim() : '');

export const normalizeEmail = (value) => normalizeText(value).toLowerCase();

export const normalizeWhatsapp = (value) => {
  const digits = normalizeText(value).replace(/\D/g, '');
  return digits.length === 12 && digits.startsWith('91') ? digits.slice(2) : digits;
};

export const isValidIndianMobile = (value) => /^[6-9]\d{9}$/.test(value);

export const sanitizeLeadPayload = (rawLead = {}) => {
  const lead = {
    parent_name: normalizeText(rawLead.parent_name),
    email: normalizeEmail(rawLead.email),
    whatsapp: normalizeWhatsapp(rawLead.whatsapp),
    child_class: normalizeText(rawLead.child_class ?? rawLead.class),
    area_locality: normalizeText(rawLead.area_locality),
    biggest_concern: normalizeText(rawLead.biggest_concern),
    source: normalizeText(rawLead.source) || webinarConfig.registrationSource,
    child_name: '',
  };

  const errors = [];

  if (!lead.parent_name) {
    errors.push('Parent name is required.');
  }

  if (!lead.email || !lead.email.includes('@')) {
    errors.push('A valid email address is required.');
  }

  if (!isValidIndianMobile(lead.whatsapp)) {
    errors.push('A valid 10-digit WhatsApp number is required.');
  }

  if (!VALID_CLASSES.has(lead.child_class)) {
    errors.push('Please choose Class 8, Class 9 or Class 10.');
  }

  if (!lead.area_locality) {
    errors.push('Area or locality in Mumbai is required.');
  }

  if (lead.biggest_concern && !VALID_CONCERNS.has(lead.biggest_concern)) {
    errors.push('Please choose a valid concern option.');
  }

  return {
    errors,
    lead,
  };
};

export const createRazorpayReceipt = (leadId) => `webinar-${leadId}-${Date.now()}`;

export const verifyRazorpayPaymentSignature = ({ orderId, paymentId, signature, secret }) => {
  if (!orderId || !paymentId || !signature || !secret) {
    return false;
  }

  const digest = createHmac('sha256', secret).update(`${orderId}|${paymentId}`).digest();
  const provided = Buffer.from(signature, 'hex');

  if (digest.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(digest, provided);
};

export const verifyWebhookSignature = ({ body, signature, secret }) => {
  if (!body || !signature || !secret) {
    return false;
  }

  const digest = createHmac('sha256', secret).update(body).digest();
  const provided = Buffer.from(signature, 'hex');

  if (digest.length !== provided.length) {
    return false;
  }

  return timingSafeEqual(digest, provided);
};

export const createReminderWindows = (sessionStartIso = webinarConfig.sessionStartIso) => {
  const sessionTime = new Date(sessionStartIso).getTime();

  return {
    sessionTime,
    reminder24Start: sessionTime - 24 * 60 * 60 * 1000,
    reminder24End: sessionTime - (24 * 60 - webinarConfig.reminder24WindowMinutes) * 60 * 1000,
    reminder1Start: sessionTime - 60 * 60 * 1000,
    reminder1End: sessionTime - (60 - webinarConfig.reminder1WindowMinutes) * 60 * 1000,
  };
};

export const isWithinWindow = (now, start, end) => now >= start && now < end;

export const shouldSend24HourReminder = (now, sessionStartIso = webinarConfig.sessionStartIso) => {
  const { reminder24Start, reminder24End } = createReminderWindows(sessionStartIso);
  return isWithinWindow(now, reminder24Start, reminder24End);
};

export const shouldSend1HourReminder = (now, sessionStartIso = webinarConfig.sessionStartIso) => {
  const { reminder1Start, reminder1End } = createReminderWindows(sessionStartIso);
  return isWithinWindow(now, reminder1Start, reminder1End);
};

export const shouldMarkAbandoned = (paymentStartedAt, now = Date.now()) => {
  if (!paymentStartedAt) {
    return false;
  }

  const startedAt = new Date(paymentStartedAt).getTime();
  return Number.isFinite(startedAt) && now - startedAt >= 15 * 60 * 1000;
};

export const isCapturedPaymentStatus = (value) =>
  PAYMENT_SUCCESS_STATUSES.has(normalizeText(value).toLowerCase());

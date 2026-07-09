import { webinarConfig } from '../../src/data/webinar.js';

const DEFAULT_TEMPLATE_ENDPOINT = 'https://api.interakt.ai/v1/public/message/';

const templateConfig = {
  payment_success: {
    envKey: 'INTERAKT_TEMPLATE_PAYMENT_SUCCESS',
    fallbackName: 'webinar_payment_success',
    bodyValues: (lead, env) => [
      lead.parent_name,
      webinarConfig.dateLabel,
      webinarConfig.timeLabel,
      env.WEBINAR_LINK || 'Link will be shared shortly on WhatsApp.',
    ],
  },
  payment_abandon: {
    envKey: 'INTERAKT_TEMPLATE_PAYMENT_ABANDON',
    fallbackName: 'webinar_payment_abandon',
    bodyValues: (lead, env) => [
      lead.parent_name,
      env.PUBLIC_SITE_URL ? `${env.PUBLIC_SITE_URL}/#webinar-form` : 'https://pragnyaconsultancy.com/#webinar-form',
    ],
  },
  reminder_24h: {
    envKey: 'INTERAKT_TEMPLATE_REMINDER_24H',
    fallbackName: 'webinar_reminder_24h',
    bodyValues: (lead, env) => [
      webinarConfig.timeLabel,
      env.WEBINAR_LINK || 'Link will be shared shortly on WhatsApp.',
    ],
  },
  reminder_1h: {
    envKey: 'INTERAKT_TEMPLATE_REMINDER_1H',
    fallbackName: 'webinar_reminder_1h',
    bodyValues: (lead, env) => [env.WEBINAR_LINK || 'Link will be shared shortly on WhatsApp.'],
  },
};

export const isInteraktConfigured = (env) => Boolean(env.INTERAKT_API_KEY);

export const sendInteraktTemplate = async ({ env, lead, templateType }) => {
  if (!isInteraktConfigured(env)) {
    return { skipped: true, reason: 'interakt-not-configured' };
  }

  const config = templateConfig[templateType];
  if (!config) {
    throw new Error(`Unsupported Interakt template type: ${templateType}`);
  }

  const endpoint = env.INTERAKT_TEMPLATE_ENDPOINT || DEFAULT_TEMPLATE_ENDPOINT;
  const templateName = env[config.envKey] || config.fallbackName;
  const payload = {
    countryCode: env.INTERAKT_COUNTRY_CODE || '+91',
    phoneNumber: lead.whatsapp,
    type: 'Template',
    callbackData: `${templateType}:${lead.id}`,
    template: {
      name: templateName,
      languageCode: env.INTERAKT_LANGUAGE_CODE || 'en',
      bodyValues: config.bodyValues(lead, env),
    },
  };

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      authorization: `Basic ${env.INTERAKT_API_KEY}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Interakt template send failed: ${response.status} ${errorText}`);
  }

  return response.json().catch(() => ({ success: true }));
};

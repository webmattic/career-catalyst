import {
  listLeadsPendingAbandonRecovery,
  listLeadsPendingConfirmation,
  listLeadsPendingReminder,
  markLeadAbandoned,
  markNotificationSent,
} from '../../lib/db.js';
import { json, noStoreHeaders } from '../../lib/http.js';
import { sendInteraktTemplate } from '../../lib/interakt.js';
import {
  shouldMarkAbandoned,
  shouldSend1HourReminder,
  shouldSend24HourReminder,
} from '../../lib/registration.js';

const authorize = (request, env) => {
  const secret = request.headers.get('x-cron-secret');
  return Boolean(env.PAGES_CRON_SECRET && secret && secret === env.PAGES_CRON_SECRET);
};

const trySendTemplate = async ({ env, lead, templateType, fieldName }) => {
  const result = await sendInteraktTemplate({ env, lead, templateType });
  if (!result?.skipped) {
    await markNotificationSent(env.DB, { leadId: lead.id, fieldName });
    return 1;
  }
  return 0;
};

export async function onRequestPost({ request, env }) {
  if (!env.DB) {
    return json({ error: 'Lead database is not configured.' }, { status: 500, headers: noStoreHeaders });
  }

  if (!authorize(request, env)) {
    return json({ error: 'Unauthorized.' }, { status: 401, headers: noStoreHeaders });
  }

  const now = Date.now();
  let confirmationsSent = 0;
  let abandonmentsSent = 0;
  let reminders24Sent = 0;
  let reminders1Sent = 0;

  const leadsPendingConfirmation = await listLeadsPendingConfirmation(env.DB);
  for (const lead of leadsPendingConfirmation) {
    confirmationsSent += await trySendTemplate({
      env,
      lead,
      templateType: 'payment_success',
      fieldName: 'whatsapp_confirmation_sent_at',
    });
  }

  const leadsPendingAbandonment = await listLeadsPendingAbandonRecovery(env.DB);
  for (const lead of leadsPendingAbandonment) {
    if (!shouldMarkAbandoned(lead.payment_started_at, now)) {
      continue;
    }

    abandonmentsSent += await trySendTemplate({
      env,
      lead,
      templateType: 'payment_abandon',
      fieldName: 'abandonment_message_sent_at',
    });

    await markLeadAbandoned(env.DB, { leadId: lead.id });
  }

  if (shouldSend24HourReminder(now)) {
    const pending24HourReminders = await listLeadsPendingReminder(env.DB, 'reminder_24h_sent_at');
    for (const lead of pending24HourReminders) {
      reminders24Sent += await trySendTemplate({
        env,
        lead,
        templateType: 'reminder_24h',
        fieldName: 'reminder_24h_sent_at',
      });
    }
  }

  if (shouldSend1HourReminder(now)) {
    const pending1HourReminders = await listLeadsPendingReminder(env.DB, 'reminder_1h_sent_at');
    for (const lead of pending1HourReminders) {
      reminders1Sent += await trySendTemplate({
        env,
        lead,
        templateType: 'reminder_1h',
        fieldName: 'reminder_1h_sent_at',
      });
    }
  }

  return json(
    {
      ok: true,
      confirmationsSent,
      abandonmentsSent,
      reminders24Sent,
      reminders1Sent,
    },
    { headers: noStoreHeaders }
  );
}

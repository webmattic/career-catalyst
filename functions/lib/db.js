const rowToLead = (row) => (row ? { ...row } : null);

export const insertLead = async (db, lead) => {
  const result = await db
    .prepare(
      `INSERT INTO webinar_leads (
        parent_name,
        email,
        whatsapp,
        child_name,
        child_class,
        area_locality,
        biggest_concern,
        payment_status,
        payment_provider,
        source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      lead.parent_name,
      lead.email,
      lead.whatsapp,
      lead.child_name ?? '',
      lead.child_class,
      lead.area_locality,
      lead.biggest_concern || null,
      'initiated',
      'razorpay',
      lead.source
    )
    .run();

  return result.meta.last_row_id;
};

export const updateLeadOrder = async (db, { leadId, orderId, paymentProvider = 'razorpay' }) =>
  db
    .prepare(
      `UPDATE webinar_leads
       SET provider_order_id = ?,
           payment_provider = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(orderId, paymentProvider, leadId)
    .run();

export const markPaymentStarted = async (db, { leadId }) =>
  db
    .prepare(
      `UPDATE webinar_leads
       SET payment_status = 'payment_started',
           payment_started_at = COALESCE(payment_started_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(leadId)
    .run();

export const markPaymentPaid = async (db, { leadId, paymentId, signature }) =>
  db
    .prepare(
      `UPDATE webinar_leads
       SET payment_status = 'paid',
           provider_payment_id = ?,
           razorpay_signature = ?,
           payment_completed_at = COALESCE(payment_completed_at, CURRENT_TIMESTAMP),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(paymentId, signature || null, leadId)
    .run();

export const markPaymentFailed = async (db, { leadId, reason }) =>
  db
    .prepare(
      `UPDATE webinar_leads
       SET payment_status = 'payment_failed',
           last_payment_error = ?,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    )
    .bind(reason || 'payment_failed', leadId)
    .run();

export const markLeadAbandoned = async (db, { leadId }) =>
  db
    .prepare(
      `UPDATE webinar_leads
       SET payment_status = 'abandoned',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?
         AND payment_status = 'payment_started'
         AND payment_completed_at IS NULL`
    )
    .bind(leadId)
    .run();

export const markNotificationSent = async (db, { leadId, fieldName }) =>
  db
    .prepare(`UPDATE webinar_leads SET ${fieldName} = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = ?`)
    .bind(leadId)
    .run();

export const getLeadById = async (db, leadId) => {
  const result = await db
    .prepare(`SELECT * FROM webinar_leads WHERE id = ? LIMIT 1`)
    .bind(leadId)
    .first();
  return rowToLead(result);
};

export const getLeadByOrderId = async (db, orderId) => {
  const result = await db
    .prepare(`SELECT * FROM webinar_leads WHERE provider_order_id = ? LIMIT 1`)
    .bind(orderId)
    .first();
  return rowToLead(result);
};

export const listLeadsPendingConfirmation = async (db) => {
  const result = await db
    .prepare(
      `SELECT * FROM webinar_leads
       WHERE payment_status = 'paid'
         AND whatsapp_confirmation_sent_at IS NULL`
    )
    .all();
  return result.results ?? [];
};

export const listLeadsPendingAbandonRecovery = async (db) => {
  const result = await db
    .prepare(
      `SELECT * FROM webinar_leads
       WHERE payment_status = 'payment_started'
         AND payment_completed_at IS NULL
         AND payment_started_at IS NOT NULL
         AND abandonment_message_sent_at IS NULL`
    )
    .all();
  return result.results ?? [];
};

export const listLeadsPendingReminder = async (db, fieldName) => {
  const result = await db
    .prepare(
      `SELECT * FROM webinar_leads
       WHERE payment_status = 'paid'
         AND ${fieldName} IS NULL`
    )
    .all();
  return result.results ?? [];
};

export const listAdminLeads = async (db, limit = 200) => {
  const cappedLimit = Math.max(1, Math.min(Number(limit) || 200, 500));
  const result = await db
    .prepare(
      `SELECT
         id,
         parent_name,
         email,
         whatsapp,
         child_class,
         area_locality,
         biggest_concern,
         payment_status,
         payment_provider,
         provider_order_id,
         provider_payment_id,
         created_at,
         payment_started_at,
         payment_completed_at,
         updated_at
       FROM webinar_leads
       ORDER BY id DESC
       LIMIT ?`
    )
    .bind(cappedLimit)
    .all();

  return result.results ?? [];
};

export const getLeadStatusCounts = async (db) => {
  const result = await db
    .prepare(
      `SELECT payment_status, COUNT(*) AS count
       FROM webinar_leads
       GROUP BY payment_status`
    )
    .all();

  return result.results ?? [];
};

ALTER TABLE webinar_leads ADD COLUMN area_locality TEXT;
ALTER TABLE webinar_leads ADD COLUMN biggest_concern TEXT;
ALTER TABLE webinar_leads ADD COLUMN payment_status TEXT NOT NULL DEFAULT 'initiated';
ALTER TABLE webinar_leads ADD COLUMN payment_provider TEXT;
ALTER TABLE webinar_leads ADD COLUMN provider_order_id TEXT;
ALTER TABLE webinar_leads ADD COLUMN provider_payment_id TEXT;
ALTER TABLE webinar_leads ADD COLUMN razorpay_signature TEXT;
ALTER TABLE webinar_leads ADD COLUMN payment_started_at TEXT;
ALTER TABLE webinar_leads ADD COLUMN payment_completed_at TEXT;
ALTER TABLE webinar_leads ADD COLUMN whatsapp_confirmation_sent_at TEXT;
ALTER TABLE webinar_leads ADD COLUMN abandonment_message_sent_at TEXT;
ALTER TABLE webinar_leads ADD COLUMN reminder_24h_sent_at TEXT;
ALTER TABLE webinar_leads ADD COLUMN reminder_1h_sent_at TEXT;
ALTER TABLE webinar_leads ADD COLUMN last_payment_error TEXT;
ALTER TABLE webinar_leads ADD COLUMN updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP;

UPDATE webinar_leads
SET area_locality = COALESCE(area_locality, ''),
    payment_status = COALESCE(payment_status, 'initiated'),
    payment_provider = COALESCE(payment_provider, 'razorpay'),
    updated_at = COALESCE(updated_at, CURRENT_TIMESTAMP)
WHERE area_locality IS NULL
   OR payment_status IS NULL
   OR payment_provider IS NULL
   OR updated_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_webinar_leads_payment_status ON webinar_leads (payment_status);
CREATE INDEX IF NOT EXISTS idx_webinar_leads_order_id ON webinar_leads (provider_order_id);
CREATE INDEX IF NOT EXISTS idx_webinar_leads_started_at ON webinar_leads (payment_started_at);
CREATE INDEX IF NOT EXISTS idx_webinar_leads_completed_at ON webinar_leads (payment_completed_at);

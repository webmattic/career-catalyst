CREATE TABLE IF NOT EXISTS webinar_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_name TEXT NOT NULL,
  email TEXT NOT NULL,
  whatsapp TEXT NOT NULL,
  child_name TEXT NOT NULL DEFAULT '',
  child_class TEXT NOT NULL,
  area_locality TEXT NOT NULL,
  biggest_concern TEXT,
  payment_status TEXT NOT NULL DEFAULT 'initiated',
  payment_provider TEXT DEFAULT 'razorpay',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  razorpay_signature TEXT,
  payment_started_at TEXT,
  payment_completed_at TEXT,
  whatsapp_confirmation_sent_at TEXT,
  abandonment_message_sent_at TEXT,
  reminder_24h_sent_at TEXT,
  reminder_1h_sent_at TEXT,
  last_payment_error TEXT,
  source TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_webinar_leads_created_at ON webinar_leads (created_at);
CREATE INDEX IF NOT EXISTS idx_webinar_leads_email ON webinar_leads (email);
CREATE INDEX IF NOT EXISTS idx_webinar_leads_payment_status ON webinar_leads (payment_status);
CREATE INDEX IF NOT EXISTS idx_webinar_leads_order_id ON webinar_leads (provider_order_id);
CREATE INDEX IF NOT EXISTS idx_webinar_leads_started_at ON webinar_leads (payment_started_at);
CREATE INDEX IF NOT EXISTS idx_webinar_leads_completed_at ON webinar_leads (payment_completed_at);

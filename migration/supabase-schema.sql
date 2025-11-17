-- =============================================================================
-- TicTacStick Cloud Migration - Supabase PostgreSQL Schema
-- =============================================================================
-- Version: 1.0
-- Created: 2025-11-17
-- Purpose: Database schema for cloud-based storage with offline-first sync
-- Target: Supabase PostgreSQL / PostgreSQL 14+
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- USERS TABLE (Supabase Auth integration)
-- =============================================================================
-- Note: Supabase provides auth.users table by default
-- We'll reference that for user_id foreign keys

-- =============================================================================
-- QUOTES TABLE
-- =============================================================================

CREATE TABLE quotes (
  -- Primary key
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User reference (Supabase auth)
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- User-facing ID (preserved from LocalStorage)
  quote_number VARCHAR(50),

  -- Client information
  client_id UUID REFERENCES clients(uuid) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,
  client_location TEXT,

  -- Quote details
  quote_title VARCHAR(255),
  job_type VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'draft',

  -- Financial data
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  gst DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Full quote data (JSONB for flexibility)
  -- Stores line items, notes, and other dynamic fields
  data JSONB NOT NULL DEFAULT '{}',

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Sync metadata
  version INTEGER NOT NULL DEFAULT 1,
  device_id VARCHAR(100),
  last_synced_at TIMESTAMPTZ,

  -- Indexes for common queries
  CONSTRAINT quotes_total_check CHECK (total >= 0),
  CONSTRAINT quotes_status_check CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'scheduled', 'completed'))
);

-- Indexes
CREATE INDEX idx_quotes_user_id ON quotes(user_id);
CREATE INDEX idx_quotes_client_id ON quotes(client_id);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX idx_quotes_updated_at ON quotes(updated_at DESC);
CREATE INDEX idx_quotes_deleted_at ON quotes(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);

-- Full-text search on client name and title
CREATE INDEX idx_quotes_search ON quotes USING gin(to_tsvector('english',
  coalesce(client_name, '') || ' ' || coalesce(quote_title, '')));

-- =============================================================================
-- CLIENTS TABLE
-- =============================================================================

CREATE TABLE clients (
  -- Primary key
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Client details
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  location VARCHAR(255),
  notes TEXT,

  -- Full client data (JSONB for flexibility)
  data JSONB NOT NULL DEFAULT '{}',

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Sync metadata
  version INTEGER NOT NULL DEFAULT 1,
  device_id VARCHAR(100),
  last_synced_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT clients_name_check CHECK (length(trim(name)) > 0)
);

-- Indexes
CREATE INDEX idx_clients_user_id ON clients(user_id);
CREATE INDEX idx_clients_name ON clients(name);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_created_at ON clients(created_at DESC);
CREATE INDEX idx_clients_deleted_at ON clients(deleted_at) WHERE deleted_at IS NULL;

-- Full-text search
CREATE INDEX idx_clients_search ON clients USING gin(to_tsvector('english',
  coalesce(name, '') || ' ' || coalesce(email, '') || ' ' || coalesce(location, '')));

-- =============================================================================
-- INVOICES TABLE
-- =============================================================================

CREATE TABLE invoices (
  -- Primary key
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- User-facing ID (preserved from LocalStorage)
  invoice_number VARCHAR(50) NOT NULL,

  -- References
  quote_id UUID REFERENCES quotes(uuid) ON DELETE SET NULL,
  client_id UUID REFERENCES clients(uuid) ON DELETE SET NULL,
  client_name VARCHAR(255) NOT NULL,

  -- Invoice details
  quote_title VARCHAR(255),
  status VARCHAR(20) NOT NULL DEFAULT 'draft',

  -- Financial data
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  gst DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(10,2) NOT NULL DEFAULT 0,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Dates
  invoice_date TIMESTAMPTZ NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,

  -- Full invoice data (JSONB)
  data JSONB NOT NULL DEFAULT '{}',

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Sync metadata
  version INTEGER NOT NULL DEFAULT 1,
  device_id VARCHAR(100),
  last_synced_at TIMESTAMPTZ,

  -- Constraints
  CONSTRAINT invoices_invoice_number_unique UNIQUE (user_id, invoice_number),
  CONSTRAINT invoices_total_check CHECK (total >= 0),
  CONSTRAINT invoices_balance_check CHECK (balance >= 0),
  CONSTRAINT invoices_status_check CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled'))
);

-- Indexes
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
CREATE INDEX idx_invoices_quote_id ON invoices(quote_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_created_at ON invoices(created_at DESC);
CREATE INDEX idx_invoices_deleted_at ON invoices(deleted_at) WHERE deleted_at IS NULL;
CREATE INDEX idx_invoices_balance ON invoices(balance) WHERE balance > 0;

-- =============================================================================
-- INVOICE PAYMENTS TABLE
-- =============================================================================

CREATE TABLE invoice_payments (
  -- Primary key
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Invoice reference
  invoice_id UUID NOT NULL REFERENCES invoices(uuid) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Payment details
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL,
  payment_date TIMESTAMPTZ NOT NULL,
  reference VARCHAR(255),
  notes TEXT,

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Constraints
  CONSTRAINT payments_amount_check CHECK (amount > 0)
);

-- Indexes
CREATE INDEX idx_payments_invoice_id ON invoice_payments(invoice_id);
CREATE INDEX idx_payments_user_id ON invoice_payments(user_id);
CREATE INDEX idx_payments_payment_date ON invoice_payments(payment_date DESC);

-- =============================================================================
-- SETTINGS TABLE
-- =============================================================================

CREATE TABLE user_settings (
  -- Primary key
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Settings type
  setting_type VARCHAR(50) NOT NULL,

  -- Settings data (JSONB for flexibility)
  data JSONB NOT NULL DEFAULT '{}',

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Sync metadata
  version INTEGER NOT NULL DEFAULT 1,

  -- One setting type per user
  CONSTRAINT user_settings_unique UNIQUE (user_id, setting_type)
);

CREATE INDEX idx_settings_user_id ON user_settings(user_id);
CREATE INDEX idx_settings_type ON user_settings(setting_type);

-- =============================================================================
-- TEMPLATES TABLE
-- =============================================================================

CREATE TABLE templates (
  -- Primary key
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Template details
  name VARCHAR(255) NOT NULL,
  template_type VARCHAR(50) NOT NULL, -- 'quote', 'invoice', etc.

  -- Template data (JSONB)
  data JSONB NOT NULL DEFAULT '{}',

  -- Audit timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,

  -- Sync metadata
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_templates_user_id ON templates(user_id);
CREATE INDEX idx_templates_type ON templates(template_type);
CREATE INDEX idx_templates_deleted_at ON templates(deleted_at) WHERE deleted_at IS NULL;

-- =============================================================================
-- SYNC QUEUE TABLE (for debugging and monitoring)
-- =============================================================================

CREATE TABLE sync_queue (
  -- Primary key
  id SERIAL PRIMARY KEY,

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Sync details
  entity_type VARCHAR(50) NOT NULL,
  entity_uuid UUID NOT NULL,
  operation VARCHAR(20) NOT NULL, -- create, update, delete

  -- Data
  data JSONB,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, processing, success, failed
  attempts INTEGER NOT NULL DEFAULT 0,
  last_attempt TIMESTAMPTZ,
  error_message TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  processed_at TIMESTAMPTZ,

  CONSTRAINT sync_queue_operation_check CHECK (operation IN ('create', 'update', 'delete')),
  CONSTRAINT sync_queue_status_check CHECK (status IN ('pending', 'processing', 'success', 'failed'))
);

CREATE INDEX idx_sync_queue_user_id ON sync_queue(user_id);
CREATE INDEX idx_sync_queue_status ON sync_queue(status);
CREATE INDEX idx_sync_queue_created_at ON sync_queue(created_at);

-- =============================================================================
-- AUDIT LOG TABLE
-- =============================================================================

CREATE TABLE audit_log (
  -- Primary key
  id BIGSERIAL PRIMARY KEY,

  -- User reference
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Audit details
  entity_type VARCHAR(50) NOT NULL,
  entity_uuid UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- create, update, delete

  -- Change data
  old_data JSONB,
  new_data JSONB,
  changes JSONB, -- Diff of changes

  -- Context
  device_id VARCHAR(100),
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_entity ON audit_log(entity_type, entity_uuid);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at DESC);

-- =============================================================================
-- UPDATED_AT TRIGGER FUNCTION
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON invoice_payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoice_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Quotes policies
CREATE POLICY "Users can view their own quotes"
  ON quotes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own quotes"
  ON quotes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own quotes"
  ON quotes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own quotes"
  ON quotes FOR DELETE
  USING (auth.uid() = user_id);

-- Clients policies
CREATE POLICY "Users can view their own clients"
  ON clients FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
  ON clients FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
  ON clients FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
  ON clients FOR DELETE
  USING (auth.uid() = user_id);

-- Invoices policies
CREATE POLICY "Users can view their own invoices"
  ON invoices FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
  ON invoices FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
  ON invoices FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
  ON invoices FOR DELETE
  USING (auth.uid() = user_id);

-- Payments policies
CREATE POLICY "Users can view their own payments"
  ON invoice_payments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON invoice_payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
  ON invoice_payments FOR UPDATE
  USING (auth.uid() = user_id);

-- Settings policies
CREATE POLICY "Users can view their own settings"
  ON user_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own settings"
  ON user_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settings"
  ON user_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Templates policies
CREATE POLICY "Users can view their own templates"
  ON templates FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own templates"
  ON templates FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own templates"
  ON templates FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own templates"
  ON templates FOR DELETE
  USING (auth.uid() = user_id);

-- Sync queue policies
CREATE POLICY "Users can view their own sync queue"
  ON sync_queue FOR SELECT
  USING (auth.uid() = user_id);

-- Audit log policies (read-only)
CREATE POLICY "Users can view their own audit log"
  ON audit_log FOR SELECT
  USING (auth.uid() = user_id);

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to calculate invoice balance
CREATE OR REPLACE FUNCTION calculate_invoice_balance(invoice_uuid UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_paid DECIMAL;
  invoice_total DECIMAL;
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM invoice_payments
  WHERE invoice_id = invoice_uuid;

  SELECT total INTO invoice_total
  FROM invoices
  WHERE uuid = invoice_uuid;

  RETURN invoice_total - total_paid;
END;
$$ LANGUAGE plpgsql;

-- Function to mark overdue invoices
CREATE OR REPLACE FUNCTION mark_overdue_invoices()
RETURNS INTEGER AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  UPDATE invoices
  SET status = 'overdue'
  WHERE status = 'sent'
    AND due_date < NOW()
    AND balance > 0
    AND deleted_at IS NULL;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- VIEWS FOR COMMON QUERIES
-- =============================================================================

-- Active quotes view (non-deleted)
CREATE VIEW active_quotes AS
SELECT *
FROM quotes
WHERE deleted_at IS NULL
ORDER BY created_at DESC;

-- Outstanding invoices view
CREATE VIEW outstanding_invoices AS
SELECT *
FROM invoices
WHERE balance > 0
  AND status IN ('sent', 'overdue')
  AND deleted_at IS NULL
ORDER BY due_date ASC;

-- Recent activity view (last 30 days)
CREATE VIEW recent_activity AS
SELECT
  'quote' AS entity_type,
  uuid,
  user_id,
  quote_title AS title,
  client_name,
  total,
  status,
  created_at,
  updated_at
FROM quotes
WHERE created_at > NOW() - INTERVAL '30 days'
  AND deleted_at IS NULL
UNION ALL
SELECT
  'invoice' AS entity_type,
  uuid,
  user_id,
  quote_title AS title,
  client_name,
  total,
  status,
  created_at,
  updated_at
FROM invoices
WHERE created_at > NOW() - INTERVAL '30 days'
  AND deleted_at IS NULL
ORDER BY created_at DESC;

-- =============================================================================
-- INITIAL DATA / SEED DATA
-- =============================================================================

-- Add default invoice settings for new users (handled by application code)

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant permissions to authenticated users
-- (Supabase handles this via RLS policies)

-- =============================================================================
-- MIGRATION NOTES
-- =============================================================================

-- To apply this schema to Supabase:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Create a new query
-- 3. Paste this entire file
-- 4. Click "Run"
--
-- To rollback:
-- DROP TABLE IF EXISTS audit_log CASCADE;
-- DROP TABLE IF EXISTS sync_queue CASCADE;
-- DROP TABLE IF EXISTS templates CASCADE;
-- DROP TABLE IF EXISTS user_settings CASCADE;
-- DROP TABLE IF EXISTS invoice_payments CASCADE;
-- DROP TABLE IF EXISTS invoices CASCADE;
-- DROP TABLE IF EXISTS clients CASCADE;
-- DROP TABLE IF EXISTS quotes CASCADE;
--
-- Note: This will delete all data! Only use for development/testing.

-- =============================================================================
-- END OF SCHEMA
-- =============================================================================

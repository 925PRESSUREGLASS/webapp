# TicTacStick Database Schema
## PostgreSQL Database Design for Phase 3

**Version:** 1.0.0
**Date:** 2025-11-17
**Database:** PostgreSQL 14+

---

## Table of Contents

1. [Schema Overview](#schema-overview)
2. [Core Tables](#core-tables)
3. [Relationships](#relationships)
4. [Indexes](#indexes)
5. [Constraints](#constraints)
6. [Triggers & Functions](#triggers--functions)
7. [Migration Strategy](#migration-strategy)

---

## Schema Overview

### Database Structure

```
tictacstick_production
├── public schema
│   ├── organizations
│   ├── users
│   ├── user_sessions
│   ├── refresh_tokens
│   ├── clients
│   ├── client_addresses
│   ├── quotes
│   ├── quote_line_items
│   ├── invoices
│   ├── invoice_line_items
│   ├── payments
│   ├── photos
│   ├── documents
│   ├── audit_logs
│   ├── sync_history
│   ├── devices
│   ├── integrations
│   └── webhook_logs
└── Extensions
    ├── uuid-ossp (UUID generation)
    ├── pg_trgm (fuzzy text search)
    └── pg_stat_statements (performance monitoring)
```

---

## Core Tables

### organizations

```sql
CREATE TABLE organizations (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  abn VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255),
  address TEXT,
  logo_url TEXT,

  -- Subscription
  subscription_plan VARCHAR(50) NOT NULL DEFAULT 'free',
    -- free, basic, pro, enterprise
  subscription_status VARCHAR(50) NOT NULL DEFAULT 'trial',
    -- trial, active, suspended, cancelled
  subscription_started_at TIMESTAMP WITH TIME ZONE,
  subscription_expires_at TIMESTAMP WITH TIME ZONE,

  -- Settings
  settings JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Indexes
  CHECK (subscription_plan IN ('free', 'basic', 'pro', 'enterprise')),
  CHECK (subscription_status IN ('trial', 'active', 'suspended', 'cancelled'))
);

CREATE INDEX idx_organizations_deleted_at ON organizations(deleted_at);
CREATE INDEX idx_organizations_subscription_status ON organizations(subscription_status);
```

### users

```sql
CREATE TABLE users (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(uuid) ON DELETE CASCADE,

  -- Authentication
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  email_verified_at TIMESTAMP WITH TIME ZONE,

  -- Profile
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  phone VARCHAR(50),
  avatar_url TEXT,

  -- Authorization
  role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    -- owner, admin, technician, viewer
  permissions JSONB DEFAULT '[]'::jsonb,

  -- Settings
  preferences JSONB DEFAULT '{}'::jsonb,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'active',
    -- active, invited, suspended, deleted
  invited_at TIMESTAMP WITH TIME ZONE,
  invited_by UUID REFERENCES users(uuid),

  -- Login tracking
  last_login_at TIMESTAMP WITH TIME ZONE,
  last_login_ip INET,
  failed_login_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CHECK (role IN ('owner', 'admin', 'technician', 'viewer')),
  CHECK (status IN ('active', 'invited', 'suspended', 'deleted'))
);

CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);
CREATE INDEX idx_users_status ON users(status);
```

### refresh_tokens

```sql
CREATE TABLE refresh_tokens (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,
  token_hash VARCHAR(255) NOT NULL UNIQUE,
  device_id VARCHAR(255),
  device_name VARCHAR(255),
  user_agent TEXT,
  ip_address INET,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES users(uuid),
  revoked_reason VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_device_id ON refresh_tokens(device_id);
```

### clients

```sql
CREATE TABLE clients (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(uuid) ON DELETE CASCADE,

  -- Basic Info
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  alternate_phone VARCHAR(50),

  -- Business Info (for commercial clients)
  company_name VARCHAR(255),
  abn VARCHAR(20),

  -- Categorization
  segment VARCHAR(50) DEFAULT 'residential',
    -- residential, commercial, industrial
  status VARCHAR(50) NOT NULL DEFAULT 'active',
    -- active, inactive

  -- Additional Info
  notes TEXT,
  tags JSONB DEFAULT '[]'::jsonb,
  custom_fields JSONB DEFAULT '{}'::jsonb,
  preferences JSONB DEFAULT '{}'::jsonb,

  -- Integration
  ghl_contact_id VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(uuid),

  -- Constraints
  CHECK (segment IN ('residential', 'commercial', 'industrial')),
  CHECK (status IN ('active', 'inactive')),
  CHECK (email IS NOT NULL OR phone IS NOT NULL) -- At least one contact method
);

CREATE INDEX idx_clients_organization_id ON clients(organization_id);
CREATE INDEX idx_clients_email ON clients(email);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_deleted_at ON clients(deleted_at);
CREATE INDEX idx_clients_segment ON clients(segment);
CREATE INDEX idx_clients_status ON clients(status);
CREATE INDEX idx_clients_ghl_contact_id ON clients(ghl_contact_id);
CREATE INDEX idx_clients_tags ON clients USING GIN(tags);

-- Full-text search
CREATE INDEX idx_clients_search ON clients USING gin(
  to_tsvector('english',
    COALESCE(first_name, '') || ' ' ||
    COALESCE(last_name, '') || ' ' ||
    COALESCE(email, '') || ' ' ||
    COALESCE(company_name, '')
  )
);
```

### client_addresses

```sql
CREATE TABLE client_addresses (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id UUID NOT NULL REFERENCES clients(uuid) ON DELETE CASCADE,

  -- Address Type
  type VARCHAR(50) NOT NULL DEFAULT 'service',
    -- service, billing, postal
  is_primary BOOLEAN NOT NULL DEFAULT false,

  -- Address Details
  street VARCHAR(255) NOT NULL,
  suburb VARCHAR(100) NOT NULL,
  state VARCHAR(50) NOT NULL,
  postcode VARCHAR(20) NOT NULL,
  country VARCHAR(100) DEFAULT 'Australia',

  -- Additional Info
  notes TEXT,
  access_instructions TEXT,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CHECK (type IN ('service', 'billing', 'postal'))
);

CREATE INDEX idx_client_addresses_client_id ON client_addresses(client_id);
CREATE INDEX idx_client_addresses_type ON client_addresses(type);
CREATE INDEX idx_client_addresses_is_primary ON client_addresses(is_primary);
CREATE INDEX idx_client_addresses_suburb ON client_addresses(suburb);
CREATE INDEX idx_client_addresses_state ON client_addresses(state);
```

### quotes

```sql
CREATE TABLE quotes (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(uuid) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(uuid) ON DELETE RESTRICT,

  -- Quote Number (auto-generated)
  quote_number VARCHAR(50) NOT NULL UNIQUE,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
    -- draft, sent, accepted, rejected, expired

  -- Quote Details
  quote_title VARCHAR(255),
  job_type VARCHAR(50), -- residential, commercial, industrial
  client_location TEXT,

  -- Financial
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  gst DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

  -- Notes
  internal_notes TEXT,
  client_notes TEXT,
  terms TEXT,

  -- Validity
  valid_until DATE,

  -- Dates
  sent_at TIMESTAMP WITH TIME ZONE,
  accepted_at TIMESTAMP WITH TIME ZONE,
  rejected_at TIMESTAMP WITH TIME ZONE,

  -- Integration
  ghl_opportunity_id VARCHAR(255),

  -- Sync
  version INT NOT NULL DEFAULT 1,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(uuid),
  updated_by UUID REFERENCES users(uuid),

  -- Constraints
  CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'expired')),
  CHECK (subtotal >= 0),
  CHECK (gst >= 0),
  CHECK (total >= 0),
  CHECK (version > 0)
);

CREATE INDEX idx_quotes_organization_id ON quotes(organization_id);
CREATE INDEX idx_quotes_client_id ON quotes(client_id);
CREATE INDEX idx_quotes_quote_number ON quotes(quote_number);
CREATE INDEX idx_quotes_status ON quotes(status);
CREATE INDEX idx_quotes_deleted_at ON quotes(deleted_at);
CREATE INDEX idx_quotes_created_at ON quotes(created_at DESC);
CREATE INDEX idx_quotes_sent_at ON quotes(sent_at DESC);
CREATE INDEX idx_quotes_ghl_opportunity_id ON quotes(ghl_opportunity_id);
CREATE INDEX idx_quotes_version ON quotes(version);

-- Unique constraint: organization can't have duplicate quote numbers
CREATE UNIQUE INDEX idx_quotes_org_number ON quotes(organization_id, quote_number)
  WHERE deleted_at IS NULL;
```

### quote_line_items

```sql
CREATE TABLE quote_line_items (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  quote_id UUID NOT NULL REFERENCES quotes(uuid) ON DELETE CASCADE,

  -- Order
  order_index INT NOT NULL DEFAULT 0,

  -- Type
  type VARCHAR(50) NOT NULL, -- window, pressure, other

  -- Description
  description TEXT NOT NULL,

  -- Quantity (for windows)
  quantity INT,

  -- Area (for pressure cleaning)
  area DECIMAL(10, 2),

  -- Pricing
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,

  -- Additional Attributes (for windows)
  location VARCHAR(50), -- inside, outside, both
  height VARCHAR(50), -- standard, high_reach

  -- Additional Attributes (for pressure)
  surface VARCHAR(50), -- concrete, pavers, timber, etc.

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CHECK (unit_price >= 0),
  CHECK (subtotal >= 0),
  CHECK (quantity > 0 OR area > 0) -- Must have either quantity or area
);

CREATE INDEX idx_quote_line_items_quote_id ON quote_line_items(quote_id);
CREATE INDEX idx_quote_line_items_type ON quote_line_items(type);
CREATE INDEX idx_quote_line_items_order ON quote_line_items(quote_id, order_index);
```

### invoices

```sql
CREATE TABLE invoices (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(uuid) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(uuid) ON DELETE RESTRICT,
  quote_id UUID REFERENCES quotes(uuid) ON DELETE SET NULL,

  -- Invoice Number (auto-generated)
  invoice_number VARCHAR(50) NOT NULL UNIQUE,

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
    -- draft, sent, partial, paid, overdue, void

  -- Financial
  subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  gst DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  total DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  amount_paid DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  amount_due DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

  -- Dates
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE,
  paid_at TIMESTAMP WITH TIME ZONE,

  -- Payment Terms
  payment_terms VARCHAR(255),
  payment_methods JSONB DEFAULT '[]'::jsonb,

  -- Bank Details
  bank_details JSONB DEFAULT '{}'::jsonb,

  -- Notes
  notes TEXT,
  terms TEXT,

  -- Void
  voided_at TIMESTAMP WITH TIME ZONE,
  voided_by UUID REFERENCES users(uuid),
  void_reason TEXT,

  -- Integration
  ghl_invoice_id VARCHAR(255),

  -- Sync
  version INT NOT NULL DEFAULT 1,

  -- Metadata
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(uuid),
  updated_by UUID REFERENCES users(uuid),

  -- Constraints
  CHECK (status IN ('draft', 'sent', 'partial', 'paid', 'overdue', 'void')),
  CHECK (subtotal >= 0),
  CHECK (gst >= 0),
  CHECK (total >= 0),
  CHECK (amount_paid >= 0),
  CHECK (amount_due >= 0),
  CHECK (amount_paid <= total),
  CHECK (version > 0),
  CHECK (due_date >= invoice_date)
);

CREATE INDEX idx_invoices_organization_id ON invoices(organization_id);
CREATE INDEX idx_invoices_client_id ON invoices(client_id);
CREATE INDEX idx_invoices_quote_id ON invoices(quote_id);
CREATE INDEX idx_invoices_invoice_number ON invoices(invoice_number);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_deleted_at ON invoices(deleted_at);
CREATE INDEX idx_invoices_invoice_date ON invoices(invoice_date DESC);
CREATE INDEX idx_invoices_due_date ON invoices(due_date);
CREATE INDEX idx_invoices_ghl_invoice_id ON invoices(ghl_invoice_id);
CREATE INDEX idx_invoices_version ON invoices(version);

-- Unique constraint
CREATE UNIQUE INDEX idx_invoices_org_number ON invoices(organization_id, invoice_number)
  WHERE deleted_at IS NULL;
```

### invoice_line_items

```sql
CREATE TABLE invoice_line_items (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(uuid) ON DELETE CASCADE,

  -- Same structure as quote_line_items
  order_index INT NOT NULL DEFAULT 0,
  type VARCHAR(50) NOT NULL,
  description TEXT NOT NULL,
  quantity INT,
  area DECIMAL(10, 2),
  unit_price DECIMAL(10, 2) NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  location VARCHAR(50),
  height VARCHAR(50),
  surface VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CHECK (unit_price >= 0),
  CHECK (subtotal >= 0)
);

CREATE INDEX idx_invoice_line_items_invoice_id ON invoice_line_items(invoice_id);
CREATE INDEX idx_invoice_line_items_order ON invoice_line_items(invoice_id, order_index);
```

### payments

```sql
CREATE TABLE payments (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invoice_id UUID NOT NULL REFERENCES invoices(uuid) ON DELETE RESTRICT,
  organization_id UUID NOT NULL REFERENCES organizations(uuid) ON DELETE CASCADE,

  -- Payment Details
  amount DECIMAL(10, 2) NOT NULL,
  method VARCHAR(50) NOT NULL,
    -- bank_transfer, card, cash, cheque, other
  reference VARCHAR(255),
  date DATE NOT NULL,
  notes TEXT,

  -- Integration
  ghl_transaction_id VARCHAR(255),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID NOT NULL REFERENCES users(uuid),

  -- Constraints
  CHECK (amount > 0),
  CHECK (method IN ('bank_transfer', 'card', 'cash', 'cheque', 'other'))
);

CREATE INDEX idx_payments_invoice_id ON payments(invoice_id);
CREATE INDEX idx_payments_organization_id ON payments(organization_id);
CREATE INDEX idx_payments_date ON payments(date DESC);
CREATE INDEX idx_payments_deleted_at ON payments(deleted_at);
CREATE INDEX idx_payments_ghl_transaction_id ON payments(ghl_transaction_id);
```

### photos

```sql
CREATE TABLE photos (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(uuid) ON DELETE CASCADE,

  -- File Details
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,

  -- Image Dimensions
  width INT,
  height INT,

  -- Metadata
  caption TEXT,
  tags JSONB DEFAULT '[]'::jsonb,

  -- Storage
  storage_provider VARCHAR(50) DEFAULT 's3', -- s3, r2, supabase
  storage_key VARCHAR(500) NOT NULL,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  uploaded_by UUID NOT NULL REFERENCES users(uuid),

  -- Constraints
  CHECK (size_bytes > 0)
);

CREATE INDEX idx_photos_organization_id ON photos(organization_id);
CREATE INDEX idx_photos_deleted_at ON photos(deleted_at);
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX idx_photos_tags ON photos USING GIN(tags);
```

### quote_photos

```sql
CREATE TABLE quote_photos (
  quote_id UUID NOT NULL REFERENCES quotes(uuid) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(uuid) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  PRIMARY KEY (quote_id, photo_id)
);

CREATE INDEX idx_quote_photos_quote_id ON quote_photos(quote_id);
CREATE INDEX idx_quote_photos_photo_id ON quote_photos(photo_id);
CREATE INDEX idx_quote_photos_order ON quote_photos(quote_id, order_index);
```

### invoice_photos

```sql
CREATE TABLE invoice_photos (
  invoice_id UUID NOT NULL REFERENCES invoices(uuid) ON DELETE CASCADE,
  photo_id UUID NOT NULL REFERENCES photos(uuid) ON DELETE CASCADE,
  order_index INT NOT NULL DEFAULT 0,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  PRIMARY KEY (invoice_id, photo_id)
);

CREATE INDEX idx_invoice_photos_invoice_id ON invoice_photos(invoice_id);
CREATE INDEX idx_invoice_photos_photo_id ON invoice_photos(photo_id);
```

### documents

```sql
CREATE TABLE documents (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(uuid) ON DELETE CASCADE,

  -- Document Type
  type VARCHAR(50) NOT NULL, -- quote_pdf, invoice_pdf, photo, other

  -- Related Entity
  related_entity_type VARCHAR(50), -- quote, invoice, client
  related_entity_id UUID,

  -- File Details
  filename VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  size_bytes BIGINT NOT NULL,

  -- Storage
  storage_provider VARCHAR(50) DEFAULT 's3',
  storage_key VARCHAR(500) NOT NULL,

  -- Expiry (for temporary signed URLs)
  expires_at TIMESTAMP WITH TIME ZONE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(uuid),

  -- Constraints
  CHECK (type IN ('quote_pdf', 'invoice_pdf', 'photo', 'other'))
);

CREATE INDEX idx_documents_organization_id ON documents(organization_id);
CREATE INDEX idx_documents_type ON documents(type);
CREATE INDEX idx_documents_related_entity ON documents(related_entity_type, related_entity_id);
CREATE INDEX idx_documents_expires_at ON documents(expires_at);
CREATE INDEX idx_documents_deleted_at ON documents(deleted_at);
```

### audit_logs

```sql
CREATE TABLE audit_logs (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(uuid) ON DELETE CASCADE,

  -- Who
  user_id UUID REFERENCES users(uuid),
  device_id VARCHAR(255),
  ip_address INET,

  -- What
  action VARCHAR(100) NOT NULL, -- create, update, delete, login, logout, etc.
  entity_type VARCHAR(50), -- quote, invoice, client, user, etc.
  entity_id UUID,

  -- Changes
  field VARCHAR(255),
  old_value TEXT,
  new_value TEXT,

  -- Context
  version INT,
  metadata JSONB DEFAULT '{}'::jsonb,

  -- Timestamp
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Partition by month for performance
CREATE TABLE audit_logs_y2025m11 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');
```

### devices

```sql
CREATE TABLE devices (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(uuid) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(uuid) ON DELETE CASCADE,

  -- Device Info
  device_id VARCHAR(255) NOT NULL,
  device_name VARCHAR(255),
  device_type VARCHAR(50), -- web, ios, android
  user_agent TEXT,

  -- Sync Status
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(50) DEFAULT 'synced',
    -- syncing, synced, error, offline
  pending_changes INT NOT NULL DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CHECK (sync_status IN ('syncing', 'synced', 'error', 'offline')),
  UNIQUE (organization_id, device_id)
);

CREATE INDEX idx_devices_organization_id ON devices(organization_id);
CREATE INDEX idx_devices_user_id ON devices(user_id);
CREATE INDEX idx_devices_device_id ON devices(device_id);
CREATE INDEX idx_devices_sync_status ON devices(sync_status);
CREATE INDEX idx_devices_last_sync_at ON devices(last_sync_at);
```

### sync_history

```sql
CREATE TABLE sync_history (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(uuid) ON DELETE CASCADE,
  device_id VARCHAR(255) NOT NULL,
  user_id UUID NOT NULL REFERENCES users(uuid),

  -- Sync Details
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL, -- insert, update, delete
  version INT NOT NULL,

  -- Status
  status VARCHAR(50) NOT NULL, -- accepted, conflict, error
  conflict_reason TEXT,

  -- Data
  data JSONB,

  -- Timestamp
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sync_history_organization_id ON sync_history(organization_id);
CREATE INDEX idx_sync_history_device_id ON sync_history(device_id);
CREATE INDEX idx_sync_history_entity ON sync_history(entity_type, entity_id);
CREATE INDEX idx_sync_history_timestamp ON sync_history(timestamp DESC);
CREATE INDEX idx_sync_history_status ON sync_history(status);
```

### integrations

```sql
CREATE TABLE integrations (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL REFERENCES organizations(uuid) ON DELETE CASCADE,

  -- Integration Type
  provider VARCHAR(50) NOT NULL, -- gohighlevel, xero, stripe, etc.

  -- Status
  status VARCHAR(50) NOT NULL DEFAULT 'disconnected',
    -- connected, disconnected, error, suspended

  -- Credentials (encrypted)
  api_key_encrypted TEXT,
  api_secret_encrypted TEXT,
  webhook_secret_encrypted TEXT,

  -- Provider Details
  location_id VARCHAR(255),
  location_name VARCHAR(255),

  -- Configuration
  config JSONB DEFAULT '{}'::jsonb,
  field_mappings JSONB DEFAULT '{}'::jsonb,

  -- Sync
  last_sync_at TIMESTAMP WITH TIME ZONE,
  sync_status VARCHAR(50) DEFAULT 'idle',
    -- idle, syncing, healthy, degraded, error

  -- Timestamps
  connected_at TIMESTAMP WITH TIME ZONE,
  disconnected_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),

  -- Constraints
  CHECK (provider IN ('gohighlevel', 'xero', 'stripe', 'other')),
  CHECK (status IN ('connected', 'disconnected', 'error', 'suspended')),
  CHECK (sync_status IN ('idle', 'syncing', 'healthy', 'degraded', 'error')),
  UNIQUE (organization_id, provider)
);

CREATE INDEX idx_integrations_organization_id ON integrations(organization_id);
CREATE INDEX idx_integrations_provider ON integrations(provider);
CREATE INDEX idx_integrations_status ON integrations(status);
```

### webhook_logs

```sql
CREATE TABLE webhook_logs (
  uuid UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(uuid) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(uuid) ON DELETE CASCADE,

  -- Webhook Details
  provider VARCHAR(50) NOT NULL,
  event_type VARCHAR(100) NOT NULL,

  -- Request
  request_headers JSONB,
  request_body JSONB,
  signature VARCHAR(500),
  signature_valid BOOLEAN,

  -- Response
  response_status INT,
  response_body JSONB,

  -- Processing
  processed_at TIMESTAMP WITH TIME ZONE,
  processing_duration_ms INT,
  error TEXT,

  -- Timestamp
  received_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_webhook_logs_organization_id ON webhook_logs(organization_id);
CREATE INDEX idx_webhook_logs_integration_id ON webhook_logs(integration_id);
CREATE INDEX idx_webhook_logs_provider ON webhook_logs(provider);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_received_at ON webhook_logs(received_at DESC);
CREATE INDEX idx_webhook_logs_signature_valid ON webhook_logs(signature_valid);
```

---

## Triggers & Functions

### Auto-update updated_at timestamp

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON clients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- (repeat for all tables with updated_at)
```

### Auto-generate quote/invoice numbers

```sql
CREATE OR REPLACE FUNCTION generate_quote_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INT;
  year VARCHAR(4);
BEGIN
  IF NEW.quote_number IS NULL THEN
    year := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(CAST(SUBSTRING(quote_number FROM '\d+$') AS INT)), 0) + 1
    INTO next_number
    FROM quotes
    WHERE organization_id = NEW.organization_id
      AND quote_number LIKE 'Q-' || year || '-%';

    NEW.quote_number := 'Q-' || year || '-' || LPAD(next_number::TEXT, 6, '0');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_quote_number_trigger
  BEFORE INSERT ON quotes
  FOR EACH ROW EXECUTE FUNCTION generate_quote_number();

-- Similar function for invoices
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TRIGGER AS $$
DECLARE
  next_number INT;
  year VARCHAR(4);
BEGIN
  IF NEW.invoice_number IS NULL THEN
    year := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(CAST(SUBSTRING(invoice_number FROM '\d+$') AS INT)), 0) + 1
    INTO next_number
    FROM invoices
    WHERE organization_id = NEW.organization_id
      AND invoice_number LIKE 'INV-' || year || '-%';

    NEW.invoice_number := 'INV-' || year || '-' || LPAD(next_number::TEXT, 6, '0');
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_invoice_number_trigger
  BEFORE INSERT ON invoices
  FOR EACH ROW EXECUTE FUNCTION generate_invoice_number();
```

### Auto-calculate invoice amount_due

```sql
CREATE OR REPLACE FUNCTION calculate_invoice_amount_due()
RETURNS TRIGGER AS $$
BEGIN
  NEW.amount_due := NEW.total - NEW.amount_paid;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_invoice_amount_due_trigger
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW EXECUTE FUNCTION calculate_invoice_amount_due();
```

### Update invoice status based on payments

```sql
CREATE OR REPLACE FUNCTION update_invoice_status_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  invoice_total DECIMAL(10, 2);
  total_paid DECIMAL(10, 2);
BEGIN
  -- Get invoice total
  SELECT total INTO invoice_total
  FROM invoices
  WHERE uuid = NEW.invoice_id;

  -- Calculate total paid
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM payments
  WHERE invoice_id = NEW.invoice_id
    AND deleted_at IS NULL;

  -- Update invoice
  UPDATE invoices
  SET
    amount_paid = total_paid,
    amount_due = total - total_paid,
    status = CASE
      WHEN total_paid >= total THEN 'paid'
      WHEN total_paid > 0 THEN 'partial'
      ELSE status
    END,
    paid_at = CASE
      WHEN total_paid >= total THEN NOW()
      ELSE NULL
    END
  WHERE uuid = NEW.invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_invoice_on_payment
  AFTER INSERT ON payments
  FOR EACH ROW EXECUTE FUNCTION update_invoice_status_on_payment();
```

### Create audit log entry

```sql
CREATE OR REPLACE FUNCTION create_audit_log_entry()
RETURNS TRIGGER AS $$
DECLARE
  action_type VARCHAR(50);
  user_id_val UUID;
BEGIN
  -- Determine action
  IF (TG_OP = 'INSERT') THEN
    action_type := 'create';
  ELSIF (TG_OP = 'UPDATE') THEN
    action_type := 'update';
  ELSIF (TG_OP = 'DELETE') THEN
    action_type := 'delete';
  END IF;

  -- Get user_id from context (set by application)
  user_id_val := current_setting('app.user_id', true)::UUID;

  -- Create audit log entry
  INSERT INTO audit_logs (
    organization_id,
    user_id,
    action,
    entity_type,
    entity_id,
    version,
    timestamp
  ) VALUES (
    COALESCE(NEW.organization_id, OLD.organization_id),
    user_id_val,
    action_type,
    TG_TABLE_NAME,
    COALESCE(NEW.uuid, OLD.uuid),
    COALESCE(NEW.version, OLD.version),
    NOW()
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to tables that need audit logging
CREATE TRIGGER audit_quotes
  AFTER INSERT OR UPDATE OR DELETE ON quotes
  FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();

CREATE TRIGGER audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON invoices
  FOR EACH ROW EXECUTE FUNCTION create_audit_log_entry();

-- (repeat for other auditable tables)
```

---

## Views

### Active quotes view

```sql
CREATE OR REPLACE VIEW v_active_quotes AS
SELECT
  q.*,
  c.first_name AS client_first_name,
  c.last_name AS client_last_name,
  c.email AS client_email,
  c.phone AS client_phone,
  u.first_name AS created_by_first_name,
  u.last_name AS created_by_last_name,
  COUNT(qli.uuid) AS line_item_count
FROM quotes q
INNER JOIN clients c ON q.client_id = c.uuid
INNER JOIN users u ON q.created_by = u.uuid
LEFT JOIN quote_line_items qli ON q.uuid = qli.quote_id
WHERE q.deleted_at IS NULL
GROUP BY q.uuid, c.first_name, c.last_name, c.email, c.phone,
         u.first_name, u.last_name;
```

### Active invoices view

```sql
CREATE OR REPLACE VIEW v_active_invoices AS
SELECT
  i.*,
  c.first_name AS client_first_name,
  c.last_name AS client_last_name,
  c.email AS client_email,
  c.phone AS client_phone,
  COUNT(p.uuid) AS payment_count
FROM invoices i
INNER JOIN clients c ON i.client_id = c.uuid
LEFT JOIN payments p ON i.uuid = p.invoice_id AND p.deleted_at IS NULL
WHERE i.deleted_at IS NULL
GROUP BY i.uuid, c.first_name, c.last_name, c.email, c.phone;
```

### Client statistics view

```sql
CREATE OR REPLACE VIEW v_client_stats AS
SELECT
  c.uuid AS client_id,
  c.organization_id,
  COUNT(DISTINCT q.uuid) AS total_quotes,
  COUNT(DISTINCT CASE WHEN q.status = 'accepted' THEN q.uuid END) AS accepted_quotes,
  COUNT(DISTINCT i.uuid) AS total_invoices,
  COALESCE(SUM(i.total), 0) AS total_invoiced,
  COALESCE(SUM(i.amount_paid), 0) AS total_paid,
  COALESCE(SUM(i.amount_due), 0) AS outstanding,
  MAX(i.invoice_date) AS last_job_date
FROM clients c
LEFT JOIN quotes q ON c.uuid = q.client_id AND q.deleted_at IS NULL
LEFT JOIN invoices i ON c.uuid = i.client_id AND i.deleted_at IS NULL
WHERE c.deleted_at IS NULL
GROUP BY c.uuid, c.organization_id;
```

---

## Migration Strategy

### Initial Migration (from localStorage to PostgreSQL)

```javascript
// Migration script pseudocode
async function migrateFromLocalStorageToPostgres() {
  const localData = {
    quotes: JSON.parse(localStorage.getItem('quotes') || '[]'),
    invoices: JSON.parse(localStorage.getItem('invoices') || '[]'),
    clients: JSON.parse(localStorage.getItem('clients') || '[]')
  };

  // 1. Create organization
  const org = await createOrganization({
    name: 'My Organization',
    subscription_plan: 'free'
  });

  // 2. Create owner user
  const user = await createUser({
    organization_id: org.uuid,
    email: 'user@example.com',
    role: 'owner'
  });

  // 3. Migrate clients
  const clientMap = new Map();
  for (const localClient of localData.clients) {
    const newClient = await createClient({
      organization_id: org.uuid,
      ...localClient,
      created_by: user.uuid
    });
    clientMap.set(localClient.id, newClient.uuid);
  }

  // 4. Migrate quotes
  const quoteMap = new Map();
  for (const localQuote of localData.quotes) {
    const newQuote = await createQuote({
      organization_id: org.uuid,
      client_id: clientMap.get(localQuote.clientId),
      ...localQuote,
      created_by: user.uuid
    });

    // Migrate line items
    for (const item of localQuote.lineItems) {
      await createQuoteLineItem({
        quote_id: newQuote.uuid,
        ...item
      });
    }

    quoteMap.set(localQuote.id, newQuote.uuid);
  }

  // 5. Migrate invoices
  for (const localInvoice of localData.invoices) {
    const newInvoice = await createInvoice({
      organization_id: org.uuid,
      client_id: clientMap.get(localInvoice.clientId),
      quote_id: quoteMap.get(localInvoice.quoteId),
      ...localInvoice,
      created_by: user.uuid
    });

    // Migrate line items
    for (const item of localInvoice.lineItems) {
      await createInvoiceLineItem({
        invoice_id: newInvoice.uuid,
        ...item
      });
    }

    // Migrate payments
    if (localInvoice.payments) {
      for (const payment of localInvoice.payments) {
        await createPayment({
          invoice_id: newInvoice.uuid,
          organization_id: org.uuid,
          ...payment,
          created_by: user.uuid
        });
      }
    }
  }

  console.log('Migration complete!');
}
```

---

## Backup & Maintenance

### Automated Backups

```sql
-- Daily full backup
pg_dump -Fc tictacstick_production > backup_$(date +%Y%m%d).dump

-- Continuous WAL archiving
archive_mode = on
archive_command = 'cp %p /backup/archive/%f'
```

### Maintenance Tasks

```sql
-- Vacuum and analyze (weekly)
VACUUM ANALYZE;

-- Reindex (monthly)
REINDEX DATABASE tictacstick_production;

-- Clean up old audit logs (keep 1 year)
DELETE FROM audit_logs
WHERE timestamp < NOW() - INTERVAL '1 year';

-- Clean up expired documents
DELETE FROM documents
WHERE expires_at < NOW();

-- Clean up revoked refresh tokens (keep 30 days)
DELETE FROM refresh_tokens
WHERE revoked_at < NOW() - INTERVAL '30 days';
```

---

## Performance Optimization

### Query Optimization

```sql
-- Analyze slow queries
SELECT
  query,
  calls,
  total_time,
  mean_time,
  max_time
FROM pg_stat_statements
ORDER BY total_time DESC
LIMIT 20;

-- Connection pooling (PgBouncer)
max_client_conn = 1000
default_pool_size = 25
```

### Partitioning

```sql
-- Partition audit_logs by month
CREATE TABLE audit_logs (
  -- columns
) PARTITION BY RANGE (timestamp);

CREATE TABLE audit_logs_y2025m11 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-11-01') TO ('2025-12-01');

CREATE TABLE audit_logs_y2025m12 PARTITION OF audit_logs
  FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Automatic partition creation
CREATE OR REPLACE FUNCTION create_audit_log_partition()
RETURNS void AS $$
DECLARE
  partition_date DATE;
  partition_name TEXT;
  start_date TEXT;
  end_date TEXT;
BEGIN
  partition_date := DATE_TRUNC('month', NOW() + INTERVAL '1 month');
  partition_name := 'audit_logs_y' || TO_CHAR(partition_date, 'YYYY') ||
                    'm' || TO_CHAR(partition_date, 'MM');
  start_date := TO_CHAR(partition_date, 'YYYY-MM-DD');
  end_date := TO_CHAR(partition_date + INTERVAL '1 month', 'YYYY-MM-DD');

  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF audit_logs
     FOR VALUES FROM (%L) TO (%L)',
    partition_name, start_date, end_date
  );
END;
$$ LANGUAGE plpgsql;
```

---

**End of Database Schema Document**

-- ==============================================================================
-- Reciept.io Database Schema Migration v1.0
-- Comprehensive PostgreSQL DDL with Tenant Isolation, Row-Level Security & Functions
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Table 1: profiles
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 2: organizations
CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    workspace_type TEXT NOT NULL CHECK (workspace_type IN ('personal', 'business')),
    default_currency TEXT NOT NULL DEFAULT 'INR',
    timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 3: organization_members
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'editor', 'viewer')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    UNIQUE(organization_id, user_id)
);

-- Table 4: business_profiles
CREATE TABLE IF NOT EXISTS business_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    business_name TEXT NOT NULL,
    logo_url TEXT,
    email TEXT,
    phone TEXT,
    address JSONB DEFAULT '{}'::jsonb,
    tax_identifier TEXT, -- e.g. GSTIN, PAN, VAT
    website TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 5: customers
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    billing_address JSONB DEFAULT '{}'::jsonb,
    tax_identifier TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 6: products
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sku TEXT,
    unit_price_minor BIGINT NOT NULL DEFAULT 0,
    currency TEXT NOT NULL DEFAULT 'INR',
    default_tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 10: receipt_templates
CREATE TABLE IF NOT EXISTS receipt_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    template_key TEXT NOT NULL,
    configuration JSONB NOT NULL DEFAULT '{}'::jsonb,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 7: receipts
CREATE TABLE IF NOT EXISTS receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    business_profile_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE RESTRICT,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    receipt_number TEXT NOT NULL,
    receipt_type TEXT NOT NULL CHECK (receipt_type IN ('sales', 'payment')),
    status TEXT NOT NULL CHECK (status IN ('draft', 'issued', 'paid', 'partially_paid', 'voided', 'cancelled')),
    currency TEXT NOT NULL DEFAULT 'INR',
    issue_date DATE NOT NULL,
    transaction_date DATE NOT NULL,
    subtotal_minor BIGINT NOT NULL DEFAULT 0,
    discount_minor BIGINT NOT NULL DEFAULT 0,
    tax_minor BIGINT NOT NULL DEFAULT 0,
    total_minor BIGINT NOT NULL DEFAULT 0,
    amount_paid_minor BIGINT NOT NULL DEFAULT 0,
    balance_due_minor BIGINT NOT NULL DEFAULT 0,
    customer_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    business_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
    notes TEXT,
    terms TEXT,
    footer_message TEXT,
    signature_url TEXT,
    template_key TEXT NOT NULL DEFAULT 'minimal',
    template_id UUID REFERENCES receipt_templates(id),
    version INTEGER NOT NULL DEFAULT 1,
    created_by UUID REFERENCES profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_receipt_number_per_org UNIQUE (organization_id, receipt_number)
);

-- Table 8: receipt_items
CREATE TABLE IF NOT EXISTS receipt_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    description TEXT NOT NULL,
    sku_snapshot TEXT,
    quantity NUMERIC(10,3) NOT NULL DEFAULT 1.000,
    unit_price_minor BIGINT NOT NULL DEFAULT 0,
    discount_minor BIGINT NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5,2) NOT NULL DEFAULT 0.00,
    tax_minor BIGINT NOT NULL DEFAULT 0,
    line_total_minor BIGINT NOT NULL DEFAULT 0,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Table 9: payments
CREATE TABLE IF NOT EXISTS payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    amount_minor BIGINT NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'card', 'bank_transfer', 'upi', 'other')),
    payment_reference TEXT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    status TEXT NOT NULL DEFAULT 'recorded' CHECK (status IN ('recorded', 'reconciled', 'failed')),
    is_manual_entry BOOLEAN NOT NULL DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 11: receipt_documents
CREATE TABLE IF NOT EXISTS receipt_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_id UUID NOT NULL REFERENCES receipts(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_type TEXT NOT NULL DEFAULT 'application/pdf',
    file_hash TEXT,
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 12: receipt_number_sequences
CREATE TABLE IF NOT EXISTS receipt_number_sequences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    prefix TEXT NOT NULL DEFAULT 'REC-',
    next_number BIGINT NOT NULL DEFAULT 1,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now()),
    CONSTRAINT uq_org_prefix UNIQUE (organization_id, prefix)
);

-- Table 13: audit_logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,
    before_data JSONB,
    after_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- Table 14: subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
    plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro', 'business')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    billing_provider TEXT,
    provider_customer_id TEXT,
    provider_subscription_id TEXT,
    current_period_end TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc', now())
);

-- ==============================================================================
-- Atomic Receipt Numbering Function
-- ==============================================================================
CREATE OR REPLACE FUNCTION generate_next_receipt_number(
    p_organization_id UUID,
    p_prefix TEXT DEFAULT 'REC-'
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_seq_num BIGINT;
    v_receipt_number TEXT;
BEGIN
    INSERT INTO receipt_number_sequences (organization_id, prefix, next_number, updated_at)
    VALUES (p_organization_id, p_prefix, 2, timezone('utc', now()))
    ON CONFLICT (organization_id, prefix)
    DO UPDATE SET 
        next_number = receipt_number_sequences.next_number + 1,
        updated_at = timezone('utc', now())
    RETURNING (next_number - 1) INTO v_seq_num;

    v_receipt_number := p_prefix || LPAD(v_seq_num::TEXT, 5, '0');
    RETURN v_receipt_number;
END;
$$;

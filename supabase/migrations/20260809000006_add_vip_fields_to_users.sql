-- Migration: add_vip_fields_to_profiles
-- Description: Adds VIP status tracking to the profiles table (Supabase uses auth.users + profiles pattern)

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_status VARCHAR(20) NOT NULL DEFAULT 'none';
-- values: 'none', 'active', 'revoked'

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_granted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS vip_revoked_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_profiles_vip_status ON profiles(vip_status) WHERE vip_status = 'active';

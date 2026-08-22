-- Migration: create_signal_sessions
-- Description: Stores the daily XAUUSD anchor prices (prev close & daily open)
--              fetched automatically from TradingView/Yahoo Finance.
--              One row per (session_date, symbol) — admin can override prices manually.

CREATE TABLE IF NOT EXISTS signal_sessions (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_date      DATE NOT NULL,
    symbol            VARCHAR(20) NOT NULL DEFAULT 'XAUUSD',

    -- Core anchor prices (fetched from external source or manually set)
    prev_close        DECIMAL(10, 2) NOT NULL,          -- Previous trading day close
    daily_open        DECIMAL(10, 2),                    -- Today's opening price (used as SL anchor)

    -- Computed level cache (denormalized for quick reads)
    tp_buy            DECIMAL(10, 2),                    -- prevClose * 1.01
    tp_sell           DECIMAL(10, 2),                    -- prevClose * 0.99
    rung_data         JSONB DEFAULT '[]'::JSONB,         -- [{idx, spacing, buy, sell}, ...]
    sl_level          DECIMAL(10, 2),                    -- = daily_open

    -- Source metadata
    data_source       VARCHAR(50) DEFAULT 'manual',      -- 'yahoo_finance' | 'manual' | 'tradingview'
    is_published      BOOLEAN NOT NULL DEFAULT TRUE,     -- FALSE = admin draft, hidden from students
    admin_notes       TEXT,

    -- Timestamps
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    created_by        UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    UNIQUE(session_date, symbol)
);

-- Index: latest session lookups
CREATE INDEX IF NOT EXISTS idx_signal_sessions_date ON signal_sessions(session_date DESC, symbol);

-- Index: published sessions for student reads
CREATE INDEX IF NOT EXISTS idx_signal_sessions_published ON signal_sessions(is_published, session_date DESC)
WHERE is_published = TRUE;

-- ── RLS Policies ─────────────────────────────────────────────────────────────
ALTER TABLE signal_sessions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read published sessions
CREATE POLICY "Authenticated users can read published signal sessions"
  ON signal_sessions
  FOR SELECT
  USING (auth.role() = 'authenticated' AND is_published = TRUE);

-- Admins can do everything (admin = role in profiles table)
CREATE POLICY "Admins can manage all signal sessions"
  ON signal_sessions
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ── Auto-update updated_at on change ─────────────────────────────────────────
CREATE OR REPLACE TRIGGER set_signal_sessions_updated_at
  BEFORE UPDATE ON signal_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

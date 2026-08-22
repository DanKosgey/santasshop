-- Migration: create_signal_trades
-- Description: Stores individual trades that students log against the daily signal.
--              Linked to a signal_session for the correct anchor levels.

CREATE TABLE IF NOT EXISTS signal_trades (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id        UUID REFERENCES signal_sessions(id) ON DELETE SET NULL,
    user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol            VARCHAR(20) NOT NULL DEFAULT 'XAUUSD',

    -- Trade parameters
    trade_direction   VARCHAR(10) NOT NULL CHECK (trade_direction IN ('buy', 'sell')),
    rung_number       INTEGER CHECK (rung_number BETWEEN 1 AND 5),   -- NULL = custom entry
    entry_price       DECIMAL(10, 2) NOT NULL,
    take_profit       DECIMAL(10, 2),
    stop_loss         DECIMAL(10, 2),
    lot_size          DECIMAL(6, 2) NOT NULL DEFAULT 0.01,

    -- Outcome
    trade_result      VARCHAR(20) DEFAULT 'open'
                        CHECK (trade_result IN ('open', 'win', 'loss', 'breakeven', 'cancelled')),
    pnl_usd           DECIMAL(10, 2),                -- Realised P&L in USD (populated on close)
    exit_price        DECIMAL(10, 2),                -- Actual close price

    -- Optional context
    notes             TEXT,
    session_date      DATE,                          -- Denormalized for easy querying without JOIN

    -- Timestamps
    trade_opened_at   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    trade_closed_at   TIMESTAMP WITH TIME ZONE,
    created_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signal_trades_user ON signal_trades(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_signal_trades_session ON signal_trades(session_id);
CREATE INDEX IF NOT EXISTS idx_signal_trades_date ON signal_trades(session_date DESC);
CREATE INDEX IF NOT EXISTS idx_signal_trades_result ON signal_trades(trade_result, session_date DESC);

-- ── RLS Policies ─────────────────────────────────────────────────────────────
ALTER TABLE signal_trades ENABLE ROW LEVEL SECURITY;

-- Users can read their own trades
CREATE POLICY "Users can read their own signal trades"
  ON signal_trades
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own trades
CREATE POLICY "Users can log their own signal trades"
  ON signal_trades
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own open/cancelled trades (e.g. close out a trade)
CREATE POLICY "Users can update their own signal trades"
  ON signal_trades
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can read all trades
CREATE POLICY "Admins can read all signal trades"
  ON signal_trades
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- ── Auto-update updated_at ─────────────────────────────────────────────────────
CREATE OR REPLACE TRIGGER set_signal_trades_updated_at
  BEFORE UPDATE ON signal_trades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

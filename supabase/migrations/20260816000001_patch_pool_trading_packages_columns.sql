-- Migration: patch_pool_trading_packages_columns
-- Description: Add missing columns to pool_trading_packages that may not exist
-- if the table was created by an older schema before these fields were added.

-- Add 'recommended' column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pool_trading_packages' AND column_name = 'recommended'
    ) THEN
        ALTER TABLE pool_trading_packages ADD COLUMN recommended BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- Add 'duration_unit' column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pool_trading_packages' AND column_name = 'duration_unit'
    ) THEN
        ALTER TABLE pool_trading_packages ADD COLUMN duration_unit VARCHAR(10) NOT NULL DEFAULT 'days';
    END IF;
END $$;

-- Add 'sort_order' column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pool_trading_packages' AND column_name = 'sort_order'
    ) THEN
        ALTER TABLE pool_trading_packages ADD COLUMN sort_order INTEGER NOT NULL DEFAULT 0;
    END IF;
END $$;

-- Add 'risk_level' column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pool_trading_packages' AND column_name = 'risk_level'
    ) THEN
        ALTER TABLE pool_trading_packages ADD COLUMN risk_level VARCHAR(10) NOT NULL DEFAULT 'medium';
    END IF;
END $$;

-- Add 'max_amount' column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pool_trading_packages' AND column_name = 'max_amount'
    ) THEN
        ALTER TABLE pool_trading_packages ADD COLUMN max_amount DECIMAL(18, 2);
    END IF;
END $$;

-- Add 'description' column if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'pool_trading_packages' AND column_name = 'description'
    ) THEN
        ALTER TABLE pool_trading_packages ADD COLUMN description TEXT;
    END IF;
END $$;

-- Ensure ROI percentage can handle large values
DO $$
BEGIN
    ALTER TABLE pool_trading_packages ALTER COLUMN roi_percentage TYPE DECIMAL(10, 2);
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

-- Ensure index exists
CREATE INDEX IF NOT EXISTS idx_packages_active_sort ON pool_trading_packages(is_active, sort_order);

-- Reload PostgREST schema cache (forces Supabase to recognise new columns immediately)
NOTIFY pgrst, 'reload schema';

-- Migration: 20260818000001_strict_pool_maturity_sync.sql
-- Description: Enforces strict real-time package maturity on pool_trading_investments
-- and heals any prematurely matured or out-of-sync active records.

-- 1. Correct any premature 'matured' records where maturity_date is still in the future
UPDATE pool_trading_investments
SET 
    status = 'active',
    updated_at = NOW()
WHERE 
    status = 'matured'
    AND maturity_date > NOW();

-- 2. Ensure all investments whose maturity_date has genuinely expired transition to 'matured'
UPDATE pool_trading_investments
SET 
    status = 'matured',
    updated_at = NOW()
WHERE 
    status = 'active'
    AND maturity_date <= NOW();

-- 3. Create a helper stored procedure for background / cron maturity synchronization
CREATE OR REPLACE FUNCTION sync_pool_trading_maturity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Revert future dated investments to active if mistakenly marked matured
    UPDATE pool_trading_investments
    SET 
        status = 'active',
        updated_at = NOW()
    WHERE 
        status = 'matured'
        AND maturity_date > NOW();

    -- Mature expired active investments
    UPDATE pool_trading_investments
    SET 
        status = 'matured',
        updated_at = NOW()
    WHERE 
        status = 'active'
        AND maturity_date <= NOW();
END;
$$;

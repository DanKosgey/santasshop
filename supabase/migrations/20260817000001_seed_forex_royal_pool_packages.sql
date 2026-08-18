-- Migration: 20260817000001_seed_forex_royal_pool_packages.sql
-- Description: Seed official Forex Royal Pool Trading Investment Packages (24-Hour, 2-Day, and Weekly plans in USD)

-- Deactivate or remove existing placeholder packages if any
UPDATE pool_trading_packages SET is_active = FALSE WHERE is_active = TRUE;

-- Insert the 11 official Forex Royal Pool Trading packages
INSERT INTO pool_trading_packages (
    name,
    description,
    duration_value,
    duration_unit,
    min_amount,
    max_amount,
    roi_percentage,
    risk_level,
    recommended,
    is_active,
    sort_order,
    created_at,
    updated_at
) VALUES
    -- 24 HOURS INVESTMENT PLANS
    (
        'Royal Bronze 24H Pool',
        'Entry tier fast-yield 24-hour liquidity pool engineered for rapid capital appreciation.',
        24,
        'hours',
        500.00,
        599.00,
        840.00,
        'medium',
        FALSE,
        TRUE,
        1,
        NOW(),
        NOW()
    ),
    (
        'Royal Silver 24H Pool',
        'Accelerated 24-hour high-yield allocation delivering optimized returns on automated setups.',
        24,
        'hours',
        600.00,
        699.00,
        833.33,
        'medium',
        FALSE,
        TRUE,
        2,
        NOW(),
        NOW()
    ),
    (
        'Royal Gold 24H Pool',
        'Premium 24-hour institutional execution strategy with enhanced algorithmic yield.',
        24,
        'hours',
        700.00,
        799.00,
        871.43,
        'medium',
        TRUE,
        TRUE,
        3,
        NOW(),
        NOW()
    ),
    (
        'Royal Platinum 24H Pool',
        'Elite 24-hour sprint pool with maximized return parameters and rapid settlement.',
        24,
        'hours',
        800.00,
        899.00,
        875.00,
        'high',
        FALSE,
        TRUE,
        4,
        NOW(),
        NOW()
    ),

    -- 2 DAYS INVESTMENT PLANS
    (
        'Royal Emerald 48H Vault',
        '2-Day swing allocation capitalizing on 48-hour institutional liquidity swings.',
        2,
        'days',
        900.00,
        999.00,
        888.89,
        'medium',
        FALSE,
        TRUE,
        5,
        NOW(),
        NOW()
    ),
    (
        'Royal Sapphire 48H Vault',
        'Flagship 2-Day high-performance pool maximizing algorithmic compound efficiency.',
        2,
        'days',
        1000.00,
        1499.00,
        900.00,
        'medium',
        TRUE,
        TRUE,
        6,
        NOW(),
        NOW()
    ),
    (
        'Royal Ruby 48H Vault',
        'Heavyweight 48-hour arbitrage pool with locked high-yield returns.',
        2,
        'days',
        1500.00,
        1999.00,
        800.00,
        'high',
        FALSE,
        TRUE,
        7,
        NOW(),
        NOW()
    ),

    -- WEEKLY INVESTMENT PLANS
    (
        'Royal Diamond Weekly Master',
        '7-Day institutional liquidity cycle providing stable high-yield multi-market execution.',
        7,
        'days',
        2000.00,
        2999.00,
        800.00,
        'low',
        FALSE,
        TRUE,
        8,
        NOW(),
        NOW()
    ),
    (
        'Royal Crown Weekly Master',
        'Executive weekly investment tier with deep multi-pair algorithmic distribution.',
        7,
        'days',
        3000.00,
        4999.00,
        666.67,
        'medium',
        FALSE,
        TRUE,
        9,
        NOW(),
        NOW()
    ),
    (
        'Royal Sovereign Weekly Titan',
        'High-net-worth weekly syndicate pool designed for aggressive compounding.',
        7,
        'days',
        5000.00,
        9999.00,
        600.00,
        'medium',
        FALSE,
        TRUE,
        10,
        NOW(),
        NOW()
    ),
    (
        'Royal Imperial Weekly Syndicate',
        'Apex tier institutional pool with dedicated VIP liquidity routing and maximum payout.',
        7,
        'days',
        10000.00,
        NULL,
        600.00,
        'high',
        TRUE,
        TRUE,
        11,
        NOW(),
        NOW()
    );

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';

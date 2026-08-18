import dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve('.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env');
  process.exit(1);
}

const packages = [
  // 24 HOURS INVESTMENT PLANS
  {
    name: 'Royal Bronze 24H Pool',
    description: 'Entry tier fast-yield 24-hour liquidity pool engineered for rapid capital appreciation.',
    duration_value: 24,
    duration_unit: 'hours',
    min_amount: 500.00,
    max_amount: 599.00,
    roi_percentage: 840.00,
    risk_level: 'medium',
    recommended: false,
    is_active: true,
    sort_order: 1,
  },
  {
    name: 'Royal Silver 24H Pool',
    description: 'Accelerated 24-hour high-yield allocation delivering optimized returns on automated setups.',
    duration_value: 24,
    duration_unit: 'hours',
    min_amount: 600.00,
    max_amount: 699.00,
    roi_percentage: 833.33,
    risk_level: 'medium',
    recommended: false,
    is_active: true,
    sort_order: 2,
  },
  {
    name: 'Royal Gold 24H Pool',
    description: 'Premium 24-hour institutional execution strategy with enhanced algorithmic yield.',
    duration_value: 24,
    duration_unit: 'hours',
    min_amount: 700.00,
    max_amount: 799.00,
    roi_percentage: 871.43,
    risk_level: 'medium',
    recommended: true,
    is_active: true,
    sort_order: 3,
  },
  {
    name: 'Royal Platinum 24H Pool',
    description: 'Elite 24-hour sprint pool with maximized return parameters and rapid settlement.',
    duration_value: 24,
    duration_unit: 'hours',
    min_amount: 800.00,
    max_amount: 899.00,
    roi_percentage: 875.00,
    risk_level: 'high',
    recommended: false,
    is_active: true,
    sort_order: 4,
  },

  // 2 DAYS INVESTMENT PLANS
  {
    name: 'Royal Emerald 48H Vault',
    description: '2-Day swing allocation capitalizing on 48-hour institutional liquidity swings.',
    duration_value: 2,
    duration_unit: 'days',
    min_amount: 900.00,
    max_amount: 999.00,
    roi_percentage: 888.89,
    risk_level: 'medium',
    recommended: false,
    is_active: true,
    sort_order: 5,
  },
  {
    name: 'Royal Sapphire 48H Vault',
    description: 'Flagship 2-Day high-performance pool maximizing algorithmic compound efficiency.',
    duration_value: 2,
    duration_unit: 'days',
    min_amount: 1000.00,
    max_amount: 1499.00,
    roi_percentage: 900.00,
    risk_level: 'medium',
    recommended: true,
    is_active: true,
    sort_order: 6,
  },
  {
    name: 'Royal Ruby 48H Vault',
    description: 'Heavyweight 48-hour arbitrage pool with locked high-yield returns.',
    duration_value: 2,
    duration_unit: 'days',
    min_amount: 1500.00,
    max_amount: 1999.00,
    roi_percentage: 800.00,
    risk_level: 'high',
    recommended: false,
    is_active: true,
    sort_order: 7,
  },

  // WEEKLY INVESTMENT PLANS
  {
    name: 'Royal Diamond Weekly Master',
    description: '7-Day institutional liquidity cycle providing stable high-yield multi-market execution.',
    duration_value: 7,
    duration_unit: 'days',
    min_amount: 2000.00,
    max_amount: 2999.00,
    roi_percentage: 800.00,
    risk_level: 'low',
    recommended: false,
    is_active: true,
    sort_order: 8,
  },
  {
    name: 'Royal Crown Weekly Master',
    description: 'Executive weekly investment tier with deep multi-pair algorithmic distribution.',
    duration_value: 7,
    duration_unit: 'days',
    min_amount: 3000.00,
    max_amount: 4999.00,
    roi_percentage: 666.67,
    risk_level: 'medium',
    recommended: false,
    is_active: true,
    sort_order: 9,
  },
  {
    name: 'Royal Sovereign Weekly Titan',
    description: 'High-net-worth weekly syndicate pool designed for aggressive compounding.',
    duration_value: 7,
    duration_unit: 'days',
    min_amount: 5000.00,
    max_amount: 9999.00,
    roi_percentage: 600.00,
    risk_level: 'medium',
    recommended: false,
    is_active: true,
    sort_order: 10,
  },
  {
    name: 'Royal Imperial Weekly Syndicate',
    description: 'Apex tier institutional pool with dedicated VIP liquidity routing and maximum payout.',
    duration_value: 7,
    duration_unit: 'days',
    min_amount: 10000.00,
    max_amount: null,
    roi_percentage: 600.00,
    risk_level: 'high',
    recommended: true,
    is_active: true,
    sort_order: 11,
  },
];

async function seedRemote() {
  console.log('Connecting to remote Supabase DB at:', supabaseUrl);

  const headers = {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json',
    'Prefer': 'return=representation',
  };

  // 1. Deactivate old packages
  console.log('Deactivating existing packages...');
  const patchRes = await fetch(`${supabaseUrl}/rest/v1/pool_trading_packages?is_active=eq.true`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ is_active: false }),
  });
  console.log('Deactivate response status:', patchRes.status);

  // 2. Insert new packages
  console.log('Inserting 11 official Forex Royal packages...');
  const insertRes = await fetch(`${supabaseUrl}/rest/v1/pool_trading_packages`, {
    method: 'POST',
    headers,
    body: JSON.stringify(packages),
  });

  if (!insertRes.ok) {
    const errText = await insertRes.text();
    console.error('Insert error HTTP', insertRes.status, errText);
    process.exit(1);
  }

  const inserted = await insertRes.json();
  console.log(`\n Successfully seeded ${inserted.length} packages to remote database:\n`);
  inserted.forEach((pkg, index) => {
    const profit = (pkg.min_amount * pkg.roi_percentage) / 100;
    const total = Number(pkg.min_amount) + profit;
    console.log(
      `${index + 1}. [${pkg.duration_value} ${pkg.duration_unit.toUpperCase()}] ${pkg.name} | Deposit: $${Number(pkg.min_amount).toLocaleString()} | Profit: +$${Math.round(profit).toLocaleString()} (+${pkg.roi_percentage}%) | Payout: $${Math.round(total).toLocaleString()}`
    );
  });

  process.exit(0);
}

seedRemote().catch(err => {
  console.error('Error during seed:', err);
  process.exit(1);
});

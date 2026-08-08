# Subscription Tracking System

## Overview

This document describes the subscription tracking system implemented in the Trade Hub application. The system tracks user subscription changes to provide accurate analytics, including churn rate calculation and revenue growth metrics.

## Database Schema

### subscription_history Table

The `subscription_history` table tracks all subscription tier changes for students:

| Column | Type | Description |
|--------|------|-------------|
| id | uuid | Unique identifier for the history entry |
| user_id | uuid | Reference to the user whose subscription changed |
| old_tier | text | The previous subscription tier |
| new_tier | text | The new subscription tier |
| change_date | timestamp | When the subscription change occurred |
| change_reason | text | Reason for the subscription change |
| created_at | timestamp | When the history entry was created |

### Tiers

Subscription tiers include:
- `foundation` - Basic tier
- `professional` - Intermediate tier
- `elite` - Premium tier

## Tracking Mechanism

### Automatic Tracking

Subscription changes are automatically tracked using a PostgreSQL trigger:

1. When a user's `subscription_tier` is updated in the `profiles` table, the `on_profile_subscription_change` trigger is fired
2. The `log_subscription_change` function compares the old and new tiers
3. If the tier has changed, a new entry is inserted into the `subscription_history` table

### Initial Data Population

When the system was first implemented, existing user subscriptions were populated into the history table with:
- `old_tier` and `new_tier` both set to the user's current tier
- `change_reason` set to 'initial_state'
- `change_date` set to the user's `joined_date`

## Analytics Functions

### get_business_metrics()

This function calculates key business metrics including:

1. **Total Revenue** - Based on current subscription tiers
2. **MRR (Monthly Recurring Revenue)** - Sum of monthly subscription values
3. **Churn Rate** - Percentage of users who canceled their subscription in the last 30 days
4. **Tier Counts** - Number of users in each subscription tier

### calculate_revenue_growth_percentage()

This function calculates the revenue growth percentage by comparing current MRR to MRR from 30 days ago.

## Churn Rate Calculation

The churn rate is calculated as:

```
(Number of users who churned in the last 30 days / Total active users) * 100
```

Churn is defined as moving from a paid tier (`foundation`, `professional`, or `elite`) to no tier.

## UI Integration

The Admin Portal analytics dashboard displays:
- Real-time churn rate based on actual subscription history
- Dynamic growth percentages based on historical data
- Tier distribution among students

## Testing

A test script is available at `supabase/tests/subscription_history_test.sql` to verify the functionality with sample data.

## Future Improvements

1. Track subscription payment history for more accurate revenue calculations
2. Add more detailed change reasons (upgrade, downgrade, cancellation, etc.)
3. Implement retention analysis to identify at-risk users
4. Add notifications for significant changes in churn rate
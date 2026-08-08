-- Generate test penalty data for demonstration purposes
-- This script creates sample journal entries with penalty validations for testing the penalty trends visualization

-- First, let's check if we have any student users
DO $$
DECLARE
    student_id uuid;
    counter int := 0;
BEGIN
    -- Get a student user ID
    SELECT id INTO student_id FROM profiles WHERE role = 'student' LIMIT 1;
    
    -- If we found a student, create some test journal entries
    IF student_id IS NOT NULL THEN
        -- Create 30 days of test data with varying penalties
        FOR i IN 1..30 LOOP
            -- Randomly decide if we should create an entry for this day
            IF random() > 0.3 THEN -- 70% chance of creating an entry
                -- Create a journal entry
                INSERT INTO journal_entries (
                    user_id,
                    pair,
                    type,
                    entry_price,
                    stop_loss,
                    take_profit,
                    status,
                    pnl,
                    validation_result,
                    notes,
                    date
                ) VALUES (
                    student_id,
                    CASE (random() * 4)::int
                        WHEN 0 THEN 'EURUSD'
                        WHEN 1 THEN 'GBPUSD'
                        WHEN 2 THEN 'USDJPY'
                        ELSE 'XAUUSD'
                    END,
                    CASE (random() * 1)::int
                        WHEN 0 THEN 'buy'
                        ELSE 'sell'
                    END,
                    1.0 + random() * 0.5,
                    1.0 + random() * 0.5 - 0.01,
                    1.0 + random() * 0.5 + 0.01,
                    CASE (random() * 3)::int
                        WHEN 0 THEN 'win'
                        WHEN 1 THEN 'loss'
                        WHEN 2 THEN 'breakeven'
                        ELSE 'open'
                    END,
                    (random() * 200 - 100)::numeric(10,2), -- PnL between -100 and 100
                    CASE (random() * 2)::int
                        WHEN 0 THEN 'approved'
                        WHEN 1 THEN 'warning'
                        ELSE 'rejected'
                    END,
                    'Test entry for penalty trends visualization',
                    current_date - (i || ' days')::interval
                );
                
                counter := counter + 1;
            END IF;
        END LOOP;
        
        RAISE NOTICE 'Created % test journal entries with penalty data', counter;
    ELSE
        RAISE NOTICE 'No student user found. Please create a student user first.';
    END IF;
END $$;
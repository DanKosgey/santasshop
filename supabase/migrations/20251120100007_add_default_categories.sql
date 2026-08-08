-- Add default course categories
-- This migration adds some default categories to help admins get started

insert into course_categories (name, description, color) values
  ('Trading Fundamentals', 'Core concepts for new traders', '#10B981'),
  ('Technical Analysis', 'Chart patterns and indicators', '#F59E0B'),
  ('Risk Management', 'Protecting your capital', '#EF4444'),
  ('Trading Psychology', 'Mindset and emotions', '#8B5CF6'),
  ('Market Analysis', 'Understanding market dynamics', '#06B6D4'),
  ('Strategy Development', 'Building and testing trading strategies', '#8B5CF6')
on conflict (name) do nothing;
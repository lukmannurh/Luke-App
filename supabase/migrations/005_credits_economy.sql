-- ============================================================
-- Migration 005: Credits Economy & Anti-Exploit System
-- ============================================================

-- 1. Add credits column to users table with a default of 100
ALTER TABLE users ADD COLUMN credits INT NOT NULL DEFAULT 100;

-- 2. Add Anti-Minus constraint
ALTER TABLE users ADD CONSTRAINT check_credits_positive CHECK (credits >= 0);

-- 3. Create transactions ledger table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for querying transaction history efficiently
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON transactions(created_at DESC);

-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Users can only read their own transactions
CREATE POLICY "Users can read their own transactions"
ON transactions FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Service role bypasses RLS for inserts/updates, so no insert policy needed for users.

-- 4. Daily Bonus Mechanism via pg_cron
-- We need to ensure the pg_cron extension is available
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Function to award the daily bonus and log it
CREATE OR REPLACE FUNCTION award_daily_bonus()
RETURNS void AS $$
BEGIN
  -- 1. Log the transaction for all users who will receive the bonus
  INSERT INTO transactions (user_id, amount, description)
  SELECT id, 24, 'Daily Bonus'
  FROM users;

  -- 2. Add 24 credits to all users
  UPDATE users
  SET credits = credits + 24;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the job to run every day at 00:00 server time
SELECT cron.schedule(
  'daily-bonus-job', -- job name
  '0 0 * * *',       -- daily at midnight
  'SELECT award_daily_bonus();' -- command
);

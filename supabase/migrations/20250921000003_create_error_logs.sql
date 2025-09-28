-- Create error logs table for comprehensive error tracking
-- This supports requirement 9.2 for comprehensive logging and error tracking

CREATE TABLE IF NOT EXISTS error_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  level TEXT NOT NULL CHECK (level IN ('debug', 'info', 'warn', 'error', 'fatal')),
  message TEXT NOT NULL,
  error_data JSONB,
  context JSONB,
  metadata JSONB,
  user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
-- Create GIN index on error_data JSONB column for efficient JSON queries
CREATE INDEX IF NOT EXISTS idx_error_logs_error_data ON error_logs USING GIN (error_data);

-- Create B-tree index on error code for exact matches
CREATE INDEX IF NOT EXISTS idx_error_logs_error_code ON error_logs ((error_data->>'code'));

-- Create RLS policies
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Only allow service role to insert error logs
CREATE POLICY "Service role can insert error logs" ON error_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Users can only view their own error logs (for debugging purposes)
CREATE POLICY "Users can view own error logs" ON error_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Admin policy will be added in the admin role migration

-- Create function to clean up old error logs (keep last 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_error_logs()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM error_logs 
  WHERE created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Create a scheduled job to run cleanup (if pg_cron is available)
-- This would typically be set up separately in production
COMMENT ON FUNCTION cleanup_old_error_logs() IS 'Cleans up error logs older than 30 days. Should be run periodically.';
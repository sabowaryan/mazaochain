-- Create performance metrics table
CREATE TABLE IF NOT EXISTS performance_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  avg_response_time INTEGER NOT NULL DEFAULT 0,
  uptime DECIMAL(5,2) NOT NULL DEFAULT 99.9,
  throughput INTEGER NOT NULL DEFAULT 0,
  peak_throughput INTEGER NOT NULL DEFAULT 0,
  error_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  cpu_usage DECIMAL(5,2) NOT NULL DEFAULT 0,
  memory_usage DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create blockchain transactions table for monitoring
CREATE TABLE IF NOT EXISTS blockchain_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('mint', 'burn', 'loan', 'repayment', 'transfer')),
  from_address TEXT NOT NULL,
  to_address TEXT NOT NULL,
  amount DECIMAL NOT NULL,
  token_type TEXT NOT NULL CHECK (token_type IN ('MAZAO', 'USDC')),
  hedera_transaction_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'failed')),
  gas_used INTEGER,
  processing_time DECIMAL(10,3), -- in seconds
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user activity logs table
CREATE TABLE IF NOT EXISTS user_activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create system alerts table
CREATE TABLE IF NOT EXISTS system_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('security', 'performance', 'system', 'business')),
  severity TEXT NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  source TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  assigned_to UUID REFERENCES auth.users(id),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_performance_metrics_created_at ON performance_metrics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_status ON blockchain_transactions(status);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_created_at ON blockchain_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_blockchain_transactions_hedera_id ON blockchain_transactions(hedera_transaction_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_user_id ON user_activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_created_at ON user_activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_logs_action ON user_activity_logs(action);
CREATE INDEX IF NOT EXISTS idx_system_alerts_status ON system_alerts(status);
CREATE INDEX IF NOT EXISTS idx_system_alerts_severity ON system_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_system_alerts_type ON system_alerts(type);
CREATE INDEX IF NOT EXISTS idx_system_alerts_created_at ON system_alerts(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for blockchain_transactions updated_at
CREATE TRIGGER update_blockchain_transactions_updated_at
  BEFORE UPDATE ON blockchain_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS (Row Level Security)
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- Admin policies will be added in the admin role migration

-- Insert some sample data for testing
INSERT INTO performance_metrics (avg_response_time, uptime, throughput, peak_throughput, error_rate, cpu_usage, memory_usage)
VALUES (850, 99.95, 120, 250, 0.5, 45.2, 62.8);

INSERT INTO system_alerts (type, severity, title, description, source, metadata)
VALUES 
  ('performance', 'medium', 'High Response Time', 'API response time exceeded 2 seconds', 'performance_monitor', '{"responseTime": 2150}'),
  ('system', 'low', 'Database Backup Completed', 'Daily database backup completed successfully', 'backup_service', '{"backupSize": "2.5GB"}'),
  ('security', 'medium', 'Multiple Failed Login Attempts', 'User attempted to login 5 times with wrong password', 'auth_monitor', '{"userId": "user123", "attempts": 5}');

-- Grant necessary permissions
GRANT ALL ON performance_metrics TO authenticated;
GRANT ALL ON blockchain_transactions TO authenticated;
GRANT ALL ON user_activity_logs TO authenticated;
GRANT ALL ON system_alerts TO authenticated;
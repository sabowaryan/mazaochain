-- Create tokenization_records table to track token creation and minting
CREATE TABLE tokenization_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id UUID NOT NULL REFERENCES crop_evaluations(id) ON DELETE CASCADE,
  token_id TEXT, -- Hedera token ID (e.g., "0.0.123456")
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'minting', 'completed', 'failed')),
  transaction_ids TEXT[] DEFAULT '{}', -- Array of Hedera transaction IDs
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Ensure one tokenization record per evaluation
  UNIQUE(evaluation_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_tokenization_records_evaluation_id ON tokenization_records(evaluation_id);
CREATE INDEX idx_tokenization_records_status ON tokenization_records(status);
CREATE INDEX idx_tokenization_records_token_id ON tokenization_records(token_id);

-- Add RLS policies
ALTER TABLE tokenization_records ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view tokenization records for their own evaluations
CREATE POLICY "Users can view their tokenization records" ON tokenization_records
  FOR SELECT USING (
    evaluation_id IN (
      SELECT id FROM crop_evaluations 
      WHERE farmer_id = auth.uid()
    )
  );

-- Policy: Cooperatives can view tokenization records for evaluations they manage
CREATE POLICY "Cooperatives can view tokenization records" ON tokenization_records
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'cooperative'
    )
  );

-- Policy: Only the system (service role) can insert/update tokenization records
CREATE POLICY "System can manage tokenization records" ON tokenization_records
  FOR ALL USING (auth.role() = 'service_role');

-- Add comment for documentation
COMMENT ON TABLE tokenization_records IS 'Tracks the tokenization process for approved crop evaluations on Hedera network';
COMMENT ON COLUMN tokenization_records.token_id IS 'Hedera Token Service token ID (e.g., 0.0.123456)';
COMMENT ON COLUMN tokenization_records.transaction_ids IS 'Array of Hedera transaction IDs for token creation, minting, and transfer';
COMMENT ON COLUMN tokenization_records.status IS 'Current status of the tokenization process';
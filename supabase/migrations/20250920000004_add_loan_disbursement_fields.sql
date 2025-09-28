-- Add fields to loans table for tracking disbursement
ALTER TABLE loans ADD COLUMN IF NOT EXISTS disbursement_transaction_id TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS escrow_transaction_id TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS disbursement_status TEXT DEFAULT 'pending' CHECK (disbursement_status IN ('pending', 'processing', 'completed', 'failed'));
ALTER TABLE loans ADD COLUMN IF NOT EXISTS disbursement_error TEXT;
ALTER TABLE loans ADD COLUMN IF NOT EXISTS disbursed_at TIMESTAMP WITH TIME ZONE;

-- Add fields to transactions table for better loan tracking
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS loan_id UUID REFERENCES loans(id) ON DELETE CASCADE;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS confirmations INTEGER DEFAULT 0;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS gas_used DECIMAL;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS block_number BIGINT;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_transactions_loan_id ON transactions(loan_id);
CREATE INDEX IF NOT EXISTS idx_transactions_hedera_id ON transactions(hedera_transaction_id);
CREATE INDEX IF NOT EXISTS idx_loans_disbursement_status ON loans(disbursement_status);

-- Add function to update loan disbursement status
CREATE OR REPLACE FUNCTION update_loan_disbursement_status(
  p_loan_id UUID,
  p_status TEXT,
  p_transaction_id TEXT DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE loans 
  SET 
    disbursement_status = p_status,
    disbursement_transaction_id = COALESCE(p_transaction_id, disbursement_transaction_id),
    disbursement_error = p_error_message,
    disbursed_at = CASE WHEN p_status = 'completed' THEN NOW() ELSE disbursed_at END
  WHERE id = p_loan_id;
  
  RETURN FOUND;
END;
$$;

-- Add function to get loan transaction summary
CREATE OR REPLACE FUNCTION get_loan_transaction_summary(p_loan_id UUID)
RETURNS TABLE (
  transaction_type TEXT,
  status TEXT,
  hedera_transaction_id TEXT,
  amount DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.transaction_type,
    t.status,
    t.hedera_transaction_id,
    t.amount,
    t.created_at
  FROM transactions t
  WHERE t.loan_id = p_loan_id
  ORDER BY t.created_at DESC;
END;
$$;

-- Add RLS policies for new fields
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Policy for users to see their own loan transactions
CREATE POLICY "Users can view their loan transactions" ON transactions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM loans l 
      WHERE l.id = loan_id 
      AND (l.borrower_id = auth.uid() OR l.lender_id = auth.uid())
    )
  );

-- Policy for users to insert their own transactions
CREATE POLICY "Users can insert their transactions" ON transactions
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Policy for system to update transaction status
CREATE POLICY "System can update transactions" ON transactions
  FOR UPDATE USING (true);

-- Add comments for documentation
COMMENT ON COLUMN loans.disbursement_transaction_id IS 'Hedera transaction ID for USDC disbursement';
COMMENT ON COLUMN loans.escrow_transaction_id IS 'Hedera transaction ID for collateral escrow';
COMMENT ON COLUMN loans.disbursement_status IS 'Status of the automated disbursement process';
COMMENT ON COLUMN loans.disbursement_error IS 'Error message if disbursement failed';
COMMENT ON COLUMN loans.disbursed_at IS 'Timestamp when loan was successfully disbursed';

COMMENT ON COLUMN transactions.loan_id IS 'Reference to the loan this transaction belongs to';
COMMENT ON COLUMN transactions.confirmations IS 'Number of network confirmations for this transaction';
COMMENT ON COLUMN transactions.gas_used IS 'Amount of gas/fees used for this transaction';
COMMENT ON COLUMN transactions.block_number IS 'Block number where transaction was included';

COMMENT ON FUNCTION update_loan_disbursement_status IS 'Updates loan disbursement status and related fields';
COMMENT ON FUNCTION get_loan_transaction_summary IS 'Returns summary of all transactions for a specific loan';
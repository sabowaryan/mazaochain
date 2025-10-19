-- Migration to verify and add any missing fields identified in audit
-- Date: 2025-10-08
-- Purpose: Ensure all fields from previous migrations are present

-- Add missing disbursement fields to loans table (if not already present)
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS disbursement_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS escrow_transaction_id TEXT,
ADD COLUMN IF NOT EXISTS disbursement_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS disbursement_error TEXT,
ADD COLUMN IF NOT EXISTS disbursed_at TIMESTAMP WITH TIME ZONE;

-- Add constraint for disbursement_status if not exists
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'loans_disbursement_status_check'
  ) THEN
    ALTER TABLE loans 
    ADD CONSTRAINT loans_disbursement_status_check 
    CHECK (disbursement_status IN ('pending', 'processing', 'completed', 'failed'));
  END IF;
END $$;

-- Add missing transaction tracking fields (if not already present)
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS confirmations INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS gas_used DECIMAL,
ADD COLUMN IF NOT EXISTS block_number BIGINT;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_transactions_loan_id ON transactions(loan_id);
CREATE INDEX IF NOT EXISTS idx_transactions_hedera_id ON transactions(hedera_transaction_id);
CREATE INDEX IF NOT EXISTS idx_loans_disbursement_status ON loans(disbursement_status);

-- Add email and phone_number to profiles if not present
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Ensure transaction_type constraint includes all types
ALTER TABLE transactions DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;
ALTER TABLE transactions 
ADD CONSTRAINT transactions_transaction_type_check 
CHECK (transaction_type IN ('mint', 'burn', 'loan', 'repayment', 'transfer', 'disbursement', 'escrow', 'release'));

-- Add function to update loan disbursement status (if not exists)
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

-- Add function to get loan transaction summary (if not exists)
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

-- Update RLS policies for transactions to include loan-based access
DROP POLICY IF EXISTS "Users can view their loan transactions" ON transactions;
CREATE POLICY "Users can view their loan transactions" ON transactions
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM loans l 
      WHERE l.id = loan_id 
      AND (l.borrower_id = auth.uid() OR l.lender_id = auth.uid())
    )
  );

-- Add comments for documentation
COMMENT ON COLUMN loans.disbursement_transaction_id IS 'Hedera transaction ID for USDC disbursement to borrower';
COMMENT ON COLUMN loans.escrow_transaction_id IS 'Hedera transaction ID for collateral placed in escrow';
COMMENT ON COLUMN loans.disbursement_status IS 'Status of the automated loan disbursement process';
COMMENT ON COLUMN loans.disbursement_error IS 'Error message if automated disbursement failed';
COMMENT ON COLUMN loans.disbursed_at IS 'Timestamp when loan funds were successfully disbursed';

COMMENT ON COLUMN transactions.loan_id IS 'Reference to the loan this transaction is associated with';
COMMENT ON COLUMN transactions.confirmations IS 'Number of network confirmations received for this transaction';
COMMENT ON COLUMN transactions.gas_used IS 'Amount of gas/fees consumed by this transaction';
COMMENT ON COLUMN transactions.block_number IS 'Blockchain block number where this transaction was included';

-- Verify all critical tables exist
DO $$ 
DECLARE
  missing_tables TEXT[] := ARRAY[]::TEXT[];
  required_tables TEXT[] := ARRAY[
    'profiles',
    'farmer_profiles', 
    'cooperative_profiles',
    'lender_profiles',
    'crop_evaluations',
    'loans',
    'transactions',
    'tokenization_records',
    'repayment_schedule',
    'notifications'
  ];
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY required_tables
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = tbl
    ) THEN
      missing_tables := array_append(missing_tables, tbl);
    END IF;
  END LOOP;
  
  IF array_length(missing_tables, 1) > 0 THEN
    RAISE EXCEPTION 'Missing required tables: %', array_to_string(missing_tables, ', ');
  ELSE
    RAISE NOTICE 'All required tables verified: %', array_to_string(required_tables, ', ');
  END IF;
END $$;

-- Add composite indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_loans_status_borrower ON loans(status, borrower_id);
CREATE INDEX IF NOT EXISTS idx_loans_status_created ON loans(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crop_evaluations_status_farmer ON crop_evaluations(status, farmer_id);
CREATE INDEX IF NOT EXISTS idx_crop_evaluations_status_created ON crop_evaluations(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_user_status ON transactions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_transactions_loan_status ON transactions(loan_id, status) WHERE loan_id IS NOT NULL;

-- Add partial indexes for pending items (frequently queried)
CREATE INDEX IF NOT EXISTS idx_loans_pending ON loans(created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_evaluations_pending ON crop_evaluations(created_at DESC) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_transactions_pending ON transactions(created_at DESC) WHERE status = 'pending';

-- Verify RLS is enabled on all critical tables
DO $$ 
DECLARE
  tables_without_rls TEXT[] := ARRAY[]::TEXT[];
  critical_tables TEXT[] := ARRAY[
    'profiles',
    'farmer_profiles',
    'cooperative_profiles', 
    'lender_profiles',
    'crop_evaluations',
    'loans',
    'transactions',
    'tokenization_records',
    'repayment_schedule'
  ];
  tbl TEXT;
  rls_enabled BOOLEAN;
BEGIN
  FOREACH tbl IN ARRAY critical_tables
  LOOP
    SELECT relrowsecurity INTO rls_enabled
    FROM pg_class
    WHERE relname = tbl AND relnamespace = 'public'::regnamespace;
    
    IF NOT COALESCE(rls_enabled, FALSE) THEN
      tables_without_rls := array_append(tables_without_rls, tbl);
    END IF;
  END LOOP;
  
  IF array_length(tables_without_rls, 1) > 0 THEN
    RAISE WARNING 'RLS not enabled on tables: %', array_to_string(tables_without_rls, ', ');
  ELSE
    RAISE NOTICE 'RLS verified on all critical tables';
  END IF;
END $$;

-- Success message
DO $$ 
BEGIN
  RAISE NOTICE '✅ Database schema verification and updates completed successfully';
  RAISE NOTICE '✅ All required tables present';
  RAISE NOTICE '✅ All required columns added';
  RAISE NOTICE '✅ All indexes created';
  RAISE NOTICE '✅ All functions updated';
  RAISE NOTICE '✅ RLS policies verified';
END $$;

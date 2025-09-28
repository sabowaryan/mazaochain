-- Add repayment tracking fields to loans table
ALTER TABLE loans 
ADD COLUMN IF NOT EXISTS outstanding_balance DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_repaid DECIMAL DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS next_payment_due TIMESTAMP;

-- Create repayment_schedule table for tracking payment schedules
CREATE TABLE IF NOT EXISTS repayment_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID REFERENCES loans(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  due_date TIMESTAMP NOT NULL,
  principal_amount DECIMAL NOT NULL,
  interest_amount DECIMAL NOT NULL,
  total_amount DECIMAL NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  paid_at TIMESTAMP,
  paid_amount DECIMAL DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_repayment_schedule_loan_id ON repayment_schedule(loan_id);
CREATE INDEX IF NOT EXISTS idx_repayment_schedule_due_date ON repayment_schedule(due_date);
CREATE INDEX IF NOT EXISTS idx_repayment_schedule_status ON repayment_schedule(status);

-- Update transaction types to include more repayment-related types
ALTER TABLE transactions 
DROP CONSTRAINT IF EXISTS transactions_transaction_type_check;

ALTER TABLE transactions 
ADD CONSTRAINT transactions_transaction_type_check 
CHECK (transaction_type IN ('mint', 'burn', 'loan', 'repayment', 'transfer', 'disbursement', 'escrow', 'release'));

-- Function to update loan outstanding balance
CREATE OR REPLACE FUNCTION update_loan_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Update outstanding balance when a repayment transaction is recorded
  IF NEW.transaction_type = 'repayment' AND NEW.status = 'confirmed' THEN
    UPDATE loans 
    SET 
      total_repaid = COALESCE(total_repaid, 0) + NEW.amount,
      outstanding_balance = principal - (COALESCE(total_repaid, 0) + NEW.amount),
      last_payment_date = NEW.created_at
    WHERE id = NEW.loan_id;
    
    -- Check if loan is fully repaid
    UPDATE loans 
    SET status = 'repaid'
    WHERE id = NEW.loan_id 
    AND outstanding_balance <= 0 
    AND status = 'active';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic balance updates
DROP TRIGGER IF EXISTS trigger_update_loan_balance ON transactions;
CREATE TRIGGER trigger_update_loan_balance
  AFTER INSERT OR UPDATE ON transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_loan_balance();

-- Initialize outstanding_balance for existing loans
UPDATE loans 
SET outstanding_balance = principal - COALESCE(total_repaid, 0)
WHERE outstanding_balance IS NULL OR outstanding_balance = 0;

-- Function to generate repayment schedule
CREATE OR REPLACE FUNCTION generate_repayment_schedule(
  p_loan_id UUID,
  p_principal DECIMAL,
  p_interest_rate DECIMAL,
  p_term_months INTEGER
)
RETURNS VOID AS $$
DECLARE
  monthly_rate DECIMAL;
  monthly_payment DECIMAL;
  remaining_balance DECIMAL;
  principal_payment DECIMAL;
  interest_payment DECIMAL;
  payment_date TIMESTAMP;
  i INTEGER;
BEGIN
  -- Calculate monthly interest rate
  monthly_rate := p_interest_rate / 12;
  
  -- Calculate monthly payment using loan formula
  IF monthly_rate > 0 THEN
    monthly_payment := (p_principal * monthly_rate * POWER(1 + monthly_rate, p_term_months)) / 
                      (POWER(1 + monthly_rate, p_term_months) - 1);
  ELSE
    monthly_payment := p_principal / p_term_months;
  END IF;
  
  remaining_balance := p_principal;
  
  -- Generate schedule for each month
  FOR i IN 1..p_term_months LOOP
    -- Calculate interest for this period
    interest_payment := remaining_balance * monthly_rate;
    
    -- Calculate principal payment
    principal_payment := monthly_payment - interest_payment;
    
    -- Adjust last payment to account for rounding
    IF i = p_term_months THEN
      principal_payment := remaining_balance;
      monthly_payment := principal_payment + interest_payment;
    END IF;
    
    -- Calculate payment due date (30 days from loan creation for each installment)
    SELECT created_at + INTERVAL '30 days' * i INTO payment_date
    FROM loans WHERE id = p_loan_id;
    
    -- Insert repayment schedule entry
    INSERT INTO repayment_schedule (
      loan_id,
      installment_number,
      due_date,
      principal_amount,
      interest_amount,
      total_amount
    ) VALUES (
      p_loan_id,
      i,
      payment_date,
      principal_payment,
      interest_payment,
      monthly_payment
    );
    
    -- Update remaining balance
    remaining_balance := remaining_balance - principal_payment;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
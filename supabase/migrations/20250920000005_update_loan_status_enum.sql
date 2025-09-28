-- Add 'rejected' status to loan status check constraint
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_status_check;
ALTER TABLE loans ADD CONSTRAINT loans_status_check 
  CHECK (status IN ('pending', 'approved', 'active', 'repaid', 'defaulted', 'rejected'));
-- Comprehensive RLS (Row Level Security) Implementation
-- This migration properly enables and configures RLS for all tables
-- Requirement 10.3: Ensure proper data isolation and security

-- ============================================================================
-- STEP 1: Enable RLS on all tables
-- ============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE cooperative_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE lender_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE crop_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE tokenization_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE repayment_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE blockchain_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_alerts ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- STEP 2: Drop all existing policies to ensure clean state
-- ============================================================================

-- Profiles policies
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Cooperatives can view farmer profiles" ON profiles;

-- Farmer profiles policies
DROP POLICY IF EXISTS "farmer_profiles_select_own" ON farmer_profiles;
DROP POLICY IF EXISTS "farmer_profiles_manage_own" ON farmer_profiles;
DROP POLICY IF EXISTS "Users can manage own farmer profile" ON farmer_profiles;
DROP POLICY IF EXISTS "Cooperatives can view farmer profiles" ON farmer_profiles;

-- Cooperative profiles policies
DROP POLICY IF EXISTS "cooperative_profiles_own_only" ON cooperative_profiles;
DROP POLICY IF EXISTS "Users can manage own cooperative profile" ON cooperative_profiles;

-- Lender profiles policies
DROP POLICY IF EXISTS "lender_profiles_own_only" ON lender_profiles;

DROP POLICY IF EXISTS "Users can manage own lender profile" ON lender_profiles;

-- Crop evaluations policies
DROP POLICY IF EXISTS "crop_evaluations_manage_own" ON crop_evaluations;
DROP POLICY IF EXISTS "Farmers can manage own evaluations" ON crop_evaluations;
DROP POLICY IF EXISTS "Cooperatives can view all evaluations" ON crop_evaluations;
DROP POLICY IF EXISTS "Cooperatives can update evaluation status" ON crop_evaluations;

-- Loans policies
DROP POLICY IF EXISTS "Users can view own loans" ON loans;
DROP POLICY IF EXISTS "Borrowers can create loans" ON loans;
DROP POLICY IF EXISTS "Cooperatives can view all loans" ON loans;
DROP POLICY IF EXISTS "Cooperatives can update loan status" ON loans;
DROP POLICY IF EXISTS "Lenders can view funded loans" ON loans;

-- Transactions policies
DROP POLICY IF EXISTS "Users can view own transactions" ON transactions;
DROP POLICY IF EXISTS "Users can create own transactions" ON transactions;
DROP POLICY IF EXISTS "System can update transactions" ON transactions;
DROP POLICY IF EXISTS "Users can view their loan transactions" ON transactions;
DROP POLICY IF EXISTS "Users can insert their transactions" ON transactions;

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;

-- Notification preferences policies
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;

-- Tokenization records policies
DROP POLICY IF EXISTS "Users can view their tokenization records" ON tokenization_records;
DROP POLICY IF EXISTS "Cooperatives can view tokenization records" ON tokenization_records;
DROP POLICY IF EXISTS "System can manage tokenization records" ON tokenization_records;

-- Email/SMS logs policies
DROP POLICY IF EXISTS "Service role can manage email logs" ON email_logs;
DROP POLICY IF EXISTS "Service role can manage SMS logs" ON sms_logs;

-- Error logs policies
DROP POLICY IF EXISTS "Service role can insert error logs" ON error_logs;
DROP POLICY IF EXISTS "Users can view own error logs" ON error_logs;

-- ============================================================================
-- STEP 3: Create helper function to check user role
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS user_role AS $$
BEGIN
  RETURN (
    SELECT role FROM public.profiles WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================================
-- STEP 4: PROFILES TABLE - Base user profiles
-- ============================================================================

-- Users can view and update their own profile
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Cooperatives can view farmer profiles in their region
CREATE POLICY "cooperatives_view_farmers" ON profiles
  FOR SELECT USING (
    role = 'agriculteur' 
    AND public.get_user_role() = 'cooperative'
  );

-- Admins can view all profiles
CREATE POLICY "admins_view_all_profiles" ON profiles
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "admins_manage_all_profiles" ON profiles
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- STEP 5: FARMER PROFILES TABLE
-- ============================================================================

-- Farmers can manage their own profile
CREATE POLICY "farmers_manage_own" ON farmer_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Cooperatives can view farmer profiles
CREATE POLICY "cooperatives_view_farmers" ON farmer_profiles
  FOR SELECT USING (public.get_user_role() = 'cooperative');

-- Cooperatives can update farmer validation status
CREATE POLICY "cooperatives_validate_farmers" ON farmer_profiles
  FOR UPDATE USING (
    public.get_user_role() = 'cooperative'
    AND cooperative_id = auth.uid()
  );

-- Admins can manage all farmer profiles
CREATE POLICY "admins_manage_farmer_profiles" ON farmer_profiles
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- STEP 6: COOPERATIVE PROFILES TABLE
-- ============================================================================

-- Cooperatives can manage their own profile
CREATE POLICY "cooperatives_manage_own" ON cooperative_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Admins can manage all cooperative profiles
CREATE POLICY "admins_manage_cooperative_profiles" ON cooperative_profiles
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- STEP 7: LENDER PROFILES TABLE
-- ============================================================================

-- Lenders can manage their own profile
CREATE POLICY "lenders_manage_own" ON lender_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Admins can manage all lender profiles
CREATE POLICY "admins_manage_lender_profiles" ON lender_profiles
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- STEP 8: CROP EVALUATIONS TABLE
-- ============================================================================

-- Farmers can manage their own evaluations
CREATE POLICY "farmers_manage_own_evaluations" ON crop_evaluations
  FOR ALL USING (auth.uid() = farmer_id);

-- Cooperatives can view all evaluations
CREATE POLICY "cooperatives_view_evaluations" ON crop_evaluations
  FOR SELECT USING (public.get_user_role() = 'cooperative');

-- Cooperatives can update evaluation status (approve/reject)
CREATE POLICY "cooperatives_update_evaluation_status" ON crop_evaluations
  FOR UPDATE USING (
    public.get_user_role() = 'cooperative'
    AND status = 'pending'
  );

-- Admins can manage all evaluations
CREATE POLICY "admins_manage_evaluations" ON crop_evaluations
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- STEP 9: LOANS TABLE
-- ============================================================================

-- Borrowers can view their own loans
CREATE POLICY "borrowers_view_own_loans" ON loans
  FOR SELECT USING (auth.uid() = borrower_id);

-- Borrowers can create loan requests
CREATE POLICY "borrowers_create_loans" ON loans
  FOR INSERT WITH CHECK (auth.uid() = borrower_id);

-- Lenders can view loans they funded
CREATE POLICY "lenders_view_funded_loans" ON loans
  FOR SELECT USING (auth.uid() = lender_id);

-- Lenders can update their funded loans (for investment tracking)
CREATE POLICY "lenders_update_funded_loans" ON loans
  FOR UPDATE USING (auth.uid() = lender_id);

-- Cooperatives can view all loans
CREATE POLICY "cooperatives_view_all_loans" ON loans
  FOR SELECT USING (public.get_user_role() = 'cooperative');

-- Cooperatives can update loan status (approve/reject)
CREATE POLICY "cooperatives_update_loan_status" ON loans
  FOR UPDATE USING (
    public.get_user_role() = 'cooperative'
    AND status IN ('pending', 'approved')
  );

-- Admins can manage all loans
CREATE POLICY "admins_manage_loans" ON loans
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- STEP 10: TRANSACTIONS TABLE
-- ============================================================================

-- Users can view their own transactions
CREATE POLICY "users_view_own_transactions" ON transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create their own transactions
CREATE POLICY "users_create_own_transactions" ON transactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can view transactions related to their loans
CREATE POLICY "users_view_loan_transactions" ON transactions
  FOR SELECT USING (
    loan_id IN (
      SELECT id FROM loans 
      WHERE borrower_id = auth.uid() OR lender_id = auth.uid()
    )
  );

-- Cooperatives can view all transactions
CREATE POLICY "cooperatives_view_all_transactions" ON transactions
  FOR SELECT USING (public.get_user_role() = 'cooperative');

-- Admins can manage all transactions
CREATE POLICY "admins_manage_transactions" ON transactions
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- STEP 11: NOTIFICATIONS TABLE
-- ============================================================================

-- Users can view their own notifications
CREATE POLICY "users_view_own_notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "users_update_own_notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System can create notifications for any user
CREATE POLICY "system_create_notifications" ON notifications
  FOR INSERT WITH CHECK (true);

-- Admins can manage all notifications
CREATE POLICY "admins_manage_notifications" ON notifications
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- STEP 12: NOTIFICATION PREFERENCES TABLE
-- ============================================================================

-- Users can manage their own notification preferences
CREATE POLICY "users_manage_own_preferences" ON notification_preferences
  FOR ALL USING (auth.uid() = user_id);

-- Admins can view all notification preferences
CREATE POLICY "admins_view_preferences" ON notification_preferences
  FOR SELECT USING (public.get_user_role() = 'admin');

-- ============================================================================
-- STEP 13: TOKENIZATION RECORDS TABLE
-- ============================================================================

-- Farmers can view tokenization records for their evaluations
CREATE POLICY "farmers_view_own_tokenization" ON tokenization_records
  FOR SELECT USING (
    evaluation_id IN (
      SELECT id FROM crop_evaluations WHERE farmer_id = auth.uid()
    )
  );

-- Cooperatives can view all tokenization records
CREATE POLICY "cooperatives_view_tokenization" ON tokenization_records
  FOR SELECT USING (public.get_user_role() = 'cooperative');

-- System/Service role can manage tokenization records
CREATE POLICY "system_manage_tokenization" ON tokenization_records
  FOR ALL USING (
    auth.role() = 'service_role' 
    OR public.get_user_role() = 'admin'
  );

-- ============================================================================
-- STEP 14: REPAYMENT SCHEDULE TABLE
-- ============================================================================

-- Borrowers can view their own repayment schedules
CREATE POLICY "borrowers_view_own_schedule" ON repayment_schedule
  FOR SELECT USING (
    loan_id IN (
      SELECT id FROM loans WHERE borrower_id = auth.uid()
    )
  );

-- Lenders can view repayment schedules for their loans
CREATE POLICY "lenders_view_funded_schedule" ON repayment_schedule
  FOR SELECT USING (
    loan_id IN (
      SELECT id FROM loans WHERE lender_id = auth.uid()
    )
  );

-- Cooperatives can view all repayment schedules
CREATE POLICY "cooperatives_view_all_schedules" ON repayment_schedule
  FOR SELECT USING (public.get_user_role() = 'cooperative');

-- System can manage repayment schedules
CREATE POLICY "system_manage_schedules" ON repayment_schedule
  FOR ALL USING (
    auth.role() = 'service_role' 
    OR public.get_user_role() = 'admin'
  );

-- ============================================================================
-- STEP 15: EMAIL AND SMS LOGS (Admin/System only)
-- ============================================================================

-- Only service role and admins can access email logs
CREATE POLICY "service_manage_email_logs" ON email_logs
  FOR ALL USING (
    auth.role() = 'service_role' 
    OR public.get_user_role() = 'admin'
  );

-- Only service role and admins can access SMS logs
CREATE POLICY "service_manage_sms_logs" ON sms_logs
  FOR ALL USING (
    auth.role() = 'service_role' 
    OR public.get_user_role() = 'admin'
  );

-- ============================================================================
-- STEP 16: ERROR LOGS TABLE
-- ============================================================================

-- Service role can insert error logs
CREATE POLICY "service_insert_error_logs" ON error_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- Users can view their own error logs
CREATE POLICY "users_view_own_errors" ON error_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all error logs
CREATE POLICY "admins_view_all_errors" ON error_logs
  FOR SELECT USING (public.get_user_role() = 'admin');

-- ============================================================================
-- STEP 17: ADMIN MONITORING TABLES
-- ============================================================================

-- Performance metrics - Admin only
CREATE POLICY "admins_manage_performance_metrics" ON performance_metrics
  FOR ALL USING (public.get_user_role() = 'admin');

-- Blockchain transactions - Admin and service role
CREATE POLICY "admins_view_blockchain_transactions" ON blockchain_transactions
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "service_manage_blockchain_transactions" ON blockchain_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- User activity logs - Admin only
CREATE POLICY "admins_view_activity_logs" ON user_activity_logs
  FOR SELECT USING (public.get_user_role() = 'admin');

CREATE POLICY "service_insert_activity_logs" ON user_activity_logs
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- System alerts - Admin only
CREATE POLICY "admins_manage_system_alerts" ON system_alerts
  FOR ALL USING (public.get_user_role() = 'admin');

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Create a view to verify RLS is enabled on all tables
CREATE OR REPLACE VIEW rls_status AS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Create a view to list all policies
CREATE OR REPLACE VIEW rls_policies AS
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Grant access to these views for authenticated users
GRANT SELECT ON rls_status TO authenticated;
GRANT SELECT ON rls_policies TO authenticated;

-- Add comments for documentation
COMMENT ON FUNCTION public.get_user_role() IS 'Helper function to get the current user role from profiles table';
COMMENT ON VIEW rls_status IS 'Shows RLS status for all public tables';
COMMENT ON VIEW rls_policies IS 'Lists all RLS policies in the public schema';

-- Force clean all RLS policies and disable RLS completely
-- This migration will clean up any remaining problematic policies

-- First, disable RLS on all tables to prevent any issues
ALTER TABLE IF EXISTS profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS farmer_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cooperative_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS lender_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS crop_evaluations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS loans DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notification_preferences DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tokenization_records DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to ensure clean state
DROP POLICY IF EXISTS "profiles_select_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Cooperatives can view farmer profiles" ON profiles;

DROP POLICY IF EXISTS "farmer_profiles_select_own" ON farmer_profiles;
DROP POLICY IF EXISTS "farmer_profiles_manage_own" ON farmer_profiles;
DROP POLICY IF EXISTS "Cooperatives can view farmer profiles" ON farmer_profiles;

DROP POLICY IF EXISTS "cooperative_profiles_own_only" ON cooperative_profiles;
DROP POLICY IF EXISTS "lender_profiles_own_only" ON lender_profiles;

DROP POLICY IF EXISTS "crop_evaluations_manage_own" ON crop_evaluations;
DROP POLICY IF EXISTS "Cooperatives can view all evaluations" ON crop_evaluations;
DROP POLICY IF EXISTS "Cooperatives can update evaluation status" ON crop_evaluations;

DROP POLICY IF EXISTS "Users can view own loans" ON loans;
DROP POLICY IF EXISTS "Borrowers can create loans" ON loans;
DROP POLICY IF EXISTS "Cooperatives can view all loans" ON loans;
DROP POLICY IF EXISTS "Cooperatives can update loan status" ON loans;

-- Drop any functions that might cause issues
DROP FUNCTION IF EXISTS public.get_user_role();

-- Note: RLS is now completely disabled for testing purposes
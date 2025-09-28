-- Fix RLS policies to prevent infinite recursion
-- This migration corrects the problematic policies from the initial schema

-- 1. Drop all existing problematic policies on profiles table
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Cooperatives can view farmer profiles" ON profiles;

-- 2. Create simple, non-recursive policies for profiles table
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Fix problematic policies on other tables that reference profiles

-- Drop problematic farmer_profiles policies
DROP POLICY IF EXISTS "Cooperatives can view farmer profiles" ON farmer_profiles;

-- Create a simpler policy for farmer_profiles
CREATE POLICY "farmer_profiles_select_own" ON farmer_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "farmer_profiles_manage_own" ON farmer_profiles
  FOR ALL USING (auth.uid() = user_id);

-- Drop problematic crop_evaluations policies
DROP POLICY IF EXISTS "Cooperatives can view all evaluations" ON crop_evaluations;
DROP POLICY IF EXISTS "Cooperatives can update evaluation status" ON crop_evaluations;

-- Create simpler policies for crop_evaluations
CREATE POLICY "crop_evaluations_manage_own" ON crop_evaluations
  FOR ALL USING (auth.uid() = farmer_id);

-- Drop problematic loans policies
DROP POLICY IF EXISTS "Cooperatives can view all loans" ON loans;
DROP POLICY IF EXISTS "Cooperatives can update loan status" ON loans;

-- Keep the simple loans policies that work
-- "Users can view own loans" and "Borrowers can create loans" are fine

-- 4. Simple policies for other profile tables
CREATE POLICY "cooperative_profiles_own_only" ON cooperative_profiles
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "lender_profiles_own_only" ON lender_profiles
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies fixed successfully - simple version without recursion
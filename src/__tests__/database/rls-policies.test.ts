/**
 * RLS (Row Level Security) Policies Test Suite
 * 
 * This test suite verifies that RLS policies are correctly configured
 * to ensure proper data isolation between users of different roles.
 * 
 * Requirements: 10.3 - Row Level Security policies
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Test configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

describe('RLS Policies', () => {
  let serviceClient: SupabaseClient;
  let farmerClient: SupabaseClient;
  let cooperativeClient: SupabaseClient;
  let lenderClient: SupabaseClient;
  
  let farmerUserId: string;
  let cooperativeUserId: string;
  let lenderUserId: string;
  let otherFarmerUserId: string;

  beforeAll(async () => {
    // Create service role client (bypasses RLS)
    serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Create test users with different roles
    const farmerEmail = `farmer-${Date.now()}@test.com`;
    const cooperativeEmail = `cooperative-${Date.now()}@test.com`;
    const lenderEmail = `lender-${Date.now()}@test.com`;
    const otherFarmerEmail = `farmer2-${Date.now()}@test.com`;

    // Create farmer user
    const { data: farmerData, error: farmerError } = await serviceClient.auth.admin.createUser({
      email: farmerEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: { role: 'agriculteur' }
    });
    
    if (farmerError) throw farmerError;
    farmerUserId = farmerData.user.id;

    // Create cooperative user
    const { data: cooperativeData, error: cooperativeError } = await serviceClient.auth.admin.createUser({
      email: cooperativeEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: { role: 'cooperative' }
    });
    
    if (cooperativeError) throw cooperativeError;
    cooperativeUserId = cooperativeData.user.id;

    // Create lender user
    const { data: lenderData, error: lenderError } = await serviceClient.auth.admin.createUser({
      email: lenderEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: { role: 'preteur' }
    });
    
    if (lenderError) throw lenderError;
    lenderUserId = lenderData.user.id;

    // Create another farmer user
    const { data: otherFarmerData, error: otherFarmerError } = await serviceClient.auth.admin.createUser({
      email: otherFarmerEmail,
      password: 'TestPassword123!',
      email_confirm: true,
      user_metadata: { role: 'agriculteur' }
    });
    
    if (otherFarmerError) throw otherFarmerError;
    otherFarmerUserId = otherFarmerData.user.id;

    // Wait for profiles to be created by trigger
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create authenticated clients for each user
    farmerClient = createClient(supabaseUrl, supabaseAnonKey);
    await farmerClient.auth.signInWithPassword({
      email: farmerEmail,
      password: 'TestPassword123!'
    });

    cooperativeClient = createClient(supabaseUrl, supabaseAnonKey);
    await cooperativeClient.auth.signInWithPassword({
      email: cooperativeEmail,
      password: 'TestPassword123!'
    });

    lenderClient = createClient(supabaseUrl, supabaseAnonKey);
    await lenderClient.auth.signInWithPassword({
      email: lenderEmail,
      password: 'TestPassword123!'
    });
  });

  afterAll(async () => {
    // Clean up test users
    if (farmerUserId) {
      await serviceClient.auth.admin.deleteUser(farmerUserId);
    }
    if (cooperativeUserId) {
      await serviceClient.auth.admin.deleteUser(cooperativeUserId);
    }
    if (lenderUserId) {
      await serviceClient.auth.admin.deleteUser(lenderUserId);
    }
    if (otherFarmerUserId) {
      await serviceClient.auth.admin.deleteUser(otherFarmerUserId);
    }
  });

  describe('Profiles Table RLS', () => {
    it('should allow users to view their own profile', async () => {
      const { data, error } = await farmerClient
        .from('profiles')
        .select('*')
        .eq('id', farmerUserId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.id).toBe(farmerUserId);
    });

    it('should prevent users from viewing other user profiles (except cooperatives)', async () => {
      const { data, error } = await farmerClient
        .from('profiles')
        .select('*')
        .eq('id', lenderUserId)
        .single();

      // Should return no data or error due to RLS
      expect(data).toBeNull();
    });

    it('should allow cooperatives to view farmer profiles', async () => {
      const { data, error } = await cooperativeClient
        .from('profiles')
        .select('*')
        .eq('role', 'agriculteur');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBeGreaterThan(0);
    });
  });

  describe('Crop Evaluations RLS', () => {
    let evaluationId: string;

    beforeAll(async () => {
      // Create a test evaluation using service client
      const { data, error } = await serviceClient
        .from('crop_evaluations')
        .insert({
          farmer_id: farmerUserId,
          crop_type: 'manioc',
          superficie: 2,
          rendement_historique: 1000,
          prix_reference: 0.5,
          valeur_estimee: 1000,
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      evaluationId = data.id;
    });

    it('should allow farmers to view their own evaluations', async () => {
      const { data, error } = await farmerClient
        .from('crop_evaluations')
        .select('*')
        .eq('id', evaluationId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.farmer_id).toBe(farmerUserId);
    });

    it('should prevent farmers from viewing other farmers evaluations', async () => {
      // Create evaluation for other farmer
      const { data: otherEval } = await serviceClient
        .from('crop_evaluations')
        .insert({
          farmer_id: otherFarmerUserId,
          crop_type: 'cafe',
          superficie: 1,
          rendement_historique: 500,
          prix_reference: 1.0,
          valeur_estimee: 500,
          status: 'pending'
        })
        .select()
        .single();

      // Try to access with farmer client
      const { data, error } = await farmerClient
        .from('crop_evaluations')
        .select('*')
        .eq('id', otherEval?.id)
        .single();

      expect(data).toBeNull();
    });

    it('should allow cooperatives to view all evaluations', async () => {
      const { data, error } = await cooperativeClient
        .from('crop_evaluations')
        .select('*');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBeGreaterThan(0);
    });

    it('should allow cooperatives to update evaluation status', async () => {
      const { data, error } = await cooperativeClient
        .from('crop_evaluations')
        .update({ status: 'approved' })
        .eq('id', evaluationId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.status).toBe('approved');
    });
  });

  describe('Loans Table RLS', () => {
    let loanId: string;

    beforeAll(async () => {
      // Create a test loan using service client
      const { data, error } = await serviceClient
        .from('loans')
        .insert({
          borrower_id: farmerUserId,
          lender_id: lenderUserId,
          principal: 1000,
          collateral_amount: 2000,
          interest_rate: 0.1,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;
      loanId = data.id;
    });

    it('should allow borrowers to view their own loans', async () => {
      const { data, error } = await farmerClient
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.borrower_id).toBe(farmerUserId);
    });

    it('should allow lenders to view loans they funded', async () => {
      const { data, error } = await lenderClient
        .from('loans')
        .select('*')
        .eq('id', loanId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.lender_id).toBe(lenderUserId);
    });

    it('should prevent users from viewing loans they are not involved in', async () => {
      // Create loan for other farmer
      const { data: otherLoan } = await serviceClient
        .from('loans')
        .insert({
          borrower_id: otherFarmerUserId,
          principal: 500,
          collateral_amount: 1000,
          interest_rate: 0.1,
          due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          status: 'pending'
        })
        .select()
        .single();

      // Try to access with farmer client
      const { data, error } = await farmerClient
        .from('loans')
        .select('*')
        .eq('id', otherLoan?.id)
        .single();

      expect(data).toBeNull();
    });

    it('should allow cooperatives to view all loans', async () => {
      const { data, error } = await cooperativeClient
        .from('loans')
        .select('*');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBeGreaterThan(0);
    });

    it('should allow cooperatives to update loan status', async () => {
      const { data, error } = await cooperativeClient
        .from('loans')
        .update({ status: 'approved' })
        .eq('id', loanId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.status).toBe('approved');
    });
  });

  describe('Transactions Table RLS', () => {
    let transactionId: string;

    beforeAll(async () => {
      // Create a test transaction using service client
      const { data, error } = await serviceClient
        .from('transactions')
        .insert({
          user_id: farmerUserId,
          transaction_type: 'mint',
          from_address: '0.0.123456',
          to_address: '0.0.789012',
          amount: 1000,
          token_type: 'MAZAO',
          status: 'confirmed'
        })
        .select()
        .single();

      if (error) throw error;
      transactionId = data.id;
    });

    it('should allow users to view their own transactions', async () => {
      const { data, error } = await farmerClient
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.user_id).toBe(farmerUserId);
    });

    it('should prevent users from viewing other users transactions', async () => {
      // Create transaction for other user
      const { data: otherTx } = await serviceClient
        .from('transactions')
        .insert({
          user_id: otherFarmerUserId,
          transaction_type: 'transfer',
          from_address: '0.0.111111',
          to_address: '0.0.222222',
          amount: 500,
          token_type: 'USDC',
          status: 'confirmed'
        })
        .select()
        .single();

      // Try to access with farmer client
      const { data, error } = await farmerClient
        .from('transactions')
        .select('*')
        .eq('id', otherTx?.id)
        .single();

      expect(data).toBeNull();
    });

    it('should allow cooperatives to view all transactions', async () => {
      const { data, error } = await cooperativeClient
        .from('transactions')
        .select('*');

      expect(error).toBeNull();
      expect(data).toBeDefined();
    });
  });

  describe('Notifications Table RLS', () => {
    let notificationId: string;

    beforeAll(async () => {
      // Create a test notification using service client
      const { data, error } = await serviceClient
        .from('notifications')
        .insert({
          user_id: farmerUserId,
          title: 'Test Notification',
          message: 'This is a test notification',
          type: 'general',
          is_read: false
        })
        .select()
        .single();

      if (error) throw error;
      notificationId = data.id;
    });

    it('should allow users to view their own notifications', async () => {
      const { data, error } = await farmerClient
        .from('notifications')
        .select('*')
        .eq('id', notificationId)
        .single();

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.user_id).toBe(farmerUserId);
    });

    it('should prevent users from viewing other users notifications', async () => {
      // Create notification for other user
      const { data: otherNotif } = await serviceClient
        .from('notifications')
        .insert({
          user_id: otherFarmerUserId,
          title: 'Other User Notification',
          message: 'This is for another user',
          type: 'general',
          is_read: false
        })
        .select()
        .single();

      // Try to access with farmer client
      const { data, error } = await farmerClient
        .from('notifications')
        .select('*')
        .eq('id', otherNotif?.id)
        .single();

      expect(data).toBeNull();
    });

    it('should allow users to update their own notifications', async () => {
      const { data, error } = await farmerClient
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data?.is_read).toBe(true);
    });
  });

  describe('RLS Status Verification', () => {
    it('should verify RLS is enabled on all tables', async () => {
      const { data, error } = await serviceClient
        .from('rls_status')
        .select('*')
        .eq('rls_enabled', true);

      expect(error).toBeNull();
      expect(data).toBeDefined();
      
      // Check that key tables have RLS enabled
      const tableNames = data?.map(row => row.tablename) || [];
      expect(tableNames).toContain('profiles');
      expect(tableNames).toContain('farmer_profiles');
      expect(tableNames).toContain('crop_evaluations');
      expect(tableNames).toContain('loans');
      expect(tableNames).toContain('transactions');
      expect(tableNames).toContain('notifications');
    });

    it('should verify policies exist for all tables', async () => {
      const { data, error } = await serviceClient
        .from('rls_policies')
        .select('tablename, policyname');

      expect(error).toBeNull();
      expect(data).toBeDefined();
      expect(data?.length).toBeGreaterThan(0);

      // Group policies by table
      const policiesByTable = data?.reduce((acc, row) => {
        if (!acc[row.tablename]) {
          acc[row.tablename] = [];
        }
        acc[row.tablename].push(row.policyname);
        return acc;
      }, {} as Record<string, string[]>) || {};

      // Verify key tables have policies
      expect(policiesByTable['profiles']).toBeDefined();
      expect(policiesByTable['crop_evaluations']).toBeDefined();
      expect(policiesByTable['loans']).toBeDefined();
      expect(policiesByTable['transactions']).toBeDefined();
    });
  });
});

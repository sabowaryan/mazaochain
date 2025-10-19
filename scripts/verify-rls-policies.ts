/**
 * Script to verify RLS policies are correctly configured
 * 
 * This script checks:
 * 1. RLS is enabled on all tables
 * 2. Policies exist for all tables
 * 3. Helper functions are created
 * 4. Views are accessible
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// List of tables that should have RLS enabled
const REQUIRED_TABLES = [
  'profiles',
  'farmer_profiles',
  'cooperative_profiles',
  'lender_profiles',
  'crop_evaluations',
  'loans',
  'transactions',
  'notifications',
  'notification_preferences',
  'tokenization_records',
  'repayment_schedule',
  'email_logs',
  'sms_logs',
  'error_logs',
  'performance_metrics',
  'blockchain_transactions',
  'user_activity_logs',
  'system_alerts'
];

// Minimum number of policies expected per table
const MIN_POLICIES_PER_TABLE: Record<string, number> = {
  'profiles': 3,
  'farmer_profiles': 2,
  'cooperative_profiles': 1,
  'lender_profiles': 1,
  'crop_evaluations': 2,
  'loans': 3,
  'transactions': 2,
  'notifications': 2,
  'notification_preferences': 1,
  'tokenization_records': 2,
  'repayment_schedule': 2,
  'email_logs': 1,
  'sms_logs': 1,
  'error_logs': 2,
  'performance_metrics': 1,
  'blockchain_transactions': 1,
  'user_activity_logs': 1,
  'system_alerts': 1
};

async function verifyRLSStatus() {
  console.log('\n🔍 Checking RLS Status...\n');

  const { data, error } = await supabase
    .from('rls_status')
    .select('*')
    .order('tablename');

  if (error) {
    console.error('❌ Error fetching RLS status:', error.message);
    return false;
  }

  let allEnabled = true;
  const enabledTables: string[] = [];

  for (const table of REQUIRED_TABLES) {
    const tableStatus = data?.find(row => row.tablename === table);
    
    if (!tableStatus) {
      console.log(`⚠️  Table "${table}" not found in database`);
      continue;
    }

    if (tableStatus.rls_enabled) {
      console.log(`✅ ${table.padEnd(30)} - RLS Enabled`);
      enabledTables.push(table);
    } else {
      console.log(`❌ ${table.padEnd(30)} - RLS Disabled`);
      allEnabled = false;
    }
  }

  console.log(`\n📊 Summary: ${enabledTables.length}/${REQUIRED_TABLES.length} tables have RLS enabled\n`);

  return allEnabled;
}

async function verifyPolicies() {
  console.log('\n🔍 Checking RLS Policies...\n');

  const { data, error } = await supabase
    .from('rls_policies')
    .select('*')
    .order('tablename, policyname');

  if (error) {
    console.error('❌ Error fetching policies:', error.message);
    return false;
  }

  // Group policies by table
  const policiesByTable = data?.reduce((acc, row) => {
    if (!acc[row.tablename]) {
      acc[row.tablename] = [];
    }
    acc[row.tablename].push(row.policyname);
    return acc;
  }, {} as Record<string, string[]>) || {};

  let allTablesHavePolicies = true;

  for (const table of REQUIRED_TABLES) {
    const policies = policiesByTable[table] || [];
    const minPolicies = MIN_POLICIES_PER_TABLE[table] || 1;

    if (policies.length === 0) {
      console.log(`❌ ${table.padEnd(30)} - No policies found`);
      allTablesHavePolicies = false;
    } else if (policies.length < minPolicies) {
      console.log(`⚠️  ${table.padEnd(30)} - ${policies.length} policies (expected at least ${minPolicies})`);
      policies.forEach(policy => console.log(`    - ${policy}`));
    } else {
      console.log(`✅ ${table.padEnd(30)} - ${policies.length} policies`);
      policies.forEach(policy => console.log(`    - ${policy}`));
    }
  }

  const totalPolicies = Object.values(policiesByTable).reduce((sum, policies) => sum + policies.length, 0);
  console.log(`\n📊 Summary: ${totalPolicies} total policies across ${Object.keys(policiesByTable).length} tables\n`);

  return allTablesHavePolicies;
}

async function verifyHelperFunctions() {
  console.log('\n🔍 Checking Helper Functions...\n');

  try {
    // Check if public.get_user_role() function exists
    const { data, error } = await supabase.rpc('get_user_role' as any);

    if (error && error.message.includes('function') && error.message.includes('does not exist')) {
      console.log('❌ public.get_user_role() function not found');
      return false;
    }

    console.log('✅ public.get_user_role() function exists');
    return true;
  } catch (error: any) {
    // Function exists but might fail due to no authenticated user
    if (error.message.includes('null value')) {
      console.log('✅ public.get_user_role() function exists (no user context)');
      return true;
    }
    console.log('⚠️  Could not verify public.get_user_role() function:', error.message);
    return false;
  }
}

async function verifyViews() {
  console.log('\n🔍 Checking Verification Views...\n');

  let allViewsExist = true;

  // Check rls_status view
  const { error: statusError } = await supabase
    .from('rls_status')
    .select('*')
    .limit(1);

  if (statusError) {
    console.log('❌ rls_status view not accessible:', statusError.message);
    allViewsExist = false;
  } else {
    console.log('✅ rls_status view accessible');
  }

  // Check rls_policies view
  const { error: policiesError } = await supabase
    .from('rls_policies')
    .select('*')
    .limit(1);

  if (policiesError) {
    console.log('❌ rls_policies view not accessible:', policiesError.message);
    allViewsExist = false;
  } else {
    console.log('✅ rls_policies view accessible');
  }

  return allViewsExist;
}

async function testBasicAccess() {
  console.log('\n🔍 Testing Basic Access Patterns...\n');

  // Test 1: Service role can access all tables
  console.log('Test 1: Service role access...');
  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('count');

  if (profilesError) {
    console.log('❌ Service role cannot access profiles table:', profilesError.message);
    return false;
  }
  console.log('✅ Service role can access profiles table');

  // Test 2: Check that tables exist
  console.log('\nTest 2: Checking table existence...');
  let allTablesExist = true;

  for (const table of REQUIRED_TABLES.slice(0, 5)) { // Check first 5 tables
    const { error } = await supabase
      .from(table)
      .select('count')
      .limit(1);

    if (error && error.message.includes('does not exist')) {
      console.log(`❌ Table "${table}" does not exist`);
      allTablesExist = false;
    }
  }

  if (allTablesExist) {
    console.log('✅ All checked tables exist');
  }

  return allTablesExist;
}

async function main() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  RLS Policies Verification Script');
  console.log('═══════════════════════════════════════════════════════════');

  const results = {
    rlsStatus: await verifyRLSStatus(),
    policies: await verifyPolicies(),
    helperFunctions: await verifyHelperFunctions(),
    views: await verifyViews(),
    basicAccess: await testBasicAccess()
  };

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  Verification Results');
  console.log('═══════════════════════════════════════════════════════════\n');

  console.log(`RLS Status:        ${results.rlsStatus ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Policies:          ${results.policies ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Helper Functions:  ${results.helperFunctions ? '✅ PASS' : '⚠️  WARNING'}`);
  console.log(`Views:             ${results.views ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Basic Access:      ${results.basicAccess ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = Object.values(results).every(result => result === true);

  console.log('\n═══════════════════════════════════════════════════════════');
  if (allPassed) {
    console.log('  ✅ All verifications passed!');
    console.log('  RLS policies are correctly configured.');
  } else {
    console.log('  ⚠️  Some verifications failed or have warnings.');
    console.log('  Please review the output above for details.');
  }
  console.log('═══════════════════════════════════════════════════════════\n');

  process.exit(allPassed ? 0 : 1);
}

main().catch(error => {
  console.error('\n❌ Script failed with error:', error);
  process.exit(1);
});

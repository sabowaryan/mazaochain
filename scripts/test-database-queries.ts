/**
 * Database Query Test Script
 * 
 * Tests common queries to ensure database schema is working correctly
 */

import { createClient } from '@supabase/supabase-js';
import { Database } from '../src/lib/supabase/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

interface TestResult {
  name: string;
  status: 'pass' | 'fail';
  message: string;
  duration: number;
  error?: Error | unknown;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const startTime = Date.now();
  try {
    await testFn();
    const duration = Date.now() - startTime;
    results.push({ name, status: 'pass', message: 'Success', duration });
    console.log(`✅ ${name} (${duration}ms)`);
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    results.push({ 
      name, 
      status: 'fail', 
      message: errorMessage, 
      duration,
      error 
    });
    console.log(`❌ ${name} (${duration}ms)`);
    console.log(`   Error: ${errorMessage}`);
  }
}

async function testProfilesTable() {
  await runTest('Query profiles table', async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
    
    if (error) throw error;
    console.log(`   Found ${data?.length || 0} profiles`);
  });
}

async function testFarmerProfilesJoin() {
  await runTest('Join farmer_profiles with profiles', async () => {
    const { data, error } = await supabase
      .from('farmer_profiles')
      .select(`
        *,
        profiles (
          id,
          role,
          is_validated,
          wallet_address
        )
      `)
      .limit(5);
    
    if (error) throw error;
    console.log(`   Found ${data?.length || 0} farmer profiles with user data`);
  });
}

async function testCropEvaluations() {
  await runTest('Query crop evaluations', async () => {
    const { data, error } = await supabase
      .from('crop_evaluations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    console.log(`   Found ${data?.length || 0} crop evaluations`);
  });
}

async function testCropEvaluationsWithTokenization() {
  await runTest('Join crop evaluations with tokenization records', async () => {
    const { data, error } = await supabase
      .from('crop_evaluations')
      .select(`
        *,
        tokenization_records (
          id,
          token_id,
          status,
          transaction_ids
        )
      `)
      .limit(5);
    
    if (error) throw error;
    console.log(`   Found ${data?.length || 0} evaluations with tokenization data`);
  });
}

async function testLoansTable() {
  await runTest('Query loans table', async () => {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    console.log(`   Found ${data?.length || 0} loans`);
  });
}

async function testLoansWithProfiles() {
  await runTest('Join loans with borrower and lender profiles', async () => {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        borrower:profiles!loans_borrower_id_fkey (
          id,
          role,
          wallet_address
        ),
        lender:profiles!loans_lender_id_fkey (
          id,
          role,
          wallet_address
        )
      `)
      .limit(5);
    
    if (error) throw error;
    console.log(`   Found ${data?.length || 0} loans with borrower/lender data`);
  });
}

async function testLoansWithRepaymentSchedule() {
  await runTest('Join loans with repayment schedule', async () => {
    const { data, error } = await supabase
      .from('loans')
      .select(`
        *,
        repayment_schedule (
          id,
          installment_number,
          due_date,
          total_amount,
          status
        )
      `)
      .limit(5);
    
    if (error) throw error;
    console.log(`   Found ${data?.length || 0} loans with repayment schedules`);
  });
}

async function testTransactionsTable() {
  await runTest('Query transactions table', async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    console.log(`   Found ${data?.length || 0} transactions`);
  });
}

async function testTransactionsWithLoans() {
  await runTest('Join transactions with loans', async () => {
    const { data, error } = await supabase
      .from('transactions')
      .select(`
        *,
        loans (
          id,
          principal,
          status
        )
      `)
      .not('loan_id', 'is', null)
      .limit(5);
    
    if (error) throw error;
    console.log(`   Found ${data?.length || 0} loan-related transactions`);
  });
}

async function testNotificationsTable() {
  await runTest('Query notifications table', async () => {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    console.log(`   Found ${data?.length || 0} notifications`);
  });
}

async function testPendingEvaluations() {
  await runTest('Query pending crop evaluations', async () => {
    const { data, error } = await supabase
      .from('crop_evaluations')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    console.log(`   Found ${data?.length || 0} pending evaluations`);
  });
}

async function testPendingLoans() {
  await runTest('Query pending loans', async () => {
    const { data, error } = await supabase
      .from('loans')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) throw error;
    console.log(`   Found ${data?.length || 0} pending loans`);
  });
}

async function testCooperativeProfiles() {
  await runTest('Query cooperative profiles', async () => {
    const { data, error } = await supabase
      .from('cooperative_profiles')
      .select(`
        *,
        profiles (
          id,
          role,
          is_validated
        )
      `)
      .limit(5);
    
    if (error) throw error;
    console.log(`   Found ${data?.length || 0} cooperative profiles`);
  });
}

async function testLenderProfiles() {
  await runTest('Query lender profiles', async () => {
    const { data, error } = await supabase
      .from('lender_profiles')
      .select(`
        *,
        profiles (
          id,
          role,
          is_validated
        )
      `)
      .limit(5);
    
    if (error) throw error;
    console.log(`   Found ${data?.length || 0} lender profiles`);
  });
}

async function testFarmersByCooperative() {
  await runTest('Query farmers by cooperative', async () => {
    const { data, error } = await supabase
      .from('farmer_profiles')
      .select(`
        *,
        profiles (
          id,
          role,
          is_validated
        )
      `)
      .not('cooperative_id', 'is', null)
      .limit(5);
    
    if (error) throw error;
    console.log(`   Found ${data?.length || 0} farmers with cooperatives`);
  });
}

async function testComplexAggregation() {
  await runTest('Complex aggregation query', async () => {
    // Get farmer with their evaluation and loan counts
    const { data: farmers, error: farmersError } = await supabase
      .from('farmer_profiles')
      .select('id, nom, user_id')
      .limit(5);
    
    if (farmersError) throw farmersError;
    
    if (farmers && farmers.length > 0 && farmers[0].user_id) {
      const farmerId = farmers[0].user_id;
      
      const [evaluations, loans] = await Promise.all([
        supabase
          .from('crop_evaluations')
          .select('id', { count: 'exact', head: true })
          .eq('farmer_id', farmerId),
        supabase
          .from('loans')
          .select('id', { count: 'exact', head: true })
          .eq('borrower_id', farmerId)
      ]);
      
      console.log(`   Farmer has ${evaluations.count || 0} evaluations and ${loans.count || 0} loans`);
    }
  });
}

async function generateReport() {
  console.log('\n' + '='.repeat(80));
  console.log('📊 DATABASE QUERY TEST SUMMARY');
  console.log('='.repeat(80) + '\n');

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);
  const avgDuration = totalDuration / results.length;

  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📝 Total Tests: ${results.length}`);
  console.log(`⏱️  Total Duration: ${totalDuration}ms`);
  console.log(`⏱️  Average Duration: ${avgDuration.toFixed(2)}ms\n`);

  if (failed > 0) {
    console.log('❌ FAILED TESTS:\n');
    results
      .filter(r => r.status === 'fail')
      .forEach(r => {
        console.log(`  • ${r.name}`);
        console.log(`    ${r.message}`);
        if (r.error && typeof r.error === 'object' && 'details' in r.error) {
          console.log(`    Details: ${(r.error as { details: string }).details}`);
        }
      });
  }

  console.log('\n' + '='.repeat(80) + '\n');

  return {
    passed,
    failed,
    total: results.length,
    totalDuration,
    avgDuration,
    results
  };
}

async function main() {
  console.log('🚀 Starting Database Query Tests...\n');

  // Basic table queries
  await testProfilesTable();
  await testFarmerProfilesJoin();
  await testCooperativeProfiles();
  await testLenderProfiles();

  // Business data queries
  await testCropEvaluations();
  await testCropEvaluationsWithTokenization();
  await testLoansTable();
  await testLoansWithProfiles();
  await testLoansWithRepaymentSchedule();
  await testTransactionsTable();
  await testTransactionsWithLoans();
  await testNotificationsTable();

  // Filtered queries
  await testPendingEvaluations();
  await testPendingLoans();
  await testFarmersByCooperative();

  // Complex queries
  await testComplexAggregation();

  const report = await generateReport();

  // Exit with error code if there are failures
  if (report.failed > 0) {
    process.exit(1);
  }
}

main().catch(console.error);

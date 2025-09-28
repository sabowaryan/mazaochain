# Script to apply RLS policies fix

Write-Host "Fixing RLS Policies" -ForegroundColor Green

# Load environment variables
$envFile = ".env.local"
if (Test-Path $envFile) {
    Get-Content $envFile | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            [Environment]::SetEnvironmentVariable($matches[1], $matches[2])
        }
    }
    Write-Host "Environment variables loaded" -ForegroundColor Yellow
} else {
    Write-Host "File $envFile not found" -ForegroundColor Red
    exit 1
}

$supabaseUrl = $env:NEXT_PUBLIC_SUPABASE_URL

if (-not $supabaseUrl) {
    Write-Host "SUPABASE_URL variable missing" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== RLS POLICIES FIX ===" -ForegroundColor Yellow
Write-Host "Problem detected: Infinite recursion in RLS policies" -ForegroundColor Red
Write-Host "Solution: Apply SQL correction manually" -ForegroundColor Green

Write-Host ""
Write-Host "INSTRUCTIONS:" -ForegroundColor Cyan
Write-Host "1. Open your Supabase dashboard:" -ForegroundColor White
Write-Host "   $supabaseUrl" -ForegroundColor Blue
Write-Host "2. Go to 'SQL Editor'" -ForegroundColor White
Write-Host "3. Copy and execute the following SQL script:" -ForegroundColor White

$sqlScript = @"
-- 1. Drop problematic RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Cooperatives can view farmer profiles" ON profiles;

-- 2. Create simplified and non-recursive RLS policies
CREATE POLICY "profiles_select_own" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. Verify that policies are created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'profiles';
"@

Write-Host ""
Write-Host "--- START OF SQL SCRIPT ---" -ForegroundColor Magenta
Write-Host $sqlScript -ForegroundColor White
Write-Host "--- END OF SQL SCRIPT ---" -ForegroundColor Magenta

# Save script to temporary file
$tempSqlFile = "temp_rls_fix.sql"
$sqlScript | Out-File -FilePath $tempSqlFile -Encoding UTF8
Write-Host ""
Write-Host "SQL script saved to: $tempSqlFile" -ForegroundColor Green

Write-Host ""
Write-Host "4. After executing the SQL, test the fix:" -ForegroundColor White
Write-Host "   node test-profile-fix.js" -ForegroundColor Blue

Write-Host ""
Write-Host "5. If the fix works, restart your Next.js server:" -ForegroundColor White
Write-Host "   npm run dev" -ForegroundColor Blue

Write-Host ""
Write-Host "IMPORTANT:" -ForegroundColor Yellow
Write-Host "This fix is REQUIRED for the application to work" -ForegroundColor Red
Write-Host "Without it, you will always get 'Error fetching profile'" -ForegroundColor Red

Write-Host ""
Write-Host "Script ready to apply!" -ForegroundColor Green
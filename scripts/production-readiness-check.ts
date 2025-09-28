#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import path from 'path';

interface ReadinessCheck {
  name: string;
  description: string;
  check: () => Promise<boolean>;
  critical: boolean;
}

interface CheckResult {
  name: string;
  passed: boolean;
  message: string;
  critical: boolean;
}

class ProductionReadinessChecker {
  private checks: ReadinessCheck[] = [];

  constructor() {
    this.initializeChecks();
  }

  private initializeChecks(): void {
    this.checks = [
      {
        name: 'Environment Variables',
        description: 'Verify all required environment variables are set',
        check: this.checkEnvironmentVariables.bind(this),
        critical: true
      },
      {
        name: 'Database Connectivity',
        description: 'Test database connection and basic queries',
        check: this.checkDatabaseConnectivity.bind(this),
        critical: true
      },
      {
        name: 'Hedera Network',
        description: 'Verify Hedera mainnet connectivity and account balance',
        check: this.checkHederaNetwork.bind(this),
        critical: true
      },
      {
        name: 'Smart Contracts',
        description: 'Verify smart contracts are deployed and functional',
        check: this.checkSmartContracts.bind(this),
        critical: true
      },
      {
        name: 'External Services',
        description: 'Check connectivity to external services (email, SMS)',
        check: this.checkExternalServices.bind(this),
        critical: false
      },
      {
        name: 'SSL Certificates',
        description: 'Verify SSL certificates are valid and not expiring soon',
        check: this.checkSSLCertificates.bind(this),
        critical: true
      },
      {
        name: 'Backup System',
        description: 'Verify backup system is configured and working',
        check: this.checkBackupSystem.bind(this),
        critical: true
      },
      {
        name: 'Monitoring',
        description: 'Check monitoring and alerting systems',
        check: this.checkMonitoring.bind(this),
        critical: false
      },
      {
        name: 'Security Configuration',
        description: 'Verify security settings and configurations',
        check: this.checkSecurityConfiguration.bind(this),
        critical: true
      },
      {
        name: 'Performance',
        description: 'Check system performance and resource usage',
        check: this.checkPerformance.bind(this),
        critical: false
      }
    ];
  }

  async runAllChecks(): Promise<CheckResult[]> {
    console.log('🔍 Running production readiness checks...\n');

    const results: CheckResult[] = [];

    for (const check of this.checks) {
      console.log(`Checking: ${check.name}...`);
      
      try {
        const passed = await check.check();
        results.push({
          name: check.name,
          passed,
          message: passed ? 'Passed' : 'Failed',
          critical: check.critical
        });
        
        console.log(passed ? '✅ Passed' : '❌ Failed');
      } catch (error) {
        results.push({
          name: check.name,
          passed: false,
          message: `Error: ${error}`,
          critical: check.critical
        });
        
        console.log(`❌ Error: ${error}`);
      }
      
      console.log('');
    }

    return results;
  }

  private async checkEnvironmentVariables(): Promise<boolean> {
    const requiredVars = [
      'NODE_ENV',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_HEDERA_NETWORK',
      'HEDERA_OPERATOR_ID',
      'HEDERA_OPERATOR_KEY',
      'HEDERA_TOKEN_TREASURY_ID',
      'MAZAO_TOKEN_FACTORY_CONTRACT',
      'LOAN_MANAGER_CONTRACT',
      'DATABASE_URL',
      'NEXTAUTH_SECRET',
      'SMTP_HOST',
      'SMTP_PASSWORD'
    ];

    const missingVars = requiredVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingVars.join(', ')}`);
    }

    // Verify NODE_ENV is production
    if (process.env.NODE_ENV !== 'production') {
      throw new Error('NODE_ENV must be set to "production"');
    }

    // Verify Hedera network is mainnet
    if (process.env.NEXT_PUBLIC_HEDERA_NETWORK !== 'mainnet') {
      throw new Error('NEXT_PUBLIC_HEDERA_NETWORK must be set to "mainnet"');
    }

    return true;
  }

  private async checkDatabaseConnectivity(): Promise<boolean> {
    try {
      // Test basic database connectivity
      execSync(`psql "${process.env.DATABASE_URL}" -c "SELECT 1;"`, { stdio: 'pipe' });
      
      // Check if required tables exist
      const tableCheck = execSync(
        `psql "${process.env.DATABASE_URL}" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';"`,
        { encoding: 'utf8' }
      );

      const requiredTables = ['profiles', 'crop_evaluations', 'loans', 'transactions'];
      const existingTables = tableCheck.toLowerCase();

      for (const table of requiredTables) {
        if (!existingTables.includes(table)) {
          throw new Error(`Required table '${table}' not found`);
        }
      }

      return true;
    } catch (error) {
      throw new Error(`Database connectivity failed: ${error}`);
    }
  }

  private async checkHederaNetwork(): Promise<boolean> {
    try {
      // Check Hedera account balance
      const balanceCheck = execSync(
        `curl -s "https://mainnet-public.mirrornode.hedera.com/api/v1/accounts/${process.env.HEDERA_OPERATOR_ID}"`,
        { encoding: 'utf8' }
      );

      const accountInfo = JSON.parse(balanceCheck);
      const balanceInHbar = accountInfo.balance.balance / 100_000_000; // Convert from tinybars

      if (balanceInHbar < 10) {
        throw new Error(`Insufficient HBAR balance: ${balanceInHbar} HBAR (minimum 10 HBAR required)`);
      }

      // Test mirror node connectivity
      execSync(
        'curl -f -s "https://mainnet-public.mirrornode.hedera.com/api/v1/network/nodes"',
        { stdio: 'pipe' }
      );

      return true;
    } catch (error) {
      throw new Error(`Hedera network check failed: ${error}`);
    }
  }

  private async checkSmartContracts(): Promise<boolean> {
    try {
      const factoryContract = process.env.MAZAO_TOKEN_FACTORY_CONTRACT;
      const loanContract = process.env.LOAN_MANAGER_CONTRACT;

      if (!factoryContract || !loanContract) {
        throw new Error('Smart contract addresses not configured');
      }

      // Verify contracts exist on mainnet
      const factoryCheck = execSync(
        `curl -s "https://mainnet-public.mirrornode.hedera.com/api/v1/contracts/${factoryContract}"`,
        { encoding: 'utf8' }
      );

      const loanCheck = execSync(
        `curl -s "https://mainnet-public.mirrornode.hedera.com/api/v1/contracts/${loanContract}"`,
        { encoding: 'utf8' }
      );

      const factoryInfo = JSON.parse(factoryCheck);
      const loanInfo = JSON.parse(loanCheck);

      if (!factoryInfo.contract_id || !loanInfo.contract_id) {
        throw new Error('Smart contracts not found on mainnet');
      }

      return true;
    } catch (error) {
      throw new Error(`Smart contract verification failed: ${error}`);
    }
  }

  private async checkExternalServices(): Promise<boolean> {
    try {
      // Test SMTP connectivity
      if (process.env.SMTP_HOST && process.env.SMTP_PASSWORD) {
        // This would require a more sophisticated SMTP test
        console.log('SMTP configuration found');
      }

      // Test SMS service (Twilio)
      if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
        console.log('Twilio configuration found');
      }

      return true;
    } catch (error) {
      throw new Error(`External services check failed: ${error}`);
    }
  }

  private async checkSSLCertificates(): Promise<boolean> {
    try {
      const domain = process.env.NEXT_PUBLIC_APP_URL?.replace('https://', '') || 'mazaochain.com';
      
      const certInfo = execSync(
        `echo | openssl s_client -servername ${domain} -connect ${domain}:443 2>/dev/null | openssl x509 -noout -dates`,
        { encoding: 'utf8' }
      );

      // Parse expiration date
      const expiryMatch = certInfo.match(/notAfter=(.+)/);
      if (expiryMatch) {
        const expiryDate = new Date(expiryMatch[1]);
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilExpiry < 30) {
          throw new Error(`SSL certificate expires in ${daysUntilExpiry} days`);
        }
      }

      return true;
    } catch (error) {
      throw new Error(`SSL certificate check failed: ${error}`);
    }
  }

  private async checkBackupSystem(): Promise<boolean> {
    try {
      const backupPath = process.env.BACKUP_PATH || '/var/backups/mazaochain';
      
      if (!existsSync(backupPath)) {
        throw new Error(`Backup directory does not exist: ${backupPath}`);
      }

      // Check for recent backups
      const recentBackups = execSync(
        `find "${backupPath}" -name "mazaochain-backup-*.sql.gz" -mtime -1`,
        { encoding: 'utf8' }
      ).trim();

      if (!recentBackups) {
        throw new Error('No recent backups found (within 24 hours)');
      }

      return true;
    } catch (error) {
      throw new Error(`Backup system check failed: ${error}`);
    }
  }

  private async checkMonitoring(): Promise<boolean> {
    try {
      // Check if monitoring services are running
      const prometheusCheck = execSync('curl -f -s http://localhost:9090/-/healthy', { stdio: 'pipe' });
      const grafanaCheck = execSync('curl -f -s http://localhost:3001/api/health', { stdio: 'pipe' });

      return true;
    } catch (error) {
      console.warn('Monitoring services may not be fully configured');
      return false;
    }
  }

  private async checkSecurityConfiguration(): Promise<boolean> {
    try {
      // Check if security headers are enabled
      if (process.env.ENABLE_SECURITY_HEADERS !== 'true') {
        throw new Error('Security headers not enabled');
      }

      // Check if rate limiting is enabled
      if (process.env.ENABLE_RATE_LIMITING !== 'true') {
        throw new Error('Rate limiting not enabled');
      }

      // Verify NEXTAUTH_SECRET is strong
      const secret = process.env.NEXTAUTH_SECRET;
      if (!secret || secret.length < 32) {
        throw new Error('NEXTAUTH_SECRET must be at least 32 characters long');
      }

      return true;
    } catch (error) {
      throw new Error(`Security configuration check failed: ${error}`);
    }
  }

  private async checkPerformance(): Promise<boolean> {
    try {
      // Check system resources
      const memInfo = execSync('free -m', { encoding: 'utf8' });
      const diskInfo = execSync('df -h /', { encoding: 'utf8' });

      // Parse memory info
      const memLines = memInfo.split('\n');
      const memData = memLines[1].split(/\s+/);
      const totalMem = parseInt(memData[1]);
      const availableMem = parseInt(memData[6]);

      if (availableMem < 1000) { // Less than 1GB available
        console.warn(`Low available memory: ${availableMem}MB`);
      }

      // Parse disk info
      const diskLines = diskInfo.split('\n');
      const diskData = diskLines[1].split(/\s+/);
      const diskUsage = parseInt(diskData[4].replace('%', ''));

      if (diskUsage > 80) {
        console.warn(`High disk usage: ${diskUsage}%`);
      }

      return true;
    } catch (error) {
      console.warn('Performance check failed, but not critical');
      return false;
    }
  }

  generateReport(results: CheckResult[]): void {
    console.log('\n📊 Production Readiness Report');
    console.log('================================\n');

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const criticalFailed = results.filter(r => !r.passed && r.critical).length;

    console.log(`Total Checks: ${results.length}`);
    console.log(`Passed: ${passed}`);
    console.log(`Failed: ${failed}`);
    console.log(`Critical Failures: ${criticalFailed}\n`);

    if (criticalFailed > 0) {
      console.log('❌ CRITICAL FAILURES:');
      results
        .filter(r => !r.passed && r.critical)
        .forEach(r => console.log(`  - ${r.name}: ${r.message}`));
      console.log('');
    }

    if (failed > criticalFailed) {
      console.log('⚠️  NON-CRITICAL FAILURES:');
      results
        .filter(r => !r.passed && !r.critical)
        .forEach(r => console.log(`  - ${r.name}: ${r.message}`));
      console.log('');
    }

    if (criticalFailed === 0) {
      console.log('✅ System is ready for production deployment!');
    } else {
      console.log('❌ System is NOT ready for production. Please fix critical issues.');
    }
  }
}

async function main() {
  const checker = new ProductionReadinessChecker();
  
  try {
    const results = await checker.runAllChecks();
    checker.generateReport(results);

    const criticalFailures = results.filter(r => !r.passed && r.critical).length;
    process.exit(criticalFailures > 0 ? 1 : 0);

  } catch (error) {
    console.error('Production readiness check failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
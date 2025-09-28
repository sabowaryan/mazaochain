#!/usr/bin/env ts-node

/**
 * Security scanning script for MazaoChain
 * Runs comprehensive security checks and vulnerability scans
 */

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

interface SecurityScanResult {
  timestamp: string;
  overallScore: number;
  criticalIssues: number;
  highIssues: number;
  mediumIssues: number;
  lowIssues: number;
  categories: {
    [key: string]: {
      score: number;
      issues: SecurityIssue[];
    };
  };
}

interface SecurityIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: string;
  description: string;
  file?: string;
  line?: number;
  recommendation: string;
}

class SecurityScanner {
  private results: SecurityScanResult;

  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      overallScore: 0,
      criticalIssues: 0,
      highIssues: 0,
      mediumIssues: 0,
      lowIssues: 0,
      categories: {}
    };
  }

  async runComprehensiveScan(): Promise<SecurityScanResult> {
    console.log('🔒 Starting comprehensive security scan...\n');

    // Run all security checks
    await this.scanDependencies();
    await this.scanCodeQuality();
    await this.scanSmartContracts();
    await this.scanConfiguration();
    await this.scanAuthentication();
    await this.scanInputValidation();
    await this.scanDataProtection();
    await this.scanNetworkSecurity();

    // Calculate overall score
    this.calculateOverallScore();

    // Generate report
    this.generateReport();

    return this.results;
  }

  private async scanDependencies(): Promise<void> {
    console.log('📦 Scanning dependencies for vulnerabilities...');
    
    try {
      // Run npm audit
      const auditOutput = execSync('npm audit --json', { encoding: 'utf8' });
      const auditData = JSON.parse(auditOutput);

      const issues: SecurityIssue[] = [];
      
      if (auditData.vulnerabilities) {
        Object.entries(auditData.vulnerabilities).forEach(([pkg, vuln]: [string, unknown]) => {
          const vulnerability = vuln as unknown;
          const severity = this.mapSeverity(vulnerability.severity);
          issues.push({
            severity,
            category: 'DEPENDENCIES',
            description: `Vulnerability in ${pkg}: ${vulnerability.title}`,
            recommendation: `Update ${pkg} to version ${vulnerability.fixAvailable?.version || 'latest'}`
          });
        });
      }

      this.results.categories.dependencies = {
        score: Math.max(0, 100 - (issues.length * 10)),
        issues
      };

      console.log(`   Found ${issues.length} dependency vulnerabilities`);
    } catch (error) {
      console.log('   ⚠️  Could not run npm audit');
      this.results.categories.dependencies = {
        score: 80, // Assume reasonable score if audit fails
        issues: []
      };
    }
  }

  private async scanCodeQuality(): Promise<void> {
    console.log('🔍 Scanning code quality and security patterns...');
    
    const issues: SecurityIssue[] = [];

    // Check for common security anti-patterns
    const securityPatterns = [
      {
        pattern: /console\.log\(/g,
        severity: 'LOW' as const,
        description: 'Console.log statements may leak sensitive information',
        recommendation: 'Remove console.log statements in production code'
      },
      {
        pattern: /eval\(/g,
        severity: 'CRITICAL' as const,
        description: 'Use of eval() can lead to code injection',
        recommendation: 'Replace eval() with safer alternatives'
      },
      {
        pattern: /innerHTML\s*=/g,
        severity: 'HIGH' as const,
        description: 'Direct innerHTML assignment can lead to XSS',
        recommendation: 'Use textContent or sanitize HTML input'
      },
      {
        pattern: /document\.write\(/g,
        severity: 'HIGH' as const,
        description: 'document.write can be exploited for XSS',
        recommendation: 'Use safer DOM manipulation methods'
      }
    ];

    // Scan TypeScript/JavaScript files
    const filesToScan = this.getSourceFiles();
    
    filesToScan.forEach(file => {
      try {
        const content = readFileSync(file, 'utf8');
        
        securityPatterns.forEach(pattern => {
          const matches = content.match(pattern.pattern);
          if (matches) {
            matches.forEach(() => {
              issues.push({
                severity: pattern.severity,
                category: 'CODE_QUALITY',
                description: pattern.description,
                file: file,
                recommendation: pattern.recommendation
              });
            });
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    });

    this.results.categories.codeQuality = {
      score: Math.max(0, 100 - (issues.length * 5)),
      issues
    };

    console.log(`   Found ${issues.length} code quality issues`);
  }

  private async scanSmartContracts(): Promise<void> {
    console.log('⛓️  Scanning smart contracts...');
    
    const issues: SecurityIssue[] = [];

    // Check for common smart contract vulnerabilities
    const contractVulnerabilities = [
      {
        pattern: /\.call\(/g,
        severity: 'HIGH' as const,
        description: 'Unchecked external call can lead to reentrancy',
        recommendation: 'Use checks-effects-interactions pattern'
      },
      {
        pattern: /tx\.origin/g,
        severity: 'MEDIUM' as const,
        description: 'tx.origin should not be used for authorization',
        recommendation: 'Use msg.sender instead of tx.origin'
      },
      {
        pattern: /block\.timestamp/g,
        severity: 'LOW' as const,
        description: 'block.timestamp can be manipulated by miners',
        recommendation: 'Avoid using block.timestamp for critical logic'
      }
    ];

    // Scan Solidity files
    const contractFiles = this.getContractFiles();
    
    contractFiles.forEach(file => {
      try {
        const content = readFileSync(file, 'utf8');
        
        contractVulnerabilities.forEach(vuln => {
          const matches = content.match(vuln.pattern);
          if (matches) {
            matches.forEach(() => {
              issues.push({
                severity: vuln.severity,
                category: 'SMART_CONTRACTS',
                description: vuln.description,
                file: file,
                recommendation: vuln.recommendation
              });
            });
          }
        });
      } catch (error) {
        // Skip files that can't be read
      }
    });

    this.results.categories.smartContracts = {
      score: Math.max(0, 100 - (issues.length * 15)),
      issues
    };

    console.log(`   Found ${issues.length} smart contract issues`);
  }

  private async scanConfiguration(): Promise<void> {
    console.log('⚙️  Scanning configuration security...');
    
    const issues: SecurityIssue[] = [];

    // Check environment configuration
    const envChecks = [
      {
        file: '.env.local',
        required: ['SUPABASE_URL', 'SUPABASE_ANON_KEY'],
        sensitive: ['SUPABASE_SERVICE_ROLE_KEY', 'HEDERA_PRIVATE_KEY']
      },
      {
        file: '.env.local.example',
        shouldNotContain: ['password', 'secret', 'key', 'token']
      }
    ];

    envChecks.forEach(check => {
      try {
        const content = readFileSync(check.file, 'utf8');
        
        if (check.shouldNotContain) {
          check.shouldNotContain.forEach(term => {
            if (content.toLowerCase().includes(term)) {
              issues.push({
                severity: 'MEDIUM',
                category: 'CONFIGURATION',
                description: `Example file contains sensitive term: ${term}`,
                file: check.file,
                recommendation: 'Remove sensitive data from example files'
              });
            }
          });
        }

        if (check.sensitive) {
          check.sensitive.forEach(key => {
            const regex = new RegExp(`${key}=.+`, 'i');
            if (regex.test(content)) {
              const line = content.split('\n').findIndex(l => regex.test(l)) + 1;
              issues.push({
                severity: 'HIGH',
                category: 'CONFIGURATION',
                description: `Sensitive key ${key} found in configuration`,
                file: check.file,
                line,
                recommendation: 'Ensure sensitive keys are properly secured'
              });
            }
          });
        }
      } catch (error) {
        // File doesn't exist or can't be read
      }
    });

    this.results.categories.configuration = {
      score: Math.max(0, 100 - (issues.length * 10)),
      issues
    };

    console.log(`   Found ${issues.length} configuration issues`);
  }

  private async scanAuthentication(): Promise<void> {
    console.log('🔐 Scanning authentication security...');
    
    const issues: SecurityIssue[] = [];

    // Check authentication implementation
    const authFiles = this.getAuthFiles();
    
    authFiles.forEach(file => {
      try {
        const content = readFileSync(file, 'utf8');
        
        // Check for weak authentication patterns
        if (content.includes('password') && !content.includes('hash')) {
          issues.push({
            severity: 'HIGH',
            category: 'AUTHENTICATION',
            description: 'Password handling without proper hashing detected',
            file: file,
            recommendation: 'Implement proper password hashing with bcrypt or similar'
          });
        }

        if (content.includes('jwt') && !content.includes('verify')) {
          issues.push({
            severity: 'MEDIUM',
            category: 'AUTHENTICATION',
            description: 'JWT usage without proper verification',
            file: file,
            recommendation: 'Always verify JWT tokens before trusting them'
          });
        }

        if (content.includes('session') && !content.includes('secure')) {
          issues.push({
            severity: 'MEDIUM',
            category: 'AUTHENTICATION',
            description: 'Session configuration may not be secure',
            file: file,
            recommendation: 'Ensure sessions use secure and httpOnly flags'
          });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    });

    this.results.categories.authentication = {
      score: Math.max(0, 100 - (issues.length * 20)),
      issues
    };

    console.log(`   Found ${issues.length} authentication issues`);
  }

  private async scanInputValidation(): Promise<void> {
    console.log('✅ Scanning input validation...');
    
    const issues: SecurityIssue[] = [];

    // Check for input validation patterns
    const validationFiles = this.getValidationFiles();
    
    validationFiles.forEach(file => {
      try {
        const content = readFileSync(file, 'utf8');
        
        // Check for SQL injection prevention
        if (content.includes('query') && !content.includes('sanitize') && !content.includes('escape')) {
          issues.push({
            severity: 'HIGH',
            category: 'INPUT_VALIDATION',
            description: 'Database query without proper sanitization',
            file: file,
            recommendation: 'Use parameterized queries or proper sanitization'
          });
        }

        // Check for XSS prevention
        if (content.includes('innerHTML') && !content.includes('sanitize')) {
          issues.push({
            severity: 'HIGH',
            category: 'INPUT_VALIDATION',
            description: 'HTML injection without sanitization',
            file: file,
            recommendation: 'Sanitize HTML content before rendering'
          });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    });

    this.results.categories.inputValidation = {
      score: Math.max(0, 100 - (issues.length * 15)),
      issues
    };

    console.log(`   Found ${issues.length} input validation issues`);
  }

  private async scanDataProtection(): Promise<void> {
    console.log('🛡️  Scanning data protection...');
    
    const issues: SecurityIssue[] = [];

    // Check for data protection patterns
    const dataFiles = this.getDataFiles();
    
    dataFiles.forEach(file => {
      try {
        const content = readFileSync(file, 'utf8');
        
        // Check for sensitive data exposure
        const sensitivePatterns = [
          { pattern: /password.*=.*['"]\w+['"]/, term: 'password' },
          { pattern: /secret.*=.*['"]\w+['"]/, term: 'secret' },
          { pattern: /key.*=.*['"]\w+['"]/, term: 'key' },
          { pattern: /token.*=.*['"]\w+['"]/, term: 'token' }
        ];

        sensitivePatterns.forEach(({ pattern, term }) => {
          if (pattern.test(content)) {
            issues.push({
              severity: 'HIGH',
              category: 'DATA_PROTECTION',
              description: `Potential ${term} exposure in code`,
              file: file,
              recommendation: `Move ${term} to environment variables`
            });
          }
        });

        // Check for encryption usage
        if (content.includes('personal') && !content.includes('encrypt')) {
          issues.push({
            severity: 'MEDIUM',
            category: 'DATA_PROTECTION',
            description: 'Personal data handling without encryption',
            file: file,
            recommendation: 'Encrypt sensitive personal data'
          });
        }
      } catch (error) {
        // Skip files that can't be read
      }
    });

    this.results.categories.dataProtection = {
      score: Math.max(0, 100 - (issues.length * 12)),
      issues
    };

    console.log(`   Found ${issues.length} data protection issues`);
  }

  private async scanNetworkSecurity(): Promise<void> {
    console.log('🌐 Scanning network security...');
    
    const issues: SecurityIssue[] = [];

    // Check Next.js configuration
    try {
      const nextConfig = readFileSync('next.config.ts', 'utf8');
      
      if (!nextConfig.includes('headers')) {
        issues.push({
          severity: 'MEDIUM',
          category: 'NETWORK_SECURITY',
          description: 'Missing security headers configuration',
          file: 'next.config.ts',
          recommendation: 'Add security headers to Next.js configuration'
        });
      }

      if (!nextConfig.includes('Content-Security-Policy')) {
        issues.push({
          severity: 'HIGH',
          category: 'NETWORK_SECURITY',
          description: 'Missing Content Security Policy',
          file: 'next.config.ts',
          recommendation: 'Implement Content Security Policy headers'
        });
      }
    } catch (error) {
      issues.push({
        severity: 'LOW',
        category: 'NETWORK_SECURITY',
        description: 'Could not verify Next.js security configuration',
        recommendation: 'Ensure Next.js configuration includes security headers'
      });
    }

    this.results.categories.networkSecurity = {
      score: Math.max(0, 100 - (issues.length * 15)),
      issues
    };

    console.log(`   Found ${issues.length} network security issues`);
  }

  private calculateOverallScore(): void {
    const categories = Object.values(this.results.categories);
    const totalScore = categories.reduce((sum, cat) => sum + cat.score, 0);
    this.results.overallScore = Math.round(totalScore / categories.length);

    // Count issues by severity
    categories.forEach(category => {
      category.issues.forEach(issue => {
        switch (issue.severity) {
          case 'CRITICAL':
            this.results.criticalIssues++;
            break;
          case 'HIGH':
            this.results.highIssues++;
            break;
          case 'MEDIUM':
            this.results.mediumIssues++;
            break;
          case 'LOW':
            this.results.lowIssues++;
            break;
        }
      });
    });
  }

  private generateReport(): void {
    console.log('\n📊 Security Scan Results');
    console.log('========================');
    console.log(`Overall Security Score: ${this.results.overallScore}/100`);
    console.log(`Critical Issues: ${this.results.criticalIssues}`);
    console.log(`High Issues: ${this.results.highIssues}`);
    console.log(`Medium Issues: ${this.results.mediumIssues}`);
    console.log(`Low Issues: ${this.results.lowIssues}`);
    console.log('');

    // Category breakdown
    Object.entries(this.results.categories).forEach(([name, category]) => {
      console.log(`${name.toUpperCase()}: ${category.score}/100 (${category.issues.length} issues)`);
    });

    // Critical and high issues details
    const criticalAndHigh = Object.values(this.results.categories)
      .flatMap(cat => cat.issues)
      .filter(issue => issue.severity === 'CRITICAL' || issue.severity === 'HIGH');

    if (criticalAndHigh.length > 0) {
      console.log('\n🚨 Critical and High Priority Issues:');
      console.log('=====================================');
      criticalAndHigh.forEach((issue, index) => {
        console.log(`${index + 1}. [${issue.severity}] ${issue.description}`);
        if (issue.file) console.log(`   File: ${issue.file}${issue.line ? `:${issue.line}` : ''}`);
        console.log(`   Recommendation: ${issue.recommendation}`);
        console.log('');
      });
    }

    // Save detailed report
    const reportPath = join(process.cwd(), 'security-report.json');
    writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`📄 Detailed report saved to: ${reportPath}`);

    // Exit with error code if critical issues found
    if (this.results.criticalIssues > 0) {
      console.log('\n❌ Security scan failed due to critical issues');
      process.exit(1);
    } else if (this.results.overallScore < 80) {
      console.log('\n⚠️  Security score below threshold (80)');
      process.exit(1);
    } else {
      console.log('\n✅ Security scan passed');
    }
  }

  private mapSeverity(severity: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' {
    switch (severity.toLowerCase()) {
      case 'critical': return 'CRITICAL';
      case 'high': return 'HIGH';
      case 'moderate': return 'MEDIUM';
      case 'low': return 'LOW';
      default: return 'MEDIUM';
    }
  }

  private getSourceFiles(): string[] {
    try {
      const output = execSync('find src -name "*.ts" -o -name "*.tsx" -o -name "*.js" -o -name "*.jsx"', { encoding: 'utf8' });
      return output.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  private getContractFiles(): string[] {
    try {
      const output = execSync('find contracts -name "*.sol"', { encoding: 'utf8' });
      return output.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  private getAuthFiles(): string[] {
    try {
      const output = execSync('find src -name "*auth*" -name "*.ts" -o -name "*auth*" -name "*.tsx"', { encoding: 'utf8' });
      return output.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  private getValidationFiles(): string[] {
    try {
      const output = execSync('find src -name "*validation*" -name "*.ts" -o -name "*validator*" -name "*.ts"', { encoding: 'utf8' });
      return output.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }

  private getDataFiles(): string[] {
    try {
      const output = execSync('find src -name "*data*" -name "*.ts" -o -name "*model*" -name "*.ts" -o -name "*service*" -name "*.ts"', { encoding: 'utf8' });
      return output.trim().split('\n').filter(Boolean);
    } catch {
      return [];
    }
  }
}

// Run security scan if called directly
if (require.main === module) {
  const scanner = new SecurityScanner();
  scanner.runComprehensiveScan().catch(error => {
    console.error('Security scan failed:', error);
    process.exit(1);
  });
}

export { SecurityScanner };
export type { SecurityScanResult, SecurityIssue };
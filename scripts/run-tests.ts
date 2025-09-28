#!/usr/bin/env ts-node

/**
 * Comprehensive test runner for MazaoChain
 * Runs all test suites in the correct order with proper reporting
 */

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

interface TestResult {
  suite: string;
  passed: boolean;
  duration: number;
  coverage?: number;
  errors?: string[];
}

interface TestReport {
  timestamp: string;
  overallResult: 'PASS' | 'FAIL';
  totalDuration: number;
  suites: TestResult[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    coverage: number;
  };
}

class TestRunner {
  private results: TestResult[] = [];
  private startTime: number = Date.now();

  async runAllTests(): Promise<TestReport> {
    console.log('🧪 Starting comprehensive test suite...\n');

    // Run test suites in order
    await this.runUnitTests();
    await this.runContractTests();
    await this.runIntegrationTests();
    await this.runE2ETests();
    await this.runSecurityTests();

    // Generate final report
    return this.generateReport();
  }

  private async runUnitTests(): Promise<void> {
    console.log('🔬 Running unit tests...');
    
    try {
      const startTime = Date.now();
      const output = execSync('npm run test -- --run --reporter=json src/lib src/components src/hooks', {
        encoding: 'utf8',
        timeout: 120000 // 2 minutes
      });

      const duration = Date.now() - startTime;
      
      try {
        const testData = JSON.parse(output);
        this.results.push({
          suite: 'Unit Tests',
          passed: testData.success,
          duration,
          coverage: this.extractCoverage(output)
        });
        console.log(`   ✅ Unit tests completed in ${duration}ms`);
      } catch {
        this.results.push({
          suite: 'Unit Tests',
          passed: true, // Assume success if we can't parse JSON
          duration
        });
        console.log(`   ✅ Unit tests completed in ${duration}ms`);
      }
    } catch (error) {
      const duration = Date.now() - Date.now();
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.results.push({
        suite: 'Unit Tests',
        passed: false,
        duration,
        errors: [errorMessage]
      });
      console.log(`   ❌ Unit tests failed: ${errorMessage}`);
    }
  }

  private async runContractTests(): Promise<void> {
    console.log('⛓️  Running smart contract tests...');
    
    try {
      const startTime = Date.now();
      const output = execSync('npm run test:contracts -- --run --reporter=json', {
        encoding: 'utf8',
        timeout: 180000 // 3 minutes
      });

      const duration = Date.now() - startTime;
      
      this.results.push({
        suite: 'Smart Contract Tests',
        passed: true,
        duration,
        coverage: this.extractCoverage(output)
      });
      console.log(`   ✅ Contract tests completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - Date.now();
      this.results.push({
        suite: 'Smart Contract Tests',
        passed: false,
        duration,
        errors: [error instanceof Error ? error.message : String(error)]
      });
      console.log(`   ❌ Contract tests failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async runIntegrationTests(): Promise<void> {
    console.log('🔗 Running integration tests...');
    
    try {
      const startTime = Date.now();
      const output = execSync('npm run test:integration -- --run --reporter=json', {
        encoding: 'utf8',
        timeout: 300000 // 5 minutes
      });

      const duration = Date.now() - startTime;
      
      this.results.push({
        suite: 'Integration Tests',
        passed: true,
        duration,
        coverage: this.extractCoverage(output)
      });
      console.log(`   ✅ Integration tests completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - Date.now();
      this.results.push({
        suite: 'Integration Tests',
        passed: false,
        duration,
        errors: [error instanceof Error ? error.message : String(error)]
      });
      console.log(`   ❌ Integration tests failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async runE2ETests(): Promise<void> {
    console.log('🌐 Running end-to-end tests...');
    
    try {
      const startTime = Date.now();
      const output = execSync('npm run test:e2e -- --run --reporter=json', {
        encoding: 'utf8',
        timeout: 600000 // 10 minutes
      });

      const duration = Date.now() - startTime;
      
      this.results.push({
        suite: 'End-to-End Tests',
        passed: true,
        duration
      });
      console.log(`   ✅ E2E tests completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - Date.now();
      this.results.push({
        suite: 'End-to-End Tests',
        passed: false,
        duration,
        errors: [error instanceof Error ? error.message : String(error)]
      });
      console.log(`   ❌ E2E tests failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async runSecurityTests(): Promise<void> {
    console.log('🔒 Running security tests...');
    
    try {
      const startTime = Date.now();
      const output = execSync('npm run test:security -- --run --reporter=json', {
        encoding: 'utf8',
        timeout: 240000 // 4 minutes
      });

      const duration = Date.now() - startTime;
      
      this.results.push({
        suite: 'Security Tests',
        passed: true,
        duration
      });
      console.log(`   ✅ Security tests completed in ${duration}ms`);
    } catch (error) {
      const duration = Date.now() - Date.now();
      this.results.push({
        suite: 'Security Tests',
        passed: false,
        duration,
        errors: [error instanceof Error ? error.message : String(error)]
      });
      console.log(`   ❌ Security tests failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private extractCoverage(output: string): number {
    // Try to extract coverage percentage from output
    const coverageMatch = output.match(/All files\s+\|\s+(\d+\.?\d*)/);
    return coverageMatch ? parseFloat(coverageMatch[1]) : 0;
  }

  private generateReport(): TestReport {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter(r => r.passed).length;
    const failed = this.results.length - passed;
    const overallResult = failed === 0 ? 'PASS' : 'FAIL';
    
    // Calculate average coverage
    const coverageResults = this.results.filter(r => r.coverage !== undefined);
    const averageCoverage = coverageResults.length > 0 
      ? coverageResults.reduce((sum, r) => sum + (r.coverage || 0), 0) / coverageResults.length
      : 0;

    const report: TestReport = {
      timestamp: new Date().toISOString(),
      overallResult,
      totalDuration,
      suites: this.results,
      summary: {
        total: this.results.length,
        passed,
        failed,
        coverage: Math.round(averageCoverage * 100) / 100
      }
    };

    this.printReport(report);
    this.saveReport(report);

    return report;
  }

  private printReport(report: TestReport): void {
    console.log('\n📊 Test Results Summary');
    console.log('=======================');
    console.log(`Overall Result: ${report.overallResult === 'PASS' ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`Total Duration: ${Math.round(report.totalDuration / 1000)}s`);
    console.log(`Test Suites: ${report.summary.passed}/${report.summary.total} passed`);
    if (report.summary.coverage > 0) {
      console.log(`Code Coverage: ${report.summary.coverage}%`);
    }
    console.log('');

    // Suite breakdown
    report.suites.forEach(suite => {
      const status = suite.passed ? '✅' : '❌';
      const duration = Math.round(suite.duration / 1000);
      const coverage = suite.coverage ? ` (${suite.coverage}% coverage)` : '';
      console.log(`${status} ${suite.suite}: ${duration}s${coverage}`);
      
      if (suite.errors && suite.errors.length > 0) {
        suite.errors.forEach(error => {
          console.log(`   Error: ${error}`);
        });
      }
    });

    // Failed tests details
    const failedSuites = report.suites.filter(s => !s.passed);
    if (failedSuites.length > 0) {
      console.log('\n🚨 Failed Test Suites:');
      console.log('======================');
      failedSuites.forEach(suite => {
        console.log(`- ${suite.suite}`);
        if (suite.errors) {
          suite.errors.forEach(error => console.log(`  ${error}`));
        }
      });
    }

    // Coverage recommendations
    if (report.summary.coverage > 0 && report.summary.coverage < 80) {
      console.log('\n⚠️  Code coverage is below 80%. Consider adding more tests.');
    }

    console.log('');
  }

  private saveReport(report: TestReport): void {
    const reportPath = join(process.cwd(), 'test-report.json');
    writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📄 Detailed test report saved to: ${reportPath}`);

    // Also save a simple HTML report
    const htmlReport = this.generateHTMLReport(report);
    const htmlPath = join(process.cwd(), 'test-report.html');
    writeFileSync(htmlPath, htmlReport);
    console.log(`📄 HTML test report saved to: ${htmlPath}`);
  }

  private generateHTMLReport(report: TestReport): string {
    const statusColor = report.overallResult === 'PASS' ? '#4CAF50' : '#F44336';
    const statusIcon = report.overallResult === 'PASS' ? '✅' : '❌';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MazaoChain Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background-color: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { text-align: center; margin-bottom: 30px; }
        .status { font-size: 24px; font-weight: bold; color: ${statusColor}; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 30px; }
        .metric { background: #f8f9fa; padding: 15px; border-radius: 6px; text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #333; }
        .metric-label { color: #666; margin-top: 5px; }
        .suites { margin-top: 20px; }
        .suite { margin-bottom: 15px; padding: 15px; border-radius: 6px; border-left: 4px solid #ddd; }
        .suite.passed { border-left-color: #4CAF50; background: #f1f8e9; }
        .suite.failed { border-left-color: #F44336; background: #ffebee; }
        .suite-name { font-weight: bold; margin-bottom: 5px; }
        .suite-details { color: #666; font-size: 14px; }
        .errors { margin-top: 10px; color: #d32f2f; font-size: 14px; }
        .timestamp { text-align: center; color: #666; margin-top: 20px; font-size: 14px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>MazaoChain Test Report</h1>
            <div class="status">${statusIcon} ${report.overallResult}</div>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${Math.round(report.totalDuration / 1000)}s</div>
                <div class="metric-label">Total Duration</div>
            </div>
            <div class="metric">
                <div class="metric-value">${report.summary.passed}/${report.summary.total}</div>
                <div class="metric-label">Suites Passed</div>
            </div>
            ${report.summary.coverage > 0 ? `
            <div class="metric">
                <div class="metric-value">${report.summary.coverage}%</div>
                <div class="metric-label">Code Coverage</div>
            </div>
            ` : ''}
        </div>
        
        <div class="suites">
            <h2>Test Suites</h2>
            ${report.suites.map(suite => `
                <div class="suite ${suite.passed ? 'passed' : 'failed'}">
                    <div class="suite-name">${suite.passed ? '✅' : '❌'} ${suite.suite}</div>
                    <div class="suite-details">
                        Duration: ${Math.round(suite.duration / 1000)}s
                        ${suite.coverage ? ` | Coverage: ${suite.coverage}%` : ''}
                    </div>
                    ${suite.errors && suite.errors.length > 0 ? `
                        <div class="errors">
                            ${suite.errors.map(error => `<div>Error: ${error}</div>`).join('')}
                        </div>
                    ` : ''}
                </div>
            `).join('')}
        </div>
        
        <div class="timestamp">
            Generated on ${new Date(report.timestamp).toLocaleString()}
        </div>
    </div>
</body>
</html>`;
  }
}

// Run tests if called directly
if (require.main === module) {
  const runner = new TestRunner();
  runner.runAllTests().then(report => {
    if (report.overallResult === 'FAIL') {
      process.exit(1);
    }
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export { TestRunner };
export type { TestReport, TestResult };
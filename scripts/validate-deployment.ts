#!/usr/bin/env node

import { execSync } from "child_process";

interface ValidationConfig {
  baseUrl: string;
  environment: "staging" | "production";
  timeout: number;
  retries: number;
}

interface ValidationResult {
  test: string;
  status: "pass" | "fail" | "warn";
  message: string;
  duration?: number;
}

class DeploymentValidator {
  private config: ValidationConfig;
  private results: ValidationResult[] = [];

  constructor(config: ValidationConfig) {
    this.config = config;
  }

  async validateDeployment(): Promise<boolean> {
    console.log(`🔍 Validating deployment at ${this.config.baseUrl}...`);

    try {
      // Core functionality tests
      await this.validateHealthCheck();
      await this.validateSecurityHeaders();
      await this.validateSSL();
      await this.validateAPI();
      await this.validateDatabase();
      await this.validateBlockchain();
      await this.validateMonitoring();
      await this.validatePerformance();
      await this.validateStaticAssets();

      // Environment-specific tests
      if (this.config.environment === "production") {
        await this.validateProductionSpecific();
      }

      // Generate report
      this.generateReport();

      const failedTests = this.results.filter((r) => r.status === "fail");
      return failedTests.length === 0;
    } catch (error) {
      console.error("❌ Validation failed with error:", error);
      return false;
    }
  }

  private async validateHealthCheck(): Promise<void> {
    const start = Date.now();

    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}/api/health`
      );
      const duration = Date.now() - start;

      if (response.status === 200) {
        const health = await response.json();

        if (health.status === "healthy") {
          this.addResult(
            "Health Check",
            "pass",
            "API health check passed",
            duration
          );
        } else {
          this.addResult(
            "Health Check",
            "fail",
            `Health check returned: ${health.status}`
          );
        }
      } else {
        this.addResult(
          "Health Check",
          "fail",
          `Health check returned status: ${response.status}`
        );
      }
    } catch (error) {
      this.addResult("Health Check", "fail", `Health check failed: ${error}`);
    }
  }

  private async validateSecurityHeaders(): Promise<void> {
    try {
      const response = await this.fetchWithTimeout(this.config.baseUrl);

      const requiredHeaders = [
        "x-frame-options",
        "x-content-type-options",
        "x-xss-protection",
      ];

      let allHeadersPresent = true;
      const missingHeaders: string[] = [];

      for (const header of requiredHeaders) {
        if (!response.headers.get(header)) {
          allHeadersPresent = false;
          missingHeaders.push(header);
        }
      }

      if (allHeadersPresent) {
        this.addResult(
          "Security Headers",
          "pass",
          "All required security headers present"
        );
      } else {
        this.addResult(
          "Security Headers",
          "fail",
          `Missing headers: ${missingHeaders.join(", ")}`
        );
      }

      // Check HTTPS enforcement
      if (this.config.baseUrl.startsWith("https://")) {
        const hsts = response.headers.get("strict-transport-security");
        if (hsts) {
          this.addResult("HSTS Header", "pass", "HSTS header present");
        } else {
          this.addResult("HSTS Header", "warn", "HSTS header missing");
        }
      }
    } catch (error) {
      this.addResult(
        "Security Headers",
        "fail",
        `Security header check failed: ${error}`
      );
    }
  }

  private async validateSSL(): Promise<void> {
    if (!this.config.baseUrl.startsWith("https://")) {
      this.addResult("SSL Certificate", "warn", "Not using HTTPS");
      return;
    }

    try {
      const response = await this.fetchWithTimeout(this.config.baseUrl);

      if (response.status < 400) {
        this.addResult("SSL Certificate", "pass", "SSL certificate valid");
      } else {
        this.addResult(
          "SSL Certificate",
          "fail",
          "SSL certificate validation failed"
        );
      }

      // Test HTTP to HTTPS redirect
      const httpUrl = this.config.baseUrl.replace("https://", "http://");
      const redirectResponse = await this.fetchWithTimeout(httpUrl, {
        redirect: "manual",
      });

      if ([301, 302, 308].includes(redirectResponse.status)) {
        this.addResult(
          "HTTP Redirect",
          "pass",
          "HTTP to HTTPS redirect working"
        );
      } else {
        this.addResult(
          "HTTP Redirect",
          "warn",
          "HTTP to HTTPS redirect not configured"
        );
      }
    } catch (error) {
      this.addResult(
        "SSL Certificate",
        "fail",
        `SSL validation failed: ${error}`
      );
    }
  }

  private async validateAPI(): Promise<void> {
    const apiEndpoints = ["/api/health", "/api/metrics"];

    for (const endpoint of apiEndpoints) {
      try {
        const response = await this.fetchWithTimeout(
          `${this.config.baseUrl}${endpoint}`
        );

        if (response.status === 200) {
          this.addResult(
            `API ${endpoint}`,
            "pass",
            "Endpoint responding correctly"
          );
        } else {
          this.addResult(
            `API ${endpoint}`,
            "fail",
            `Endpoint returned status: ${response.status}`
          );
        }
      } catch (error) {
        this.addResult(`API ${endpoint}`, "fail", `Endpoint failed: ${error}`);
      }
    }

    // Test protected endpoints return proper auth errors
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}/api/user/profile`
      );

      if ([401, 403].includes(response.status)) {
        this.addResult(
          "API Authentication",
          "pass",
          "Protected endpoints properly secured"
        );
      } else {
        this.addResult(
          "API Authentication",
          "warn",
          "Protected endpoints may not be properly secured"
        );
      }
    } catch (error) {
      this.addResult(
        "API Authentication",
        "fail",
        `Auth check failed: ${error}`
      );
    }
  }

  private async validateDatabase(): Promise<void> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}/api/health`
      );

      if (response.status === 200) {
        const health = await response.json();

        if (health.services?.database === "healthy") {
          this.addResult(
            "Database Connection",
            "pass",
            "Database connection healthy"
          );
        } else {
          this.addResult(
            "Database Connection",
            "fail",
            "Database connection unhealthy"
          );
        }
      }
    } catch (error) {
      this.addResult(
        "Database Connection",
        "fail",
        `Database check failed: ${error}`
      );
    }
  }

  private async validateBlockchain(): Promise<void> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}/api/blockchain/status`
      );

      if (response.status === 200) {
        const status = await response.json();

        if (status.connected && status.network === "mainnet") {
          this.addResult(
            "Blockchain Connection",
            "pass",
            "Hedera mainnet connection active"
          );
        } else {
          this.addResult(
            "Blockchain Connection",
            "warn",
            `Blockchain status: ${JSON.stringify(status)}`
          );
        }
      } else {
        this.addResult(
          "Blockchain Connection",
          "warn",
          "Blockchain status endpoint not available"
        );
      }
    } catch (error) {
      this.addResult(
        "Blockchain Connection",
        "warn",
        `Blockchain check failed: ${error}`
      );
    }
  }

  private async validateMonitoring(): Promise<void> {
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}/api/metrics`
      );

      if (response.status === 200) {
        const metrics = await response.text();

        const expectedMetrics = [
          "http_requests_total",
          "http_request_duration_seconds",
          "nodejs_version_info",
        ];

        const missingMetrics = expectedMetrics.filter(
          (metric) => !metrics.includes(metric)
        );

        if (missingMetrics.length === 0) {
          this.addResult(
            "Monitoring Metrics",
            "pass",
            "All expected metrics available"
          );
        } else {
          this.addResult(
            "Monitoring Metrics",
            "warn",
            `Missing metrics: ${missingMetrics.join(", ")}`
          );
        }
      } else {
        this.addResult(
          "Monitoring Metrics",
          "fail",
          "Metrics endpoint not available"
        );
      }
    } catch (error) {
      this.addResult(
        "Monitoring Metrics",
        "fail",
        `Metrics check failed: ${error}`
      );
    }
  }

  private async validatePerformance(): Promise<void> {
    const start = Date.now();

    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}/api/health`
      );
      const duration = Date.now() - start;

      if (duration < 2000) {
        this.addResult("Response Time", "pass", `Response time: ${duration}ms`);
      } else if (duration < 5000) {
        this.addResult(
          "Response Time",
          "warn",
          `Response time: ${duration}ms (slow)`
        );
      } else {
        this.addResult(
          "Response Time",
          "fail",
          `Response time: ${duration}ms (too slow)`
        );
      }

      // Test concurrent requests
      const concurrentRequests = Array(5)
        .fill(null)
        .map(() => this.fetchWithTimeout(`${this.config.baseUrl}/api/health`));

      const concurrentStart = Date.now();
      const responses = await Promise.all(concurrentRequests);
      const concurrentDuration = Date.now() - concurrentStart;

      const successfulResponses = responses.filter((r) => r.status === 200);

      if (successfulResponses.length === responses.length) {
        this.addResult(
          "Concurrent Requests",
          "pass",
          `Handled ${responses.length} concurrent requests in ${concurrentDuration}ms`
        );
      } else {
        this.addResult(
          "Concurrent Requests",
          "warn",
          `Only ${successfulResponses.length}/${responses.length} concurrent requests succeeded`
        );
      }
    } catch (error) {
      this.addResult(
        "Performance",
        "fail",
        `Performance check failed: ${error}`
      );
    }
  }

  private async validateStaticAssets(): Promise<void> {
    const staticAssets = ["/manifest.json", "/sw.js"];

    for (const asset of staticAssets) {
      try {
        const response = await this.fetchWithTimeout(
          `${this.config.baseUrl}${asset}`
        );

        if (response.status === 200) {
          this.addResult(`Static Asset ${asset}`, "pass", "Asset available");

          // Check caching headers
          const cacheControl = response.headers.get("cache-control");
          if (cacheControl) {
            this.addResult(
              `Caching ${asset}`,
              "pass",
              `Cache headers present: ${cacheControl}`
            );
          } else {
            this.addResult(
              `Caching ${asset}`,
              "warn",
              "No cache headers found"
            );
          }
        } else {
          this.addResult(
            `Static Asset ${asset}`,
            "fail",
            `Asset returned status: ${response.status}`
          );
        }
      } catch (error) {
        this.addResult(
          `Static Asset ${asset}`,
          "fail",
          `Asset check failed: ${error}`
        );
      }
    }
  }

  private async validateProductionSpecific(): Promise<void> {
    // Check environment variables are set for production
    const requiredProdEnvVars = ["NODE_ENV", "NEXT_PUBLIC_HEDERA_NETWORK"];

    // This would need to be checked server-side, so we'll validate through API
    try {
      const response = await this.fetchWithTimeout(
        `${this.config.baseUrl}/api/health`
      );
      const health = await response.json();

      if (health.environment === "production") {
        this.addResult(
          "Production Environment",
          "pass",
          "Running in production mode"
        );
      } else {
        this.addResult(
          "Production Environment",
          "fail",
          `Environment is: ${health.environment}`
        );
      }
    } catch (error) {
      this.addResult(
        "Production Environment",
        "warn",
        "Could not verify production environment"
      );
    }

    // Check for development/debug endpoints that should be disabled
    const debugEndpoints = ["/api/debug", "/api/test"];

    for (const endpoint of debugEndpoints) {
      try {
        const response = await this.fetchWithTimeout(
          `${this.config.baseUrl}${endpoint}`
        );

        if (response.status === 404) {
          this.addResult(
            `Debug Endpoint ${endpoint}`,
            "pass",
            "Debug endpoint properly disabled"
          );
        } else {
          this.addResult(
            `Debug Endpoint ${endpoint}`,
            "warn",
            "Debug endpoint may be exposed"
          );
        }
      } catch (error) {
        this.addResult(
          `Debug Endpoint ${endpoint}`,
          "pass",
          "Debug endpoint not accessible"
        );
      }
    }
  }

  private async fetchWithTimeout(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private addResult(
    test: string,
    status: "pass" | "fail" | "warn",
    message: string,
    duration?: number
  ): void {
    this.results.push({ test, status, message, duration });
  }

  private generateReport(): void {
    console.log("\n📊 Deployment Validation Report");
    console.log("================================");

    const passed = this.results.filter((r) => r.status === "pass").length;
    const failed = this.results.filter((r) => r.status === "fail").length;
    const warnings = this.results.filter((r) => r.status === "warn").length;

    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Warnings: ${warnings}`);
    console.log(`📊 Total: ${this.results.length}\n`);

    // Show detailed results
    for (const result of this.results) {
      const icon =
        result.status === "pass"
          ? "✅"
          : result.status === "fail"
          ? "❌"
          : "⚠️";
      const duration = result.duration ? ` (${result.duration}ms)` : "";
      console.log(`${icon} ${result.test}: ${result.message}${duration}`);
    }

    // Summary
    if (failed === 0) {
      console.log("\n🎉 Deployment validation completed successfully!");
    } else {
      console.log(
        `\n💥 Deployment validation failed with ${failed} critical issues.`
      );
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  const config: ValidationConfig = {
    baseUrl:
      process.env.BASE_URL ||
      args.find((arg) => arg.startsWith("--url="))?.split("=")[1] ||
      "http://localhost:3000",
    environment:
      (args.find((arg) => arg.startsWith("--env="))?.split("=")[1] as
        | "staging"
        | "production") || "production",
    timeout: parseInt(process.env.VALIDATION_TIMEOUT || "10000"),
    retries: parseInt(process.env.VALIDATION_RETRIES || "3"),
  };

  console.log(
    `🚀 Starting deployment validation for ${config.environment} environment`
  );
  console.log(`🌐 Target URL: ${config.baseUrl}`);

  const validator = new DeploymentValidator(config);
  const success = await validator.validateDeployment();

  process.exit(success ? 0 : 1);
}

if (require.main === module) {
  main();
}

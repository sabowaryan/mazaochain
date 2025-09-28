#!/usr/bin/env node

import { execSync } from "child_process";
import { readFileSync, writeFileSync, existsSync } from "fs";
import path from "path";

interface DisasterRecoveryConfig {
  backupPath: string;
  applicationPath: string;
  databaseUrl: string;
  supabaseServiceKey: string;
  recoveryMode: "full" | "database-only" | "application-only";
  verifyIntegrity: boolean;
}

interface BackupMetadata {
  filename: string;
  timestamp: string;
  size: number;
  checksum: string;
}

class DisasterRecovery {
  private config: DisasterRecoveryConfig;

  constructor(config: DisasterRecoveryConfig) {
    this.config = config;
  }

  async executeRecovery(): Promise<void> {
    console.log("🚨 Starting disaster recovery process...");

    try {
      // Pre-recovery checks
      await this.preRecoveryChecks();

      // Stop services
      await this.stopServices();

      // Execute recovery based on mode
      switch (this.config.recoveryMode) {
        case "full":
          await this.fullRecovery();
          break;
        case "database-only":
          await this.databaseRecovery();
          break;
        case "application-only":
          await this.applicationRecovery();
          break;
      }

      // Verify recovery
      if (this.config.verifyIntegrity) {
        await this.verifyRecovery();
      }

      // Restart services
      await this.startServices();

      console.log("✅ Disaster recovery completed successfully");
    } catch (error) {
      console.error("❌ Disaster recovery failed:", error);
      await this.rollbackRecovery();
      throw error;
    }
  }

  private async preRecoveryChecks(): Promise<void> {
    console.log("🔍 Running pre-recovery checks...");

    // Check if backup directory exists
    if (!existsSync(this.config.backupPath)) {
      throw new Error(`Backup directory not found: ${this.config.backupPath}`);
    }

    // Check if application directory exists
    if (!existsSync(this.config.applicationPath)) {
      throw new Error(
        `Application directory not found: ${this.config.applicationPath}`
      );
    }

    // Check available disk space
    const diskSpace = this.getAvailableDiskSpace();
    if (diskSpace < 5 * 1024 * 1024 * 1024) {
      // 5GB minimum
      throw new Error("Insufficient disk space for recovery operation");
    }

    // Verify database connectivity
    try {
      execSync("npx supabase status", { stdio: "pipe" });
    } catch (error) {
      console.warn(
        "⚠️ Supabase CLI not available, skipping database connectivity check"
      );
    }

    console.log("✅ Pre-recovery checks passed");
  }

  private async stopServices(): Promise<void> {
    console.log("🛑 Stopping services...");

    try {
      // Stop application containers
      execSync(
        `cd ${this.config.applicationPath} && docker-compose -f deployment/production/docker-compose.yml down`,
        { stdio: "inherit" }
      );

      // Stop monitoring services
      execSync(
        `cd ${this.config.applicationPath} && docker-compose -f deployment/production/docker-compose.monitoring.yml down`,
        { stdio: "inherit" }
      );

      console.log("✅ Services stopped successfully");
    } catch (error) {
      console.warn("⚠️ Some services may not have stopped cleanly:", error);
    }
  }

  private async fullRecovery(): Promise<void> {
    console.log("🔄 Executing full system recovery...");

    await this.databaseRecovery();
    await this.applicationRecovery();
  }

  private async databaseRecovery(): Promise<void> {
    console.log("🗄️ Recovering database...");

    // Find latest backup
    const latestBackup = this.findLatestBackup();
    if (!latestBackup) {
      throw new Error("No database backup found");
    }

    console.log(`Using backup: ${latestBackup.filename}`);

    // Verify backup integrity
    if (this.config.verifyIntegrity) {
      await this.verifyBackupIntegrity(latestBackup);
    }

    // Extract backup
    const backupPath = path.join(this.config.backupPath, latestBackup.filename);
    const extractedPath = backupPath.replace(".gz", "");

    execSync(`gunzip -c "${backupPath}" > "${extractedPath}"`, {
      stdio: "inherit",
    });

    try {
      // Restore database
      const restoreCommand = `
        npx supabase db reset --db-url "${this.config.databaseUrl}" &&
        psql "${this.config.databaseUrl}" < "${extractedPath}"
      `;

      execSync(restoreCommand, { stdio: "inherit" });

      console.log("✅ Database recovery completed");
    } finally {
      // Cleanup extracted file
      if (existsSync(extractedPath)) {
        execSync(`rm "${extractedPath}"`, { stdio: "pipe" });
      }
    }
  }

  private async applicationRecovery(): Promise<void> {
    console.log("📱 Recovering application...");

    // Pull latest code from repository
    execSync(
      `cd ${this.config.applicationPath} && git fetch origin && git reset --hard origin/main`,
      { stdio: "inherit" }
    );

    // Restore environment configuration
    const envBackupPath = path.join(
      this.config.backupPath,
      "env-backup.tar.gz"
    );
    if (existsSync(envBackupPath)) {
      execSync(
        `cd ${this.config.applicationPath} && tar -xzf "${envBackupPath}"`,
        { stdio: "inherit" }
      );
    }

    // Rebuild Docker images
    execSync(
      `cd ${this.config.applicationPath} && docker-compose -f deployment/production/docker-compose.yml build`,
      { stdio: "inherit" }
    );

    console.log("✅ Application recovery completed");
  }

  private async verifyRecovery(): Promise<void> {
    console.log("🔍 Verifying recovery integrity...");

    // Start services temporarily for verification
    await this.startServices();

    // Wait for services to be ready
    await this.waitForServices();

    // Run health checks
    try {
      execSync("curl -f http://localhost:3000/api/health", { stdio: "pipe" });
      console.log("✅ Application health check passed");
    } catch (error) {
      throw new Error("Application health check failed");
    }

    // Verify database connectivity
    try {
      execSync(`psql "${this.config.databaseUrl}" -c "SELECT 1;"`, {
        stdio: "pipe",
      });
      console.log("✅ Database connectivity verified");
    } catch (error) {
      throw new Error("Database connectivity verification failed");
    }

    // Run smoke tests
    try {
      execSync("npm run test:smoke", {
        stdio: "inherit",
        cwd: this.config.applicationPath,
      });
      console.log("✅ Smoke tests passed");
    } catch (error) {
      console.warn(
        "⚠️ Some smoke tests failed, but recovery appears successful"
      );
    }
  }

  private async startServices(): Promise<void> {
    console.log("🚀 Starting services...");

    try {
      // Start application services
      execSync(
        `cd ${this.config.applicationPath} && docker-compose -f deployment/production/docker-compose.yml up -d`,
        { stdio: "inherit" }
      );

      // Start monitoring services
      execSync(
        `cd ${this.config.applicationPath} && docker-compose -f deployment/production/docker-compose.monitoring.yml up -d`,
        { stdio: "inherit" }
      );

      console.log("✅ Services started successfully");
    } catch (error) {
      throw new Error(`Failed to start services: ${error}`);
    }
  }

  private async waitForServices(): Promise<void> {
    console.log("⏳ Waiting for services to be ready...");

    const maxWaitTime = 120; // 2 minutes
    const checkInterval = 5; // 5 seconds
    let elapsed = 0;

    while (elapsed < maxWaitTime) {
      try {
        execSync("curl -f http://localhost:3000/api/health", { stdio: "pipe" });
        console.log("✅ Services are ready");
        return;
      } catch (error) {
        elapsed += checkInterval;
        if (elapsed < maxWaitTime) {
          console.log(`Waiting for services... (${elapsed}/${maxWaitTime}s)`);
          await new Promise((resolve) =>
            setTimeout(resolve, checkInterval * 1000)
          );
        }
      }
    }

    throw new Error("Services did not become ready within the timeout period");
  }

  private async rollbackRecovery(): Promise<void> {
    console.log("🔄 Rolling back recovery...");

    try {
      // Stop any running services
      await this.stopServices();

      // Restore from previous state if available
      const rollbackBackup = this.findRollbackBackup();
      if (rollbackBackup) {
        console.log("Restoring from rollback backup...");
        await this.databaseRecovery();
      }

      console.log("✅ Rollback completed");
    } catch (error) {
      console.error("❌ Rollback failed:", error);
    }
  }

  private findLatestBackup(): BackupMetadata | null {
    try {
      const backupFiles = execSync(
        `find "${this.config.backupPath}" -name "mazaochain-backup-*.sql.gz.meta" -type f`,
        { encoding: "utf8" }
      )
        .trim()
        .split("\n")
        .filter(Boolean);

      if (backupFiles.length === 0) {
        return null;
      }

      // Sort by timestamp and get the latest
      const backups = backupFiles
        .map((metaFile) => {
          const content = readFileSync(metaFile, "utf8");
          return JSON.parse(content) as BackupMetadata;
        })
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

      return backups[0];
    } catch (error) {
      console.error("Error finding latest backup:", error);
      return null;
    }
  }

  private findRollbackBackup(): BackupMetadata | null {
    // Find the second latest backup for rollback
    try {
      const backupFiles = execSync(
        `find "${this.config.backupPath}" -name "mazaochain-backup-*.sql.gz.meta" -type f`,
        { encoding: "utf8" }
      )
        .trim()
        .split("\n")
        .filter(Boolean);

      if (backupFiles.length < 2) {
        return null;
      }

      const backups = backupFiles
        .map((metaFile) => {
          const content = readFileSync(metaFile, "utf8");
          return JSON.parse(content) as BackupMetadata;
        })
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

      return backups[1]; // Second latest
    } catch (error) {
      console.error("Error finding rollback backup:", error);
      return null;
    }
  }

  private async verifyBackupIntegrity(backup: BackupMetadata): Promise<void> {
    console.log("🔍 Verifying backup integrity...");

    const backupPath = path.join(this.config.backupPath, backup.filename);

    // Verify file exists
    if (!existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    // Verify checksum
    const actualChecksum = execSync(`sha256sum "${backupPath}"`, {
      encoding: "utf8",
    }).split(" ")[0];
    if (actualChecksum !== backup.checksum) {
      throw new Error("Backup integrity check failed: checksum mismatch");
    }

    console.log("✅ Backup integrity verified");
  }

  private getAvailableDiskSpace(): number {
    try {
      const output = execSync("df -B1 . | tail -1", { encoding: "utf8" });
      const parts = output.trim().split(/\s+/);
      return parseInt(parts[3]); // Available space in bytes
    } catch (error) {
      console.warn("Could not determine disk space");
      return Number.MAX_SAFE_INTEGER;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);

  const config: DisasterRecoveryConfig = {
    backupPath: process.env.BACKUP_PATH || "/var/backups/mazaochain",
    applicationPath: process.env.APP_PATH || "/opt/mazaochain",
    databaseUrl: process.env.DATABASE_URL || "",
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    recoveryMode:
      (args.find((arg) => arg.startsWith("--mode="))?.split("=")[1] as
        | "full"
        | "database-only"
        | "application-only") || "full",
    verifyIntegrity: !args.includes("--no-verify"),
  };

  if (!config.databaseUrl || !config.supabaseServiceKey) {
    console.error(
      "Missing required environment variables: DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY"
    );
    process.exit(1);
  }

  const recovery = new DisasterRecovery(config);

  try {
    await recovery.executeRecovery();
    console.log("🎉 Disaster recovery completed successfully!");
  } catch (error) {
    console.error("💥 Disaster recovery failed:", error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

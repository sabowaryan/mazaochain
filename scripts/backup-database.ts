#!/usr/bin/env node

import { execSync } from 'child_process';
import { writeFileSync } from 'fs';
import path from 'path';

interface BackupConfig {
  supabaseUrl: string;
  supabaseKey: string;
  backupPath: string;
  retentionDays: number;
}

class DatabaseBackup {
  private config: BackupConfig;

  constructor(config: BackupConfig) {
    this.config = config;
  }

  async createBackup(): Promise<string> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `mazaochain-backup-${timestamp}.sql`;
    const backupFilePath = path.join(this.config.backupPath, backupFileName);

    try {
      console.log('Starting database backup...');

      // Create backup directory if it doesn't exist
      execSync(`mkdir -p ${this.config.backupPath}`, { stdio: 'inherit' });

      // Export database schema and data
      const backupCommand = `
        npx supabase db dump \
          --db-url "${this.config.supabaseUrl}" \
          --file "${backupFilePath}" \
          --data-only=false
      `;

      execSync(backupCommand, { stdio: 'inherit' });

      // Compress the backup
      execSync(`gzip "${backupFilePath}"`, { stdio: 'inherit' });
      const compressedPath = `${backupFilePath}.gz`;

      console.log(`Backup created successfully: ${compressedPath}`);

      // Create backup metadata
      const metadata = {
        filename: `${backupFileName}.gz`,
        timestamp: new Date().toISOString(),
        size: this.getFileSize(compressedPath),
        checksum: this.calculateChecksum(compressedPath)
      };

      writeFileSync(
        `${compressedPath}.meta`,
        JSON.stringify(metadata, null, 2)
      );

      return compressedPath;

    } catch (error) {
      console.error('Backup failed:', error);
      throw error;
    }
  }

  async cleanupOldBackups(): Promise<void> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);

      const cleanupCommand = `
        find "${this.config.backupPath}" \
          -name "mazaochain-backup-*.sql.gz" \
          -type f \
          -mtime +${this.config.retentionDays} \
          -delete
      `;

      execSync(cleanupCommand, { stdio: 'inherit' });

      // Also cleanup metadata files
      const cleanupMetaCommand = `
        find "${this.config.backupPath}" \
          -name "mazaochain-backup-*.sql.gz.meta" \
          -type f \
          -mtime +${this.config.retentionDays} \
          -delete
      `;

      execSync(cleanupMetaCommand, { stdio: 'inherit' });

      console.log(`Cleaned up backups older than ${this.config.retentionDays} days`);

    } catch (error) {
      console.error('Cleanup failed:', error);
      throw error;
    }
  }

  private getFileSize(filePath: string): number {
    try {
      const stats = execSync(`stat -c%s "${filePath}"`, { encoding: 'utf8' });
      return parseInt(stats.trim());
    } catch {
      return 0;
    }
  }

  private calculateChecksum(filePath: string): string {
    try {
      const checksum = execSync(`sha256sum "${filePath}"`, { encoding: 'utf8' });
      return checksum.split(' ')[0];
    } catch {
      return '';
    }
  }
}

async function main() {
  const config: BackupConfig = {
    supabaseUrl: process.env.DATABASE_URL || '',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    backupPath: process.env.BACKUP_PATH || '/var/backups/mazaochain',
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '30')
  };

  if (!config.supabaseUrl || !config.supabaseKey) {
    console.error('Missing required environment variables: DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const backup = new DatabaseBackup(config);

  try {
    // Create backup
    const backupPath = await backup.createBackup();
    
    // Upload to cloud storage if configured
    if (process.env.AWS_S3_BACKUP_BUCKET) {
      await uploadToS3(backupPath, process.env.AWS_S3_BACKUP_BUCKET);
    }

    // Cleanup old backups
    await backup.cleanupOldBackups();

    console.log('Backup process completed successfully');

  } catch (error) {
    console.error('Backup process failed:', error);
    process.exit(1);
  }
}

async function uploadToS3(filePath: string, bucketName: string): Promise<void> {
  try {
    const fileName = path.basename(filePath);
    const s3Key = `database-backups/${fileName}`;

    const uploadCommand = `
      aws s3 cp "${filePath}" "s3://${bucketName}/${s3Key}" \
        --storage-class STANDARD_IA \
        --server-side-encryption AES256
    `;

    execSync(uploadCommand, { stdio: 'inherit' });
    console.log(`Backup uploaded to S3: s3://${bucketName}/${s3Key}`);

  } catch (error) {
    console.error('S3 upload failed:', error);
    throw error;
  }
}

if (require.main === module) {
  main();
}
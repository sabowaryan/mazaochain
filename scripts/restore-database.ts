#!/usr/bin/env node

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import path from 'path';

interface RestoreConfig {
  supabaseUrl: string;
  supabaseKey: string;
  backupPath: string;
}

class DatabaseRestore {
  private config: RestoreConfig;

  constructor(config: RestoreConfig) {
    this.config = config;
  }

  async listBackups(): Promise<Array<{ filename: string; timestamp: string; size: number }>> {
    try {
      const backups: Array<{ filename: string; timestamp: string; size: number }> = [];
      
      const listCommand = `find "${this.config.backupPath}" -name "mazaochain-backup-*.sql.gz" -type f | sort -r`;
      const files = execSync(listCommand, { encoding: 'utf8' }).trim().split('\n').filter(f => f);

      for (const file of files) {
        const metaFile = `${file}.meta`;
        if (existsSync(metaFile)) {
          const metadata = JSON.parse(readFileSync(metaFile, 'utf8'));
          backups.push({
            filename: path.basename(file),
            timestamp: metadata.timestamp,
            size: metadata.size
          });
        } else {
          // Fallback to file stats if metadata doesn't exist
          const stats = execSync(`stat -c "%Y %s" "${file}"`, { encoding: 'utf8' }).trim().split(' ');
          backups.push({
            filename: path.basename(file),
            timestamp: new Date(parseInt(stats[0]) * 1000).toISOString(),
            size: parseInt(stats[1])
          });
        }
      }

      return backups;

    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }

  async restoreFromBackup(backupFilename: string, confirmRestore: boolean = false): Promise<void> {
    const backupPath = path.join(this.config.backupPath, backupFilename);

    if (!existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupPath}`);
    }

    if (!confirmRestore) {
      console.warn('⚠️  WARNING: This will completely replace the current database!');
      console.warn('⚠️  All current data will be lost!');
      console.warn('⚠️  Use --confirm flag to proceed with the restore.');
      return;
    }

    try {
      console.log(`Starting database restore from: ${backupFilename}`);

      // Verify backup integrity
      await this.verifyBackup(backupPath);

      // Create a temporary directory for extraction
      const tempDir = `/tmp/mazaochain-restore-${Date.now()}`;
      execSync(`mkdir -p "${tempDir}"`, { stdio: 'inherit' });

      try {
        // Extract the backup
        const extractedFile = path.join(tempDir, backupFilename.replace('.gz', ''));
        execSync(`gunzip -c "${backupPath}" > "${extractedFile}"`, { stdio: 'inherit' });

        // Stop the application (if running in production)
        if (process.env.NODE_ENV === 'production') {
          console.log('Stopping application services...');
          execSync('docker-compose -f deployment/production/docker-compose.yml stop mazaochain-app', { stdio: 'inherit' });
        }

        // Restore the database
        console.log('Restoring database...');
        const restoreCommand = `
          psql "${this.config.supabaseUrl}" \
            -f "${extractedFile}" \
            --single-transaction \
            --set ON_ERROR_STOP=on
        `;

        execSync(restoreCommand, { stdio: 'inherit' });

        // Restart the application
        if (process.env.NODE_ENV === 'production') {
          console.log('Restarting application services...');
          execSync('docker-compose -f deployment/production/docker-compose.yml start mazaochain-app', { stdio: 'inherit' });
        }

        console.log('Database restore completed successfully');

      } finally {
        // Cleanup temporary files
        execSync(`rm -rf "${tempDir}"`, { stdio: 'inherit' });
      }

    } catch (error) {
      console.error('Restore failed:', error);
      
      // Attempt to restart services even if restore failed
      if (process.env.NODE_ENV === 'production') {
        try {
          execSync('docker-compose -f deployment/production/docker-compose.yml start mazaochain-app', { stdio: 'inherit' });
        } catch (restartError) {
          console.error('Failed to restart services:', restartError);
        }
      }
      
      throw error;
    }
  }

  private async verifyBackup(backupPath: string): Promise<void> {
    const metaPath = `${backupPath}.meta`;
    
    if (!existsSync(metaPath)) {
      console.warn('No metadata file found, skipping integrity check');
      return;
    }

    try {
      const metadata = JSON.parse(readFileSync(metaPath, 'utf8'));
      const currentChecksum = execSync(`sha256sum "${backupPath}"`, { encoding: 'utf8' }).split(' ')[0];

      if (metadata.checksum && metadata.checksum !== currentChecksum) {
        throw new Error('Backup file integrity check failed - checksums do not match');
      }

      console.log('Backup integrity verified');

    } catch (error) {
      console.error('Backup verification failed:', error);
      throw error;
    }
  }
}

async function main() {
  const config: RestoreConfig = {
    supabaseUrl: process.env.DATABASE_URL || '',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    backupPath: process.env.BACKUP_PATH || '/var/backups/mazaochain'
  };

  if (!config.supabaseUrl || !config.supabaseKey) {
    console.error('Missing required environment variables: DATABASE_URL, SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  const restore = new DatabaseRestore(config);
  const args = process.argv.slice(2);

  if (args.includes('--list')) {
    // List available backups
    const backups = await restore.listBackups();
    
    if (backups.length === 0) {
      console.log('No backups found');
      return;
    }

    console.log('\nAvailable backups:');
    console.log('==================');
    backups.forEach((backup, index) => {
      const sizeInMB = (backup.size / 1024 / 1024).toFixed(2);
      const date = new Date(backup.timestamp).toLocaleString();
      console.log(`${index + 1}. ${backup.filename}`);
      console.log(`   Date: ${date}`);
      console.log(`   Size: ${sizeInMB} MB`);
      console.log('');
    });

  } else if (args.length >= 1) {
    // Restore from specific backup
    const backupFilename = args[0];
    const confirmRestore = args.includes('--confirm');

    try {
      await restore.restoreFromBackup(backupFilename, confirmRestore);
    } catch (error) {
      console.error('Restore process failed:', error);
      process.exit(1);
    }

  } else {
    console.log('Usage:');
    console.log('  npm run restore-db -- --list                    # List available backups');
    console.log('  npm run restore-db -- <backup-filename>         # Preview restore (dry run)');
    console.log('  npm run restore-db -- <backup-filename> --confirm  # Actually restore');
    console.log('');
    console.log('Example:');
    console.log('  npm run restore-db -- mazaochain-backup-2024-01-15T10-30-00-000Z.sql.gz --confirm');
  }
}

if (require.main === module) {
  main();
}
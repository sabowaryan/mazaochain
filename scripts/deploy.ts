#!/usr/bin/env node

import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

interface DeploymentConfig {
  environment: 'staging' | 'production';
  imageTag: string;
  host: string;
  user: string;
  backupBeforeDeploy: boolean;
  runMigrations: boolean;
  healthCheckUrl: string;
  rollbackOnFailure: boolean;
}

class Deployment {
  private config: DeploymentConfig;

  constructor(config: DeploymentConfig) {
    this.config = config;
  }

  async deploy(): Promise<void> {
    console.log(`🚀 Starting deployment to ${this.config.environment}...`);

    try {
      // Pre-deployment checks
      await this.preDeploymentChecks();

      // Create backup if requested
      if (this.config.backupBeforeDeploy) {
        await this.createBackup();
      }

      // Deploy the application
      await this.deployApplication();

      // Run database migrations if needed
      if (this.config.runMigrations) {
        await this.runMigrations();
      }

      // Health check
      await this.healthCheck();

      // Post-deployment tasks
      await this.postDeploymentTasks();

      console.log('✅ Deployment completed successfully!');

    } catch (error) {
      console.error('❌ Deployment failed:', error);

      if (this.config.rollbackOnFailure) {
        await this.rollback();
      }

      throw error;
    }
  }

  private async preDeploymentChecks(): Promise<void> {
    console.log('🔍 Running pre-deployment checks...');

    // Check if target server is reachable
    try {
      execSync(`ssh -o ConnectTimeout=10 ${this.config.user}@${this.config.host} 'echo "Connection successful"'`, { stdio: 'pipe' });
    } catch (error) {
      throw new Error(`Cannot connect to target server: ${this.config.host}`);
    }

    // Check if Docker is running on target server
    try {
      execSync(`ssh ${this.config.user}@${this.config.host} 'docker --version'`, { stdio: 'pipe' });
    } catch (error) {
      throw new Error('Docker is not available on target server');
    }

    // Check if required environment variables are set
    const requiredEnvVars = [
      'DATABASE_URL',
      'NEXT_PUBLIC_SUPABASE_URL',
      'NEXT_PUBLIC_HEDERA_NETWORK'
    ];

    for (const envVar of requiredEnvVars) {
      try {
        const result = execSync(`ssh ${this.config.user}@${this.config.host} 'cd /opt/mazaochain && grep -q "^${envVar}=" .env.${this.config.environment} || echo "MISSING"'`, { encoding: 'utf8' });
        if (result.trim() === 'MISSING') {
          throw new Error(`Required environment variable ${envVar} is not set`);
        }
      } catch (error) {
        throw new Error(`Failed to check environment variable ${envVar}: ${error}`);
      }
    }

    console.log('✅ Pre-deployment checks passed');
  }

  private async createBackup(): Promise<void> {
    console.log('💾 Creating database backup...');

    try {
      execSync(`ssh ${this.config.user}@${this.config.host} 'cd /opt/mazaochain && npm run backup-db'`, { stdio: 'inherit' });
      console.log('✅ Backup created successfully');
    } catch (error) {
      throw new Error(`Backup failed: ${error}`);
    }
  }

  private async deployApplication(): Promise<void> {
    console.log('🔄 Deploying application...');

    const deployCommands = `
      cd /opt/mazaochain

      # Pull latest code
      git pull origin main

      # Update Docker image tag in docker-compose
      sed -i 's|image: ghcr.io/mazaochain/mazaochain:.*|image: ghcr.io/mazaochain/mazaochain:${this.config.imageTag}|' deployment/${this.config.environment}/docker-compose.yml

      # Pull new image
      docker-compose -f deployment/${this.config.environment}/docker-compose.yml pull mazaochain-app

      # Deploy with zero-downtime rolling update
      docker-compose -f deployment/${this.config.environment}/docker-compose.yml up -d --no-deps mazaochain-app

      # Wait for container to be ready
      sleep 10
    `;

    try {
      execSync(`ssh ${this.config.user}@${this.config.host} '${deployCommands}'`, { stdio: 'inherit' });
      console.log('✅ Application deployed successfully');
    } catch (error) {
      throw new Error(`Application deployment failed: ${error}`);
    }
  }

  private async runMigrations(): Promise<void> {
    console.log('🗄️ Running database migrations...');

    try {
      execSync(`ssh ${this.config.user}@${this.config.host} 'cd /opt/mazaochain && npx supabase db push'`, { stdio: 'inherit' });
      console.log('✅ Migrations completed successfully');
    } catch (error) {
      throw new Error(`Migration failed: ${error}`);
    }
  }

  private async healthCheck(): Promise<void> {
    console.log('🏥 Running health check...');

    const maxRetries = 30;
    const retryInterval = 2000; // 2 seconds

    for (let i = 0; i < maxRetries; i++) {
      try {
        execSync(`curl -f --max-time 10 ${this.config.healthCheckUrl}`, { stdio: 'pipe' });
        console.log('✅ Health check passed');
        return;
      } catch (error) {
        if (i === maxRetries - 1) {
          throw new Error(`Health check failed after ${maxRetries} attempts`);
        }
        console.log(`Health check attempt ${i + 1}/${maxRetries} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, retryInterval));
      }
    }
  }

  private async postDeploymentTasks(): Promise<void> {
    console.log('🧹 Running post-deployment tasks...');

    const postDeployCommands = `
      cd /opt/mazaochain

      # Update all services
      docker-compose -f deployment/${this.config.environment}/docker-compose.yml up -d

      # Clean up old Docker images
      docker image prune -f

      # Restart monitoring services
      docker-compose -f deployment/${this.config.environment}/docker-compose.yml restart prometheus grafana

      # Update deployment timestamp
      echo "$(date -Iseconds)" > .last-deployment
    `;

    try {
      execSync(`ssh ${this.config.user}@${this.config.host} '${postDeployCommands}'`, { stdio: 'inherit' });
      console.log('✅ Post-deployment tasks completed');
    } catch (error) {
      console.warn('⚠️ Some post-deployment tasks failed:', error);
    }
  }

  private async rollback(): Promise<void> {
    console.log('🔄 Rolling back deployment...');

    const rollbackCommands = `
      cd /opt/mazaochain

      # Get previous image tag
      PREVIOUS_IMAGE=$(docker images --format "table {{.Repository}}:{{.Tag}}" | grep mazaochain | sed -n '2p')

      if [ -n "$PREVIOUS_IMAGE" ]; then
        echo "Rolling back to: $PREVIOUS_IMAGE"
        
        # Update docker-compose with previous image
        sed -i "s|image: ghcr.io/mazaochain/mazaochain:.*|image: $PREVIOUS_IMAGE|" deployment/${this.config.environment}/docker-compose.yml
        
        # Deploy previous version
        docker-compose -f deployment/${this.config.environment}/docker-compose.yml up -d --no-deps mazaochain-app
        
        echo "Rollback completed"
      else
        echo "No previous image found for rollback"
        exit 1
      fi
    `;

    try {
      execSync(`ssh ${this.config.user}@${this.config.host} '${rollbackCommands}'`, { stdio: 'inherit' });
      console.log('✅ Rollback completed successfully');
    } catch (error) {
      console.error('❌ Rollback failed:', error);
      throw error;
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const environment = args.includes('--staging') ? 'staging' : 'production';
  
  const config: DeploymentConfig = {
    environment,
    imageTag: process.env.IMAGE_TAG || 'latest',
    host: process.env[`${environment.toUpperCase()}_HOST`] || '',
    user: process.env[`${environment.toUpperCase()}_USER`] || 'deploy',
    backupBeforeDeploy: !args.includes('--no-backup'),
    runMigrations: args.includes('--migrate'),
    healthCheckUrl: environment === 'production' 
      ? 'https://mazaochain.com/api/health'
      : 'https://staging.mazaochain.com/api/health',
    rollbackOnFailure: !args.includes('--no-rollback')
  };

  if (!config.host) {
    console.error(`Missing ${environment.toUpperCase()}_HOST environment variable`);
    process.exit(1);
  }

  const deployment = new Deployment(config);

  try {
    await deployment.deploy();
  } catch (error) {
    console.error('Deployment failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
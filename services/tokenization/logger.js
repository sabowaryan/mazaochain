/**
 * Module de logging pour le service de tokenisation
 */

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

const COLORS = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  blue: '\x1b[34m',
  gray: '\x1b[90m'
};

class Logger {
  constructor(level = 'info') {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.info;
    this.stats = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      startTime: new Date()
    };
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  log(level, message, data = null) {
    if (LOG_LEVELS[level] > this.level) return;

    const timestamp = this.formatTimestamp();
    let color = COLORS.reset;
    let emoji = '';

    switch (level) {
      case 'error':
        color = COLORS.red;
        emoji = '❌';
        break;
      case 'warn':
        color = COLORS.yellow;
        emoji = '⚠️';
        break;
      case 'info':
        color = COLORS.blue;
        emoji = 'ℹ️';
        break;
      case 'debug':
        color = COLORS.gray;
        emoji = '🔍';
        break;
    }

    console.log(`${color}[${timestamp}] ${emoji} ${level.toUpperCase()}: ${message}${COLORS.reset}`);
    
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }

  error(message, data) {
    this.log('error', message, data);
  }

  warn(message, data) {
    this.log('warn', message, data);
  }

  info(message, data) {
    this.log('info', message, data);
  }

  debug(message, data) {
    this.log('debug', message, data);
  }

  recordProcessed() {
    this.stats.processed++;
  }

  recordSuccess() {
    this.stats.succeeded++;
  }

  recordFailure() {
    this.stats.failed++;
  }

  getStats() {
    const uptime = Math.floor((new Date() - this.stats.startTime) / 1000);
    return {
      ...this.stats,
      uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${uptime % 60}s`,
      successRate: this.stats.processed > 0 
        ? `${((this.stats.succeeded / this.stats.processed) * 100).toFixed(2)}%`
        : 'N/A'
    };
  }

  printStats() {
    const stats = this.getStats();
    console.log(`\n${COLORS.green}📊 Statistiques du Service${COLORS.reset}`);
    console.log(`   Temps de fonctionnement: ${stats.uptime}`);
    console.log(`   Enregistrements traités: ${stats.processed}`);
    console.log(`   Succès: ${COLORS.green}${stats.succeeded}${COLORS.reset}`);
    console.log(`   Échecs: ${COLORS.red}${stats.failed}${COLORS.reset}`);
    console.log(`   Taux de réussite: ${stats.successRate}\n`);
  }
}

export default Logger;

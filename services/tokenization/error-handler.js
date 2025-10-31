/**
 * Module de gestion des erreurs avec retry logic
 */

/**
 * Retry une fonction avec backoff exponentiel
 */
export async function retryWithBackoff(fn, maxRetries = 3, baseDelay = 1000, logger = console) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt - 1);
        logger.warn(`Tentative ${attempt}/${maxRetries} échouée, retry dans ${delay}ms...`, {
          error: error.message
        });
        await sleep(delay);
      }
    }
  }
  
  throw lastError;
}

/**
 * Vérifier si une erreur est récupérable
 */
export function isRecoverableError(error) {
  const recoverableErrors = [
    'TIMEOUT',
    'NETWORK_ERROR',
    'BUSY',
    'RATE_LIMIT',
    'INSUFFICIENT_GAS'
  ];
  
  return recoverableErrors.some(type => 
    error.message?.includes(type) || error.code?.includes(type)
  );
}

/**
 * Catégoriser une erreur
 */
export function categorizeError(error) {
  if (error.message?.includes('wallet')) {
    return {
      category: 'WALLET_ERROR',
      recoverable: false,
      userMessage: 'Erreur avec l\'adresse wallet du fermier'
    };
  }
  
  if (error.message?.includes('gas') || error.message?.includes('GAS')) {
    return {
      category: 'GAS_ERROR',
      recoverable: true,
      userMessage: 'Erreur de gas sur la blockchain'
    };
  }
  
  if (error.message?.includes('network') || error.message?.includes('timeout')) {
    return {
      category: 'NETWORK_ERROR',
      recoverable: true,
      userMessage: 'Erreur réseau temporaire'
    };
  }
  
  if (error.message?.includes('contract')) {
    return {
      category: 'CONTRACT_ERROR',
      recoverable: false,
      userMessage: 'Erreur lors de l\'exécution du smart contract'
    };
  }
  
  return {
    category: 'UNKNOWN_ERROR',
    recoverable: false,
    userMessage: 'Erreur inconnue lors de la tokenisation'
  };
}

/**
 * Sleep helper
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Circuit Breaker pour éviter les appels répétés en cas de panne
 */
export class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureCount = 0;
    this.threshold = threshold;
    this.timeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.nextAttempt = Date.now();
  }

  async execute(fn, logger = console) {
    if (this.state === 'OPEN') {
      if (Date.now() < this.nextAttempt) {
        throw new Error('Circuit breaker is OPEN - too many failures');
      }
      this.state = 'HALF_OPEN';
      logger.info('Circuit breaker entering HALF_OPEN state');
    }

    try {
      const result = await fn();
      this.onSuccess(logger);
      return result;
    } catch (error) {
      this.onFailure(logger);
      throw error;
    }
  }

  onSuccess(logger) {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      logger.info('Circuit breaker CLOSED - service recovered');
    }
  }

  onFailure(logger) {
    this.failureCount++;
    if (this.failureCount >= this.threshold) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.timeout;
      logger.error(`Circuit breaker OPEN - ${this.failureCount} consecutive failures`);
    }
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      nextAttempt: this.state === 'OPEN' ? new Date(this.nextAttempt).toISOString() : null
    };
  }
}

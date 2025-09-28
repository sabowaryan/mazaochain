/**
 * Security configuration for MazaoChain platform
 * Defines security policies, rate limits, and validation rules
 */

export const securityConfig = {
  // Authentication settings
  auth: {
    passwordPolicy: {
      minLength: 12,
      requireUppercase: true,
      requireLowercase: true,
      requireNumbers: true,
      requireSpecialChars: true,
      forbiddenPasswords: [
        'password', '123456', 'admin', 'qwerty', 'password123',
        'letmein', 'welcome', 'monkey', '1234567890', 'abc123'
      ]
    },
    session: {
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      refreshThreshold: 60 * 60 * 1000, // 1 hour
      maxConcurrentSessions: 3,
      requireReauthForSensitive: true
    },
    bruteForce: {
      maxAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      progressiveLockout: true,
      trackByIP: true
    },
    twoFactor: {
      enabled: false, // Future enhancement
      methods: ['sms', 'email', 'totp'],
      backupCodes: 10
    }
  },

  // Rate limiting configuration
  rateLimiting: {
    global: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // requests per window
      message: 'Trop de requêtes, veuillez réessayer plus tard'
    },
    auth: {
      windowMs: 15 * 60 * 1000,
      max: 10, // login attempts per window
      skipSuccessfulRequests: true
    },
    api: {
      windowMs: 60 * 1000, // 1 minute
      max: 100, // API calls per minute
      keyGenerator: (req: any) => req.user?.id || req.ip
    },
    blockchain: {
      windowMs: 60 * 1000,
      max: 10, // blockchain transactions per minute
      keyGenerator: (req: any) => req.user?.walletAddress
    }
  },

  // Input validation rules
  validation: {
    email: {
      maxLength: 254,
      allowedDomains: [], // Empty means all domains allowed
      blockedDomains: ['tempmail.com', '10minutemail.com']
    },
    text: {
      maxLength: 1000,
      allowedChars: /^[a-zA-Z0-9\s\-_.@àâäéèêëïîôöùûüÿç]+$/,
      forbiddenPatterns: [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi
      ]
    },
    numeric: {
      min: 0,
      max: Number.MAX_SAFE_INTEGER,
      precision: 2
    },
    file: {
      maxSize: 10 * 1024 * 1024, // 10MB
      allowedTypes: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp'
      ],
      scanForMalware: true
    }
  },

  // CORS configuration
  cors: {
    origin: process.env.NODE_ENV === 'production' 
      ? ['https://mazaochain.com', 'https://www.mazaochain.com']
      : ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Origin',
      'X-Requested-With',
      'Content-Type',
      'Accept',
      'Authorization',
      'X-CSRF-Token'
    ]
  },

  // Security headers
  headers: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'", // Required for Next.js
          "https://cdn.jsdelivr.net",
          "https://unpkg.com"
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://fonts.googleapis.com"
        ],
        fontSrc: [
          "'self'",
          "https://fonts.gstatic.com"
        ],
        imgSrc: [
          "'self'",
          "data:",
          "https:"
        ],
        connectSrc: [
          "'self'",
          "https://api.supabase.co",
          "https://testnet.hedera.com",
          "https://mainnet.hedera.com"
        ],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"]
      }
    },
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    frameOptions: 'DENY',
    contentTypeOptions: 'nosniff',
    xssProtection: '1; mode=block',
    referrerPolicy: 'strict-origin-when-cross-origin'
  },

  // Blockchain security settings
  blockchain: {
    hedera: {
      network: process.env.HEDERA_NETWORK || 'testnet',
      maxTransactionFee: 100000000, // 1 HBAR in tinybars
      transactionTimeout: 30000, // 30 seconds
      retryAttempts: 3,
      validateSignatures: true,
      requireMultiSig: false // Future enhancement
    },
    wallet: {
      supportedWallets: ['hashpack'],
      requireWalletVerification: true,
      maxWalletsPerUser: 3,
      walletAddressValidation: /^0\.0\.\d+$/
    },
    transactions: {
      maxAmount: {
        agriculteur: 50000, // USDC
        cooperative: 100000,
        preteur: 1000000
      },
      dailyLimits: {
        agriculteur: 10000,
        cooperative: 50000,
        preteur: 500000
      },
      requireApproval: {
        threshold: 10000,
        approvers: ['cooperative', 'admin']
      }
    }
  },

  // Data protection settings
  dataProtection: {
    encryption: {
      algorithm: 'aes-256-gcm',
      keyRotationInterval: 90 * 24 * 60 * 60 * 1000, // 90 days
      encryptSensitiveFields: [
        'password',
        'privateKey',
        'personalData'
      ]
    },
    anonymization: {
      levels: {
        PARTIAL: {
          email: (email: string) => email.replace(/(.{1})(.*)(@.*)/, '$1***$3'),
          name: (name: string) => name.replace(/(\w)\w+/g, '$1***')
        },
        FULL: {
          email: () => '[REDACTED]',
          name: () => '[REDACTED]',
          phone: () => '[REDACTED]'
        }
      },
      retentionPeriod: 7 * 365 * 24 * 60 * 60 * 1000, // 7 years
      autoAnonymize: true
    },
    backup: {
      frequency: 'daily',
      retention: 30, // days
      encryption: true,
      offsite: true
    }
  },

  // Monitoring and alerting
  monitoring: {
    securityEvents: [
      'FAILED_LOGIN_ATTEMPTS',
      'PRIVILEGE_ESCALATION_ATTEMPT',
      'SUSPICIOUS_TRANSACTION',
      'DATA_BREACH_ATTEMPT',
      'MALWARE_DETECTED',
      'UNUSUAL_API_USAGE'
    ],
    alertThresholds: {
      failedLogins: 10,
      suspiciousTransactions: 5,
      apiAbuseScore: 80,
      dataAccessAnomaly: 3
    },
    logRetention: 365, // days
    realTimeAlerts: true
  },

  // Smart contract security
  smartContracts: {
    deployment: {
      requireAudit: true,
      multiSigRequired: true,
      testnetFirst: true,
      upgradeDelay: 48 * 60 * 60 * 1000 // 48 hours
    },
    execution: {
      gasLimits: {
        mintTokens: 300000,
        createLoan: 500000,
        repayLoan: 400000,
        liquidateCollateral: 600000
      },
      maxRetries: 3,
      timeoutMs: 30000
    },
    vulnerabilityScanning: {
      enabled: true,
      scanOnDeploy: true,
      continuousMonitoring: true,
      alertOnVulnerability: true
    }
  }
};

// Security validation functions
export const securityValidators = {
  validatePassword: (password: string): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const policy = securityConfig.auth.passwordPolicy;

    if (password.length < policy.minLength) {
      errors.push(`Le mot de passe doit contenir au moins ${policy.minLength} caractères`);
    }

    if (policy.requireUppercase && !/[A-Z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une majuscule');
    }

    if (policy.requireLowercase && !/[a-z]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins une minuscule');
    }

    if (policy.requireNumbers && !/\d/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un chiffre');
    }

    if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      errors.push('Le mot de passe doit contenir au moins un caractère spécial');
    }

    if (policy.forbiddenPasswords.includes(password.toLowerCase())) {
      errors.push('Ce mot de passe est trop commun');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  },

  validateEmail: (email: string): { valid: boolean; error?: string } => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const config = securityConfig.validation.email;

    if (!emailRegex.test(email)) {
      return { valid: false, error: 'Format d\'email invalide' };
    }

    if (email.length > config.maxLength) {
      return { valid: false, error: 'Email trop long' };
    }

    const domain = email.split('@')[1];
    if (config.blockedDomains.includes(domain)) {
      return { valid: false, error: 'Domaine email non autorisé' };
    }

    return { valid: true };
  },

  sanitizeInput: (input: string): string => {
    const config = securityConfig.validation.text;
    let sanitized = input.slice(0, config.maxLength);

    // Remove forbidden patterns
    config.forbiddenPatterns.forEach(pattern => {
      sanitized = sanitized.replace(pattern, '');
    });

    // Keep only allowed characters
    sanitized = sanitized.replace(config.allowedChars, '');

    return sanitized.trim();
  },

  validateWalletAddress: (address: string): { valid: boolean; error?: string } => {
    const walletConfig = securityConfig.blockchain.wallet;
    
    if (!walletConfig.walletAddressValidation.test(address)) {
      return { valid: false, error: 'Format d\'adresse de portefeuille invalide' };
    }

    return { valid: true };
  },

  checkTransactionLimits: (
    amount: number, 
    userRole: string, 
    dailyTotal: number
  ): { allowed: boolean; error?: string } => {
    const limits = securityConfig.blockchain.transactions;
    const maxAmount = limits.maxAmount[userRole as keyof typeof limits.maxAmount];
    const dailyLimit = limits.dailyLimits[userRole as keyof typeof limits.dailyLimits];

    if (amount > maxAmount) {
      return { 
        allowed: false, 
        error: `Montant maximum autorisé: ${maxAmount} USDC` 
      };
    }

    if (dailyTotal + amount > dailyLimit) {
      return { 
        allowed: false, 
        error: `Limite quotidienne dépassée: ${dailyLimit} USDC` 
      };
    }

    return { allowed: true };
  }
};

export default securityConfig;
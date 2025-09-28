import { ValidationSchemas, ValidationResult, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/errors/logger';
import { ErrorHandler } from '@/lib/errors/handler';

/**
 * Centralized validation service for all forms and data inputs
 * Provides server-side validation with comprehensive error handling
 */

export class ValidationService {
  /**
   * Validate user registration data
   */
  static validateUserRegistration(data: {
    email: string;
    password: string;
    role: string;
  }): ValidationResult {
    logger.debug('Validating user registration data', { email: data.email, role: data.role });
    
    const schema = ValidationSchemas.userRegistration();
    const result = schema.validate(data);
    
    if (!result.isValid) {
      logger.warn('User registration validation failed', { errors: result.errors });
    }
    
    return result;
  }

  /**
   * Validate crop evaluation data
   */
  static validateCropEvaluation(data: {
    cropType: string;
    superficie: number;
    rendementHistorique: number;
  }): ValidationResult {
    logger.debug('Validating crop evaluation data', data);
    
    const schema = ValidationSchemas.cropEvaluation();
    const result = schema.validate(data);
    
    // Additional business logic validation
    if (result.isValid) {
      const additionalErrors: ValidationError[] = [];
      
      // Check if crop type is supported for the region
      if (data.cropType === 'cafe' && data.superficie > 100) {
        additionalErrors.push({
          field: 'superficie',
          code: 'BUSINESS_RULE',
          message: 'La superficie pour le café ne peut pas dépasser 100 hectares',
          value: data.superficie
        });
      }
      
      // Check realistic yield ranges
      const yieldLimits = {
        manioc: { min: 5000, max: 25000 }, // kg/ha
        cafe: { min: 500, max: 3000 }      // kg/ha
      };
      
      const limits = yieldLimits[data.cropType as keyof typeof yieldLimits];
      if (limits && (data.rendementHistorique < limits.min || data.rendementHistorique > limits.max)) {
        additionalErrors.push({
          field: 'rendementHistorique',
          code: 'UNREALISTIC_YIELD',
          message: `Rendement irréaliste pour ${data.cropType}. Attendu: ${limits.min}-${limits.max} kg/ha`,
          value: data.rendementHistorique
        });
      }
      
      if (additionalErrors.length > 0) {
        result.errors.push(...additionalErrors);
        result.isValid = false;
      }
    }
    
    if (!result.isValid) {
      logger.warn('Crop evaluation validation failed', { errors: result.errors });
    }
    
    return result;
  }

  /**
   * Validate loan request data
   */
  static validateLoanRequest(data: {
    amount: number;
    purpose: string;
  }): ValidationResult {
    logger.debug('Validating loan request data', data);
    
    const schema = ValidationSchemas.loanRequest();
    const result = schema.validate(data);
    
    if (!result.isValid) {
      logger.warn('Loan request validation failed', { errors: result.errors });
    }
    
    return result;
  }

  /**
   * Validate wallet address
   */
  static validateWalletAddress(walletAddress: string): ValidationResult {
    logger.debug('Validating wallet address', { walletAddress });
    
    const schema = ValidationSchemas.walletAddress();
    const result = schema.validate({ walletAddress });
    
    if (!result.isValid) {
      logger.warn('Wallet address validation failed', { errors: result.errors });
    }
    
    return result;
  }

  /**
   * Validate farmer profile data
   */
  static validateFarmerProfile(data: {
    nom: string;
    superficie: number;
    localisation: string;
  }): ValidationResult {
    logger.debug('Validating farmer profile data', data);
    
    const schema = ValidationSchemas.farmerProfile();
    const result = schema.validate(data);
    
    if (!result.isValid) {
      logger.warn('Farmer profile validation failed', { errors: result.errors });
    }
    
    return result;
  }

  /**
   * Validate transaction parameters
   */
  static validateTransactionParams(data: {
    amount?: number;
    walletAddress?: string;
    tokenId?: string;
    contractId?: string;
  }): ValidationResult {
    logger.debug('Validating transaction parameters', data);
    
    const errors: ValidationError[] = [];
    
    // Validate amount
    if (data.amount !== undefined) {
      if (typeof data.amount !== 'number' || data.amount <= 0) {
        errors.push({
          field: 'amount',
          code: 'INVALID_AMOUNT',
          message: 'Le montant doit être un nombre positif',
          value: data.amount
        });
      }
      
      if (data.amount > 1000000) {
        errors.push({
          field: 'amount',
          code: 'AMOUNT_TOO_LARGE',
          message: 'Montant trop élevé (maximum: 1,000,000)',
          value: data.amount
        });
      }
    }
    
    // Validate Hedera address format (0.0.xxxxx)
    const hederaAddressRegex = /^0\.0\.\d+$/;
    
    if (data.walletAddress && !hederaAddressRegex.test(data.walletAddress)) {
      errors.push({
        field: 'walletAddress',
        code: 'INVALID_HEDERA_ADDRESS',
        message: 'Format d\'adresse Hedera invalide (ex: 0.0.123456)',
        value: data.walletAddress
      });
    }
    
    if (data.tokenId && !hederaAddressRegex.test(data.tokenId)) {
      errors.push({
        field: 'tokenId',
        code: 'INVALID_TOKEN_ID',
        message: 'Format d\'ID de token invalide (ex: 0.0.123456)',
        value: data.tokenId
      });
    }
    
    if (data.contractId && !hederaAddressRegex.test(data.contractId)) {
      errors.push({
        field: 'contractId',
        code: 'INVALID_CONTRACT_ID',
        message: 'Format d\'ID de contrat invalide (ex: 0.0.123456)',
        value: data.contractId
      });
    }
    
    const result = {
      isValid: errors.length === 0,
      errors
    };
    
    if (!result.isValid) {
      logger.warn('Transaction parameters validation failed', { errors });
    }
    
    return result;
  }

  /**
   * Validate file upload parameters
   */
  static validateFileUpload(file: File, options: {
    maxSize?: number; // in bytes
    allowedTypes?: string[];
  } = {}): ValidationResult {
    const { maxSize = 5 * 1024 * 1024, allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'] } = options;
    
    logger.debug('Validating file upload', { 
      fileName: file.name, 
      fileSize: file.size, 
      fileType: file.type 
    });
    
    const errors: ValidationError[] = [];
    
    // Check file size
    if (file.size > maxSize) {
      errors.push({
        field: 'file',
        code: 'FILE_TOO_LARGE',
        message: `Fichier trop volumineux (maximum: ${Math.round(maxSize / 1024 / 1024)}MB)`,
        value: file.size
      });
    }
    
    // Check file type
    if (!allowedTypes.includes(file.type)) {
      errors.push({
        field: 'file',
        code: 'INVALID_FILE_TYPE',
        message: `Type de fichier non supporté. Types autorisés: ${allowedTypes.join(', ')}`,
        value: file.type
      });
    }
    
    // Check file name
    if (file.name.length > 255) {
      errors.push({
        field: 'file',
        code: 'FILENAME_TOO_LONG',
        message: 'Nom de fichier trop long (maximum: 255 caractères)',
        value: file.name
      });
    }
    
    const result = {
      isValid: errors.length === 0,
      errors
    };
    
    if (!result.isValid) {
      logger.warn('File upload validation failed', { errors });
    }
    
    return result;
  }

  /**
   * Sanitize and validate text input
   */
  static sanitizeText(text: string, options: {
    maxLength?: number;
    allowHtml?: boolean;
    trim?: boolean;
  } = {}): { sanitized: string; isValid: boolean; errors: ValidationError[] } {
    const { maxLength = 1000, allowHtml = false, trim = true } = options;
    
    let sanitized = text;
    const errors: ValidationError[] = [];
    
    // Trim whitespace
    if (trim) {
      sanitized = sanitized.trim();
    }
    
    // Remove HTML if not allowed
    if (!allowHtml) {
      sanitized = sanitized.replace(/<[^>]*>/g, '');
    }
    
    // Check length
    if (sanitized.length > maxLength) {
      errors.push({
        field: 'text',
        code: 'TEXT_TOO_LONG',
        message: `Texte trop long (maximum: ${maxLength} caractères)`,
        value: sanitized.length
      });
    }
    
    // Check for potentially malicious content
    const suspiciousPatterns = [
      /javascript:/i,
      /data:text\/html/i,
      /vbscript:/i,
      /<script/i,
      /on\w+\s*=/i
    ];
    
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(sanitized)) {
        errors.push({
          field: 'text',
          code: 'SUSPICIOUS_CONTENT',
          message: 'Contenu potentiellement malveillant détecté',
          value: sanitized
        });
        break;
      }
    }
    
    return {
      sanitized,
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Batch validate multiple fields
   */
  static batchValidate(validations: Array<{
    name: string;
    validator: () => ValidationResult;
  }>): ValidationResult {
    const allErrors: ValidationError[] = [];
    
    for (const validation of validations) {
      try {
        const result = validation.validator();
        if (!result.isValid) {
          allErrors.push(...result.errors);
        }
      } catch (error) {
        const mazaoError = ErrorHandler.handle(error);
        logger.error(`Validation failed for ${validation.name}`, mazaoError);
        
        allErrors.push({
          field: validation.name,
          code: 'VALIDATION_ERROR',
          message: mazaoError.userMessage,
          value: undefined
        });
      }
    }
    
    return {
      isValid: allErrors.length === 0,
      errors: allErrors
    };
  }
}

// Export singleton instance
export const validationService = ValidationService;
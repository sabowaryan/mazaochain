import { ValidationError, ValidationResult } from '../errors/types';

/**
 * Comprehensive validation system for MazaoChain
 * Provides client-side form validation with user-friendly error messages
 */

export interface ValidatorRule {
  validate: (value: any) => boolean;
  message: string;
  code: string;
}

export class Validator {
  private rules: ValidatorRule[] = [];
  private field: string;

  constructor(field: string) {
    this.field = field;
  }

  /**
   * Add required validation
   */
  required(message: string = 'Ce champ est obligatoire'): Validator {
    this.rules.push({
      validate: (value) => value !== null && value !== undefined && value !== '',
      message,
      code: 'REQUIRED'
    });
    return this;
  }

  /**
   * Add minimum length validation
   */
  minLength(min: number, message?: string): Validator {
    this.rules.push({
      validate: (value) => !value || value.length >= min,
      message: message || `Minimum ${min} caractères requis`,
      code: 'MIN_LENGTH'
    });
    return this;
  }

  /**
   * Add maximum length validation
   */
  maxLength(max: number, message?: string): Validator {
    this.rules.push({
      validate: (value) => !value || value.length <= max,
      message: message || `Maximum ${max} caractères autorisés`,
      code: 'MAX_LENGTH'
    });
    return this;
  }

  /**
   * Add email validation
   */
  email(message: string = 'Format d\'email invalide'): Validator {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    this.rules.push({
      validate: (value) => !value || emailRegex.test(value),
      message,
      code: 'INVALID_EMAIL'
    });
    return this;
  }

  /**
   * Add numeric validation
   */
  numeric(message: string = 'Doit être un nombre'): Validator {
    this.rules.push({
      validate: (value) => !value || !isNaN(Number(value)),
      message,
      code: 'NOT_NUMERIC'
    });
    return this;
  }

  /**
   * Add minimum value validation
   */
  min(min: number, message?: string): Validator {
    this.rules.push({
      validate: (value) => !value || Number(value) >= min,
      message: message || `Valeur minimum: ${min}`,
      code: 'MIN_VALUE'
    });
    return this;
  }

  /**
   * Add maximum value validation
   */
  max(max: number, message?: string): Validator {
    this.rules.push({
      validate: (value) => !value || Number(value) <= max,
      message: message || `Valeur maximum: ${max}`,
      code: 'MAX_VALUE'
    });
    return this;
  }

  /**
   * Add positive number validation
   */
  positive(message: string = 'Doit être un nombre positif'): Validator {
    this.rules.push({
      validate: (value) => !value || Number(value) > 0,
      message,
      code: 'NOT_POSITIVE'
    });
    return this;
  }

  /**
   * Add custom regex validation
   */
  pattern(regex: RegExp, message: string): Validator {
    this.rules.push({
      validate: (value) => !value || regex.test(value),
      message,
      code: 'PATTERN_MISMATCH'
    });
    return this;
  }

  /**
   * Add custom validation function
   */
  custom(validator: (value: any) => boolean, message: string, code: string = 'CUSTOM'): Validator {
    this.rules.push({
      validate: validator,
      message,
      code
    });
    return this;
  }

  /**
   * Validate value against all rules
   */
  validate(value: any): ValidationError[] {
    const errors: ValidationError[] = [];

    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        errors.push({
          field: this.field,
          code: rule.code,
          message: rule.message,
          value
        });
      }
    }

    return errors;
  }
}

/**
 * Form validation schema
 */
export class ValidationSchema {
  private validators: Map<string, Validator> = new Map();

  /**
   * Add field validator
   */
  field(name: string): Validator {
    const validator = new Validator(name);
    this.validators.set(name, validator);
    return validator;
  }

  /**
   * Validate entire form data
   */
  validate(data: Record<string, any>): ValidationResult {
    const errors: ValidationError[] = [];

    for (const [fieldName, validator] of this.validators) {
      const fieldErrors = validator.validate(data[fieldName]);
      errors.push(...fieldErrors);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate single field
   */
  validateField(fieldName: string, value: any): ValidationError[] {
    const validator = this.validators.get(fieldName);
    if (!validator) {
      return [];
    }
    return validator.validate(value);
  }
}

/**
 * Pre-defined validation schemas for common forms
 */
export const ValidationSchemas = {
  /**
   * User registration validation
   */
  userRegistration: () => {
    const schema = new ValidationSchema();
    
    schema.field('email')
      .required('L\'email est obligatoire')
      .email('Format d\'email invalide');
    
    schema.field('password')
      .required('Le mot de passe est obligatoire')
      .minLength(8, 'Le mot de passe doit contenir au moins 8 caractères');
    
    schema.field('role')
      .required('Le rôle est obligatoire')
      .custom(
        (value) => ['agriculteur', 'cooperative', 'preteur'].includes(value),
        'Rôle invalide',
        'INVALID_ROLE'
      );

    return schema;
  },

  /**
   * Crop evaluation validation
   */
  cropEvaluation: () => {
    const schema = new ValidationSchema();
    
    schema.field('cropType')
      .required('Le type de culture est obligatoire')
      .custom(
        (value) => ['manioc', 'cafe'].includes(value),
        'Type de culture non supporté',
        'INVALID_CROP_TYPE'
      );
    
    schema.field('superficie')
      .required('La superficie est obligatoire')
      .numeric('La superficie doit être un nombre')
      .positive('La superficie doit être positive')
      .max(1000, 'Superficie maximum: 1000 hectares');
    
    schema.field('rendementHistorique')
      .required('Le rendement historique est obligatoire')
      .numeric('Le rendement doit être un nombre')
      .positive('Le rendement doit être positif')
      .max(50000, 'Rendement maximum: 50000 kg/ha');

    return schema;
  },

  /**
   * Loan request validation
   */
  loanRequest: () => {
    const schema = new ValidationSchema();
    
    schema.field('amount')
      .required('Le montant est obligatoire')
      .numeric('Le montant doit être un nombre')
      .positive('Le montant doit être positif')
      .min(10, 'Montant minimum: 10 USDC')
      .max(10000, 'Montant maximum: 10000 USDC');
    
    schema.field('purpose')
      .required('L\'objectif du prêt est obligatoire')
      .minLength(10, 'Veuillez décrire l\'objectif (minimum 10 caractères)')
      .maxLength(500, 'Description trop longue (maximum 500 caractères)');

    return schema;
  },

  /**
   * Wallet address validation
   */
  walletAddress: () => {
    const schema = new ValidationSchema();
    
    schema.field('walletAddress')
      .required('L\'adresse du portefeuille est obligatoire')
      .pattern(
        /^0\.0\.\d+$/,
        'Format d\'adresse Hedera invalide (ex: 0.0.123456)'
      );

    return schema;
  },

  /**
   * Profile validation
   */
  farmerProfile: () => {
    const schema = new ValidationSchema();
    
    schema.field('nom')
      .required('Le nom est obligatoire')
      .minLength(2, 'Le nom doit contenir au moins 2 caractères')
      .maxLength(100, 'Le nom ne peut pas dépasser 100 caractères');
    
    schema.field('superficie')
      .required('La superficie totale est obligatoire')
      .numeric('La superficie doit être un nombre')
      .positive('La superficie doit être positive');
    
    schema.field('localisation')
      .required('La localisation est obligatoire')
      .minLength(3, 'La localisation doit contenir au moins 3 caractères');

    return schema;
  }
};

/**
 * Utility function to create validator for a field
 */
export const validator = (field: string): Validator => new Validator(field);
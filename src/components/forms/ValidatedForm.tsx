'use client';

import React, { useState, useCallback } from 'react';
import { ValidationError, ValidationResult } from '@/lib/errors/types';
import { ValidationSchema } from '@/lib/validation/validators';
import { ErrorHandler } from '@/lib/errors/handler';
import { logger } from '@/lib/errors/logger';

interface ValidatedFormProps {
  schema: ValidationSchema;
  initialData?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => Promise<void> | void;
  onValidationChange?: (isValid: boolean, errors: ValidationError[]) => void;
  children: React.ReactNode;
  className?: string;
  submitButtonText?: string;
  isSubmitting?: boolean;
  disabled?: boolean;
}

export function ValidatedForm({
  schema,
  initialData = {},
  onSubmit,
  onValidationChange,
  children,
  className = '',
  submitButtonText = 'Soumettre',
  isSubmitting = false,
  disabled = false
}: ValidatedFormProps) {
  const [formData, setFormData] = useState<Record<string, any>>(initialData);
  const [fieldErrors, setFieldErrors] = useState<Record<string, ValidationError[]>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  // Handle field value changes
  const handleFieldChange = useCallback((name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    setSubmitError(null); // Clear submit error when user makes changes
  }, []);

  // Handle field validation
  const handleFieldValidation = useCallback((name: string, errors: ValidationError[]) => {
    setFieldErrors(prev => {
      const newErrors = { ...prev, [name]: errors };
      
      // Calculate overall form validity
      const allErrors = Object.values(newErrors).flat();
      const formIsValid = allErrors.length === 0;
      setIsValid(formIsValid);
      
      if (onValidationChange) {
        onValidationChange(formIsValid, allErrors);
      }
      
      return newErrors;
    });
  }, [onValidationChange]);

  // Validate entire form
  const validateForm = (): ValidationResult => {
    const result = schema.validate(formData);
    
    // Update field errors
    const errorsByField: Record<string, ValidationError[]> = {};
    result.errors.forEach(error => {
      if (!errorsByField[error.field]) {
        errorsByField[error.field] = [];
      }
      errorsByField[error.field].push(error);
    });
    
    setFieldErrors(errorsByField);
    setIsValid(result.isValid);
    
    if (onValidationChange) {
      onValidationChange(result.isValid, result.errors);
    }
    
    return result;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    try {
      // Validate form before submission
      const validationResult = validateForm();
      
      if (!validationResult.isValid) {
        logger.warn('Form submission attempted with validation errors', {
          errors: validationResult.errors,
          formData
        });
        return;
      }

      logger.info('Form submission started', { formData });
      
      await onSubmit(formData);
      
      logger.info('Form submission completed successfully');
      
    } catch (error) {
      const mazaoError = ErrorHandler.handle(error, {
        context: ErrorHandler.createContext({
          additionalData: { formData, formType: 'validated_form' }
        })
      });
      
      setSubmitError(mazaoError.userMessage);
      logger.error('Form submission failed', mazaoError);
    }
  };

  // Clone children and inject form props
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child) && (child.props as any).name) {
      const fieldName = (child.props as any).name;
      return React.cloneElement(child, {
        value: formData[fieldName] || '',
        onChange: handleFieldChange,
        onValidation: handleFieldValidation,
        errors: fieldErrors[fieldName] || [],
        ...(child.props as any)
      });
    }
    return child;
  });

  const allErrors = Object.values(fieldErrors).flat();
  const hasErrors = allErrors.length > 0;

  return (
    <form onSubmit={handleSubmit} className={`space-y-4 ${className}`} noValidate>
      {enhancedChildren}
      
      {/* Display submit error */}
      {submitError && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-600">{submitError}</p>
        </div>
      )}
      
      {/* Display validation summary for accessibility */}
      {hasErrors && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3" role="alert">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">
            Veuillez corriger les erreurs suivantes :
          </h3>
          <ul className="text-sm text-yellow-700 list-disc list-inside">
            {allErrors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Submit button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={disabled || isSubmitting || hasErrors}
          className={`
            px-6 py-2 rounded-md font-medium text-white
            transition-colors duration-200
            ${disabled || isSubmitting || hasErrors
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
            }
          `}
        >
          {isSubmitting ? 'Envoi en cours...' : submitButtonText}
        </button>
      </div>
    </form>
  );
}

// Hook for using form validation in components
export function useFormValidation(schema: ValidationSchema, initialData: Record<string, any> = {}) {
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isValid, setIsValid] = useState(false);

  const validateField = useCallback((name: string, value: any) => {
    const fieldErrors = schema.validateField(name, value);
    return fieldErrors;
  }, [schema]);

  const validateForm = useCallback(() => {
    const result = schema.validate(formData);
    setErrors(result.errors);
    setIsValid(result.isValid);
    return result;
  }, [schema, formData]);

  const updateField = useCallback((name: string, value: unknown) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  }, []);

  const reset = useCallback(() => {
    setFormData(initialData);
    setErrors([]);
    setIsValid(false);
  }, [initialData]);

  return {
    formData,
    errors,
    isValid,
    validateField,
    validateForm,
    updateField,
    reset
  };
}
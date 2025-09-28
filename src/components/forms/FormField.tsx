'use client';

import React, { useState, useEffect } from 'react';
import { ValidationError } from '@/lib/errors/types';
import { validator } from '@/lib/validation/validators';

interface FormFieldProps {
  name: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select';
  value?: string | number;
  onChange?: (name: string, value: string | number) => void;
  onValidation?: (name: string, errors: ValidationError[]) => void;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
    email?: boolean;
    pattern?: RegExp;
    custom?: (value: any) => boolean;
    customMessage?: string;
  };
  options?: { value: string; label: string }[]; // For select fields
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  errors?: ValidationError[];
  showErrors?: boolean;
}

export function FormField({
  name,
  label,
  type = 'text',
  value,
  onChange,
  onValidation,
  validation = {},
  options = [],
  placeholder,
  disabled = false,
  className = '',
  errors = [],
  showErrors = true
}: FormFieldProps) {
  const [touched, setTouched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<ValidationError[]>([]);
  const [internalValue, setInternalValue] = useState<string | number>(value || '');

  // Use provided value or internal state
  const currentValue = value !== undefined ? value : internalValue;
  const handleChange = onChange || ((name: string, val: string | number) => setInternalValue(val));

  // Validate field when value changes
  useEffect(() => {
    if (touched && validation) {
      validateField(currentValue);
    }
  }, [currentValue, touched, validation]);

  const validateField = (fieldValue: unknown) => {
    const fieldValidator = validator(name);

    // Apply validation rules
    if (validation.required) {
      fieldValidator.required();
    }
    if (validation.minLength) {
      fieldValidator.minLength(validation.minLength);
    }
    if (validation.maxLength) {
      fieldValidator.maxLength(validation.maxLength);
    }
    if (validation.email) {
      fieldValidator.email();
    }
    if (validation.min !== undefined) {
      fieldValidator.min(validation.min);
    }
    if (validation.max !== undefined) {
      fieldValidator.max(validation.max);
    }
    if (type === 'number') {
      fieldValidator.numeric();
    }
    if (validation.pattern) {
      fieldValidator.pattern(validation.pattern, 'Format invalide');
    }
    if (validation.custom && validation.customMessage) {
      fieldValidator.custom(validation.custom, validation.customMessage);
    }

    const validationErrors = fieldValidator.validate(fieldValue);
    setFieldErrors(validationErrors);
    
    if (onValidation) {
      onValidation(name, validationErrors);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const newValue = type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value;
    handleChange(name, newValue);
  };

  const handleBlur = () => {
    setTouched(true);
    if (validation) {
      validateField(currentValue);
    }
  };

  const allErrors = [...fieldErrors, ...errors];
  const hasErrors = allErrors.length > 0;
  const shouldShowErrors = showErrors && touched && hasErrors;

  const baseInputClasses = `
    w-full px-3 py-2 border rounded-md shadow-sm
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
    disabled:bg-gray-100 disabled:cursor-not-allowed
    ${hasErrors ? 'border-red-500' : 'border-gray-300'}
    ${className}
  `;

  const renderInput = () => {
    switch (type) {
      case 'textarea':
        return (
          <textarea
            id={name}
            name={name}
            value={currentValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={`${baseInputClasses} min-h-[100px] resize-vertical`}
            rows={4}
          />
        );

      case 'select':
        return (
          <select
            id={name}
            name={name}
            value={currentValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            disabled={disabled}
            className={baseInputClasses}
          >
            <option value="">{placeholder || 'Sélectionnez une option'}</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            id={name}
            name={name}
            type={type}
            value={currentValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled}
            className={baseInputClasses}
            step={type === 'number' ? 'any' : undefined}
          />
        );
    }
  };

  return (
    <div className="mb-4">
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {validation.required && <span className="text-red-500 ml-1">*</span>}
      </label>
      
      {renderInput()}
      
      {shouldShowErrors && (
        <div className="mt-1">
          {allErrors.map((error, index) => (
            <p key={index} className="text-sm text-red-600">
              {error.message}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
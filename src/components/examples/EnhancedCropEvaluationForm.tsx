'use client';

import React, { useState } from 'react';
import { ValidatedForm } from '@/components/forms/ValidatedForm';
import { FormField } from '@/components/forms/FormField';
import { ErrorDisplay } from '@/components/errors/ErrorDisplay';
import { ValidationSchemas, MazaoChainError, ErrorHandler, logger } from '@/lib/errors';
import { validationService } from '@/lib/services/validation';

/**
 * Example of enhanced crop evaluation form with comprehensive error handling
 * Demonstrates integration of validation, error handling, and user feedback
 */

interface CropEvaluationData {
  cropType: string;
  superficie: number;
  rendementHistorique: number;
  localisation: string;
  notes?: string;
}

export function EnhancedCropEvaluationForm() {
  const [submitError, setSubmitError] = useState<MazaoChainError | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const schema = ValidationSchemas.cropEvaluation();

  const handleSubmit = async (data: Record<string, any>) => {
    setSubmitError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      logger.info('Starting crop evaluation form submission', { data });

      // Additional validation with business rules
      const validationResult = validationService.validateCropEvaluation({
        cropType: data.cropType,
        superficie: Number(data.superficie),
        rendementHistorique: Number(data.rendementHistorique)
      });

      if (!validationResult.isValid) {
        throw ErrorHandler.handleValidationErrors(validationResult.errors);
      }

      // Sanitize text inputs
      const sanitizedNotes = data.notes ? 
        validationService.sanitizeText(data.notes, { maxLength: 500 }) : 
        { sanitized: '', isValid: true, errors: [] };

      if (!sanitizedNotes.isValid) {
        throw ErrorHandler.handleValidationErrors(sanitizedNotes.errors);
      }

      // Simulate API call with error handling
      const result = await submitCropEvaluation({
        ...data,
        cropType: data.cropType || 'manioc',
        localisation: data.localisation || 'Unknown',
        superficie: Number(data.superficie),
        rendementHistorique: Number(data.rendementHistorique),
        notes: sanitizedNotes.sanitized
      });

      if (result.success) {
        setSuccessMessage('Évaluation de culture soumise avec succès!');
        logger.info('Crop evaluation submitted successfully', { evaluationId: result.data?.id });
      } else {
        throw result.error;
      }

    } catch (error) {
      const mazaoError = ErrorHandler.handle(error, {
        context: ErrorHandler.createContext({
          additionalData: { formType: 'crop_evaluation', formData: data }
        })
      });
      
      setSubmitError(mazaoError);
      logger.error('Crop evaluation form submission failed', mazaoError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSubmitError(null);
    // Form will be re-enabled for retry
  };

  const handleDismissError = () => {
    setSubmitError(null);
  };

  const handleDismissSuccess = () => {
    setSuccessMessage(null);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">
        Évaluation de Culture
      </h2>

      {/* Success Message */}
      {successMessage && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <p className="text-sm font-medium text-green-800">{successMessage}</p>
            </div>
            <div className="ml-4 flex-shrink-0">
              <button
                onClick={handleDismissSuccess}
                className="inline-flex text-green-400 hover:text-green-600"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {submitError && (
        <div className="mb-6">
          <ErrorDisplay
            error={submitError}
            onRetry={submitError.retryable ? handleRetry : undefined}
            onDismiss={handleDismissError}
            showDetails={process.env.NODE_ENV === 'development'}
          />
        </div>
      )}

      <ValidatedForm
        schema={schema}
        onSubmit={handleSubmit}
        submitButtonText="Soumettre l'évaluation"
        isSubmitting={isSubmitting}
        className="space-y-6"
      >
        <FormField
          name="cropType"
          label="Type de culture"
          type="select"
          options={[
            { value: 'manioc', label: 'Manioc' },
            { value: 'cafe', label: 'Café' }
          ]}
          validation={{ required: true }}
          placeholder="Sélectionnez le type de culture"
        />

        <FormField
          name="superficie"
          label="Superficie (hectares)"
          type="number"
          validation={{
            required: true,
            min: 0.1,
            max: 1000
          }}
          placeholder="Ex: 5.5"
        />

        <FormField
          name="rendementHistorique"
          label="Rendement historique (kg/ha)"
          type="number"
          validation={{
            required: true,
            min: 100,
            max: 50000
          }}
          placeholder="Ex: 15000"
        />

        <FormField
          name="localisation"
          label="Localisation"
          type="text"
          validation={{
            required: true,
            minLength: 3,
            maxLength: 100
          }}
          placeholder="Ex: Kinshasa, Commune de Lemba"
        />

        <FormField
          name="notes"
          label="Notes additionnelles (optionnel)"
          type="textarea"
          validation={{
            maxLength: 500
          }}
          placeholder="Informations supplémentaires sur la culture..."
        />
      </ValidatedForm>
    </div>
  );
}

// Mock API function for demonstration
async function submitCropEvaluation(data: CropEvaluationData): Promise<{
  success: boolean;
  data?: { id: string };
  error?: MazaoChainError;
}> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Simulate random failures for testing
  if (Math.random() < 0.3) {
    return {
      success: false,
      error: new MazaoChainError(
        'EXTERNAL_SERVICE_ERROR' as any,
        'Service temporarily unavailable',
        {
          retryable: true,
          userMessage: 'Service temporairement indisponible. Veuillez réessayer.'
        }
      )
    };
  }

  // Simulate validation error
  if (data.superficie > 500) {
    return {
      success: false,
      error: new MazaoChainError(
        'VALIDATION_ERROR' as any,
        'Superficie too large',
        {
          retryable: false,
          userMessage: 'Superficie trop importante pour une évaluation automatique. Veuillez contacter un agent.'
        }
      )
    };
  }

  return {
    success: true,
    data: { id: `eval_${Date.now()}` }
  };
}
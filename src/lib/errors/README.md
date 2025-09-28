# MazaoChain Error Handling System

This comprehensive error handling system provides structured error management, validation, logging, and retry mechanisms for the MazaoChain platform.

## Features

- **Structured Error Types**: Consistent error codes and severity levels
- **User-Friendly Messages**: Localized error messages for end users
- **Comprehensive Logging**: Detailed error tracking and monitoring
- **Retry Mechanisms**: Automatic retry for transient failures
- **Form Validation**: Client-side and server-side validation
- **React Integration**: Error boundaries and display components
- **Blockchain Error Handling**: Specialized handling for Hedera operations

## Core Components

### 1. Error Types (`types.ts`)

Defines all error codes, severity levels, and interfaces:

```typescript
import { ErrorCode, ErrorSeverity, MazaoChainError } from '@/lib/errors';

// Create a structured error
const error = new MazaoChainError(
  ErrorCode.INSUFFICIENT_COLLATERAL,
  'Not enough collateral for loan',
  {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Garantie insuffisante pour ce prêt',
    retryable: false
  }
);
```

### 2. Error Handler (`handler.ts`)

Central error processing and conversion:

```typescript
import { ErrorHandler } from '@/lib/errors';

// Handle any error type
const mazaoError = ErrorHandler.handle(someError);

// Handle async operations
const result = await ErrorHandler.handleAsync(async () => {
  return await riskyOperation();
});

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error.userMessage);
}
```

### 3. Retry Manager (`retry.ts`)

Automatic retry with exponential backoff:

```typescript
import { retryUtils } from '@/lib/errors';

// Retry blockchain operations
const result = await retryUtils.forBlockchain.execute(
  () => submitTransaction(),
  'submitTransaction'
);

// Custom retry configuration
const customRetry = new RetryManager({
  maxAttempts: 5,
  baseDelay: 2000,
  retryableErrors: [ErrorCode.NETWORK_ERROR]
});
```

### 4. Validation System (`validation/validators.ts`)

Comprehensive form and data validation:

```typescript
import { ValidationSchemas } from '@/lib/errors';

// Validate user registration
const schema = ValidationSchemas.userRegistration();
const result = schema.validate({
  email: 'user@example.com',
  password: 'password123',
  role: 'agriculteur'
});

if (!result.isValid) {
  console.log(result.errors);
}
```

### 5. Logger (`logger.ts`)

Structured logging with multiple levels:

```typescript
import { logger } from '@/lib/errors';

logger.info('Operation started', { userId: '123' });
logger.error('Operation failed', error, context);
logger.debug('Debug information', metadata);
```

## React Components

### Error Boundary

Catch and handle React errors:

```tsx
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary>
      <YourComponent />
    </ErrorBoundary>
  );
}
```

### Validated Form

Form with built-in validation and error handling:

```tsx
import { ValidatedForm } from '@/components/forms/ValidatedForm';
import { FormField } from '@/components/forms/FormField';
import { ValidationSchemas } from '@/lib/errors';

function MyForm() {
  const schema = ValidationSchemas.userRegistration();

  return (
    <ValidatedForm
      schema={schema}
      onSubmit={handleSubmit}
    >
      <FormField
        name="email"
        label="Email"
        type="email"
        validation={{ required: true, email: true }}
      />
      <FormField
        name="password"
        label="Password"
        type="password"
        validation={{ required: true, minLength: 8 }}
      />
    </ValidatedForm>
  );
}
```

### Error Display

Show errors with appropriate styling:

```tsx
import { ErrorDisplay } from '@/components/errors/ErrorDisplay';

function MyComponent() {
  const [error, setError] = useState<MazaoChainError | null>(null);

  return (
    <div>
      {error && (
        <ErrorDisplay
          error={error}
          onRetry={error.retryable ? handleRetry : undefined}
          onDismiss={() => setError(null)}
        />
      )}
    </div>
  );
}
```

## Blockchain Error Handling

Specialized handling for Hedera operations:

```typescript
import { BlockchainErrorHandler } from '@/lib/errors';

// Execute blockchain operation with retry
const result = await BlockchainErrorHandler.executeWithRetry(
  () => transferTokens(amount, recipient),
  'transferTokens',
  {
    walletAddress: '0.0.123456',
    transactionType: 'token_transfer',
    amount: 100
  }
);

if (result.success) {
  console.log('Transfer successful:', result.data);
} else {
  console.error('Transfer failed:', result.error?.userMessage);
}
```

## Validation Schemas

Pre-built validation schemas for common forms:

```typescript
import { ValidationSchemas } from '@/lib/errors';

// Available schemas:
const userRegistration = ValidationSchemas.userRegistration();
const cropEvaluation = ValidationSchemas.cropEvaluation();
const loanRequest = ValidationSchemas.loanRequest();
const walletAddress = ValidationSchemas.walletAddress();
const farmerProfile = ValidationSchemas.farmerProfile();
```

## Error Codes

Common error codes used throughout the system:

- **Authentication**: `UNAUTHORIZED`, `FORBIDDEN`, `SESSION_EXPIRED`
- **Validation**: `VALIDATION_ERROR`, `INVALID_INPUT`, `MISSING_REQUIRED_FIELD`
- **Blockchain**: `WALLET_NOT_CONNECTED`, `TRANSACTION_FAILED`, `INSUFFICIENT_BALANCE`
- **Business Logic**: `INSUFFICIENT_COLLATERAL`, `LOAN_NOT_ELIGIBLE`
- **System**: `DATABASE_ERROR`, `NETWORK_ERROR`, `INTERNAL_SERVER_ERROR`

## Severity Levels

- **LOW**: Minor issues, user can continue
- **MEDIUM**: Important issues, may affect functionality
- **HIGH**: Serious issues, immediate attention needed
- **CRITICAL**: System-level issues, requires urgent action

## Best Practices

### 1. Always Use Structured Errors

```typescript
// ❌ Don't throw generic errors
throw new Error('Something went wrong');

// ✅ Use MazaoChainError with proper context
throw new MazaoChainError(
  ErrorCode.VALIDATION_ERROR,
  'Invalid crop type',
  {
    userMessage: 'Type de culture invalide',
    context: { cropType, validTypes }
  }
);
```

### 2. Handle Errors at the Right Level

```typescript
// ❌ Don't catch and ignore errors
try {
  await riskyOperation();
} catch (error) {
  console.log('Error occurred');
}

// ✅ Handle errors appropriately
const result = await ErrorHandler.handleAsync(() => riskyOperation());
if (!result.success) {
  // Show user-friendly error message
  setError(result.error);
}
```

### 3. Use Validation Before Operations

```typescript
// ✅ Validate input before processing
const validationResult = validationService.validateLoanRequest(data);
if (!validationResult.isValid) {
  throw ErrorHandler.handleValidationErrors(validationResult.errors);
}
```

### 4. Log Important Events

```typescript
// ✅ Log with appropriate level and context
logger.info('Loan request submitted', { loanId, farmerId, amount });
logger.error('Loan processing failed', error, { loanId, farmerId });
```

### 5. Provide Retry Options for Transient Errors

```typescript
// ✅ Make retryable errors clear to users
if (error.retryable) {
  // Show retry button
  <button onClick={handleRetry}>Réessayer</button>
}
```

## Testing

The error handling system includes comprehensive tests:

```bash
npm test -- src/lib/errors/__tests__/error-handling.test.ts
```

## Configuration

### Environment Variables

- `NODE_ENV`: Controls logging behavior (development vs production)
- `NEXT_PUBLIC_SUPABASE_URL`: For error log storage
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: For error log storage

### Database Setup

Error logs are stored in Supabase. Run the migration:

```sql
-- See: supabase/migrations/20250921000003_create_error_logs.sql
```

## Integration Examples

See `src/components/examples/EnhancedCropEvaluationForm.tsx` for a complete example of integrating all error handling features in a form component.

## Monitoring and Alerts

In production, critical errors are automatically:

1. Logged to the database
2. Sent to external monitoring services
3. Available for analysis and alerting

## Contributing

When adding new error types:

1. Add the error code to `ErrorCode` enum
2. Add user-friendly message to `MazaoChainError.getDefaultUserMessage()`
3. Update severity mapping in `ErrorHandler.getSeverityForCode()`
4. Add tests for the new error scenarios
5. Update this documentation
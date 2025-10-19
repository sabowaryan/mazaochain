# Error Handling Guide - MazaoChain

This guide explains how to use the comprehensive error handling system in the MazaoChain application.

## Overview

The error handling system provides:
- **Structured error responses** with error codes and user-friendly messages
- **Multilingual support** (French and Lingala)
- **Blockchain error translation** for wallet and transaction errors
- **Centralized error logging** and monitoring
- **React Error Boundaries** for catching UI errors
- **Standardized API error responses**

## Components

### 1. Error Types (`types.ts`)

Defines all error codes, severities, and interfaces:

```typescript
import { ErrorCode, ErrorSeverity } from '@/lib/errors/types';

// Available error codes
ErrorCode.UNAUTHORIZED
ErrorCode.VALIDATION_ERROR
ErrorCode.WALLET_NOT_CONNECTED
ErrorCode.TRANSACTION_FAILED
ErrorCode.INSUFFICIENT_COLLATERAL
// ... and many more
```

### 2. MazaoChainError (`MazaoChainError.ts`)

Custom error class with context and user messages:

```typescript
import { MazaoChainError } from '@/lib/errors/MazaoChainError';
import { ErrorCode, ErrorSeverity } from '@/lib/errors/types';

// Create a custom error
const error = new MazaoChainError(
  ErrorCode.INSUFFICIENT_COLLATERAL,
  'User does not have enough collateral',
  {
    severity: ErrorSeverity.MEDIUM,
    userMessage: 'Garantie insuffisante pour ce prêt',
    retryable: false,
    context: {
      timestamp: new Date(),
      userId: 'user123',
      additionalData: { required: 1000, available: 500 }
    }
  }
);
```

### 3. Error Handler (`handler.ts`)

Centralized error processing:

```typescript
import { ErrorHandler } from '@/lib/errors/handler';

// Handle any error
try {
  // ... some operation
} catch (error) {
  const mazaoError = ErrorHandler.handle(error);
  console.error(mazaoError.userMessage);
}

// Handle async operations
const result = await ErrorHandler.handleAsync(async () => {
  return await fetchData();
});

if (!result.success) {
  console.error(result.error.userMessage);
}

// Utility functions
const validationError = errorUtils.validation('Invalid email format', 'email');
const walletError = errorUtils.wallet('Wallet not connected');
const collateralError = errorUtils.insufficientCollateral(1000, 500);
```

### 4. Blockchain Error Translator (`blockchain-errors.ts`)

Translates blockchain/wallet errors to user-friendly messages:

```typescript
import { 
  translateBlockchainError, 
  createBlockchainError,
  isBlockchainError 
} from '@/lib/errors/blockchain-errors';

// Translate error to French or Lingala
try {
  await wallet.connect();
} catch (error) {
  const message = translateBlockchainError(error, 'fr');
  // "Portefeuille HashPack non trouvé. Veuillez installer l'extension HashPack."
  
  const messageLn = translateBlockchainError(error, 'ln');
  // "Bozwi te portefeuille HashPack. Tyá extension HashPack."
}

// Create MazaoChainError from blockchain error
try {
  await sendTransaction();
} catch (error) {
  if (isBlockchainError(error)) {
    const mazaoError = createBlockchainError(error, 'fr', {
      transactionId: 'tx123',
      walletAddress: '0x...'
    });
    throw mazaoError;
  }
}
```

### 5. API Error Responses (`api-errors.ts`)

Standardized API error responses:

```typescript
import { 
  createErrorResponse, 
  createSuccessResponse,
  createValidationErrorResponse,
  createUnauthorizedResponse,
  generateRequestId 
} from '@/lib/errors/api-errors';

// In API routes
export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const data = await fetchData();
    return createSuccessResponse(data, 'Data retrieved successfully');
  } catch (error) {
    return createErrorResponse(error, 500, requestId);
  }
}

// Validation errors
export async function POST(request: NextRequest) {
  const body = await request.json();
  
  if (!body.email) {
    return createValidationErrorResponse([
      { field: 'email', message: 'Email is required' }
    ]);
  }
  
  // ... rest of handler
}

// Unauthorized
export async function DELETE(request: NextRequest) {
  const user = await getUser(request);
  
  if (!user) {
    return createUnauthorizedResponse();
  }
  
  // ... rest of handler
}
```

### 6. Error Boundary (`ErrorBoundary.tsx`)

React component for catching UI errors:

```typescript
import { ErrorBoundary } from '@/components/errors/ErrorBoundary';

// Wrap your app or components
<ErrorBoundary>
  <YourApp />
</ErrorBoundary>

// With custom fallback
<ErrorBoundary 
  fallback={<CustomErrorUI />}
  onError={(error, errorInfo) => {
    // Custom error handling
    logToAnalytics(error);
  }}
>
  <YourComponent />
</ErrorBoundary>

// Use as HOC
const SafeComponent = withErrorBoundary(MyComponent);
```

## Usage Examples

### In React Components

```typescript
import { useErrorHandler } from '@/components/errors/ErrorBoundary';
import { translateBlockchainError } from '@/lib/errors/blockchain-errors';

function MyComponent() {
  const { handleError } = useErrorHandler();
  const [error, setError] = useState<string | null>(null);
  
  const handleWalletConnect = async () => {
    try {
      await wallet.connect();
    } catch (err) {
      // Translate blockchain error
      const message = translateBlockchainError(err, 'fr');
      setError(message);
      
      // Log error
      handleError(err, 'wallet_connection');
    }
  };
  
  return (
    <div>
      {error && <div className="error">{error}</div>}
      <button onClick={handleWalletConnect}>Connect Wallet</button>
    </div>
  );
}
```

### In API Routes

```typescript
import { NextRequest } from 'next/server';
import { 
  createErrorResponse, 
  createSuccessResponse,
  generateRequestId 
} from '@/lib/errors/api-errors';
import { MazaoChainError } from '@/lib/errors/MazaoChainError';
import { ErrorCode } from '@/lib/errors/types';

export async function POST(request: NextRequest) {
  const requestId = generateRequestId();
  
  try {
    const body = await request.json();
    
    // Validate
    if (!body.amount || body.amount <= 0) {
      throw new MazaoChainError(
        ErrorCode.INVALID_LOAN_AMOUNT,
        'Loan amount must be greater than 0',
        {
          userMessage: 'Le montant du prêt doit être supérieur à 0'
        }
      );
    }
    
    // Check collateral
    const collateral = await getCollateral(body.userId);
    if (collateral < body.amount * 2) {
      throw new MazaoChainError(
        ErrorCode.INSUFFICIENT_COLLATERAL,
        `Insufficient collateral: required ${body.amount * 2}, available ${collateral}`,
        {
          userMessage: `Garantie insuffisante. Requis: ${body.amount * 2}, Disponible: ${collateral}`
        }
      );
    }
    
    // Create loan
    const loan = await createLoan(body);
    
    return createSuccessResponse(loan, 'Loan created successfully', 201);
  } catch (error) {
    return createErrorResponse(error, 500, requestId);
  }
}
```

### In Blockchain Operations

```typescript
import { createBlockchainError } from '@/lib/errors/blockchain-errors';

async function mintTokens(farmerId: string, amount: number) {
  try {
    const tx = await tokenFactory.mintTokens(farmerId, amount);
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    // Create blockchain error with context
    const blockchainError = createBlockchainError(error, 'fr', {
      transactionId: tx?.hash,
      walletAddress: wallet.address,
      contractAddress: tokenFactory.address
    });
    
    // Show user-friendly message
    toast.error(blockchainError.userMessage);
    
    // Log for debugging
    console.error('Minting failed:', blockchainError);
    
    throw blockchainError;
  }
}
```

### Form Validation

```typescript
import { ErrorHandler } from '@/lib/errors/handler';

function validateLoanRequest(data: LoanRequest) {
  const errors: Array<{ field: string; message: string }> = [];
  
  if (!data.amount || data.amount <= 0) {
    errors.push({ 
      field: 'amount', 
      message: 'Le montant doit être supérieur à 0' 
    });
  }
  
  if (!data.duration || data.duration < 1) {
    errors.push({ 
      field: 'duration', 
      message: 'La durée doit être d\'au moins 1 mois' 
    });
  }
  
  if (errors.length > 0) {
    throw ErrorHandler.handleValidationErrors(errors);
  }
}
```

## Error Message Translations

All error messages are available in French and Lingala in the translation files:

**French (`messages/fr.json`):**
```json
{
  "errors": {
    "walletNotConnected": "Veuillez connecter votre portefeuille HashPack",
    "insufficientFunds": "Fonds insuffisants pour cette transaction",
    "transactionFailed": "La transaction a échoué. Veuillez réessayer"
  }
}
```

**Lingala (`messages/ln.json`):**
```json
{
  "errors": {
    "walletNotConnected": "Kangisa portefeuille HashPack na yo",
    "insufficientFunds": "Mbongo ekoki te mpo na transaction oyo",
    "transactionFailed": "Transaction ekweaki. Meka lisusu"
  }
}
```

## Best Practices

1. **Always use MazaoChainError** for throwing errors in your code
2. **Provide user-friendly messages** in both French and Lingala
3. **Include context** when creating errors (userId, transactionId, etc.)
4. **Use appropriate error codes** from the ErrorCode enum
5. **Mark errors as retryable** when appropriate
6. **Log errors** using the logger utility
7. **Wrap API routes** with standardized error responses
8. **Use Error Boundaries** to catch React errors
9. **Translate blockchain errors** before showing to users
10. **Test error scenarios** to ensure proper handling

## Testing

```typescript
import { MazaoChainError } from '@/lib/errors/MazaoChainError';
import { ErrorCode } from '@/lib/errors/types';
import { translateBlockchainError } from '@/lib/errors/blockchain-errors';

describe('Error Handling', () => {
  it('should create error with user message', () => {
    const error = new MazaoChainError(
      ErrorCode.WALLET_NOT_CONNECTED,
      'Wallet not connected'
    );
    
    expect(error.userMessage).toBe('Veuillez connecter votre portefeuille HashPack.');
  });
  
  it('should translate blockchain errors', () => {
    const error = new Error('insufficient funds');
    const message = translateBlockchainError(error, 'fr');
    
    expect(message).toBe('Fonds insuffisants pour effectuer cette transaction.');
  });
});
```

## Monitoring and Logging

All errors are automatically logged with context:

```typescript
import { logger } from '@/lib/errors/logger';

// Errors are logged with:
// - Error code and message
// - User message
// - Severity level
// - Context (userId, transactionId, etc.)
// - Stack trace
// - Timestamp

// View logs in development console or production monitoring tool
```

## Support

For questions or issues with error handling:
1. Check this guide first
2. Review the error code definitions in `types.ts`
3. Look at example usage in existing components
4. Contact the development team
